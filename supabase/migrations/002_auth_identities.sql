-- 002_auth_identities.sql
--
-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STATUS: NOT YET APPLIED. Run STEP 1, then the STEP 2 VERIFY queries. │
-- │ STEP 3 is optional constraint proof and rolls itself back.           │
-- │ Safe to re-run in full: every statement is idempotent (unlike the    │
-- │ CREATE POLICY statements in schema.sql, which error on a second run).│
-- └──────────────────────────────────────────────────────────────────────┘
--
-- Creates the durable link between a `users` row and the provider identity
-- that authenticated it. Locked in DECISIONS [I9]; resolves [I6].
--
-- BACKGROUND: today the ONLY link between a session and an account is the
-- phone number (`getUserByPhone`). `users.id` is a generated UUID unrelated
-- to the Supabase auth user. Consequences, all fixed by this one table:
--   · a telco-reassigned phone silently inherits an existing account ([I6])
--   · there is no key to map old identities to new ones at the AWS cutover
--   · "log out other devices" cannot be built (Account Security & Recovery)
--
-- WHY A TABLE, NOT A `users.auth_user_id` COLUMN: a column holds ONE
-- identity and cannot express "this user exists in both the old and the new
-- provider at once" — which is exactly what the [A12] parallel run IS. A
-- column would force a hard flip; the table makes the overlap a normal,
-- representable state. See docs/ARCHITECTURE/MIGRATION.md §3.
--
-- ⚠️ SCHEMA ONLY — chunk 1.2. NOTHING reads or writes this table yet:
--   · chunk 1.3 backfills it (one throwaway script)
--   · chunk 1.8 writes an identity on each successful authentication
--   · chunk 1.9 resolves identity VIA it, with a phone fallback
-- Zero application code changes in this chunk, so the running app cannot
-- behave differently.
--
-- Standard PostgreSQL only — no Supabase-specific features (CORE T2 / A2).

-- ── STEP 1: CREATE (idempotent, safe to re-run) ────────────────────────

CREATE TABLE IF NOT EXISTS auth_identities (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- ON DELETE CASCADE is a DELIBERATE deviation from every other FK in this
  -- schema (all of which are bare `REFERENCES users(id)`). An identity that
  -- outlives its user is actively harmful, not merely untidy: the orphan
  -- still occupies the UNIQUE constraint below, so that provider identity
  -- could never be re-registered, and once chunk 1.9 starts reading this
  -- table a stale row would resolve a live session to a deleted account.
  -- RESTRICT would instead block user deletion outright. No user-deletion
  -- flow exists today, so this is free to get right now.
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 'supabase' today; 'cognito' / 'password' / social providers later.
  -- NO CHECK CONSTRAINT, deliberately: [I9]'s list is open-ended, and the
  -- [A12] parallel run must be able to add a provider WITHOUT a DDL change
  -- at the moment of cutover. Also matches this schema's convention —
  -- users.user_type and every `status` column are plain TEXT with no CHECK.
  provider     TEXT NOT NULL,

  -- TEXT, not UUID, on purpose. A Supabase auth uid IS a UUID, but a Cognito
  -- `sub`, a social-provider id and an email-derived id are not. UUID here
  -- would force a type change at exactly the worst moment.
  -- OPEN QUESTION (chunk 1.6 / M10, NOT this chunk): for provider =
  -- 'password' the credential lives in our own `users` table, so there is no
  -- external id — either users.id doubles as the uid, or password is a
  -- `users` column and never a row here. The schema supports either.
  provider_uid TEXT NOT NULL,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- THE key that makes cross-provider mapping possible ([I9]). Also the
  -- primary hot path: "a token from provider X carries uid Y — which user is
  -- that?", which is what chunk 1.9's resolution does on every request.
  -- Postgres backs this with an index automatically; `provider` leads, so it
  -- additionally serves `WHERE provider = '…'` scans (the 1.3 backfill audit
  -- and the Phase 4 retirement count).
  CONSTRAINT auth_identities_provider_uid_key UNIQUE (provider, provider_uid)
);

-- Postgres does NOT automatically index a foreign-key column — only the
-- referenced side. Without this, the reverse lookup "which identities does
-- this user have?" is a sequential scan, and that is the query behind remote
-- logout and per-device session visibility. It also keeps the ON DELETE
-- CASCADE check above efficient.
CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id
  ON auth_identities (user_id);

