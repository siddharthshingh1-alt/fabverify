# MIGRATION.md
### Supabase → AWS RDS: Inventory, Strategy and Build Rules
> The durable reference for how FabVerify leaves Supabase without locking anyone out. Read this before building anything that touches auth, storage, payments, or the database layer. Audited against the tree at commit `1bb7b1b` (2026-07-29).

**Locked decisions this file implements:** DECISIONS **A12** (parallel-run migration), **I8** (RLS retired), **I9** (auth_identities model). Supersedes the open questions in **I6** and **I7**.

---

## 0. THE ONE-LINE SUMMARY

> Own identity in your own tables, rent authentication behind one seam, give every user a credential you control, then run both providers in parallel until nobody is standing on the old one.

---

## 1. WHERE WE STAND (audited 2026-07-29)

### 1.1 Does all DB access go through `db.ts`?

Almost. Seven files import Supabase:

| File | Uses | Verdict |
|---|---|---|
| `app/lib/db.ts` | `supabaseAdmin.from` | ✅ the abstraction layer |
| `app/lib/supabase.ts` | `createClient` | ✅ browser client factory |
| `app/lib/supabaseAdmin.ts` | `createClient` | ✅ service-role factory |
| `app/api/test-db/route.ts` | **`supabase.from("users")`** | 🚫 **CORE T1 / A1 VIOLATION** — direct query outside `db.ts` |
| `app/login/page.tsx` | `auth.signInWithOtp`, `verifyOtp`, `signOut` | ⚠️ auth only, no DB |
| `app/signup/page.tsx` | same | ⚠️ auth only, no DB |
| `app/context/UserContext.tsx` | `auth.signOut` | ⚠️ auth only, no DB |
| `app/components/AuthGuard.tsx` | `auth.getSession` | ⚠️ auth only, no DB |

**17 of 18 API routes import `db.ts`.** The discipline held through the entire auth-hardening batch. The single violation is a one-line health check and is trivial to fix.

**The four `auth` importers are the real finding.** They touch no database, so they do not threaten the *data* migration — but they mean **there is no auth abstraction layer**. `db.ts` is the seam for data; auth has no equivalent. That is invisible to a DB-only audit and is the largest migration risk we carry.

### 1.2 Supabase-specific dependency inventory

| System | Where | Difficulty | Isolation |
|---|---|---|---|
| **Supabase Auth** (OTP, session, token→identity, sign-out) | 5 files (see below) | 🔴 **HARD** | **POOR — scattered** |
| **PostgREST query syntax** | `db.ts` | 🟡 MEDIUM | ✅ EXCELLENT — one file |
| **RLS / `auth.uid()`** | `supabase/schema.sql` | 🟢 LOW (already inert) | schema only |
| **Supabase Storage** | not used yet | 🟢 NONE YET | n/a |
| **Client library / env** | 3 files, 3 env vars | 🟢 LOW | contained |

**Auth, broken out — five pieces, five places:**

| Piece | Location |
|---|---|
| OTP send / verify | `login/page.tsx`, `signup/page.tsx` (`signInWithOtp`, `verifyOtp`) |
| Session storage | `supabase.ts` — `persistSession: true` → **localStorage, no cookies** |
| Token → identity (the trust root) | `db.ts` `getPhoneFromAccessToken` → `supabaseAdmin.auth.getUser()` |
| Session read | `AuthGuard.tsx` — `getSession()` |
| Sign-out | `UserContext.tsx` — ✅ already centralised |

**PostgREST syntax in `db.ts` — 813 lines, 35 exported functions:**

| Pattern | Count | On RDS becomes |
|---|---|---|
| Embedded-resource joins (`buyer:users!buyer_id(...)`) | **16** | real SQL `JOIN`s |
| `.maybeSingle()` | 8 | `rows[0] ?? null` |
| `.upsert(..., { onConflict })` | 3 / 2 | `INSERT … ON CONFLICT DO UPDATE` |

⚠️ **`db.ts`'s own header currently claims "All queries use standard PostgreSQL. No Supabase-specific features used." That is inaccurate** — see the table above. Correcting it is part of Launch-Ready item 1; a future migration planned against that comment would badly underestimate the work.

