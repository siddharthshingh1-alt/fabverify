-- FabVerify Database Schema
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  profile_photo TEXT,
  user_type TEXT,
  position TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON users
  FOR ALL USING (id = auth.uid());

-- Manufacturer profiles
CREATE TABLE IF NOT EXISTS manufacturer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  categories TEXT[],
  min_order INT,
  capacity TEXT,
  verification_tier TEXT DEFAULT 'bronze',
  fab_score DECIMAL(3,1) DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE manufacturer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_profiles" ON manufacturer_profiles
  FOR SELECT USING (is_visible = true);

CREATE POLICY "own_profile" ON manufacturer_profiles
  FOR ALL USING (user_id = auth.uid());

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES users(id),
  manufacturer_id UUID REFERENCES users(id),
  style_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price_per_piece DECIMAL(10,2),
  total_value DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  delivery_date DATE,
  escrow_total DECIMAL(10,2) DEFAULT 0,
  escrow_released DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_participants" ON orders
  FOR ALL USING (
    buyer_id = auth.uid() OR manufacturer_id = auth.uid()
  );

-- Order milestones
CREATE TABLE IF NOT EXISTS order_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  milestone_number INT NOT NULL,
  milestone_name TEXT NOT NULL,
  payment_percentage INT DEFAULT 20,
  status TEXT DEFAULT 'pending',
  photo_url TEXT,
  geo_lat DECIMAL(10,8),
  geo_lng DECIMAL(11,8),
  completed_at TIMESTAMPTZ,
  payment_released BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestone_participants" ON order_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND (
        orders.buyer_id = auth.uid() OR
        orders.manufacturer_id = auth.uid()
      )
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  is_verified_update BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_participants" ON messages
  FOR ALL USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Sample briefs
CREATE TABLE IF NOT EXISTS sample_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  quantity INT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sample_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_briefs" ON sample_briefs
  FOR SELECT USING (status = 'open');

CREATE POLICY "own_briefs" ON sample_briefs
  FOR ALL USING (buyer_id = auth.uid());

-- Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enquiry_participants" ON enquiries
  FOR ALL USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- FabScore history
CREATE TABLE IF NOT EXISTS fabscore_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  score DECIMAL(3,1),
  event_type TEXT,
  event_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fabscore_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_score_history" ON fabscore_history
  FOR ALL USING (user_id = auth.uid());

-- Migration: generic per-user-type onboarding data + manufacturer profile
-- fields the onboarding form collects but the original schema didn't store.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}';

ALTER TABLE manufacturer_profiles
  ADD COLUMN IF NOT EXISTS unit_type TEXT,
  ADD COLUMN IF NOT EXISTS moq_unit TEXT DEFAULT 'pieces',
  ADD COLUMN IF NOT EXISTS specialisations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS notable_clients TEXT[];

-- One profile per user — required for the upsert(..., { onConflict: 'user_id' })
-- in saveManufacturerProfile (app/lib/db.ts) to work; ON CONFLICT needs a
-- real unique constraint to target, which the original schema never had.
ALTER TABLE manufacturer_profiles
  ADD CONSTRAINT manufacturer_profiles_user_id_key UNIQUE (user_id);

-- Verification applications (generic — applies to any user type, not just
-- manufacturers; manufacturer_profiles.verification_tier is a separate,
-- pre-existing column used only for the discovery-page badge/filter and is
-- intentionally left alone here).
CREATE TABLE IF NOT EXISTS verification_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  documents JSONB DEFAULT '{}',
  video_call_scheduled TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE verification_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_applications" ON verification_applications
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS bronze_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS silver_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gold_verified_at TIMESTAMPTZ;

-- Waitlist — submitted by signed-out visitors (no user_id), so RLS is
-- enabled with no policy at all: deny direct anon/authenticated access
-- entirely, same as every other table here, and rely on the service-role
-- client (which bypasses RLS) for the one route that writes to it.
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Auth identities — the durable link between a `users` row and the provider
-- identity that authenticated it (DECISIONS I9, resolves I6). Added by
-- migration 002_auth_identities.sql, 2026-07-30, and duplicated here so a
-- fresh environment — or the AWS RDS build in A12 Phase 3, which is likely
-- to be created from this file — does not silently miss the foundation table
-- that all of Launch-Ready item 1 stands on.
--
-- Today the only link between a session and an account is the phone number,
-- which is why a telco reassignment can inherit an account (I6) and why
-- there is no key to map identities across providers at cutover. A TABLE
-- rather than a `users.auth_user_id` column because a column holds ONE
-- identity and cannot express "this user exists in both the old and the new
-- provider at once" — exactly what the A12 parallel run is.
--
-- Full rationale, per-column reasoning and the VERIFY queries live in
-- supabase/migrations/002_auth_identities.sql. Keep the two in sync.
CREATE TABLE IF NOT EXISTS auth_identities (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- ON DELETE CASCADE deviates from every other FK here, deliberately: an
  -- orphaned identity still occupies the UNIQUE constraint (blocking
  -- re-registration) and could resolve a live session to a deleted account.
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- No CHECK constraint: adding a provider mid-migration must not need DDL.
  provider     TEXT NOT NULL,
  -- TEXT not UUID — a Cognito sub / social id / email id is not a UUID.
  provider_uid TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_identities_provider_uid_key UNIQUE (provider, provider_uid)
);

