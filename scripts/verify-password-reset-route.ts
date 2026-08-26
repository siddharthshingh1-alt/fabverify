/**
 * CHUNK 2.8b VERIFICATION, PART 2 — the reset ROUTE and the served PAGE.
 *
 * Run:  npm run dev        (in another terminal, must be `next dev`)
 *       node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-password-reset-route.ts
 *
 * ⚠️ PART 1 (verify-otp-verify-throttle.ts) PROVED THE THROTTLE IN ISOLATION.
 * This proves the HTTP surface on top of it: that the route is a thin adapter
 * which does not re-open at the HTTP layer what the seam closed ([I28]), and
 * that the page a browser actually receives wires to it.
 *
 * ⚠️ THE 429 IS THE POINT OF SECTION [C]. A throttle refusal must be
 * indistinguishable between a registered and an unregistered number — that is
 * the property that matters, and it holds because the counter reads only the
 * CALLER'S OWN attempts and never touches `users`. Asserted, not assumed.
 *
 * It writes rows to otp_requests and credentials for its OWN test accounts
 * only, and removes both in [Z].
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing from .env.local`);
  return m[1].trim();
};
const SUPABASE_URL = envVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = envVar("SUPABASE_SERVICE_ROLE_KEY");
const TOKEN_SECRET = envVar("SESSION_TOKEN_SECRET");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

process.env.NEXT_PUBLIC_SUPABASE_URL ||= SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY ||= SERVICE_KEY;
process.env.SESSION_TOKEN_SECRET ||= TOKEN_SECRET;

const BUYER = { phone: "9999999991", id: "5b616a97-9d5d-4fd4-be4e-8fe7acecd613" };
const ABSENT = "9111100002";
const GOOD_CODE = "123456"; // the non-production bypass code
const BAD_CODE = "654321";
const NEW_PASSWORD = "lantern-harbour-cobalt-83";

let passed = 0;
let failed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const section = (t: string) => console.log(`\n${t}`);

const HASH_KEY = createHmac("sha256", TOKEN_SECRET)
  .update("fabverify/otp-throttle-hash/v1")
  .digest();
const phoneHash = (p: string) => createHmac("sha256", HASH_KEY).update(`phone:${p}`).digest("hex");

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

/** ⚠️ SCOPED to this suite's own account — never a whole-table DELETE. */
const wipeCredential = () =>
  rest(`user_credentials?user_id=eq.${BUYER.id}`, { method: "DELETE" });
const credentialOf = async () =>
  (await (
    await rest(`user_credentials?user_id=eq.${BUYER.id}&select=password_hash,token_epoch`)
  ).json())?.[0] ?? null;
const clearOtpRows = async (p: string) => {
  await rest(`otp_requests?phone_hash=eq.${phoneHash(p)}`, { method: "DELETE" });
};

type Res = { status: number; body: string; parsed: Record<string, unknown> | null };
async function post(path: string, payload: unknown): Promise<Res> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await r.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    /* non-JSON body stays null */
  }
  return { status: r.status, body, parsed };
}
const submitReset = (phone: string, code: string, password: string) =>
  post("/api/auth/password-reset", { phone, code, password });

const { setPassword } = await import("../app/lib/authProvider.server.ts");
const { issueSessionToken, verifySessionToken } = await import(
  "../app/lib/sessionToken.server.ts"
);
const { OTP_VERIFY_PER_PHONE } = await import("../app/lib/otpPolicy.ts");

console.log("CHUNK 2.8b PART 2 — reset route + served page");
console.log("=".repeat(74));

// ─────────────────────────────────────────────────────────────────────────
section("[0] SAFETY GUARD — this suite must run against `next dev`");

const devProbe = await fetch(`${BASE}/api/account/password-status`, {
  headers: { "x-dev-phone": BUYER.phone },
});
check(
  "0.1 ⚠️ server is `next dev` (x-dev-phone accepted) — the 123456 bypass is what makes this testable",
  devProbe.status === 200,
  `password-status with x-dev-phone → ${devProbe.status}`
);
if (devProbe.status !== 200) {
  console.log("\n  ABORTING — against a production build these requests would send REAL SMS.");
  process.exit(1);
}

await clearOtpRows(BUYER.phone);
await clearOtpRows(ABSENT);
await wipeCredential();

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE SERVED PAGE — what a browser actually receives");

const loginHtml = await (await fetch(`${BASE}/login`)).text();
check(
  "A1 /login offers a 'Forgot password?' route into the flow",
  /Forgot password\?/i.test(loginHtml) && loginHtml.includes("/reset-password"),
  "the 2.6a lesson: a proven backend nothing links to is not shipped"
);

