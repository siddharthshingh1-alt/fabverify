/**
 * CHUNK 2.8b VERIFICATION, PART 1 — the reset-code VERIFY throttle ([I33]).
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-otp-verify-throttle.ts
 *
 * ⚠️ WHAT THIS GUARDS. The reset SUBMIT endpoint is unauthenticated and gated
 * only by a 6-digit code. A success WRITES A PASSWORD and bumps `token_epoch`
 * — account takeover that also evicts the real owner. Until this chunk NOTHING
 * counted verify attempts: `otp_requests` recorded sends, and 2.7's counter is
 * for PASSWORD attempts on a different table.
 *
 * ⚠️ No HTTP, no route, no UI. The throttle is proven in isolation FIRST, the
 * same way 2.5a proved credential verification before anything could reach it.
 *
 * It writes real rows to otp_requests and deletes them again in [Z].
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing from .env.local`);
  return m[1].trim();
};
const SUPABASE_URL = envVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = envVar("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = envVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const TOKEN_SECRET = envVar("SESSION_TOKEN_SECRET");

process.env.NEXT_PUBLIC_SUPABASE_URL ||= SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY ||= SERVICE_KEY;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= ANON_KEY;
process.env.SESSION_TOKEN_SECRET ||= TOKEN_SECRET;

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

/** Independently re-derived, exactly as verify-otp-send.ts does. */
const HASH_KEY = createHmac("sha256", TOKEN_SECRET)
  .update("fabverify/otp-throttle-hash/v1")
  .digest();
const phoneHash = (p: string) => createHmac("sha256", HASH_KEY).update(`phone:${p}`).digest("hex");
const ipHashOf = (i: string) => createHmac("sha256", HASH_KEY).update(`ip:${i}`).digest("hex");

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

const TARGET = "9876540001";
const BYSTANDER = "9876540002";
const TEST_IP = ipHashOf("198.51.100.200");

type Row = { purpose: string; created_at: string };
const rowsFor = async (p: string): Promise<Row[]> =>
  (await (await rest(`otp_requests?phone_hash=eq.${phoneHash(p)}&select=purpose,created_at`)).json()) ?? [];
const wipe = async (p: string) => {
  await rest(`otp_requests?phone_hash=eq.${phoneHash(p)}`, { method: "DELETE" });
};

const { checkOtpThrottle, checkOtpVerifyThrottle, recordOtpVerifyAttempt, recordOtpAttempt } =
  await import("../app/lib/otpThrottle.server.ts");
const { OTP_VERIFY_PER_PHONE_HOURLY, OTP_PER_PHONE_HOURLY, OTP_VERIFY_PURPOSE } = await import(
  "../app/lib/otpPolicy.ts"
);

type Decision = Awaited<ReturnType<typeof checkOtpVerifyThrottle>>;
const scope = (d: Decision) => (d.allowed ? "ALLOWED" : d.scope);
const retry = (d: Decision) => (d.allowed ? 0 : d.retryAfterSeconds);

console.log("CHUNK 2.8b PART 1 — reset-code VERIFY throttle");
console.log("=".repeat(74));

await wipe(TARGET);
await wipe(BYSTANDER);

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE CAP BINDS — N wrong guesses and the gate closes");

let allowedCount = 0;
for (let i = 0; i < OTP_VERIFY_PER_PHONE_HOURLY; i++) {
  const d = await checkOtpVerifyThrottle({ phoneHash: phoneHash(TARGET), ipHash: TEST_IP });
  if (d.allowed) allowedCount++;
  await recordOtpVerifyAttempt({ phoneHash: phoneHash(TARGET), ipHash: TEST_IP });
}
check(
  `A1 the first ${OTP_VERIFY_PER_PHONE_HOURLY} guesses are allowed`,
  allowedCount === OTP_VERIFY_PER_PHONE_HOURLY,
  `${allowedCount}/${OTP_VERIFY_PER_PHONE_HOURLY}`
);

const blocked = await checkOtpVerifyThrottle({ phoneHash: phoneHash(TARGET), ipHash: TEST_IP });
check(
  "A2 ⚠️ the NEXT guess is REFUSED — brute force is bounded",
  blocked.allowed === false,
  `scope=${scope(blocked)}`
);
check(
  "A3 …and it reports the per-number scope, not the per-IP one",
  scope(blocked) === "phone-hourly",
  `scope=${scope(blocked)}`
);
check("A4 …with a positive retryAfterSeconds", retry(blocked) > 0, `${retry(blocked)}s`);

// ─────────────────────────────────────────────────────────────────────────
section("[B] ⚠️ THE LOAD-BEARING PROPERTY — guesses must NOT consume the SEND budget");

// TARGET is now at the verify cap. If the counters were shared, this account
// could no longer REQUEST a recovery code — a self-inflicted denial of service
// on the one path that only matters once someone has already lost access.
const sendAfterLockout = await checkOtpThrottle({ phoneHash: phoneHash(TARGET), ipHash: TEST_IP });
check(
  "B1 ⚠️ a number locked out of GUESSING can still REQUEST a code ([I33])",
  sendAfterLockout.allowed === true,
  sendAfterLockout.allowed ? "send allowed" : `WRONGLY REFUSED: ${scope(sendAfterLockout)}`
);

