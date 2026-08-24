/**
 * CHUNK 2.6a/2.6b VERIFICATION — the WIRED login path, over real HTTP.
 *
 * Run:  npm run dev        (in another terminal)
 *       node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-login-wiring.ts
 *
 * ⚠️ THIS SUITE EXISTS BECAUSE THE SEAM SUITES CANNOT PROVE WIRING. Chunks
 * 2.5a/2.7 proved `verifyPasswordCredential` by calling it directly — 88
 * assertions that all still pass while the login page has no password field
 * and no route calls the function. "The function is correct" and "a user can
 * log in" are different claims, and this file tests the second one: real
 * HTTP, real routes, real served markup.
 *
 * ⚠️ WHAT IT STILL CANNOT PROVE, STATED HONESTLY:
 *   · the CLIENT-SIDE GATE (forced redirect, abandon-and-return, no loop).
 *     That is React running in a browser; HTTP cannot exercise it.
 *   · TOKEN VERIFICATION. On localhost `getVerifiedCallerPhone` is gated on
 *     isProduction and reads x-dev-phone, so a Bearer token is never checked.
 *     Proven instead by verify-token-ladder.ts (which forces NODE_ENV) and
 *     finally by the production LAN run.
 * Both gaps are covered elsewhere or flagged — neither is silently assumed.
 */

import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1].trim();
};

process.env.NEXT_PUBLIC_SUPABASE_URL ||= envVar("NEXT_PUBLIC_SUPABASE_URL");
process.env.SUPABASE_SERVICE_ROLE_KEY ||= envVar("SUPABASE_SERVICE_ROLE_KEY");
process.env.SESSION_TOKEN_SECRET ||= envVar("SESSION_TOKEN_SECRET");

const SUPABASE_URL = envVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = envVar("SUPABASE_SERVICE_ROLE_KEY");
const APP = "http://localhost:3000";

const BUYER = { phone: "9999999991", id: "5b616a97-9d5d-4fd4-be4e-8fe7acecd613" };
const MAKER = { phone: "9999999992", id: "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33" };
const PASSWORD = "orchid-lantern-monsoon-77";
const WRONG = "granite-harbour-velvet-08";
const ABSENT_PHONE = "9111100001";
const THRESHOLD = 10;

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const section = (title: string) => console.log(`\n${title}`);

