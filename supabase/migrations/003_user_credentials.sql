-- 003_user_credentials.sql
--
-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STATUS: NOT YET APPLIED. Run STEP 1, then the STEP 2 VERIFY queries. │
-- │ STEP 3 is optional constraint proof and rolls itself back.           │
-- │ Safe to re-run in full: every statement is idempotent (unlike the    │
-- │ CREATE POLICY statements in schema.sql, which error on a second run).│
-- └──────────────────────────────────────────────────────────────────────┘
--
-- Password credentials that FabVerify itself owns. Locked in DECISIONS [M10]
-- (login = OTP OR password) and built as the migration safety net under
-- [A12]: a credential we control works identically before, during and after
-- the AWS RDS move, and is the fallback if the token cutover goes wrong.
--
-- ⚠️ PASSWORDS ARE NEVER STORED IN SUPABASE AUTH. That is the single most
-- expensive mistake available here, and it rules out
-- `supabase.auth.signInWithPassword()` — the convenient thing that looks
-- like it solves M10 while re-coupling us to the provider we are leaving.
--
-- ── WHY A SEPARATE TABLE AND NOT A `users.password_hash` COLUMN ────────
--
-- Not tidiness — a live disclosure. `/api/dev-auth/lookup` has NO
-- authentication at all, accepts any phone in the body, and returns
-- `getUserByPhone(phone)` — which is `.select("*")` on `users` (db.ts:38-39)
-- — as the entire row. A hash on `users` would therefore be handed to an
-- anonymous caller for ANY phone number on the platform: free offline
-- cracking material for the whole user base. `users` has five unqualified
-- select sites in db.ts (38, 55, 66, 86, 264) and `getVerifiedUser` passes
-- the full row to 13 route call sites, several of which embed user objects
-- in responses — so a column would have multiple escape routes, not one.
--
-- A separate table cannot be reached by `select("*")` on `users`, so the
-- leak is impossible BY CONSTRUCTION rather than prevented by remembering a
-- column projection at 5+ call sites forever. It also mirrors the
-- auth_identities precedent: identity and credentials sit BESIDE the
-- profile, never inside it.
--
-- ── WHY PASSWORD WRITES NO `auth_identities` ROW ───────────────────────
--
-- Resolves the open question parked in migration 002 and chunk 1.4. The
-- credential lives in OUR table, so there is no external provider and no
-- external id; a `provider='password'` row would be self-referential noise
-- (provider_uid = the very user_id it maps to). Chunk 1.9's existing
-- identity and phone branches are therefore untouched by M10. What DOES
-- change at chunk 2.5 is that the resolution ladder gains one NEW branch
-- above them, for tokens we issue ourselves — a token carrying our own
-- `sub = users.id` needs no lookup at all.
--
-- ⚠️ SCHEMA ONLY — chunk 2.1. NOTHING reads or writes this table yet:
--   · chunk 2.2 builds the argon2id hashing module (unused, nothing imports)
--   · chunk 2.3 declares verifyPassword/setPassword on the auth seam
--   · chunk 2.4 is the first code that WRITES here (set-password route)
--   · chunk 2.5 issues/verifies our own session token (token_epoch below)
--   · chunk 2.7 uses the lockout columns; chunk 2.8 uses reset
-- Zero application code changes in this chunk, so the running app cannot
-- behave differently.
--
-- Standard PostgreSQL only — no Supabase-specific features (CORE T2 / A2).

-- ── STEP 1: CREATE (idempotent, safe to re-run) ────────────────────────