**RLS:** 10 policies reference `auth.uid()`, which has no RDS equivalent. They are already decorative — `users.id` never equals `auth.uid()`, so they can never match (was I7, now decided in **I8**). Because the security batch put real authorisation server-side, we are *not* dependent on them; on RDS they are simply deleted.

**Storage:** zero `.storage.` calls. Photos are base64 in `messages.media_url` (X3 debt). This is an opportunity, not a problem — see §4.4.

### 1.3 The honest assessment

**Data migrates cleanly.** Supabase *is* Postgres, so standard logical replication gets us to RDS with seconds of downtime.

**Auth does not migrate at all.** A session is not data. A Supabase JWT is signed by Supabase's keys; no other issuer can validate it. Copying rows does not move sessions.

**And identity has no durable anchor today.** `users.id` is a generated UUID unrelated to the Supabase auth user; the only link between a session and an account is the **phone number** (`getUserByPhone`). Consequences:

- No key to map old identities onto new ones at cutover
- Telco phone reassignment silently transfers an account (**I6**)
- RLS can never match (**I7**)
- "Log out other devices" cannot be built (Account Security & Recovery group)

One fix resolves all four. It is Launch-Ready item 1.

---

## 2. STRATEGIC PRINCIPLE

> **Own identity yourself. Rent only authentication.**

The `users` table is the source of truth for *who someone is*. The auth provider only answers *did this person prove they are that identity*. Providers become swappable; identity never moves.

---

## 3. THE MIGRATION — 4-PHASE PARALLEL RUN (DECISIONS A12)

**Target:** seconds of downtime at the flip, executed in a low-traffic window.
**Accepted:** some users may need **one** re-verification (re-OTP or set password) at cutover. That is normal for an auth migration, not a failure.

### Phase 1 — Decouple (during Launch-Ready, NOW)
Add `auth_identities`; backfill Supabase identities for existing users; add password credentials we own; build `authProvider.ts`. **Nothing user-visible changes.** Supabase still performs all authentication.

### Phase 2 — Dual-verify (weeks before migration)
Stand up the new provider. `getIdentityFromToken()` tries the new issuer first and falls back to Supabase. Both token types resolve to the same `users` row via `auth_identities`. New logins receive new-provider tokens; existing Supabase sessions keep working untouched. **Nobody is logged out.** Hold this window long enough that most active users re-authenticate onto the new provider naturally.

### Phase 3 — Data migration (the RDS move)
Logical replication Supabase → RDS; cut writes over in a low-traffic window. Because auth was decoupled in Phase 1, **this is now purely a data operation.** Sessions are unaffected — tokens do not live in the database.

### Phase 4 — Retire Supabase
Stop issuing Supabase tokens. Keep the fallback verifier alive until the longest legacy session TTL expires (weeks, not months). Then delete the Supabase branch, client and dependency.

**Why nobody is locked out:** at no point is a user's ability to authenticate withdrawn. Live sessions stay valid through dual-verify. Anyone whose session expires re-authenticates with a password we control or an OTP from the new provider. The worst case for any user is **one ordinary login**.

### Known risks

- **Backfilling `auth_identities`** means enumerating Supabase auth users and matching on phone — the same fragile phone-matching this work exists to replace. **Do it early, while the user count is small.** It gets harder every month.
- **OTP provider swap** (Twilio trial → 2Factor.in or the new stack) is a second moving part. Do it *before* the auth cutover, never during.
- **Dev bypass** (`123456`, DECISIONS A10) must be re-implemented behind the seam or local development breaks on day one.
- **"Zero interruption" is achievable for auth and near-achievable for data**, but expect a short write-freeze during replication cutover. Plan it, announce it, do not promise literal zero.

---

## 4. BUILD RULES PER LAUNCH-READY ITEM

Locked order. Each item's abstraction layer is built **before** its first implementation, never after.

### 4.1 Durable auth link + auth seam 🔴 FOUNDATION
> **Built across MANY sessions, not one.** Split into 10 self-contained chunks — see `TASKS.md` for the ordered list and the 📍 STATUS line recording which chunk is next. Chunks 1.1–1.4 are additive and near-zero risk; 1.5–1.9 touch the login path; 1.9 (resolve identity via `auth_identities`) is the highest-risk chunk and the one that actually decouples identity from phone number.