const resetRes = await fetch(`${BASE}/reset-password`);
const resetHtml = await resetRes.text();
check("A2 /reset-password is served", resetRes.status === 200, `HTTP ${resetRes.status}`);
check(
  "A3 …and is PUBLIC — no auth bounce for a signed-out visitor",
  !/redirected to \/login/i.test(resetHtml) && resetHtml.length > 500
);
check(
  "A4 the page collects the three inputs the route requires",
  /Mobile number/i.test(resetHtml)
);

// ─────────────────────────────────────────────────────────────────────────
section("[B] THE HAPPY PATH — reset, get a token, old password dies");

await setPassword(BUYER.id, "orchid-monsoon-tabletop-19");
const beforeReset = await credentialOf();
check("B1 SETUP the account starts with a password", !!beforeReset?.password_hash);
const epochBefore = Number(beforeReset?.token_epoch ?? 0);

// A token minted BEFORE the reset — this is what must die afterwards.
const staleToken = await issueSessionToken(BUYER.id, epochBefore);
check("B2 SETUP a pre-reset token verifies", (await verifySessionToken(staleToken)).ok === true);

const ok = await submitReset(BUYER.phone, GOOD_CODE, NEW_PASSWORD);
check("B3 ⚠️ a VALID code resets the password over HTTP", ok.status === 200, `HTTP ${ok.status}`);
check("B4 …and a session token is issued", typeof ok.parsed?.token === "string");
check(
  "B5 …resolving the RIGHT account",
  (ok.parsed?.user as { id?: string } | undefined)?.id === BUYER.id
);
check(
  "B6 …with hasPassword:true so the [I27] gate does not bounce them back",
  ok.parsed?.hasPassword === true
);
check(
  "B7 ⚠️ the response is a PROJECTION — no PII beyond routing",
  Object.keys((ok.parsed?.user ?? {}) as object).sort().join(",") === "id,name,phone,user_type",
  Object.keys((ok.parsed?.user ?? {}) as object).join(",")
);

