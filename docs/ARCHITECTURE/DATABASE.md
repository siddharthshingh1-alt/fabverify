# DATABASE.md
### The Database Schema & Rules
> Claude Code reads this BEFORE writing any query, to use real column names — never guessed ones. All access goes through `app/lib/db.ts` (CORE T1). Standard PostgreSQL only (CORE T2). Current DB: Supabase (Postgres); target: AWS RDS (Postgres) via one-file `db.ts` change.

---

## THE GOLDEN RULES
1. **Only `db.ts` and `supabase.ts` import Supabase.** Every other file calls functions in `db.ts`. No direct Supabase calls in components or routes (except the existing service-role API routes, which still centralize through helpers).
2. **Standard PostgreSQL only** — no Supabase-specific SQL. Must run unchanged on AWS RDS.
3. **RLS on every table.** Policies restrict rows to the owning/participating user. Service-role API routes bypass RLS server-side for dev/admin operations only.
4. **Never store raw Aadhaar, card numbers, passwords, or secrets.** Verification stores status, not the government ID number.
5. **After DDL on Supabase**, may need `NOTIFY pgrst, 'reload schema';`. `CREATE POLICY` has no `IF NOT EXISTS` — re-runs error on existing policies (known).

---

## LIVE TABLES (exist now)

### users
Primary identity table. One row per person.
```
id                    UUID PK (gen_random_uuid())
phone                 TEXT UNIQUE NOT NULL   -- E.164 last-10 form used as lookup key
name                  TEXT
email                 TEXT
city                  TEXT
state                 TEXT
profile_photo         TEXT
user_type             TEXT   -- brand_buyer | manufacturer | fabric_mill | trim_supplier | artisan | job_worker | designer | master | merchandiser | qc_inspector | enterprise
position              TEXT   -- enterprise position (md_ceo, cfo, head_ops, ...)
profile_data          JSONB DEFAULT '{}'  -- type-specific data (avoids per-type columns)
verification_tier     TEXT DEFAULT 'none'      -- none | bronze | silver | gold
verification_status   TEXT DEFAULT 'unverified' -- unverified | application_submitted | verified
bronze_verified_at    TIMESTAMPTZ
silver_verified_at    TIMESTAMPTZ
gold_verified_at      TIMESTAMPTZ
created_at            TIMESTAMPTZ DEFAULT NOW()
```
RLS: `users_own_data` — `id = auth.uid()`.

### manufacturer_profiles
```
id                  UUID PK
user_id             UUID REFERENCES users(id) UNIQUE   -- UNIQUE needed for upsert onConflict
business_name       TEXT NOT NULL
city, state         TEXT
categories          TEXT[]
min_order           INT
moq_unit            TEXT     -- 'pieces' | 'meters'
capacity            TEXT
unit_type           TEXT
specialisations     TEXT[] DEFAULT '{}'
about               TEXT
notable_clients     TEXT[]
verification_tier   TEXT DEFAULT 'bronze'   -- SYNCED with users.verification_tier on silver/gold (M9)
fab_score           DECIMAL(3,1) DEFAULT 0
is_visible          BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT NOW()
```
RLS: `public_profiles` (SELECT where is_visible), `own_profile` (ALL where user_id = auth.uid()).

### orders
```
id                UUID PK
order_number      TEXT UNIQUE NOT NULL   -- ORD-XXXXXX
buyer_id          UUID REFERENCES users(id)
manufacturer_id   UUID REFERENCES users(id)
style_name        TEXT NOT NULL
quantity          INT NOT NULL
price_per_piece   DECIMAL(10,2)
total_value       DECIMAL(10,2)
status            TEXT DEFAULT 'pending'   -- pending | confirmed | declined | in_production | completed | ...
delivery_date     DATE
escrow_total      DECIMAL(10,2) DEFAULT 0
escrow_released   DECIMAL(10,2) DEFAULT 0
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
-- MISSING (TODO): delivery_address, special_instructions
```
RLS: `order_participants` — buyer_id or manufacturer_id = auth.uid().

### order_milestones
```
id                  UUID PK
order_id            UUID REFERENCES orders(id)
milestone_number    INT NOT NULL
milestone_name      TEXT NOT NULL
payment_percentage  INT DEFAULT 20
status              TEXT DEFAULT 'pending'   -- pending | active | completed
photo_url           TEXT
geo_lat             DECIMAL(10,8)
geo_lng             DECIMAL(11,8)
completed_at        TIMESTAMPTZ
payment_released    BOOLEAN DEFAULT FALSE
created_at          TIMESTAMPTZ DEFAULT NOW()
```
Auto-created (5 per order) on order insert. RLS: participants of the parent order.

### messages
```
id                 UUID PK
order_id           UUID REFERENCES orders(id)   -- nullable (non-order chats)
sender_id          UUID REFERENCES users(id)
receiver_id        UUID REFERENCES users(id)
content            TEXT
message_type       TEXT DEFAULT 'text'   -- text | photo | voice
media_url          TEXT                  -- ⚠️ currently base64; move to Supabase Storage
is_verified_update BOOLEAN DEFAULT FALSE
read_at            TIMESTAMPTZ
created_at         TIMESTAMPTZ DEFAULT NOW()
```
RLS: `message_participants` — sender_id or receiver_id = auth.uid().

