-- 004_otp_requests.sql
--
-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STATUS: NOT YET APPLIED. Run STEP 1, then the STEP 2 VERIFY queries. │
-- │ STEP 3 is optional proof and rolls itself back.                      │
-- │ Safe to re-run in full: every statement is idempotent.               │
-- └──────────────────────────────────────────────────────────────────────┘
--
-- THE OTP SEND THROTTLE (M10 chunk 2.6c). The counter behind server-side OTP
-- sending. Until this chunk the send ran BROWSER-DIRECT against Supabase
-- (authProvider.ts sendOtp -> supabase.auth.signInWithOtp), which meant it was
-- unthrottleable by us, invisible to any counter we own, and willing to SMS a
-- number with no account.
--
-- ⚠️ WHY A TABLE AND NOT MEMORY. There is no shared state store — no Redis —
-- and Vercel lambdas share no memory, so a module-level Map throttles exactly
-- one warm instance and nothing else. Same constraint [I23] recorded when it
-- declined to build per-IP lockout. Postgres is the only shared state this
-- platform has.
--
-- ⚠️ WHY THE PHONE IS HASHED AND NEVER STORED RAW. This table takes a row for
-- every number that ASKS for a code, including numbers that never sign up.
-- Stored raw it would quickly become the largest pile of non-user PII on the
-- platform — and the platform already has an unauthenticated route that
-- returns select("*") on a table (/api/dev-auth/lookup). A hash makes that
-- leak impossible BY CONSTRUCTION rather than prevented by remembering a
-- column projection forever; the same reasoning [I10] used to put password
-- hashes in their own table instead of on `users`.
--
-- The hash is HMAC-SHA256 under a server-only key derived from
-- SESSION_TOKEN_SECRET with domain separation (app/lib/otpThrottle.server.ts).
-- HMAC, not a bare digest: a plain SHA-256 of a 10-digit Indian mobile is
-- brute-forceable in seconds (there are under 4 billion candidates), so an
-- unkeyed hash would be a reversible encoding, not a protection.
--
-- ⚠️ NO FOREIGN KEY TO users, DELIBERATELY. The whole point is to count
-- requests for numbers that have NO account. An FK would make the table
-- incapable of recording exactly the abuse it exists to stop.
--
-- ⚠️ THIS TABLE IS NOT AN AUDIT LOG AND MUST NOT BECOME ONE. It holds only
-- what the throttle arithmetic needs, and rows are purged after
-- OTP_REQUEST_RETENTION_HOURS (48). Keeping more, or keeping it longer, would
-- rebuild the PII pile the hashing just removed.
--
-- Standard PostgreSQL only — no Supabase-specific features (CORE T2 / A2).

-- ── STEP 1: CREATE (idempotent, safe to re-run) ────────────────────────

