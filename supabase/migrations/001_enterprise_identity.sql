-- 001_enterprise_identity.sql
--
-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STATUS: APPLIED — 2026-07-26. 1 row updated (phone 9773933279:       │
-- │ user_type 'buyer' -> 'enterprise', position NULL -> 'md_ceo').       │
-- │ DO NOT RUN STEP 2 AGAIN. It is left commented out below as a record  │
-- │ of what was executed. The WHERE clause makes it a no-op regardless.  │
-- └──────────────────────────────────────────────────────────────────────┘
--
-- One-time correction for accounts created before enterprise identity was
-- stored durably.
--
-- BACKGROUND: /onboarding/type mapped "enterprise-brand" to user_type
-- 'buyer', so enterprise identity existed only in localStorage and was lost
-- on every logout/re-login (the account then rendered as "Brand Builder").
-- Enterprise onboarding is the only flow that writes profile_data.companyName
-- together with profile_data.role, which makes those two fields a reliable
-- fingerprint for the affected rows.
--
-- Standard PostgreSQL only — no Supabase-specific features (CORE T2 / A2).
-- Idempotent: after the first run no row still matches user_type = 'buyer',
-- so re-running is a no-op.
--
-- RUN THE PREVIEW FIRST and confirm the row count before the UPDATE.

-- ── STEP 1: PREVIEW (read-only, safe to run repeatedly) ────────────────
-- Now returns zero rows, because the correction below has been applied.
SELECT
  phone,
  name,
  user_type                     AS current_user_type,
  position                      AS current_position,
  profile_data ->> 'companyName' AS company_name,
  profile_data ->> 'role'        AS enterprise_role
FROM users
WHERE user_type = 'buyer'
  AND profile_data ->> 'companyName' IS NOT NULL
  AND profile_data ->> 'role' IS NOT NULL
ORDER BY created_at DESC;

-- ── STEP 2: UPDATE — ALREADY APPLIED 2026-07-26, DO NOT RE-RUN ─────────
-- The CASE mirrors ROLE_TO_POSITION in app/onboarding/enterprise/page.tsx.
-- An unrecognised role leaves position NULL rather than guessing.
--
-- UPDATE users
-- SET user_type = 'enterprise',
--     position = CASE profile_data ->> 'role'
--                  WHEN 'MD / CEO'              THEN 'md_ceo'
--                  WHEN 'Head of Operations'    THEN 'head_operations'
--                  WHEN 'Head of Merchandising' THEN 'head_merchandising'
--                  WHEN 'Buying Head'           THEN 'buying_head'
--                  WHEN 'CFO'                   THEN 'cfo'
--                  WHEN 'IT Head'               THEN 'it_head'
--                  WHEN 'Other'                 THEN 'other'
--                  ELSE NULL
--                END
-- WHERE user_type = 'buyer'
--   AND profile_data ->> 'companyName' IS NOT NULL
--   AND profile_data ->> 'role' IS NOT NULL;

-- ── STEP 3: VERIFY (after the UPDATE) ─────────────────────────────────
-- SELECT phone, user_type, position FROM users WHERE user_type = 'enterprise';