const stored = await rowsFor(TARGET);
check(
  "B2 every stored row is a verify row, none is a send",
  stored.length === OTP_VERIFY_PER_PHONE_HOURLY &&
    stored.every((r) => r.purpose === OTP_VERIFY_PURPOSE),
  `${stored.length} rows, purposes: ${[...new Set(stored.map((r) => r.purpose))].join(",")}`
);

// …and the mirror image: sends must not consume the GUESS budget.
await wipe(BYSTANDER);
for (let i = 0; i < OTP_PER_PHONE_HOURLY; i++) {
  await recordOtpAttempt({ phoneHash: phoneHash(BYSTANDER), ipHash: TEST_IP, purpose: "reset" });
}
const guessAfterSends = await checkOtpVerifyThrottle({
  phoneHash: phoneHash(BYSTANDER),
  ipHash: TEST_IP,
});
check(
  "B3 ⚠️ …and the mirror image: a number at its SEND cap may still GUESS",
  guessAfterSends.allowed === true,
  guessAfterSends.allowed ? "guess allowed" : `WRONGLY REFUSED: ${scope(guessAfterSends)}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] ISOLATION — one number's guesses do not lock another's");

const other = await checkOtpVerifyThrottle({ phoneHash: phoneHash(BYSTANDER), ipHash: null });
check(
  "C1 a different number is unaffected by TARGET's lockout",
  other.allowed === true,
  other.allowed ? "allowed" : `refused: ${scope(other)}`
);
check(
  "C2 ⚠️ the decision reads NO account state — identical for a number with no account",
  other.allowed === true
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] ⚠️ FAIL-CLOSED — an unreadable counter must never allow a guess");

const brokenUrl = SUPABASE_URL.replace(".supabase.co", "-BROKEN.supabase.co");
let proof = "";
try {
  proof = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "./scripts/register-ts-resolve.mjs",
      "--input-type=module",
      "-e",
      `
      const { checkOtpVerifyThrottle, hashPhone, hashIp } = await import("./app/lib/otpThrottle.server.ts");
      try {
        const d = await checkOtpVerifyThrottle({ phoneHash: hashPhone("9999999999"), ipHash: hashIp("203.0.113.55") });
        console.log(d.allowed ? "ALLOWED" : "REFUSED");
      } catch { console.log("THREW"); }
      `,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: brokenUrl,
        SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
        SESSION_TOKEN_SECRET: TOKEN_SECRET,
      },
    }
  ).trim();
} catch (e) {
  proof = `child failed: ${(e as Error).message.slice(0, 120)}`;
}
check(
  "D1 ⚠️ an unreadable counter THROWS (never 'ALLOWED') — a verify that fails open costs an ACCOUNT",
  proof.includes("THREW"),
  proof
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] THE READS ARE PURPOSE-FILTERED AT THE DATA LAYER");

const dbCode = readFileSync("app/lib/db.ts", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const filtered = (dbCode.match(/\.in\("purpose"/g) ?? []).length;
check("E1 getOtpRequestTimes filters on purpose", /\.in\("purpose"/.test(dbCode));
check(
  "E2 …and so does the global count — both readers, not just one",
  filtered >= 2,
  `${filtered} purpose-filtered readers`
);

/**
 * ⚠️ THE VERIFY CLIENT IS NOT THE SHARED ADMIN CLIENT ([I34]).
 * verifyOtp SAVES A SESSION on whatever client it runs on, and supabase-js
 * prefers a session token over the client's own key — so calling it on
 * supabaseAdmin silently downgrades every db.ts call in the process from
 * service role to that user. Asserted on comment-stripped source because the
 * fix's own comment names supabaseAdmin while explaining why it must not be used.
 */
const authCode = readFileSync("app/lib/authProvider.server.ts", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
check(
  "E3 ⚠️ verifyOtp runs on the ISOLATED client, never on supabaseAdmin ([I34])",
  authCode.includes("otpVerifyClient.auth.verifyOtp") &&
    !authCode.includes("supabaseAdmin.auth.verifyOtp"),
  authCode.includes("supabaseAdmin.auth.verifyOtp")
    ? "supabaseAdmin.auth.verifyOtp FOUND — it would poison the data layer"
    : "isolated"
);
check(
  "E4 …and that client is never used for a database call",
  !/otpVerifyClient\s*\.\s*from\(/.test(authCode)
);

// ─────────────────────────────────────────────────────────────────────────
section("[Z] CLEANUP");
await wipe(TARGET);
await wipe(BYSTANDER);
const left = (await rowsFor(TARGET)).length + (await rowsFor(BYSTANDER)).length;
check("Z1 every row this suite created has been deleted", left === 0, `${left} left`);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(failed ? 1 : 0);
