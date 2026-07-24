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
