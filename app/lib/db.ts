/**
 * FabVerify Database Abstraction Layer
 *
 * MIGRATION NOTE:
 * This file is the ONLY place Supabase is imported for actual queries. To
 * migrate to AWS RDS:
 *
 * 1. Replace the supabaseAdmin client with a pg or drizzle client
 * 2. Rewrite the PostgREST query syntax below. This is real work, not a
 *    find-and-replace. Audited 2026-07-30 across 813 lines / 35 exported
 *    functions:
 *      · 16 embedded-resource joins (`buyer:users!buyer_id(...)`) → SQL JOINs
 *      ·  8 `.maybeSingle()`                                      → `rows[0] ?? null`
 *      ·  3 `.upsert(..., { onConflict })`                        → INSERT … ON CONFLICT DO UPDATE
 *        (was 2; chunk 2.4 added upsertUserCredential — keep MIGRATION.md §1.2 in step)
 * 3. All other files stay unchanged
 *
 * The DATA MODEL is standard PostgreSQL — no Supabase-specific column types,
 * extensions, triggers or functions, so the schema itself ports as-is. The
 * QUERY SYNTAX is NOT: PostgREST's builder is a Supabase client feature.
 * This header previously claimed "No Supabase-specific features used", which
 * was inaccurate and would have made any migration planned against it badly
 * underestimate the work. See docs/ARCHITECTURE/MIGRATION.md §1.2.
 *
 * SERVER-ONLY: this file uses the service-role client, which bypasses Row
 * Level Security entirely. Only import it from Route Handlers under
 * app/api/ — never from a "use client" file or anything reachable from one.
 * Dev-mode auth has no real Supabase session/auth.uid() behind it, so
 * direct RLS-protected client calls from the browser would be rejected;
 * every write here goes through this trusted server-side path instead.
 */

import { supabaseAdmin } from "./supabaseAdmin";

// ── USERS ──────────────────────────────────────────────

export async function getUserByPhone(phone: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) return null;
  return data;
}