CREATE TABLE IF NOT EXISTS otp_requests (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- HMAC-SHA256 hex of the last-10-digit phone, under a server-only key.
  -- ⚠️ NEVER store the raw number here. See the header.
  phone_hash  TEXT NOT NULL,

  -- HMAC-SHA256 hex of the caller IP, or NULL when no IP header was present
  -- (localhost, and any proxy configuration that strips it).
  -- ⚠️ NULLABLE ON PURPOSE: "no IP observed" is genuinely absent. A sentinel
  -- string would make every IP-less caller share one bucket and throttle each
  -- other — which on localhost means the dev machine throttling itself.
  ip_hash     TEXT,

  -- 'login' | 'signup' | 'reset'. NO CHECK CONSTRAINT, matching the
  -- convention of users.user_type, auth_identities.provider and
  -- user_credentials.credential_type: adding a purpose must not need DDL.
  purpose     TEXT NOT NULL DEFAULT 'login',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Every read this table serves is "rows for KEY newer than CUTOFF", so both
-- keyed indexes are composite and lead with the key. created_at DESC matches
-- the direction the windows are scanned in.
CREATE INDEX IF NOT EXISTS idx_otp_requests_phone_time
  ON otp_requests (phone_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_requests_ip_time
  ON otp_requests (ip_hash, created_at DESC);

-- Serves the GLOBAL daily count (the spend circuit-breaker) and the
-- opportunistic purge, neither of which has a key to lead with.
CREATE INDEX IF NOT EXISTS idx_otp_requests_time
  ON otp_requests (created_at);

-- RLS ENABLED WITH NO POLICY = DENY ALL. Same pattern as auth_identities and
-- user_credentials. NEXT_PUBLIC_SUPABASE_ANON_KEY is public by design, so a
-- table left with RLS OFF is readable from any browser — and this one maps
-- request timing to phone hashes. The service-role client, which bypasses
-- RLS, does the work from db.ts.
-- ⚠️ An anon SELECT returning 0 rows on an empty table proves NOTHING. The
-- conclusive proof is an anon INSERT returning 42501 — see STEP 4.
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;

-- PostgREST caches the schema and will 404 the new table until told to
-- reload. Operational command, not business logic in the database.
NOTIFY pgrst, 'reload schema';


-- ── STEP 2: VERIFY (read-only, run after STEP 1) ───────────────────────

-- 2a. Columns — expect exactly 5 rows, in this order:
--   id          uuid                     NO   gen_random_uuid()
--   phone_hash  text                     NO   (null)
--   ip_hash     text                     YES  (null)
--   purpose     text                     NO   'login'::text
--   created_at  timestamp with time zone NO   now()
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'otp_requests'
ORDER BY ordinal_position;

-- 2b. Constraints — expect exactly 1 row: PRIMARY KEY (p).
-- ⚠️ NO foreign key here, and its absence is the design (see the header).
-- Filtered to p/f/u because PostgreSQL 17 also catalogues NOT NULL
-- constraints in pg_constraint, which would change the count for reasons
-- unrelated to this table.
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'otp_requests'::regclass
  AND contype IN ('p', 'f', 'u')
ORDER BY contype;

-- 2c. Indexes — expect exactly 4: the PK index plus the three above.
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'otp_requests'
ORDER BY indexname;

-- 2d. RLS on, and ZERO policies. Expect: t, then 0.
SELECT relrowsecurity AS rls_enabled
FROM pg_class WHERE relname = 'otp_requests';

SELECT count(*) AS policy_count
FROM pg_policies WHERE tablename = 'otp_requests';

-- 2e. Table exists and is empty. Expect: 0.
SELECT count(*) AS row_count FROM otp_requests;

-- 2f. The tables this chunk must NOT touch, unchanged. Expect 1 and 1
-- (auth_identities = the chunk 1.3 backfill; user_credentials = the founder's
-- password from chunk 2.6a). Any other number means something happened
-- outside this migration and needs explaining before proceeding.
SELECT count(*) AS auth_identities_rows FROM auth_identities;
SELECT count(*) AS user_credentials_rows FROM user_credentials;


-- ── STEP 3: OPTIONAL PROOF (rolls back — persists nothing) ─────────────

-- 3a. ⚠️ THE CHUNK'S CENTRAL CLAIM: a row can be recorded for a number that
-- has NO ACCOUNT. If this fails, the table cannot count the abuse it exists
-- to stop. EXPECT: insert succeeds, one row selected, then rollback.
BEGIN;
  INSERT INTO otp_requests (phone_hash, ip_hash, purpose)
  VALUES ('proof-hash-no-such-user-2-6-c', 'proof-ip-2-6-c', 'login');

  SELECT phone_hash, ip_hash, purpose,
         created_at IS NOT NULL AS created_set
  FROM otp_requests WHERE phone_hash = 'proof-hash-no-such-user-2-6-c';
ROLLBACK;

-- 3b. A NULL ip_hash must be allowed (localhost, stripped headers).
-- EXPECT: insert succeeds, then rollback.
BEGIN;
  INSERT INTO otp_requests (phone_hash, purpose)
  VALUES ('proof-hash-null-ip-2-6-c', 'reset');
ROLLBACK;

-- 3c. Many rows per number must be allowed — there is no UNIQUE constraint,
-- because the throttle COUNTS rows rather than upserting one.
-- EXPECT: should_be_3 = 3, then rollback.
BEGIN;
  INSERT INTO otp_requests (phone_hash) VALUES
    ('proof-hash-many-2-6-c'), ('proof-hash-many-2-6-c'), ('proof-hash-many-2-6-c');

  SELECT count(*) AS should_be_3 FROM otp_requests
  WHERE phone_hash = 'proof-hash-many-2-6-c';
ROLLBACK;


-- ── STEP 4: RLS PROOF — CANNOT BE RUN HERE ─────────────────────────────
-- ⚠️ The Supabase SQL Editor connects as a privileged role that BYPASSES
-- RLS, so nothing above proves the anon key is actually denied. The
-- conclusive test — an anon INSERT returning 42501 — is asserted from
-- outside by scripts/verify-otp-send.ts section [A], exactly as chunks 1.2
-- and 2.1 proved auth_identities and user_credentials.