-- RLS ENABLED WITH NO POLICY = DENY ALL. This is NOT a contradiction of
-- [I8]: I8 retires `auth.uid()` policies as an AUTHORISATION mechanism, and
-- none is written here. But NEXT_PUBLIC_SUPABASE_ANON_KEY is public by
-- design, so a new table left with RLS OFF is directly readable from any
-- browser — and this table maps provider UIDs to internal user IDs, so anon
-- read access would be an enumeration goldmine, strictly worse than the
-- dev-auth/lookup disclosure already logged in TASKS.md.
-- Same pattern already used for `waitlist` (schema.sql): RLS on, no policy,
-- and the service-role client (which bypasses RLS) does the work. Costs
-- nothing at migration — on AWS RDS you simply do not grant the table to a
-- public role.
ALTER TABLE auth_identities ENABLE ROW LEVEL SECURITY;

-- PostgREST caches the schema and will 404 the new table until told to
-- reload. Operational command, NOT business logic in the database, so it
-- does not breach [X5] / CORE T2 — it has no AWS RDS equivalent and simply
-- disappears with PostgREST.
NOTIFY pgrst, 'reload schema';


-- ── STEP 2: VERIFY (read-only, run after STEP 1) ───────────────────────

-- 2a. Columns — expect exactly 5 rows:
--   id           uuid                     NO   gen_random_uuid()
--   user_id      uuid                     NO   (null)
--   provider     text                     NO   (null)
--   provider_uid text                     NO   (null)
--   created_at   timestamp with time zone NO   now()
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'auth_identities'
ORDER BY ordinal_position;

-- 2b. Constraints — expect 3: PRIMARY KEY (p), FOREIGN KEY (f) whose
-- definition includes ON DELETE CASCADE, and UNIQUE (u) on
-- (provider, provider_uid).
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'auth_identities'::regclass
ORDER BY contype;

-- 2c. Indexes — expect 3 index rows: the PK index, the UNIQUE composite,
-- and idx_auth_identities_user_id.
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'auth_identities'
ORDER BY indexname;

-- 2d. RLS on, and ZERO policies. Expect: t, then 0.
SELECT relrowsecurity AS rls_enabled
FROM pg_class WHERE relname = 'auth_identities';

SELECT count(*) AS policy_count
FROM pg_policies WHERE tablename = 'auth_identities';

-- 2e. Table exists and is empty. Expect: 0.
SELECT count(*) AS row_count FROM auth_identities;


-- ── STEP 3: OPTIONAL CONSTRAINT PROOF (rolls back — persists nothing) ──
-- Each block is expected to FAIL on its last statement. That failure IS the
-- pass. ROLLBACK means the table is still genuinely empty afterwards, so
-- re-run STEP 2e to confirm 0 rows.

-- 3a. The FK must reject an identity pointing at a non-existent user.
-- EXPECT: 'insert or update on table "auth_identities" violates foreign key
-- constraint "auth_identities_user_id_fkey"'
BEGIN;
  INSERT INTO auth_identities (user_id, provider, provider_uid)
  VALUES (gen_random_uuid(), 'test-chunk-1-2', 'proof-fk');
ROLLBACK;

-- 3b. The UNIQUE constraint must reject the same (provider, provider_uid)
-- twice. Uses a REAL user id so the FK passes and the UNIQUE is what fires.
-- EXPECT: first INSERT succeeds, second fails with 'duplicate key value
-- violates unique constraint "auth_identities_provider_uid_key"'
BEGIN;
  INSERT INTO auth_identities (user_id, provider, provider_uid)
  SELECT id, 'test-chunk-1-2', 'proof-unique' FROM users LIMIT 1;

  INSERT INTO auth_identities (user_id, provider, provider_uid)
  SELECT id, 'test-chunk-1-2', 'proof-unique' FROM users LIMIT 1;
ROLLBACK;

-- 3c. The same provider_uid under a DIFFERENT provider must be ALLOWED —
-- this is what makes the [A12] parallel run representable (one user held by
-- two providers at once). EXPECT: both INSERTs succeed, then rollback.
BEGIN;
  INSERT INTO auth_identities (user_id, provider, provider_uid)
  SELECT id, 'test-provider-a', 'proof-shared-uid' FROM users LIMIT 1;

  INSERT INTO auth_identities (user_id, provider, provider_uid)
  SELECT id, 'test-provider-b', 'proof-shared-uid' FROM users LIMIT 1;

  SELECT provider, provider_uid FROM auth_identities
  WHERE provider_uid = 'proof-shared-uid';   -- expect 2 rows
ROLLBACK;