async function sql(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
/**
 * ⚠️ SCOPED TO THIS SUITE'S OWN ACCOUNTS. THIS USED TO DELETE THE WHOLE TABLE
 * (`user_credentials?id=not.is.null`). Its sibling in verify-password-reset.ts
 * destroyed the founder's real enterprise password that way on 2026-08-22 —
 * unnoticed for two days, because nothing asserts the absence of a row nobody
 * is looking for.
 *
 * A verification suite must never be able to damage a row it did not create.
 * `user_credentials` is the live credential store, not a scratch table, and
 * [I27] is actively converting every account onto a password — so the blast
 * radius of an unfiltered DELETE here grows with adoption.
 *
 * ⚠️ THE FILTER IS THE SAFETY PROPERTY — do not widen it back for convenience.
 */
const TEST_USER_IDS = [BUYER.id, MAKER.id];
const TEST_ID_FILTER = `user_id=in.(${TEST_USER_IDS.join(",")})`;
const wipeCredentials = () =>
  sql(`user_credentials?${TEST_ID_FILTER}`, { method: "DELETE" });
/** Rows belonging to THIS suite only — never a whole-table count. */
const testCredentialRows = () => sql(`user_credentials?${TEST_ID_FILTER}&select=id`);
const credentialRow = async (userId: string) =>
  (await sql(`user_credentials?user_id=eq.${userId}&select=failed_attempts,locked_until`))?.[0] ??
  null;

/** POST to the login route exactly as the browser does. */
async function login(phone: string, password: unknown) {
  const res = await fetch(`${APP}/api/auth/password-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Dev-path authentication: x-dev-phone, exactly what apiClient sends. */
async function asUser(phone: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${APP}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-dev-phone": phone,
      ...(init.headers ?? {}),
    },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

console.log("\nCHUNK 2.6 — the WIRED login path (real HTTP, real served page)");
console.log("=".repeat(74));

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE SERVED PAGE — the gap that caused a whole session of confusion");

// ⚠️ THIS IS THE ASSERTION THAT WOULD HAVE CAUGHT IT. Every backend suite can
// be green while the page ships without a password field; only fetching the
// page the browser actually receives distinguishes "built" from "wired".
const loginHtml = await (await fetch(`${APP}/login`)).text();
check("A1 ⚠️ /login SERVES a password input", loginHtml.includes('type="password"'));
check("A2 …with the id the handler binds to", loginHtml.includes('id="password"'));
check(
  "A3 ⚠️ the OTP fallback link is SERVED and unconditional",
  loginHtml.includes("Log in with OTP instead")
);
check("A4 the primary submit is 'Log in', not 'Send OTP'", loginHtml.includes(">Log in<"));
check(
  "A5 the phone field is still there (OTP path intact)",
  loginHtml.includes('id="phone"')
);

const gateRes = await fetch(`${APP}/onboarding/password`);
check("A6 /onboarding/password is served (200)", gateRes.status === 200);
// ⚠️ Its BODY is not assertable here: AuthGuard renders null until it reads
// localStorage, which does not exist server-side. That is pre-existing guard
// behaviour, not a fault in this chunk — and it is precisely why the gate
// needs a browser to verify. Recorded, not glossed.

// ⚠️ THE FIRST VERSION OF THIS ASSERTION WAS WRONG, AND THE CODE WAS RIGHT.
// It sent {phone:"", password:""} and expected 400. Empty strings ARE strings,
// so they pass the structural check and are judged as credentials — 401,
// generic, exactly like any other wrong credential. A 400 there would have
// made "you sent an empty password" distinguishable from "wrong password",
// i.e. a status-code oracle. 400 is for a body that is not shaped like a
// request at all.
check(
  "A7 POST /api/auth/password-login exists (400 on a shapeless body, not 404)",
  (
    await fetch(`${APP}/api/auth/password-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  ).status === 400
);
check(
  "A7b …while EMPTY strings are a credential failure (401), not a 400 oracle",
  (await login("", "")).status === 401
);
check(
  "A8 GET /api/account/password-status exists and is authenticated (401)",
  (await fetch(`${APP}/api/account/password-status`)).status === 401
);

// ─────────────────────────────────────────────────────────────────────────
section("[B] ENUMERATION AT THE HTTP LAYER — the seam's guarantee, re-checked");

// ⚠️ THE SEAM CAN BE PERFECT AND THE ROUTE STILL LEAK — through a status
// code, a body shape, or an error string. This section tests the boundary the
// attacker actually touches.
await wipeCredentials();
await asUser(BUYER.phone, "/api/account/password", {
  method: "POST",
  body: JSON.stringify({ password: PASSWORD }),
});

const probes = {
  "unknown phone, wrong password": await login(ABSENT_PHONE, WRONG),
  "unknown phone, the real password": await login(ABSENT_PHONE, PASSWORD),
  "real account, wrong password": await login(BUYER.phone, WRONG),
  "real account with NO password set": await login(MAKER.phone, PASSWORD),
  "malformed phone": await login("not-a-phone", WRONG),
};
const shapes = new Set(
  Object.values(probes).map((p) => `${p.status}:${JSON.stringify(p.body)}`)
);
check(
  "B1 ⚠️ every prober-reachable outcome is the IDENTICAL status + body",
  shapes.size === 1,
  `${shapes.size} distinct: ${[...shapes].join(" | ")}`
);
check("B2 …and that status is 401", [...shapes][0].startsWith("401:"));
for (const [label, p] of Object.entries(probes)) {
  check(`B3 ${label} → no hint the account exists`, p.status === 401 && !p.body.locked);
}
check(
  "B4 a malformed BODY is 400 — and is not reachable by a credential mistake",
  (
    await fetch(`${APP}/api/auth/password-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: 12345, password: null }),
    })
  ).status === 400
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] PASSWORD LOGIN ACTUALLY WORKS — over HTTP, end to end");

const ok = await login(BUYER.phone, PASSWORD);
check("C1 ⚠️ correct password → 200", ok.status === 200, `status ${ok.status}`);
check("C2 …and a token is issued", typeof ok.body.token === "string" && ok.body.token.length > 0);
check(
  "C3 …resolving the RIGHT account",
  ok.body.user?.id === BUYER.id,
  ok.body.user?.id ?? "none"
);
check("C4 …carrying user_type for routing", ok.body.user?.user_type === "buyer");
check("C5 …and hasPassword:true so the gate is skipped", ok.body.hasPassword === true);

// ⚠️ A PROJECTION, NOT THE ROW. Returning select("*") is how
// /api/dev-auth/lookup became a PII disclosure; this asserts the same mistake
// was not repeated on a brand-new endpoint.
const leaked = ["email", "gst_number", "password_hash", "address"].filter(
  (k) => k in (ok.body.user ?? {})
);
check("C6 ⚠️ the response is a projection — no PII beyond routing", leaked.length === 0,
  leaked.join(",") || "none");

// The token is real: verify it independently with the module.
const { verifySessionToken } = await import("../app/lib/sessionToken.server.ts");
const verified = await verifySessionToken(ok.body.token);
check(
  "C7 ⚠️ the issued token VERIFIES and binds to that users.id",
  verified.ok === true && verified.userId === BUYER.id
);
check(
  "C8 …at the account's CURRENT token_epoch (revocable, not stale)",
  verified.ok === true && verified.epoch === 0
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] LOCKOUT IS LIVE ON THE WIRED PATH — not just inside the seam");

await wipeCredentials();
await asUser(BUYER.phone, "/api/account/password", {
  method: "POST",
  body: JSON.stringify({ password: PASSWORD }),
});

for (let i = 1; i <= THRESHOLD - 1; i++) await login(BUYER.phone, WRONG);
const beforeLock = await credentialRow(BUYER.id);
check(
  `D1 ${THRESHOLD - 1} failed HTTP logins counted`,
  beforeLock?.failed_attempts === THRESHOLD - 1,
  `failed_attempts = ${beforeLock?.failed_attempts}`
);
const stillWorks = await login(BUYER.phone, PASSWORD);
check("D2 ⚠️ …and the correct password STILL works (no early lock)", stillWorks.status === 200);

// Reset by that success, so run the full count again.
for (let i = 1; i <= THRESHOLD; i++) await login(BUYER.phone, WRONG);
const locked = await credentialRow(BUYER.id);
check(`D3 the ${THRESHOLD}th failure locks the account`, locked?.locked_until !== null);

const duringLock = await login(BUYER.phone, PASSWORD);
check(
  "D4 ⚠️ during lockout the CORRECT password is REJECTED over HTTP",
  duringLock.status === 401,
  duringLock.status === 200 ? "LET IN — brute force not stopped" : "refused"
);
check(
  "D5 …and the proven owner is told to wait",
  duringLock.body.locked === true && typeof duringLock.body.retryAfterSeconds === "number",
  `retryAfterSeconds = ${duringLock.body.retryAfterSeconds}`
);
const proberDuringLock = await login(BUYER.phone, WRONG);
check(
  "D6 ⚠️ but a PROBER during lockout gets the generic failure — no locked flag",
  proberDuringLock.status === 401 && proberDuringLock.body.locked === undefined,
  JSON.stringify(proberDuringLock.body)
);
check(
  "D7 …byte-identical to an unknown phone",
  JSON.stringify(proberDuringLock.body) === JSON.stringify((await login(ABSENT_PHONE, WRONG)).body)
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] THE GATE'S INPUT — password-status reflects reality");

await wipeCredentials();
const noneYet = await asUser(BUYER.phone, "/api/account/password-status");
check("E1 an account with no credential reports hasPassword:false", noneYet.body.hasPassword === false);

await asUser(BUYER.phone, "/api/account/password", {
  method: "POST",
  body: JSON.stringify({ password: PASSWORD }),
});
const nowHas = await asUser(BUYER.phone, "/api/account/password-status");
check("E2 …and true once one is set", nowHas.body.hasPassword === true);
check(
  "E3 ⚠️ it returns ONLY the boolean — no hash, epoch or lockout state",
  Object.keys(nowHas.body).length === 1 && "hasPassword" in nowHas.body,
  Object.keys(nowHas.body).join(",")
);
check(
  "E4 …and it is about the CALLER, not a phone in the request",
  (await asUser(MAKER.phone, "/api/account/password-status")).body.hasPassword === false
);

// ── CLEANUP ──────────────────────────────────────────────────────────────
await wipeCredentials();
check(
  "Z1 cleanup: no credentials left behind FOR THIS SUITE'S ACCOUNTS",
  (await testCredentialRows()).length === 0
);
check(
  "Z2 auth_identities untouched",
  (await sql("auth_identities?select=id")).length === 1
);

console.log("\n" + "=".repeat(74));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(74) + "\n");
process.exit(failed ? 1 : 0);