const afterReset = await credentialOf();
check("B8 the stored hash actually changed", afterReset?.password_hash !== beforeReset?.password_hash);
check(
  "B9 ⚠️ token_epoch was BUMPED",
  Number(afterReset?.token_epoch) === epochBefore + 1,
  `${epochBefore} → ${afterReset?.token_epoch}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] ⚠️ OLD SESSIONS DIE — the epoch bump is the point, not bookkeeping");

/**
 * WARNING: THE EVICTION CANNOT BE PROVEN OVER HTTP ON LOCALHOST, AND THE FIRST
 * VERSION OF THIS SECTION PRETENDED OTHERWISE.
 *
 * It asserted that a pre-reset token gets 401 from a real route. It did - but
 * NOT because of the epoch: `app/lib/auth.ts:144` gates the ENTIRE token
 * branch on `NODE_ENV === "production"`, so under `next dev` every Bearer
 * token is ignored and only x-dev-phone authenticates. A freshly-minted VALID
 * token returned 401 too, which is what exposed it. A green assertion that
 * would have stayed green with the feature deleted is worth less than none.
 *
 * WARNING: THE ENFORCEMENT ITSELF IS ALREADY PROVEN, in the right place:
 * section [B] of scripts/verify-token-ladder.ts ("REVOCATION - token_epoch
 * stops being inert") moves the epoch underneath a token that was valid when
 * minted and asserts the resolver refuses it. This suite does not re-prove
 * that. It proves the RESET produces the inputs that enforcement acts on.
 */
const staleClaim = await verifySessionToken(staleToken);
const freshClaim = await verifySessionToken(ok.parsed?.token as string);
const storedEpoch = Number(afterReset?.token_epoch);

check(
  "C1 the PRE-RESET token now claims a STALE epoch - auth.ts refuses anything below current",
  staleClaim.ok === true && staleClaim.epoch < storedEpoch,
  `token epoch ${staleClaim.ok ? staleClaim.epoch : "?"} < stored ${storedEpoch}`
);
check(
  "C1b ...and it is still structurally VALID - so it is the EPOCH that evicts it, not expiry",
  staleClaim.ok === true
);
check(
  "C2 the token the reset ISSUED matches the current epoch - the owner is signed in, not locked out",
  freshClaim.ok === true && freshClaim.epoch === storedEpoch,
  `token epoch ${freshClaim.ok ? freshClaim.epoch : "?"} === stored ${storedEpoch}`
);
check(
  "C2b localhost CANNOT show this over HTTP - the token branch is production-gated (auth.ts:144)",
  (
    await fetch(`${BASE}/api/account/password-status`, {
      headers: { Authorization: `Bearer ${ok.parsed?.token as string}` },
    })
  ).status === 401,
  "recorded so nobody reads a 401 here as an eviction; the production run exercises it"
);

const newLogin = await post("/api/auth/password-login", {
  phone: BUYER.phone,
  password: NEW_PASSWORD,
});
check("C3 ⚠️ the NEW password works at login", newLogin.status === 200, `HTTP ${newLogin.status}`);
const oldLogin = await post("/api/auth/password-login", {
  phone: BUYER.phone,
  password: "orchid-monsoon-tabletop-19",
});
check("C4 ⚠️ …and the OLD password STOPS working", oldLogin.status === 401, `HTTP ${oldLogin.status}`);

// ─────────────────────────────────────────────────────────────────────────
section("[D] ENUMERATION AT THE HTTP LAYER — [I28], re-checked on the wire");

await clearOtpRows(BUYER.phone);
await clearOtpRows(ABSENT);

// Baseline of rows this suite does NOT own, captured before probing.
const bystanderCredentialsBefore = (
  (await (await rest("user_credentials?select=user_id")).json()) as { user_id: string }[]
)
  .filter((r) => r.user_id !== BUYER.id)
  .map((r) => r.user_id)
  .sort()
  .join(",");

const probes = {
  "registered number, wrong code": await submitReset(BUYER.phone, BAD_CODE, NEW_PASSWORD),
  "UNREGISTERED number, wrong code": await submitReset(ABSENT, BAD_CODE, NEW_PASSWORD),
  "UNREGISTERED number, the REAL code": await submitReset(ABSENT, GOOD_CODE, NEW_PASSWORD),
};
const shapes = new Set(Object.values(probes).map((p) => `${p.status}:${p.body}`));
check(
  "D1 ⚠️ every prober-reachable outcome is the IDENTICAL status + body",
  shapes.size === 1,
  `${shapes.size} distinct: ${[...shapes].join(" | ")}`
);
check("D2 …and that status is 401", [...shapes][0].startsWith("401:"));
/**
 * ⚠️ A BYSTANDER TEST, NOT A WHOLE-TABLE COUNT — the first version of this cell
 * asserted every row belonged to BUYER and failed against the FOUNDER'S real
 * enterprise credential, which has every right to be there. That is the exact
 * assumption the 2026-08-22 incident punished: `user_credentials` is the live
 * credential store, not a scratch table, and a suite must never assert
 * ownership of rows it did not create.
 */
const otherCredentialsAfter = (
  (await (await rest("user_credentials?select=user_id")).json()) as { user_id: string }[]
)
  .filter((r) => r.user_id !== BUYER.id)
  .map((r) => r.user_id)
  .sort()
  .join(",");
check(
  "D3 ⚠️ an unregistered number created NO credential row (bystanders untouched)",
  otherCredentialsAfter === bystanderCredentialsBefore,
  `before [${bystanderCredentialsBefore || "none"}] → after [${otherCredentialsAfter || "none"}]`
);
check(
  "D4 a malformed BODY is 400 — and is NOT reachable by a wrong code",
  (await submitReset(BUYER.phone, BAD_CODE, NEW_PASSWORD)).status === 401 &&
    (await post("/api/auth/password-reset", { phone: 12345, code: null, password: 1 })).status === 400
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] ⚠️ THE 429 IS NOT AN ENUMERATION SIGNAL — the whole reason to gate this");

// Burn the verify budget on BOTH a registered and an unregistered number, then
// compare the refusals byte for byte. If the throttle read account state, this
// is where it would show.
await clearOtpRows(BUYER.phone);
await clearOtpRows(ABSENT);
for (let i = 0; i < OTP_VERIFY_PER_PHONE; i++) {
  await submitReset(BUYER.phone, BAD_CODE, NEW_PASSWORD);
  await submitReset(ABSENT, BAD_CODE, NEW_PASSWORD);
}
const lockedRegistered = await submitReset(BUYER.phone, BAD_CODE, NEW_PASSWORD);
const lockedAbsent = await submitReset(ABSENT, BAD_CODE, NEW_PASSWORD);

/**
 * ⚠️ `retryAfterSeconds` IS MASKED BEFORE THE BODIES ARE COMPARED, AND THAT IS
 * THE CORRECT ASSERTION RATHER THAN A LOOSENED ONE.
 *
 * The value counts down from the CALLER'S OWN oldest counted attempt, and this
 * suite made the two numbers' attempts a few hundred milliseconds apart, so
 * they can legitimately differ by a second. What must NEVER differ is anything
 * derived from ACCOUNT EXISTENCE. The bodies are therefore compared with that
 * one clock-derived field masked, and the field itself is bounded separately —
 * an existence-derived gap would show as a large delta, not a rounding one.
 *
 * ⚠️ The first version compared raw bodies. It passed on one run and would
 * have failed on the next: a test that depends on two clocks agreeing is a
 * flake, not a proof.
 */
const maskRetry = (b: string) => b.replace(/"retryAfterSeconds":\d+/, '"retryAfterSeconds":N');
const retryGap = Math.abs(
  Number(lockedRegistered.parsed?.retryAfterSeconds ?? 0) -
    Number(lockedAbsent.parsed?.retryAfterSeconds ?? -999)
);

check(
  `E1 ⚠️ the ${OTP_VERIFY_PER_PHONE + 1}th guess is REFUSED — brute force is bounded over HTTP`,
  lockedRegistered.status === 429,
  `HTTP ${lockedRegistered.status}`
);
check(
  "E2 ⚠️ …and a REGISTERED and an UNREGISTERED number are refused IDENTICALLY",
  lockedRegistered.status === lockedAbsent.status &&
    maskRetry(lockedRegistered.body) === maskRetry(lockedAbsent.body),
  `${lockedRegistered.status}/${lockedAbsent.status} · ${maskRetry(lockedRegistered.body)}`
);
check(
  "E2b ⚠️ …and the ONLY differing field is clock-derived, never existence-derived",
  retryGap <= 2,
  `retryAfterSeconds differ by ${retryGap}s`
);
check(
  "E3 …the refusal carries a Retry-After the UI can act on",
  typeof lockedRegistered.parsed?.retryAfterSeconds === "number" &&
    (lockedRegistered.parsed.retryAfterSeconds as number) > 0,
  `${lockedRegistered.parsed?.retryAfterSeconds}s`
);
check(
  "E4 ⚠️ …and even the CORRECT code is refused while locked — the gate is not bypassable by luck",
  (await submitReset(BUYER.phone, GOOD_CODE, "another-valid-passphrase-77")).status === 429
);

// ⚠️ THE LOAD-BEARING ONE ([I33]): being locked out of GUESSING must not stop
// the real owner REQUESTING a new code, or an attacker denies recovery outright.
const sendWhileLocked = await post("/api/auth/otp/send", {
  phone: BUYER.phone,
  purpose: "reset",
});
check(
  "E5 ⚠️ a caller locked out of GUESSING can STILL REQUEST a code — recovery does not self-lock",
  sendWhileLocked.status === 200,
  `HTTP ${sendWhileLocked.status}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[F] THE OTHER PATHS ARE UNTOUCHED");

const otpSend = await post("/api/auth/otp/send", { phone: ABSENT, purpose: "login" });
check("F1 OTP login send still works", otpSend.status === 200, `HTTP ${otpSend.status}`);
check(
  "F2 the reset route is a THIN ADAPTER — it delegates, it does not re-implement",
  (() => {
    const code = readFileSync("app/api/auth/password-reset/route.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    return (
      code.includes("resetPasswordByOtp") &&
      code.includes("checkOtpVerifyThrottle") &&
      code.includes("recordOtpVerifyAttempt") &&
      !code.includes("hashPassword") &&
      !code.includes("verifyOtp(")
    );
  })(),
  "no hashing, no OTP verification, no policy logic of its own"
);
check(
  "F3 ⚠️ the throttle is consulted BEFORE the code is evaluated",
  (() => {
    // ⚠️ COMMENT-STRIPPED *AND* SCOPED TO THE HANDLER BODY, and it needed
    // both. Stripping alone still failed: the IMPORT LIST names
    // resetPasswordByOtp above checkOtpVerifyThrottle, so a whole-file indexOf
    // reported the order backwards and this cell failed on its own imports.
    // Same family as W1 in the 2.6c suite — assert on what EXECUTES, and be
    // precise about where execution starts.
    const body =
      readFileSync("app/api/auth/password-reset/route.ts", "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .split("export async function POST")[1] ?? "";
    return body.indexOf("checkOtpVerifyThrottle") < body.indexOf("resetPasswordByOtp");
  })(),
  "otherwise every guess is free until the counter catches up"
);

// ─────────────────────────────────────────────────────────────────────────
section("[Z] CLEANUP");
await clearOtpRows(BUYER.phone);
await clearOtpRows(ABSENT);
await wipeCredential();
const leftCreds = (await (
  await rest(`user_credentials?user_id=eq.${BUYER.id}&select=user_id`)
).json()) as unknown[];
check("Z1 cleanup: no credential left behind FOR THIS SUITE'S ACCOUNT", leftCreds.length === 0);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(failed ? 1 : 0);