-- Postgres does not auto-index FK columns; this serves the reverse lookup
-- ("which identities does this user have?") behind remote logout, and keeps
-- the ON DELETE CASCADE check efficient.
CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id
  ON auth_identities (user_id);

-- RLS on with NO policy = deny all, same pattern as `waitlist` above. NOT a
-- contradiction of I8 (which retires auth.uid() policies as an authorisation
-- mechanism — none is written here): the anon key is public, so a table left
-- with RLS off is browser-readable, and this one maps provider UIDs to
-- internal user IDs. Service-role access (which bypasses RLS) does the work.
ALTER TABLE auth_identities ENABLE ROW LEVEL SECURITY;

-- User credentials — password hashes FabVerify itself owns (DECISIONS M10,
-- built as the A12 migration safety net). Added by migration
-- 003_user_credentials.sql, 2026-08-06, and duplicated here for the same
-- reason as auth_identities above: the A12 Phase 3 RDS build is likely to be
-- created from this file and must not miss it.
--
-- ⚠️ PASSWORDS ARE NEVER STORED IN SUPABASE AUTH — a credential we own works
-- identically before, during and after the move, and is the fallback if the
-- token cutover goes wrong.
--
-- ⚠️ A SEPARATE TABLE, NOT A `users.password_hash` COLUMN, because
-- /api/dev-auth/lookup is unauthenticated and returns `select("*")` on
-- `users` for any phone — a column there would hand an anonymous caller the
-- hash for every account on the platform. A separate table cannot be reached
-- by `select("*")` on `users`, so the leak is impossible by construction.
--
-- Password writes NO auth_identities row: the credential is ours, so there is
-- no external provider and no external id. Chunk 1.9's identity and phone
-- branches are unaffected.
--
-- Full per-column reasoning and the VERIFY queries live in
-- supabase/migrations/003_user_credentials.sql. Keep the two in sync.
CREATE TABLE IF NOT EXISTS user_credentials (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- ON DELETE CASCADE: a credential outliving its user is a live
  -- authentication secret with no owner.
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- No CHECK: adding a credential type (passkey, TOTP) must not need DDL.
  credential_type      TEXT NOT NULL DEFAULT 'password',
  -- The argon2id ENCODED string — carries its own salt AND parameters, so no
  -- separate salt or params column. TEXT, never fixed-width: a truncated hash
  -- fails silently and retroactively.
  password_hash        TEXT NOT NULL,
  -- Revocation. Our tokens are signed, not stored, so they cannot be deleted;
  -- a password reset bumps this and every outstanding session for the account
  -- fails verification at once (chunk 2.8's "reset ends existing sessions").
  token_epoch          INTEGER NOT NULL DEFAULT 0,
  -- Lockout (chunk 2.7). NOT NULL DEFAULT 0 deliberately: `failed_attempts +
  -- 1` is NULL when the column is NULL, so a nullable counter never
  -- increments — a lockout that never locks.
  failed_attempts      INTEGER NOT NULL DEFAULT 0,
  last_failed_at       TIMESTAMPTZ,
  locked_until         TIMESTAMPTZ,
  -- Reset (chunk 2.8). NO reset_token column by design — reset proves the
  -- phone by OTP, which is already built. No email reset links.
  password_changed_at  TIMESTAMPTZ,
  -- "Enterprise default password" (Phase A): admin-set, user must replace.
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Application-maintained, not a trigger (MIGRATION.md §5 rule 3).
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Makes "re-setting a password replaces rather than duplicates" structural.
  CONSTRAINT user_credentials_user_type_key UNIQUE (user_id, credential_type)
);

-- No separate user_id index, unlike auth_identities: the UNIQUE constraint
-- above LEADS with user_id, so its automatic index already serves the FK
-- cascade check and every lookup this table has.

-- RLS on with NO policy = deny all. Higher stakes than any other table here:
-- the anon key is public and this one holds password hashes. Service-role
-- access (which bypasses RLS) does the work. An anon SELECT returning 0 rows
-- on an empty table proves nothing — the proof is an anon INSERT → 42501.
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