CREATE TABLE IF NOT EXISTS user_credentials (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- ON DELETE CASCADE, matching auth_identities and for a stronger reason:
  -- a credential outliving its user is a live authentication secret with no
  -- owner. It would also occupy the UNIQUE constraint below, so that user's
  -- id could never hold a credential again.
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 'password' today. NO CHECK CONSTRAINT, deliberately — same reasoning as
  -- auth_identities.provider: adding a credential type (passkey, TOTP seed)
  -- must not require a DDL change, and this schema's convention is plain
  -- TEXT with no CHECK (users.user_type, every status column).
  credential_type      TEXT NOT NULL DEFAULT 'password',

  -- The argon2id ENCODED string ($argon2id$v=19$m=...,t=...,p=...$salt$hash).
  -- ⚠️ It already carries its own salt AND its own parameters, which is what
  -- makes needsRehash() possible in chunk 2.2. Do NOT add a separate salt
  -- column, and do NOT store parameters separately — two sources of truth for
  -- how a hash was made is how a rehash silently verifies against the wrong
  -- cost. TEXT, not a fixed-width type: a truncated hash column fails
  -- silently and retroactively (see chunk 2.2's risk note).
  -- ⚠️ NEVER plaintext, never reversible encryption, never a "password hint".
  password_hash        TEXT NOT NULL,

  -- ── REVOCATION (chunk 2.5 issues, chunk 2.8 bumps) ──────────────────
  -- Our own session tokens are SIGNED, not stored, so they cannot be deleted
  -- once issued. But chunk 2.8 requires that a password reset ENDS existing
  -- sessions — otherwise a reset does not evict an intruder, which is the
  -- entire point of having it. This integer is the revocation mechanism: the
  -- issued token carries the epoch it was minted under, verification rejects
  -- any token whose epoch is below the current value, and a reset is a `+1`
  -- that invalidates every outstanding session for this account at once.
  -- Chosen over a `sessions` table because it is one integer and one read.
  -- A sessions table is the more powerful answer and is what per-device
  -- remote logout will eventually want; this does not block adding one.
  token_epoch          INTEGER NOT NULL DEFAULT 0,

  -- ── LOCKOUT / THROTTLING (chunk 2.7) ────────────────────────────────
  -- ⚠️ NOT NULL DEFAULT 0, deliberately NOT nullable. `failed_attempts + 1`
  -- evaluates to NULL when the column is NULL, so a counter that starts NULL
  -- silently never increments — a lockout that never locks, which reads as
  -- working right up until someone is being brute-forced. The same reasoning
  -- makes must_change_password NOT NULL: in SQL, NULL is not FALSE.
  failed_attempts      INTEGER NOT NULL DEFAULT 0,
  -- Nullable on purpose: "has never failed" is genuinely absent, not zero.
  last_failed_at       TIMESTAMPTZ,
  -- Nullable: NULL = not locked. A sentinel date would need every reader to
  -- know the sentinel.
  locked_until         TIMESTAMPTZ,

  -- ── RESET / ROTATION (chunk 2.8) ────────────────────────────────────
  -- ⚠️ There is deliberately NO reset_token column. Chunk 2.8's locked design
  -- proves the phone by OTP — already built and production-proven — and then
  -- sets the new password through chunk 2.4's route. NO EMAIL RESET LINKS:
  -- we do not verify emails, and a stored reset token is a second credential
  -- that can leak. Reset needs exactly these two things: this timestamp, and
  -- a token_epoch bump above.
  password_changed_at  TIMESTAMPTZ,
  -- For the "enterprise default password" case in Phase A: an admin-set
  -- credential the user must replace on first use. Inert until built.
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Application-maintained (db.ts sets it on write), NOT a trigger. A trigger
  -- would be vendor SQL carrying behaviour that has to be re-created on RDS;
  -- MIGRATION.md §5 rule 3 keeps logic in application code.
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One credential of each type per user. This is what makes chunk 2.4's
  -- "re-setting a password REPLACES rather than duplicates" structural: the
  -- write is an upsert conflict-targeting this constraint, so a second
  -- password row cannot exist to be verified against by mistake.
  CONSTRAINT user_credentials_user_type_key UNIQUE (user_id, credential_type)
);

-- ⚠️ NO separate index on user_id here — a DELIBERATE difference from
-- auth_identities, not an omission. There, UNIQUE was on
-- (provider, provider_uid), leaving the FK column uncovered. Here the UNIQUE
-- constraint above LEADS with user_id, so Postgres's automatic index already
-- serves both the FK / ON DELETE CASCADE check and every lookup this table
-- has ("what credential does this user have?"). A second index on user_id
-- would be pure write overhead.

-- RLS ENABLED WITH NO POLICY = DENY ALL. Same pattern as auth_identities and
-- waitlist, and the stakes are higher than either: NEXT_PUBLIC_SUPABASE_ANON_KEY
-- is public by design, so a table left with RLS OFF is readable from any
-- browser — and this one holds password hashes. Not a contradiction of [I8]
-- (which retires auth.uid() policies as an AUTHORISATION mechanism; none is
-- written here). The service-role client, which bypasses RLS, does the work.
-- ⚠️ An anon SELECT returning 0 rows on an empty table proves NOTHING. The
-- conclusive proof is an anon INSERT returning 42501 — see STEP 4.
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- PostgREST caches the schema and will 404 the new table until told to
-- reload. Operational command, NOT business logic in the database, so it does
-- not breach [X5] / CORE T2 — it has no AWS RDS equivalent and simply
-- disappears with PostgREST.
NOTIFY pgrst, 'reload schema';


-- ── STEP 2: VERIFY (read-only, run after STEP 1) ───────────────────────

-- 2a. Columns — expect exactly 12 rows, in this order:
--   id                   uuid                     NO   gen_random_uuid()
--   user_id              uuid                     NO   (null)
--   credential_type      text                     NO   'password'::text
--   password_hash        text                     NO   (null)
--   token_epoch          integer                  NO   0
--   failed_attempts      integer                  NO   0
--   last_failed_at       timestamp with time zone YES  (null)
--   locked_until         timestamp with time zone YES  (null)
--   password_changed_at  timestamp with time zone YES  (null)
--   must_change_password boolean                  NO   false
--   created_at           timestamp with time zone NO   now()
--   updated_at           timestamp with time zone NO   now()
-- ⚠️ THE CHECK THAT MATTERS FOR THIS CHUNK: every column beyond user_id and
-- password_hash is either NULLABLE or NOT NULL WITH A DEFAULT. An INSERT
-- naming only (user_id, password_hash) must succeed — proven in STEP 3d.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_credentials'
ORDER BY ordinal_position;

-- 2b. Constraints — expect exactly 3 rows: PRIMARY KEY (p), FOREIGN KEY (f)
-- whose definition includes ON DELETE CASCADE, and UNIQUE (u) on
-- (user_id, credential_type).
-- ⚠️ Filtered to p/f/u on purpose: PostgreSQL 17 catalogues NOT NULL
-- constraints in pg_constraint too (contype 'n'), so an unfiltered query
-- returns a different count on PG17 than on PG15/16 and the expected number
-- would be wrong for reasons that have nothing to do with this table.
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'user_credentials'::regclass
  AND contype IN ('p', 'f', 'u')
ORDER BY contype;

-- 2c. Indexes — expect exactly 2: the PK index and the UNIQUE composite.
-- There is deliberately no third (see the note above the RLS statement).
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_credentials'
ORDER BY indexname;

-- 2d. RLS on, and ZERO policies. Expect: t, then 0.
SELECT relrowsecurity AS rls_enabled
FROM pg_class WHERE relname = 'user_credentials';

SELECT count(*) AS policy_count
FROM pg_policies WHERE tablename = 'user_credentials';

-- 2e. Table exists and is empty. Expect: 0.
SELECT count(*) AS row_count FROM user_credentials;

-- 2f. auth_identities must be UNCHANGED by this chunk. Expect: 1
-- (the chunk 1.3 backfill — the founder's enterprise account). Chunk 1.8's
-- write has still never executed, so any other number means something
-- happened outside this migration and needs explaining before proceeding.
SELECT count(*) AS auth_identities_rows FROM auth_identities;


-- ── STEP 3: OPTIONAL CONSTRAINT PROOF (rolls back — persists nothing) ──
-- Blocks 3a and 3b are expected to FAIL on their last statement. That
-- failure IS the pass. ROLLBACK means the table is still genuinely empty
-- afterwards, so re-run STEP 2e to confirm 0 rows.

-- 3a. The FK must reject a credential pointing at a non-existent user.
-- EXPECT: 'insert or update on table "user_credentials" violates foreign key
-- constraint "user_credentials_user_id_fkey"'
BEGIN;
  INSERT INTO user_credentials (user_id, password_hash)
  VALUES (gen_random_uuid(), 'not-a-real-hash-chunk-2-1');
ROLLBACK;

-- 3b. The UNIQUE constraint must reject a SECOND password credential for the
-- same user — this is what makes "re-setting replaces, never duplicates"
-- structural in chunk 2.4. EXPECT: first INSERT succeeds, second fails with
-- 'duplicate key value violates unique constraint
-- "user_credentials_user_type_key"'
BEGIN;
  INSERT INTO user_credentials (user_id, password_hash)
  SELECT id, 'proof-unique-a-chunk-2-1' FROM users LIMIT 1;

  INSERT INTO user_credentials (user_id, password_hash)
  SELECT id, 'proof-unique-b-chunk-2-1' FROM users LIMIT 1;
ROLLBACK;

-- 3c. A DIFFERENT credential_type for the SAME user must be ALLOWED — this
-- is what keeps a future passkey/TOTP type addable without DDL.
-- EXPECT: both INSERTs succeed, then rollback.
BEGIN;
  INSERT INTO user_credentials (user_id, credential_type, password_hash)
  SELECT id, 'password', 'proof-type-a-chunk-2-1' FROM users LIMIT 1;

  INSERT INTO user_credentials (user_id, credential_type, password_hash)
  SELECT id, 'test-future-type', 'proof-type-b-chunk-2-1' FROM users LIMIT 1;

  SELECT credential_type FROM user_credentials
  WHERE password_hash LIKE 'proof-type-%';   -- expect 2 rows
ROLLBACK;

-- 3d. ⚠️ THE CHUNK'S CENTRAL CLAIM: the future-feature columns are INERT.
-- An INSERT naming only (user_id, password_hash) must succeed, and every
-- unbuilt-feature column must come back at a harmless default.
-- EXPECT one row: token_epoch 0 · failed_attempts 0 · last_failed_at NULL ·
-- locked_until NULL · password_changed_at NULL · must_change_password false ·
-- credential_type 'password' · created_at and updated_at both set.
BEGIN;
  INSERT INTO user_credentials (user_id, password_hash)
  SELECT id, 'proof-defaults-chunk-2-1' FROM users LIMIT 1;

  SELECT credential_type, token_epoch, failed_attempts, last_failed_at,
         locked_until, password_changed_at, must_change_password,
         created_at IS NOT NULL AS created_set,
         updated_at IS NOT NULL AS updated_set
  FROM user_credentials
  WHERE password_hash = 'proof-defaults-chunk-2-1';
ROLLBACK;


-- ── STEP 4: RLS PROOF — CANNOT BE RUN HERE ─────────────────────────────
-- ⚠️ The Supabase SQL Editor connects as a privileged role that BYPASSES
-- RLS, so nothing above proves the anon key is actually denied. The
-- conclusive test — an anon INSERT returning 42501 — must be run from
-- outside, against PostgREST with NEXT_PUBLIC_SUPABASE_ANON_KEY. This is
-- exactly how chunk 1.2 proved auth_identities. Run as a post-check.