// Same lookup as getUserByPhone, but THROWS when the database itself fails
// instead of returning null. getUserByPhone swallows errors, which makes
// "no such user" and "database unreachable" indistinguishable — and any
// auth check built on it reports a database outage as "not authenticated".
// Use this wherever that distinction matters. Returns null only for a
// genuine no-match.
export async function getUserByPhoneOrThrow(phone: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function upsertUser(userData: {
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  user_type?: string;
  position?: string;
  profile_photo?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(userData, { onConflict: "phone" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Record that `providerUid` (an auth-provider identity) belongs to `userId`.
 * The durable auth link locked in DECISIONS I9 — added chunk 1.8 (2026-07-31),
 * the first code to write `auth_identities`, which until now was backfill-only.
 *
 * ⚠️ INSERT-ONLY, AND NEVER REPOINTS AN EXISTING MAPPING.
 * `ignoreDuplicates: true` compiles to ON CONFLICT DO NOTHING against
 * UNIQUE (provider, provider_uid). Two consequences, both deliberate:
 *   · Re-authenticating is a no-op — no duplicate row, no error to swallow.
 *   · If this provider_uid already maps to a DIFFERENT user_id, the existing
 *     row is left untouched and the conflict is logged, never auto-resolved.
 *     That is chunk 1.3's never-guess rule: picking a side invents a link, and
 *     once 1.9 reads this table a wrong link resolves a live session to the
 *     wrong account.
 *
 * ⚠️ NEVER CALL THIS WITH A DEV-BYPASS IDENTITY. The A10 bypass (123456)
 * creates no provider user, so there is no provider_uid; the caller guards on
 * `providerUid` being non-null. Writing a synthesised `dev-user-…` value here
 * would fabricate identities and pollute the table chunk 1.3's backfill was
 * careful to keep honest. The guard is structural, not a string check.
 *
 * ⚠️ THIS FUNCTION MUST NEVER THROW. Its caller is getVerifiedUser(), whose
 * own catch maps exceptions to `unavailable` → 503. An unguarded failure here
 * would turn a cosmetic bookkeeping write into a 503 on EVERY authenticated
 * request across all 12 routes. Identity linking is best-effort: on failure we
 * log and return, auth proceeds, and the next request retries. "No row yet" is
 * simply today's status quo, which 1.9's phone fallback already handles.
 *
 * Returns true only when a row was newly created (useful for tests//logging);
 * false means "already linked, conflicted, or failed" — never an error.
 */
export async function ensureAuthIdentity(
  userId: string,
  providerUid: string,
  provider = "supabase"
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("auth_identities")
      .upsert(
        { user_id: userId, provider, provider_uid: providerUid },
        { onConflict: "provider,provider_uid", ignoreDuplicates: true }
      )
      .select();

    if (error) {
      console.error("[auth_identities] insert failed:", error.message);
      return false;
    }
    // ignoreDuplicates returns an empty array when the row already existed.
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error(
      "[auth_identities] insert threw:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

/**
 * Resolve an auth-provider identity to its `users` row — the durable link
 * (DECISIONS I9) read for the first time here. Added chunk 1.9 (2026-08-05).
 *
 * ⚠️ THIS FUNCTION NEVER THROWS, AND THAT IS THE OPPOSITE OF
 * `getUserByPhoneOrThrow` ON PURPOSE. The contracts are deliberately inverted
 * because the two lookups play different roles:
 *
 *   · phone lookup    = REQUIRED path. Must throw, so a database outage
 *                       surfaces as 503 and never as a bogus 401 (Issue E).
 *   · identity lookup = OPTIONAL enhancement. Must never be able to break
 *                       authentication, so every failure returns null and the
 *                       caller quietly falls back to phone.
 *
 * This is not theoretical. `CREATE POLICY`/DDL work on this project has needed
 * `NOTIFY pgrst, 'reload schema'` before PostgREST sees a new table — a stale
 * schema cache means errors on `auth_identities` while `users` answers fine.
 * Returning null there keeps the app working on the proven phone path; a throw
 * would have turned a cache refresh into a 503 on EVERY authenticated request
 * across all 12 routes that call getVerifiedUser().
 *
 * ⚠️ MATCHES ON (provider, provider_uid), NEVER provider_uid ALONE. That pair
 * is what `UNIQUE (provider, provider_uid)` constrains, so it is the only
 * lookup guaranteed to return at most one row. Matching on the uid alone is
 * correct today only because 'supabase' is the sole provider — and DECISIONS
 * A12 Phase 2 (dual-verify) exists specifically to add a second one, at which
 * point a uid collision across providers would resolve a session to the wrong
 * account. Free to get right now; expensive to discover at cutover.
 *
 * FUTURE (A12 Phase 2): `provider` is a defaulted parameter because the seam's
 * getIdentityFromToken() does not yet report WHICH issuer validated the token.
 * When a second provider is stood up, that function must return it and this
 * default must go.
 *
 * An identity row can never outlive its user — the FK is ON DELETE CASCADE
 * (chunk 1.2) — so a hit here cannot point at a deleted account.
 */
export async function getUserByProviderUid(
  providerUid: string,
  provider = "supabase"
) {
  try {
    const { data: identity, error } = await supabaseAdmin
      .from("auth_identities")
      .select("user_id")
      .eq("provider", provider)
      .eq("provider_uid", providerUid)
      .maybeSingle();

    if (error || !identity) return null;

    // getUserById also swallows its errors, which is the behaviour we want
    // here: any problem loading the row means "identity path could not
    // answer", and the caller falls through to phone.
    return await getUserById(identity.user_id);
  } catch (error) {
    console.error(
      "[auth_identities] lookup threw:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

// ── USER CREDENTIALS (passwords we own — DECISIONS I10, M10) ───────────
//
// ⚠️ NEVER add credential columns to `users`. The hash lives in its own table
// specifically because `/api/dev-auth/lookup` is unauthenticated and returns
// `.select("*")` on `users` for any phone — a hash there would be handed to
// anonymous callers for every account on the platform. Separate table = the
// leak is impossible by construction, not prevented by remembering a column
// projection at five call sites forever. See migrations/003.

/**
 * ⚠️ THE ONLY DEFINITION OF THE PASSWORD CREDENTIAL TYPE. This is a SECURITY
 * CONTROL, not a tidiness constant.
 *
 * `UNIQUE (user_id, credential_type)` means a differing value does not error —
 * it creates a SECOND credential row alongside the first. Two consequences:
 *   · a typo ('passwords') silently writes a duplicate credential
 *   · worse, if this value were ever taken from a REQUEST, a caller could send
 *     an unused type, make the existence lookup below miss, and be treated as
 *     a first-time set — skipping the re-verification gate entirely while the
 *     real credential survives untouched.
 * It is therefore a module constant and must NEVER be sourced from caller
 * input. Callers pass a user id and nothing else.
 */
export const PASSWORD_CREDENTIAL_TYPE = "password";

/**
 * The caller's stored credential row, or null when they have none.
 *
 * ⚠️ THIS FUNCTION MUST THROW ON DATABASE FAILURE, AND THAT IS A SECURITY
 * REQUIREMENT — not the stylistic choice it resembles.
 *
 * Its result decides whether re-verification is required: a row means "change"
 * (current password mandatory), null means "first-time set" (session alone is
 * sufficient). db.ts has ~14 legacy `if (error) return null` sites; if this
 * followed that pattern, a transient database failure would return null, be
 * read as "no credential exists", and let a hijacked session change a password
 * WITHOUT re-verification. An attacker would not even need to cause the
 * outage — retrying until one occurs naturally is enough, and this project has
 * already seen an unplanned Supabase outage mid-test.
 *
 * Throwing means the route answers 503 and writes nothing. "Absent" is
 * concluded ONLY from a successful read that returned zero rows. Same
 * reasoning as getUserByPhoneOrThrow (Issue E), applied to an authorisation
 * decision instead of a status code.
 */
export async function getUserCredential(
  userId: string,
  credentialType: string = PASSWORD_CREDENTIAL_TYPE
) {
  const { data, error } = await supabaseAdmin
    .from("user_credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("credential_type", credentialType)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create or replace a user's credential. First writer to `user_credentials`
 * (chunk 2.4) — the table was schema-only until now.
 *
 * ⚠️ REPLACES, NEVER DUPLICATES — and that is STRUCTURAL, not conditional.
 * The upsert conflict-targets `UNIQUE (user_id, credential_type)`, so a second
 * password row for the same user cannot exist to be verified against by
 * mistake. Proven by migration 003 STEP 3b.
 *
 * ⚠️ THROWS on failure, deliberately. A credential write that quietly failed
 * would tell the user their password was changed when it was not — they would
 * then be unable to log in with either the old or the new one. The route maps
 * the throw to 503/500 via dbErrorResponse.
 *
 * `tokenEpoch` is passed explicitly rather than incremented in SQL because
 * PostgREST cannot express `token_epoch = token_epoch + 1` in an upsert. The
 * caller reads the current value and passes value+1. Omit it on a first-time
 * set so the column takes its DEFAULT 0.
 *   ⚠️ Read-then-write is NOT atomic. Two concurrent password changes for the
 *   same user could compute the same next epoch. Consequence is benign (UNIQUE
 *   still prevents duplicate rows; one write wins) and the scenario is not a
 *   threat — a user racing themselves. Recorded rather than glossed.
 *
 * Deliberately does NOT touch `failed_attempts` / `locked_until`: those carry
 * chunk 2.7's lockout semantics, which are not built. Inventing behaviour for
 * them here would bury a policy decision in a write helper. On upsert-update,
 * columns absent from the payload keep their existing values.
 */
export async function upsertUserCredential(params: {
  userId: string;
  passwordHash: string;
  credentialType?: string;
  tokenEpoch?: number;
}) {
  const now = new Date().toISOString();

  const row: Record<string, unknown> = {
    user_id: params.userId,
    credential_type: params.credentialType ?? PASSWORD_CREDENTIAL_TYPE,
    password_hash: params.passwordHash,
    password_changed_at: now,
    // Application-maintained, NOT a database trigger — a trigger is vendor SQL
    // carrying behaviour that would have to be re-created on RDS
    // (MIGRATION.md §5 rule 3).
    updated_at: now,
    // The user has just chosen their own password, so any admin-provisioned
    // "must change on first use" flag is satisfied by definition.
    must_change_password: false,
  };

  if (params.tokenEpoch !== undefined) row.token_epoch = params.tokenEpoch;

  const { data, error } = await supabaseAdmin
    .from("user_credentials")
    .upsert(row, { onConflict: "user_id,credential_type" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Resolve a `users` row AND its credential's `token_epoch` in ONE round trip
 * (chunk 2.5b, [I12] + [I22]).
 *
 * ⚠️ ONE EMBEDDED JOIN, NOT TWO QUERIES — and this is a real cost decision,
 * not tidiness. The epoch check runs on EVERY authenticated request made with
 * one of our tokens, so a second round trip here is a permanent tax on the
 * whole password-login path, paid against Supabase Singapore where a round
 * trip is tens of milliseconds. This is the 17th embedded join in this file;
 * keep MIGRATION.md §1.2's count in step.
 *
 * ⚠️ THROWS on database failure — deliberately, and it is a security
 * requirement rather than a style choice. The caller uses this to decide
 * whether a token is still valid, so a swallowed outage returning `null`
 * would read as "no such user" and answer **401**, telling a perfectly
 * authenticated user to log in again over a transient blip (Issue E). Worse,
 * an epoch that cannot be read must never be treated as "epoch matches".
 * Absent is concluded ONLY from a successful read that returned no row.
 *
 * ⚠️ RETURNS THE EPOCH AS `null` WHEN THE USER HAS NO CREDENTIAL, which is a
 * genuine state, not an error: an OTP-only account has no `user_credentials`
 * row at all. The caller decides what that means — and for a token WE issued
 * it means the credential was deleted underneath a live session, which must
 * fail closed.
 */
export async function getUserWithTokenEpoch(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*, user_credentials(credential_type, token_epoch)")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // PostgREST returns embedded rows as an array. Pick the password credential
  // explicitly rather than [0] — a future credential type (passkey, TOTP)
  // would otherwise silently become "the" epoch depending on row order.
  const credentials = (data.user_credentials ?? []) as Array<{
    credential_type: string;
    token_epoch: number;
  }>;
  const password = credentials.find(
    (c) => c.credential_type === PASSWORD_CREDENTIAL_TYPE
  );

  // Strip the embedded array off the user row so callers see the same shape
  // getUserById returns — 13 route call sites consume this object.
  const { user_credentials: _embedded, ...user } = data;

  return { user, tokenEpoch: password ? password.token_epoch : null };
}

/**
 * ── THE LOCKOUT WRITES (chunk 2.7) ──────────────────────────────────────
 *
 * Two guarded, single-round-trip updates. Both are DUMB ON PURPOSE: they are
 * handed the values to store and never decide them. The threshold and the
 * cooldown live in passwordPolicy.ts; the read they are based on is
 * getUserCredential above, which already returns every lockout column, so the
 * check costs no extra query.
 *
 * ⚠️ WHY A GUARD CLAUSE AND NOT A PLAIN UPDATE. PostgREST cannot express
 * `failed_attempts = failed_attempts + 1` (same limitation documented for
 * token_epoch above), so the increment is read-modify-write, which races: N
 * concurrent attempts all read k and all write k+1, and the counter advances
 * by one instead of N. That is not a slow counter — it is a LOCKOUT THAT
 * NEVER LOCKS under exactly the parallel load an attacker generates, and it
 * reads as working perfectly in every sequential test. The
 * `.eq("updated_at", expectedUpdatedAt)` filter is optimistic concurrency:
 * a write that lost the race matches ZERO rows and says so, and the seam
 * re-reads and retries.
 *
 * ⚠️ THEY RETURN `matched`, AND THE CALLER MUST NOT READ IT AS AN ERROR.
 * Zero rows is the normal, expected outcome on three different paths: no such
 * account, an account with no password set, and an account already locked.
 * Only the seam knows which, because only the seam knows whether a real
 * unlocked row was there to hit.
 */

/**
 * Record one failed password attempt, and lock the account if the caller says
 * this failure reaches the threshold.
 *
 * ⚠️ THE `.or()` CLAUSE IS THE "DO NOT TOUCH A LOCKED ROW" RULE, AND IT IS
 * LOAD-BEARING TWICE OVER. It means an already-locked account is not
 * re-locked and its counter does not climb, so a cooldown cannot be extended
 * by hammering it — the user genuinely only waits the 15 minutes they were
 * told about. It also means the LOCKED path and the NO-SUCH-ACCOUNT path both
 * come back with zero rows after exactly one round trip, which is what keeps
 * them indistinguishable in cost as well as in value.
 *
 * ⚠️ THROWS on database failure, like every other credential function here.
 * Swallowing the error would let an outage silently disable the lockout.
 */
export async function recordFailedPasswordAttempt(params: {
  userId: string;
  expectedUpdatedAt: string;
  failedAttempts: number;
  lockedUntil: string | null;
  now: string;
  credentialType?: string;
}): Promise<{ matched: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("user_credentials")
    .update({
      failed_attempts: params.failedAttempts,
      last_failed_at: params.now,
      locked_until: params.lockedUntil,
      updated_at: params.now,
    })
    .eq("user_id", params.userId)
    .eq("credential_type", params.credentialType ?? PASSWORD_CREDENTIAL_TYPE)
    .eq("updated_at", params.expectedUpdatedAt)
    .or(`locked_until.is.null,locked_until.lte.${params.now}`)
    .select("id");

  if (error) throw error;
  return { matched: (data?.length ?? 0) > 0 };
}

/**
 * Clear the failure counter after a successful password login.
 *
 * ⚠️ NO RETRY ON A LOST RACE, deliberately — unlike the increment. Losing
 * this write means the counter stays where it was, and the very next
 * successful login clears it; the failure mode is a user who is briefly
 * closer to a lockout than they should be. Retrying would spend extra round
 * trips on the SUCCESS path only, which is precisely the asymmetry the whole
 * function is written to avoid.
 *
 * ⚠️ Does NOT touch password_hash, token_epoch or must_change_password. A
 * login is not a credential change.
 */
export async function clearFailedPasswordAttempts(params: {
  userId: string;
  expectedUpdatedAt: string;
  now: string;
  credentialType?: string;
}): Promise<{ matched: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("user_credentials")
    .update({
      failed_attempts: 0,
      last_failed_at: null,
      locked_until: null,
      updated_at: params.now,
    })
    .eq("user_id", params.userId)
    .eq("credential_type", params.credentialType ?? PASSWORD_CREDENTIAL_TYPE)
    .eq("updated_at", params.expectedUpdatedAt)
    .select("id");

  if (error) throw error;
  return { matched: (data?.length ?? 0) > 0 };
}

export async function updateUserType(phone: string, userType: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ user_type: userType })
    .eq("phone", phone);

  if (error) throw error;
}

// The role a user holds inside an enterprise (md_ceo, cfo, …). Stored on
// users.position so enterprise position survives logout — it used to live
// only in localStorage, which meant a re-login lost it entirely.
export async function updateUserPosition(phone: string, position: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ position })
    .eq("phone", phone);

  if (error) throw error;
}

// MOVED OUT — chunk 1.5, 2026-07-30.
//
// `getPhoneFromAccessToken` lived here and validated a Supabase auth access
// token via supabaseAdmin.auth.getUser(). It was AUTH logic sitting inside the
// DATA abstraction, and that mixing is a large part of why the Supabase seam
// leaked (DECISIONS X5). It now lives in the auth seam as
// `getIdentityFromToken` in app/lib/authProvider.server.ts, which additionally
// returns the provider uid the old function discarded — the durable auth link
// chunk 1.9 needs (DECISIONS I9).
//
// This file no longer references supabaseAdmin.auth at all: db.ts is data
// only. Do not add auth calls back here.

// Generic per-user-type onboarding data (crafts, skills, portfolio, rates,
// etc.) that doesn't have a dedicated table. Stored as JSON on the users
// row so every user type — not just manufacturers — has somewhere to land.
export async function saveUserProfileData(
  phone: string,
  profileData: Record<string, unknown>
) {
  const user = await getUserByPhone(phone);
  if (!user) throw new Error(`No user found for phone ${phone}`);

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ profile_data: profileData })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── MANUFACTURER PROFILES ──────────────────────────────

export async function saveManufacturerProfile(profile: {
  user_id: string;
  business_name: string;
  city: string;
  state: string;
  categories: string[];
  min_order: number;
  capacity: string;
  unit_type?: string;
  specialisations?: string[];
}) {
  const { data, error } = await supabaseAdmin
    .from("manufacturer_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getManufacturers(filters?: {
  category?: string;
  city?: string;
  tier?: string;
  minScore?: number;
}) {
  let query = supabaseAdmin
    .from("manufacturer_profiles")
    .select(
      `
      *,
      user:users(
        id, name, phone, city, state
      )
    `
    )
    .eq("is_visible", true);

  if (filters?.city && filters.city !== "All Cities") {
    query = query.eq("city", filters.city);
  }

  if (filters?.tier && filters.tier !== "All Tiers") {
    query = query.eq("verification_tier", filters.tier.toLowerCase());
  }

  if (filters?.category) {
    query = query.contains("categories", [filters.category]);
  }

  if (filters?.minScore) {
    query = query.gte("fab_score", filters.minScore);
  }

  const { data, error } = await query
    .order("fab_score", { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}

export async function getManufacturerById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("manufacturer_profiles")
    .select(
      `
      *,
      user:users(
        id, name, phone, city, state
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data;
}

// ── ORDERS ──────────────────────────────────────────────

export async function createOrder(order: {
  buyer_id: string;
  manufacturer_id: string;
  style_name: string;
  quantity: number;
  price_per_piece: number;
  total_value: number;
  delivery_date: string;
  milestones?: { name: string; pct: number }[];
}) {
  const orderNumber = "ORD-" + Date.now().toString().slice(-6);
  const { milestones: customMilestones, ...orderFields } = order;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      ...orderFields,
      order_number: orderNumber,
      status: "pending",
      escrow_total: order.total_value,
      escrow_released: 0,
    })
    .select()
    .single();

  if (error) throw error;

  const milestones = customMilestones?.length
    ? customMilestones
    : [
        { name: "Order Confirmation", pct: 20 },
        { name: "Fabric In-house", pct: 10 },
        { name: "Production Complete", pct: 30 },
        { name: "QC Passed", pct: 20 },
        { name: "Delivery Confirmed", pct: 20 },
      ];

  await supabaseAdmin.from("order_milestones").insert(
    milestones.map((m, i) => ({
      order_id: data.id,
      milestone_number: i + 1,
      milestone_name: m.name,
      payment_percentage: m.pct,
      status: i === 0 ? "active" : "pending",
    }))
  );

  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw error;
}

// Scoped to the parent order ON PURPOSE. Without the order_id filter, a
// caller authorised on ONE order could advance a milestone belonging to a
// DIFFERENT order just by naming its id — the route's party check proves
// which order you may touch, not which milestone. Filtering here makes the
// two agree in a single atomic statement rather than a read-then-write.
//
// Returns false when nothing matched (wrong order, or no such milestone) so
// the caller can answer 404 instead of reporting a success that never
// happened — a Supabase update matching zero rows is not an error.
export async function updateMilestoneStatus(
  milestoneId: string,
  status: string,
  orderId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("order_milestones")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", milestoneId)
    .eq("order_id", orderId)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function getOrdersByUser(
  userId: string,
  role: "buyer" | "manufacturer"
) {
  const column = role === "buyer" ? "buyer_id" : "manufacturer_id";

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city
      ),
      manufacturer:users!manufacturer_id(
        id, name, city
      ),
      milestones:order_milestones(*)
    `
    )
    .eq(column, userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city, phone
      ),
      manufacturer:users!manufacturer_id(
        id, name, city, phone
      ),
      milestones:order_milestones(
        *
      )
    `
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) return null;
  return data;
}

// ── ENQUIRIES ───────────────────────────────────────────

export async function sendEnquiry(enquiry: {
  sender_id: string;
  receiver_id: string;
  subject: string;
  message: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .insert(enquiry)
    .select()
    .single();

  if (error) throw error;

  // An enquiry is also the first message of a conversation from the
  // recipient's point of view — seed it so FabChat shows this thread
  // immediately, without a separate "start chat" step.
  //
  // A failure here does NOT fail the enquiry: the enquiry row is already
  // committed, so throwing would leave the caller believing nothing was
  // saved when in fact it was. Instead the outcome is REPORTED — the route
  // passes conversationSeeded to the client, which tells the user their
  // enquiry arrived but the chat thread did not. Previously this failure
  // existed only as a console.error on the server, invisible to the user
  // and to anyone not watching the terminal.
  const { error: messageError } = await supabaseAdmin.from("messages").insert({
    sender_id: enquiry.sender_id,
    receiver_id: enquiry.receiver_id,
    content: enquiry.subject ? `${enquiry.subject}\n\n${enquiry.message}` : enquiry.message,
    message_type: "text",
  });
  if (messageError) {
    console.error("Failed to seed conversation from enquiry:", messageError);
  }

  return { enquiry: data, conversationSeeded: !messageError };
}

export async function getEnquiries(
  userId: string,
  type: "received" | "sent"
) {
  const column = type === "received" ? "receiver_id" : "sender_id";

  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .select(
      `
      *,
      sender:users!sender_id(
        id, name, city
      ),
      receiver:users!receiver_id(
        id, name, city
      )
    `
    )
    .eq(column, userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

// ── MESSAGES ────────────────────────────────────────────

export async function sendMessage(message: {
  order_id?: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: string;
  media_url?: string | null;
  is_verified_update?: boolean;
}) {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      ...message,
      message_type: message.message_type || "text",
      is_verified_update: message.is_verified_update ?? false,
    })
    .select(
      `
      *,
      sender:users!sender_id(id, name, phone),
      receiver:users!receiver_id(id, name, phone)
    `
    )
    .single();

  if (error) throw error;
  return data;
}

export async function getMessages(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(
      `
      *,
      sender:users!sender_id(
        id, name
      )
    `
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}

// Messages for a user — optionally narrowed to one conversation partner
// and/or one order. A conversation between two users always has one of
// them as sender and the other as receiver, so ANDing "involves user" with
// "involves partner" (two separate .or() filters) correctly isolates
// exactly the messages between those two people, in either direction.
export async function getMessagesForUser(params: {
  userId: string;
  otherUserId?: string;
  orderId?: string;
}) {
  let query = supabaseAdmin
    .from("messages")
    .select(
      `
      *,
      sender:users!sender_id(id, name, phone),
      receiver:users!receiver_id(id, name, phone)
    `
    )
    .or(`sender_id.eq.${params.userId},receiver_id.eq.${params.userId}`);

  if (params.orderId) {
    query = query.eq("order_id", params.orderId);
  }

  if (params.otherUserId) {
    query = query.or(
      `sender_id.eq.${params.otherUserId},receiver_id.eq.${params.otherUserId}`
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return [];
  return data;
}

export async function markMessagesRead(receiverId: string, senderId: string) {
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", receiverId)
    .eq("sender_id", senderId)
    .is("read_at", null);

  if (error) throw error;
}

// One row per conversation partner, latest message first, with an unread
// count — same grouping FabChat's UI needs, computed here since there's no
// dedicated conversations table (a conversation is just "messages between
// two users", possibly scoped to an order).
export async function getConversationsForUser(userId: string) {
  const { data: messages, error } = await supabaseAdmin
    .from("messages")
    .select(
      `
      *,
      sender:users!sender_id(id, name, phone, user_type),
      receiver:users!receiver_id(id, name, phone, user_type),
      order:orders(id, order_number, style_name, status)
    `
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !messages) return [];

  type ConversationMessage = (typeof messages)[number];
  const conversationMap = new Map<
    string,
    {
      partnerId: string;
      partnerName: string | null;
      partnerPhone: string;
      partnerType: string | null;
      lastMessage: string;
      lastMessageType: string;
      lastMessageTime: string;
      unreadCount: number;
      order: ConversationMessage["order"];
      orderId: string | null;
    }
  >();

  for (const msg of messages) {
    const isSender = msg.sender_id === userId;
    const partnerId = isSender ? msg.receiver_id : msg.sender_id;
    const partner = isSender ? msg.receiver : msg.sender;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId,
        partnerName: partner?.name ?? null,
        partnerPhone: partner?.phone ?? "",
        partnerType: partner?.user_type ?? null,
        lastMessage: msg.content,
        lastMessageType: msg.message_type,
        lastMessageTime: msg.created_at,
        unreadCount: 0,
        order: msg.order,
        orderId: msg.order_id,
      });
    }

    if (msg.receiver_id === userId && !msg.read_at) {
      conversationMap.get(partnerId)!.unreadCount++;
    }
  }

  return Array.from(conversationMap.values());
}

// ── SAMPLE BRIEFS ───────────────────────────────────────

export async function createSampleBrief(brief: {
  buyer_id: string;
  title: string;
  category: string;
  description: string;
  quantity: number;
  budget_min: number;
  budget_max: number;
}) {
  const { data, error } = await supabaseAdmin
    .from("sample_briefs")
    .insert(brief)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSampleBriefs(filters?: {
  category?: string;
  status?: string;
}) {
  let query = supabaseAdmin
    .from("sample_briefs")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city, user_type, phone
      )
    `
    )
    .eq("status", filters?.status || "open");

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) return [];
  return data;
}

export async function getSampleBriefsByBuyer(buyerId: string) {
  const { data, error } = await supabaseAdmin
    .from("sample_briefs")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city
      )
    `
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getSampleBriefById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("sample_briefs")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city, phone
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function updateSampleBriefStatus(id: string, status: string) {
  const { error } = await supabaseAdmin
    .from("sample_briefs")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

// ── VERIFICATION ────────────────────────────────────────

export async function getVerificationStatus(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(
      `
      verification_tier,
      verification_status,
      bronze_verified_at,
      silver_verified_at,
      gold_verified_at
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getLatestVerificationApplication(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("verification_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function submitVerificationApplication(
  userId: string,
  tier: string,
  documents: object,
  videoCallScheduled?: string | null
) {
  const { data, error } = await supabaseAdmin
    .from("verification_applications")
    .insert({
      user_id: userId,
      tier,
      status: "pending",
      documents,
      video_call_scheduled: videoCallScheduled ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVerificationApplicationStatus(
  applicationId: string,
  status: string
) {
  const { error } = await supabaseAdmin
    .from("verification_applications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) throw error;
}

const VERIFICATION_TIER_COLUMN: Record<string, string> = {
  bronze: "bronze_verified_at",
  silver: "silver_verified_at",
  gold: "gold_verified_at",
};

export async function updateVerificationTier(userId: string, tier: string) {
  const tierColumn = VERIFICATION_TIER_COLUMN[tier];
  const update: Record<string, string> = {
    verification_tier: tier,
    verification_status: "verified",
  };
  if (tierColumn) update[tierColumn] = new Date().toISOString();

  const { error } = await supabaseAdmin.from("users").update(update).eq("id", userId);

  if (error) throw error;

  // manufacturer_profiles has its own verification_tier column (used by the
  // discovery-page badge/filter) that defaults to 'bronze' at profile
  // creation, independent of this real verification flow. Propagate real
  // silver/gold upgrades onto it so the discovery card doesn't understate a
  // manufacturer's actual status — a no-op update for every other user type
  // (and for bronze, since that's already the profile's default).
  if (tier === "silver" || tier === "gold") {
    const { error: profileError } = await supabaseAdmin
      .from("manufacturer_profiles")
      .update({ verification_tier: tier })
      .eq("user_id", userId);
    if (profileError) {
      console.error("Failed to sync manufacturer_profiles verification_tier:", profileError);
    }
  }
}

export async function updateUserVerificationStatus(userId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ verification_status: status })
    .eq("id", userId);

  if (error) throw error;
}

// ── WAITLIST ────────────────────────────────────────────

export async function addToWaitlist(email: string, phone?: string) {
  const { data, error } = await supabaseAdmin
    .from("waitlist")
    .insert({ email, phone: phone || null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── HEALTH ──────────────────────────────────────────────

/**
 * Connectivity probe for GET /api/test-db.
 *
 * THROWS instead of returning a boolean, deliberately: a boolean collapses
 * "database unreachable" and "query failed" into one false, and the caller
 * needs that distinction to answer 503 vs 500 via dbErrorResponse(). Same
 * reasoning as getUserByPhoneOrThrow (Issue E).
 *
 * Runs on the service-role path because that is the path every real route
 * uses through this file. It previously ran on the anon client from inside
 * the route itself, which tested RLS — retired as a security mechanism in
 * DECISIONS I8 — rather than testing what the application depends on.
 */
export async function checkDatabaseConnection(): Promise<void> {
  const { error } = await supabaseAdmin.from("users").select("id").limit(1);

  if (error) throw error;
}
