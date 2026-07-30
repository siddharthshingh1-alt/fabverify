/**
 * FabVerify AUTH SEAM — SERVER-ONLY half.
 *
 * ⚠️ SERVER-ONLY. This file imports the service-role client, which bypasses
 * Row Level Security entirely. Import it ONLY from Route Handlers under
 * app/api/ or from other server-only modules (app/lib/auth.ts). NEVER from a
 * "use client" file or anything reachable from one.
 *
 * WHY THIS IS A SEPARATE FILE from `authProvider.ts`:
 * token verification is the one auth operation that genuinely needs the
 * service role. Everything else — sendOtp, verifyOtp, getSession, signOut —
 * runs on the browser anon client and lives in `authProvider.ts`, which
 * `apiClient.ts` (reachable from "use client") will import in chunk 1.10. If
 * both halves shared one file, that import would drag `supabaseAdmin` into
 * the browser module graph: `SUPABASE_SERVICE_ROLE_KEY` is not a
 * `NEXT_PUBLIC_` var so the real key would NOT be inlined — but
 * supabaseAdmin.ts would silently fall back to its placeholder and construct
 * a broken admin client client-side, breaking the SERVER-ONLY contract for
 * no benefit. The split mirrors the existing `supabase.ts` /
 * `supabaseAdmin.ts` division, for the same reason.
 *
 * ⚠️ UNUSED AS OF CHUNK 1.4. Nothing imports this file yet. Chunk 1.5 moves
 * `app/lib/auth.ts` off `db.ts getPhoneFromAccessToken` and onto
 * `getIdentityFromToken` below, which is also when `db.ts` stops referencing
 * `supabaseAdmin.auth` — auth leaving the data layer, where it never
 * belonged.
 */

import { supabaseAdmin } from "./supabaseAdmin";
import type { ProviderIdentity } from "./authProvider";

// `import type` is erased at compile time, so this does NOT pull the
// browser-safe module (or its anon client) into the server bundle at runtime.

/**
 * THE TRUST ROOT. Validates a real, provider-issued access token and returns
 * the identity the provider itself attests to — never a phone or id the
 * caller merely claims in a request body.
 *
 * Returns null when the token is missing, invalid, expired, or carries no
 * phone number.
 *
 * ⚠️ RETURNS BOTH `providerUid` AND `phone`, which is the whole reason this
 * function exists rather than reusing `db.ts getPhoneFromAccessToken`. That
 * function returns ONLY the phone and DISCARDS `data.user.id` — and
 * `data.user.id` is exactly the `auth_identities.provider_uid` that chunk 1.9
 * needs to resolve identity without depending on the phone number. Chunk 1.9
 * could not be built on the old signature.
 *
 * Both values are needed, not one or the other:
 *   · `providerUid` → the durable link, via `auth_identities` (DECISIONS I9)
 *   · `phone`       → the FALLBACK for accounts with no identity row yet
 *
 * That fallback is not an edge case here. Chunk 1.3's backfill linked 1 of 10
 * accounts; the other 9 were created through the A10 dev bypass and have no
 * Supabase auth user at all. In this environment phone resolution is the
 * PRIMARY path, which is what chunk 1.9 has to get right.
 *
 * Resolving this identity to a `users` row is deliberately a separate step
 * (`getUserByPhoneOrThrow`), so a database failure can never be mistaken for
 * a bad token — the Issue E distinction between 503 and 401.
 */
export async function getIdentityFromToken(
  accessToken: string
): Promise<ProviderIdentity | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user?.phone) return null;

  return {
    providerUid: data.user.id,
    // Same canonical key as everywhere else: strip non-digits, keep last 10.
    // Supabase stores `91`+10 while `users.phone` is bare 10-digit, so this
    // normalisation is load-bearing, not cosmetic (proven in chunk 1.3).
    phone: data.user.phone.replace(/\D/g, "").slice(-10),
  };
}
