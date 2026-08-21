/**
 * CHUNK 2.8a VERIFICATION — resetPasswordByOtp()
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-password-reset.ts
 *
 * ⚠️ THE MOST DANGEROUS FUNCTION IN M10 AFTER THE TOKEN. It writes a CREDENTIAL
 * on a path reachable WITHOUT AUTHENTICATION — that is what "forgot password"
 * means. A bug here does not leak information; it lets someone set another
 * person's password, which is worse than an auth bypass because it is
 * persistent and locks the real owner out.
 *
 * ⚠️ NO ROUTE EXISTS YET (2.8a). Proven as a seam function first, exactly as
 * 2.5a was, so a bug at this stage is a wrong answer nothing acts on.
 *
 * ⚠️ WHAT THIS SUITE DELIBERATELY DOES NOT TEST, because it is NOT BUILT:
 * rate limiting and enumeration-safety of the OTP *REQUEST*. The send still
 * runs browser-direct against Supabase (chunk 2.6c), so it cannot be throttled
 * or made uniform from here. Section [G] asserts that gap EXISTS rather than
 * pretending it is closed.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

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

const BUYER = { phone: "9999999991", id: "5b616a97-9d5d-4fd4-be4e-8fe7acecd613" };
const MAKER = { phone: "9999999992", id: "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33" };
const ABSENT_PHONE = "9111100001";

const OLD_PASSWORD = "orchid-lantern-monsoon-77";
const NEW_PASSWORD = "harbour-thistle-cobalt-41";
const GOOD_CODE = "123456"; // the non-production bypass code
const BAD_CODE = "654321";

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

const realFetch = globalThis.fetch;
async function sql(path: string, init: RequestInit = {}) {
  const r = await realFetch(`${SUPABASE_URL}/rest/v1/${path}`, {
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
const wipe = () => sql("user_credentials?id=not.is.null", { method: "DELETE" });
const credential = async (userId: string) =>
  (await sql(
    `user_credentials?user_id=eq.${userId}&select=password_hash,token_epoch,failed_attempts,locked_until`
  ))?.[0] ?? null;

console.log("\nCHUNK 2.8a — password reset via OTP (no route)");
console.log("=".repeat(74));

const { setPassword, verifyPasswordCredential, resetPasswordByOtp } = await import(
  "../app/lib/authProvider.server.ts"
);
const { issueSessionToken } = await import("../app/lib/sessionToken.server.ts");

// ── OUTAGE CHILD ─────────────────────────────────────────────────────────
if (process.argv.includes("--outage-child")) {
  try {
    const r = await resetPasswordByOtp(BUYER.phone, GOOD_CODE, NEW_PASSWORD);
    console.log(`CHILD:returned:${JSON.stringify(r)}`);
  } catch {
    console.log("CHILD:threw");
  }
  process.exit(0);
}

// ── SETUP ────────────────────────────────────────────────────────────────
await wipe();
const seeded = await setPassword(BUYER.id, OLD_PASSWORD);
check("SETUP buyer has a password", seeded.ok === true);
const before = await credential(BUYER.id);
check("SETUP …at epoch 0", before?.token_epoch === 0);

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE OTP IS THE GATE — no valid code, no write");

// ⚠️ THE CENTRAL SECURITY CLAIM. If any of these writes, anyone can take over
// any account by guessing a phone number.
const hashBefore = before?.password_hash;

const a1 = await resetPasswordByOtp(BUYER.phone, BAD_CODE, NEW_PASSWORD);
check("A1 ⚠️ a WRONG code is refused", a1.ok === false);
check(
  "A2 ⚠️ …and NOTHING was written — the stored hash is byte-identical",
  (await credential(BUYER.id))?.password_hash === hashBefore
);
check(
  "A3 …the old password still works",
  (await verifyPasswordCredential(BUYER.phone, OLD_PASSWORD)).ok === true
);

for (const [label, code] of [
  ["empty string", ""],
  ["null", null],
  ["a number", 123456],
  ["an object", { code: GOOD_CODE }],
  ["the code with whitespace", " 123456 "],
] as const) {
  const r = await resetPasswordByOtp(BUYER.phone, code, NEW_PASSWORD);
  check(`A4 ${label} → refused`, r.ok === false);
}
check(
  "A5 ⚠️ after every malformed attempt the hash is STILL unchanged",
  (await credential(BUYER.id))?.password_hash === hashBefore
);

// ─────────────────────────────────────────────────────────────────────────
section("[B] THE HAPPY PATH — reset, then log in with the new password");

const b1 = await resetPasswordByOtp(BUYER.phone, GOOD_CODE, NEW_PASSWORD);
check("B1 ⚠️ a VALID code resets the password", b1.ok === true);
check("B2 …resolving the right account", b1.ok && b1.user.id === BUYER.id);
check(
  "B3 ⚠️ the NEW password now works",
  (await verifyPasswordCredential(BUYER.phone, NEW_PASSWORD)).ok === true
);
check(
  "B4 ⚠️ …and the OLD password STOPS working",
  (await verifyPasswordCredential(BUYER.phone, OLD_PASSWORD)).ok === false,
  "an old password that still works means the reset did not replace anything"
);
check(
  "B5 the stored hash actually changed",
  (await credential(BUYER.id))?.password_hash !== hashBefore
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] REVOCATION — the epoch bump is the point of a reset");

const afterReset = await credential(BUYER.id);
check(
  "C1 ⚠️ token_epoch was BUMPED by the reset",
  afterReset?.token_epoch === 1,
  `0 → ${afterReset?.token_epoch}`
);

// A token minted before the reset must now be dead. Proven through the real
// ladder, not by inspecting the number.
// Assigned via Object.assign because NODE_ENV is typed readonly; the runtime
// assignment is ordinary and must happen before auth.ts is imported, since
// isProduction is a module-load constant there.
Object.assign(process.env, { NODE_ENV: "production" });
const { getVerifiedUser } = await import("../app/lib/auth.ts");
const bearer = (token: string) =>
  new Request("https://fabverify.test/api/x", {
    headers: { authorization: `Bearer ${token}` },
  });

const preResetToken = await issueSessionToken(BUYER.id, 0);
const c2 = await getVerifiedUser(bearer(preResetToken));
check(
  "C2 ⚠️ A TOKEN ISSUED BEFORE THE RESET IS NOW REJECTED",
  c2.ok === false,
  c2.ok ? "STILL VALID — a reset cannot evict an intruder" : "refused"
);
const postResetToken = await issueSessionToken(BUYER.id, afterReset!.token_epoch);
check(
  "C3 …while a token issued after it works",
  (await getVerifiedUser(bearer(postResetToken))).ok === true
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] A LOCKED-OUT USER CAN RECOVER — the whole point of reset");

// ⚠️ Someone locked out by a brute-force attempt is EXACTLY who reaches for
// "forgot password". If the lock survived, a successful reset still could not
// log in and the recovery path would not recover.
await sql(`user_credentials?user_id=eq.${BUYER.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    failed_attempts: 10,
    locked_until: new Date(Date.now() + 15 * 60_000).toISOString(),
  }),
});
check(
  "D1 the account is locked before the reset",
  (await verifyPasswordCredential(BUYER.phone, NEW_PASSWORD)).ok === false
);

const d2 = await resetPasswordByOtp(BUYER.phone, GOOD_CODE, OLD_PASSWORD);
check("D2 a locked account CAN still reset", d2.ok === true);
const afterUnlock = await credential(BUYER.id);
check("D3 ⚠️ the lockout was CLEARED", afterUnlock?.locked_until === null);
check("D4 …and the counter reset to zero", afterUnlock?.failed_attempts === 0);
check(
  "D5 ⚠️ …so the user can log in immediately with the new password",
  (await verifyPasswordCredential(BUYER.phone, OLD_PASSWORD)).ok === true
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] ENUMERATION — a prober learns nothing from the SUBMIT path");

await wipe();
await setPassword(BUYER.id, OLD_PASSWORD);

const probes: Record<string, unknown> = {
  "unknown phone, valid code": await resetPasswordByOtp(ABSENT_PHONE, GOOD_CODE, NEW_PASSWORD),
  "unknown phone, wrong code": await resetPasswordByOtp(ABSENT_PHONE, BAD_CODE, NEW_PASSWORD),
  "real account, wrong code": await resetPasswordByOtp(BUYER.phone, BAD_CODE, NEW_PASSWORD),
  "account with NO password, wrong code": await resetPasswordByOtp(
    MAKER.phone,
    BAD_CODE,
    NEW_PASSWORD
  ),
  "malformed phone": await resetPasswordByOtp("nope", GOOD_CODE, NEW_PASSWORD),
};
const shapes = new Set(Object.values(probes).map((r) => JSON.stringify(r)));
check(
  "E1 ⚠️ every prober-reachable failure is the IDENTICAL value",
  shapes.size === 1,
  `${shapes.size} distinct: ${[...shapes].join(" | ")}`
);
check(
  "E2 …and it reveals nothing but 'invalid-request'",
  [...shapes][0] === JSON.stringify({ ok: false, reason: "invalid-request" })
);
check(
  "E3 ⚠️ an unknown phone created NO credential row",
  (await sql("user_credentials?select=user_id")).length === 1
);

// ⚠️ THE POLICY MESSAGE IS BEHIND THE GATE. A weak-password reason reveals the
// password rules, so it must be unreachable without a valid OTP.
const weakNoOtp = await resetPasswordByOtp(BUYER.phone, BAD_CODE, "short");
check(
  "E4 ⚠️ a weak password with a WRONG code → generic failure, policy NOT revealed",
  weakNoOtp.ok === false && weakNoOtp.reason === "invalid-request",
  weakNoOtp.ok === false ? weakNoOtp.reason : "n/a"
);
const weakWithOtp = await resetPasswordByOtp(BUYER.phone, GOOD_CODE, "short");
check(
  "E5 …but WITH a valid code the policy message is returned (ownership proven)",
  weakWithOtp.ok === false && weakWithOtp.reason === "weak-password"
);
check(
  "E6 …and a rejected weak password wrote NOTHING",
  (await verifyPasswordCredential(BUYER.phone, OLD_PASSWORD)).ok === true
);

// ─────────────────────────────────────────────────────────────────────────
section("[F] FIRST-TIME RESET — an account with no credential");

check(
  "F1 an account that never had a password can reset into one",
  (await resetPasswordByOtp(MAKER.phone, GOOD_CODE, NEW_PASSWORD)).ok === true
);
check(
  "F2 …and can then log in with it",
  (await verifyPasswordCredential(MAKER.phone, NEW_PASSWORD)).ok === true
);
check("F3 …starting at epoch 0 (no tokens existed to evict)", (await credential(MAKER.id))?.token_epoch === 0);

// ─────────────────────────────────────────────────────────────────────────
section("[G] ⚠️ THE GAP THIS CHUNK DOES NOT CLOSE — asserted, not assumed");

// The OTP SEND still runs browser-direct against Supabase, so it cannot be
// rate-limited or made enumeration-uniform from the server. Asserting the gap
// keeps it visible until 2.6c closes it — a TODO in a comment gets forgotten,
// a failing-when-fixed assertion does not.
const clientSeam = readFileSync("app/lib/authProvider.ts", "utf8");
check(
  "G1 ⚠️ OTP SEND IS STILL BROWSER-DIRECT — rate limiting is NOT built (2.6c)",
  clientSeam.includes("supabase.auth.signInWithOtp"),
  "when this assertion FAILS, the send has moved server-side and 2.6c is done"
);
check(
  "G2 ⚠️ …so reset-OTP REQUESTS are unthrottled and not enumeration-uniform",
  true,
  "recorded limitation, not a passing security property"
);

// ─────────────────────────────────────────────────────────────────────────
section("[H] ISOLATION AND OUTAGE");

const grep = (pattern: string) => {
  try {
    return execFileSync("git", ["grep", "-l", pattern, "--", "app/"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};
const importers = grep("resetPasswordByOtp")
  .split("\n")
  .filter((f) => f && f !== "app/lib/authProvider.server.ts");
check(
  "H1 ⚠️ resetPasswordByOtp has ZERO route importers (2.8a is seam-only)",
  importers.length === 0,
  importers.join(", ") || "none"
);

// ⚠️ Subprocess with a cold module graph — an in-process re-import keeps the
// cached db module and reports a false pass (learned three times in M10).
const childOutput = execFileSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--import",
    "./scripts/register-ts-resolve.mjs",
    "scripts/verify-password-reset.ts",
    "--outage-child",
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL.replace(".supabase.co", "-BROKEN.supabase.co"),
    },
  }
);
const childThrew = childOutput.includes("CHILD:threw");
const childReturned = /CHILD:returned:(.*)/.exec(childOutput)?.[1]?.trim() ?? "";
check(
  "H2 ⚠️ an unreachable database THROWS rather than reporting 'invalid code'",
  childThrew,
  childThrew ? "threw → route maps to 503" : `returned ${childReturned}`
);
check("H3 …and never reports a successful reset during one", !childReturned.includes('"ok":true'));

// ── CLEANUP ──────────────────────────────────────────────────────────────
await wipe();
check("Z1 cleanup: no credentials left behind", (await sql("user_credentials?select=id")).length === 0);
check("Z2 auth_identities untouched", (await sql("auth_identities?select=id")).length === 1);

console.log("\n" + "=".repeat(74));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(74) + "\n");
process.exit(failed ? 1 : 0);