`auth_identities` table (`user_id`, `provider`, `provider_uid`, `created_at`, `UNIQUE(provider, provider_uid)`), backfill, `app/lib/authProvider.ts`, move `getPhoneFromAccessToken` **out of `db.ts`** (it is auth, not data — that mixing is why the seam leaks), fix the `test-db` T1 violation, correct `db.ts`'s migration note.

**Why a table, not a single `users.auth_user_id` column** (as I6 proposed): a column holds ONE identity and cannot express "this user exists in both Supabase and the new provider at once" — which is precisely what a parallel run *is*. A column forces a hard flip; the table makes the overlap a normal, representable state, and gives social/email login later for free.

`getVerifiedUser()` / `getVerifiedCallerPhone()` stay as they are — they are already the right shape and sit on top of the seam.
**Target: Supabase referenced in ONE file.** Today it is five.

### 4.2 Password login (M10) 🔴
Hashes in **our** `users` table (argon2id), verification behind the seam. Login offers OTP **or** password.
**This is the migration safety net, not just a feature** — a credential we own works identically before, during and after the move, and is the fallback if the token cutover goes wrong.
⚠️ **NEVER store passwords in Supabase Auth.** That is the single most expensive mistake available here.

### 4.3 RLS 🟡 — see DECISIONS I8
**Formally retired as a security mechanism.** Do not invest in `auth.uid()`-based policies; the migration deletes them. If a compliance requirement later demands defence-in-depth, rewrite against `current_setting('app.user_id')` set per-transaction — standard Postgres, portable to RDS.

### 4.4 Photos → Storage 🟢 (independent; can run in parallel)
`app/lib/storage.ts` first: `upload(file, path) → {url, key}`, `getUrl(key)`, `delete(key)`, `getSignedUrl(key, ttl)`.
⚠️ **Store the object KEY in the database, never a full Supabase URL.** Resolve to URLs at read time. A stored `https://<ref>.supabase.co/...` turns S3 day into a data migration instead of a one-file change. No transform/CDN params in stored values; signed URLs only through the layer.
Also retires the base64 debt (X3).

### 4.5 Admin verification panel 🟡
Admin rights as a column/role in **our** `users` table, checked server-side with the existing `getVerifiedUser()` pattern.
⚠️ **Never** Supabase dashboard roles, custom JWT claims, or RLS admin policies — the most provider-locked features on offer, with no RDS equivalent.
Unblocks Silver/Gold, which currently sit pending forever and gate money under M7.

### 4.6 Order completion + delivery address 🟢
Plain `ALTER TABLE ADD COLUMN`, no Supabase-specific types. Fix the order-number collision with a **Postgres sequence**, not a Supabase feature.

### 4.7 Escrow (simulated) 🟡 LAST — largest surface
`app/lib/payments.ts` seam from day one; own `escrow_*` tables; release logic in **application code**.
⚠️ **No Edge Functions, no `pg_cron`, no database triggers** for release logic — none of it migrates. Money must never depend on the DB vendor (CORE M1).
Depends on 4.6 and 4.5.

### 4.8 Error-handling polish 🟢 continuous
Finish `dbErrorResponse` adoption; fix the ~14 `if (error) return []/null` swallow sites in `db.ts`. Migration-neutral.

**Then:** deploy + production smoke-test.

---

## 5. STANDING RULES FOR ALL FUTURE WORK

1. **Every external dependency gets a seam file before its first call site** — auth, storage, payments, notifications, whatever comes next.
2. **Store keys and IDs, never vendor URLs**, in any database column.
3. **Standard PostgreSQL only** (CORE T2). No vendor SQL, no triggers or cron carrying business logic.
4. **Identity lives in our tables.** Providers authenticate; they do not own the user.
5. **If a feature can only be built with a vendor-specific capability, that is a decision** — log it in `DECISIONS.md` with the migration cost stated, do not let it in silently.

---

*Audited 2026-07-29 against commit `1bb7b1b`. Re-audit before Phase 2 begins.*