### sample_briefs
```
id           UUID PK
buyer_id     UUID REFERENCES users(id)
title        TEXT NOT NULL
category     TEXT
description  TEXT
quantity     INT
budget_min   DECIMAL(10,2)
budget_max   DECIMAL(10,2)
status       TEXT DEFAULT 'open'   -- open | responses_received | closed
created_at   TIMESTAMPTZ DEFAULT NOW()
```
RLS: `public_briefs` (SELECT where open), `own_briefs` (ALL where buyer_id = auth.uid()).

### enquiries
```
id           UUID PK
sender_id    UUID REFERENCES users(id)
receiver_id  UUID REFERENCES users(id)
subject      TEXT
message      TEXT NOT NULL
status       TEXT DEFAULT 'unread'
created_at   TIMESTAMPTZ DEFAULT NOW()
```
RLS: `enquiry_participants` — sender or receiver = auth.uid().

### fabscore_history
```
id                 UUID PK
user_id            UUID REFERENCES users(id)
score              DECIMAL(3,1)
event_type         TEXT
event_description  TEXT
created_at         TIMESTAMPTZ DEFAULT NOW()
```
Table exists; ⚠️ no algorithm writes to it yet. RLS: own rows.

### verification_applications
```
id                     UUID PK
user_id                UUID REFERENCES users(id)
tier                   TEXT NOT NULL       -- bronze | silver | gold
status                 TEXT DEFAULT 'pending'   -- pending | approved | rejected
submitted_at           TIMESTAMPTZ DEFAULT NOW()
reviewed_at            TIMESTAMPTZ
reviewer_notes         TEXT
documents              JSONB DEFAULT '{}'
video_call_scheduled   TIMESTAMPTZ
created_at, updated_at TIMESTAMPTZ DEFAULT NOW()
```
RLS: `own_applications` — user_id = auth.uid(). ⚠️ No admin approval UI yet.

### waitlist
```
id UUID PK · email TEXT · phone TEXT · created_at TIMESTAMPTZ DEFAULT NOW()
```
RLS enabled.

---

## PLANNED TABLES (design-locked, not created) — build per ROADMAP
- **fabrics** (FAB-): mill_id, name, composition, gsm, width, colours[], price_per_meter, moq_meters, ready_or_custom, lead_time, custom_code, test_reports JSONB
- **lab_dips** (LD-): fabric_id, seq, photos[], recipe, status, approved_colour_id
- **dye_lots** (LOT-): fabric_id, letter, shade_band_url, meters, order_id
- **approved_colours** (COL-): mill_id, name, buyer_id, reference
- **trims** (TRIM-): supplier_id, category, material, size, colours[], moq, price, lead_time, branded
- **trim_artboards** (ART-), **trim_reserves** (RSV-)
- **craft_orders** (CRAFT-), **authenticity_certs** (AUTH-), **gi_tags** (GI-)
- **job_orders** (JOB-): jw_id, process, parent_order_id, received_count, returned_count, price_unit(piece/meter), rate
- **shift_proofs**: jw_id, type(start/end/ot-start/ot-end), geo_lat/lng, timestamp, photo_url, styles[](with machine_count)
- **design_projects** (DSN-), **tech_packs** (TP-, versioned)
- **sample_jobs** (SMP-, rounds), **merch_projects** (MER-), **tna_calendars** (TNA-)
- **fabtalent_profiles** (TAL-): type, specialisation, portfolio[], skill_verified, availability
- **inventory_items** (universal identity): master_id, aliases JSONB, spec_fingerprint JSONB, barcode, photo_url, category, quantity
- **escrow_transactions**: order_id, milestone_id, amount, status, partner_ref (licensed PA)
- **qr_nodes**: entity_type, entity_id, geo, timestamp, photo, scanner_id, prev_node_id (chain)
- **enterprise_teams**, **enterprise_roles**, **enterprise_permissions**
- **credit_applications**, **credit_kfs** (Key Fact Statements)

---

## MIGRATION NOTES (Supabase → AWS RDS)
- All tables are standard Postgres — portable as-is.
- `gen_random_uuid()` is standard Postgres (pgcrypto) — available on RDS.
- RLS is Postgres-native — portable, but AWS setup differs; auth.uid() is Supabase-specific → on RDS, application-level auth replaces it. Plan: `db.ts` handles the auth-context mapping so table policies or app-level checks swap cleanly.
- `NEXT_PUBLIC_SUPABASE_*` → replaced by RDS connection env vars; only `db.ts`/`supabase.ts` change.
- Move photos to object storage (Supabase Storage now → S3 on AWS) — store URLs, not base64.

---

## QUERY CONVENTIONS (in db.ts)
- Every function returns typed data or `null`/`[]` on error (never throws to the UI unless the caller expects it).
- Joins use explicit foreign-key hints where two FKs point to `users` (e.g. `buyer:users!buyer_id`, `manufacturer:users!manufacturer_id`).
- Upserts specify `onConflict` on the UNIQUE column (e.g. `manufacturer_profiles.user_id`).
- Reads for lists always support the caller providing loading/empty handling.
