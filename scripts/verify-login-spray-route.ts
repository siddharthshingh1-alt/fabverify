/**
 * CHUNK 2.10 VERIFICATION, PART 2 — the anti-spray control ON THE LIVE ROUTE.
 *
 * Run:  npm run dev        (in another terminal, must be `next dev`)
 *       node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-login-spray-route.ts
 *
 * ⚠️ PART 1 (verify-login-spray.ts) PROVED THE CONTROL IN ISOLATION. This
 * proves it on `/api/auth/password-login`, which has the worst blast radius in
 * M10 — every password login in the platform flows through it, so a mistake
 * here means nobody can sign in.
 *
 * ⚠️ THE CELLS THAT MATTER MOST ARE [B] AND [D], NOT [A]. Blocking a spray is
 * the easy half. Not blocking a NAT'd office is the half [I23] refused per-IP
 * limiting over, and not blocking anyone when the counter is unreadable is
 * [I36]. If either goes red, this has become something we decided not to ship.
 *
 * It sends real HTTP to a dev server, writes rows to otp_requests and
 * credentials for its OWN accounts, and removes both in [Z].
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
const TOKEN_SECRET = envVar("SESSION_TOKEN_SECRET");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

process.env.NEXT_PUBLIC_SUPABASE_URL ||= SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY ||= SERVICE_KEY;
process.env.SESSION_TOKEN_SECRET ||= TOKEN_SECRET;

const BUYER = { phone: "9999999991", id: "5b616a97-9d5d-4fd4-be4e-8fe7acecd613" };
const MAKER = { phone: "9999999992", id: "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33" };
const ABSENT = "9111100003";
const PASSWORD = "orchid-lantern-monsoon-77";
const WRONG = "granite-harbour-velvet-08";

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
const ipHashOf = (i: string) => createHmac("sha256", HASH_KEY).update(`ip:${i}`).digest("hex");

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

const SPRAY_IP = "203.0.113.210";
const OFFICE_IP = "203.0.113.211";
const HAMMER_IP = "203.0.113.212";
const ALL_IPS = [SPRAY_IP, OFFICE_IP, HAMMER_IP];
const wipeIp = async (ip: string) => {
  await rest(`otp_requests?ip_hash=eq.${ipHashOf(ip)}`, { method: "DELETE" });
};
const rowsForIp = async (ip: string): Promise<unknown[]> =>
  (await (await rest(`otp_requests?ip_hash=eq.${ipHashOf(ip)}&select=id`)).json()) ?? [];

/** ⚠️ SCOPED — never a whole-table DELETE, and never a whole-table count. */
const TEST_IDS = `user_id=in.(${BUYER.id},${MAKER.id})`;
const wipeCredentials = () => rest(`user_credentials?${TEST_IDS}`, { method: "DELETE" });
const credentialOf = async (id: string) =>
  (await (
    await rest(`user_credentials?user_id=eq.${id}&select=failed_attempts,locked_until`)
  ).json())?.[0] ?? null;

type Res = { status: number; body: string };
async function login(phone: string, password: string, ip: string): Promise<Res> {
  const r = await fetch(`${BASE}/api/auth/password-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ phone, password }),
  });
  return { status: r.status, body: await r.text() };
}

const { setPassword } = await import("../app/lib/authProvider.server.ts");
const { LOGIN_SPRAY_DISTINCT_ACCOUNTS } = await import("../app/lib/otpPolicy.ts");

console.log("CHUNK 2.10 PART 2 — anti-spray on the LIVE login route");
console.log("=".repeat(74));

// ─────────────────────────────────────────────────────────────────────────
section("[0] SAFETY GUARD — must be `next dev`");

const devProbe = await fetch(`${BASE}/api/account/password-status`, {
  headers: { "x-dev-phone": BUYER.phone },
});
check("0.1 server is `next dev`", devProbe.status === 200, `HTTP ${devProbe.status}`);
if (devProbe.status !== 200) {
  console.log("\n  ABORTING — not a dev server.");
  process.exit(1);
}

for (const ip of ALL_IPS) await wipeIp(ip);
await wipeCredentials();
await setPassword(BUYER.id, PASSWORD);
await setPassword(MAKER.id, PASSWORD);

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE SPRAY IS BLOCKED OVER HTTP");

// One password, many accounts, one address — the defining shape.
for (let i = 0; i < LOGIN_SPRAY_DISTINCT_ACCOUNTS; i++) {
  await login(`98765${String(80000 + i)}`, WRONG, SPRAY_IP);
}
const sprayNext = await login(`98765${String(89999)}`, WRONG, SPRAY_IP);
check(
  `A1 ⚠️ after ${LOGIN_SPRAY_DISTINCT_ACCOUNTS} distinct accounts, the next attempt is REFUSED`,
  sprayNext.status === 401,
  `HTTP ${sprayNext.status}`
);

/**
 * ⚠️ THE BLOCK MUST NOT ANNOUNCE ITSELF. A 429 would be enumeration-safe but
 * would tell a sprayer their technique was detected, handing them the cue to
 * rotate addresses. The generic 401 reveals neither the account nor the
 * control.
 */
const normalFailure = await login(BUYER.phone, WRONG, "203.0.113.250");
check(
  "A2 ⚠️ …and is BYTE-IDENTICAL to an ordinary wrong password — the control does not announce itself",
  sprayNext.status === normalFailure.status && sprayNext.body === normalFailure.body,
  `${sprayNext.status}:${sprayNext.body}`
);
check(
  "A3 ⚠️ …carrying NO Retry-After, which would leak it just as loudly",
  !(await fetch(`${BASE}/api/auth/password-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": SPRAY_IP },
    body: JSON.stringify({ phone: BUYER.phone, password: WRONG }),
  }).then((r) => r.headers.has("retry-after")))
);

/**
 * ⚠️ THE PROOF THAT THE BLOCK IS REAL, not just a different message: the
 * CORRECT password is refused too while the address is blocked.
 */
const correctWhileBlocked = await login(BUYER.phone, PASSWORD, SPRAY_IP);
check(
  "A4 ⚠️ even the CORRECT password is refused from a blocked address",
  correctWhileBlocked.status === 401,
  `HTTP ${correctWhileBlocked.status}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[B] ⚠️ NAT SAFETY OVER HTTP — the cell [I23] would have failed");

/**
 * ⚠️ IF THIS GOES RED, THE ROUTE HAS BECOME A PER-IP ATTEMPT CAP AND ONE
 * ATTACKER BEHIND AN OFFICE NAT CAN LOCK OUT EVERY REAL USER — the exact
 * denial-of-service [I23] refused per-IP limiting over.
 *
 * The office is built LARGER than the spray in distinct accounts. The only
 * difference is shape: each person fails once and then SUCCEEDS, which is what
 * a real office looks like and what a sprayer can never do.
 */
/**
 * ⚠️ BUILT TO SIT EXACTLY ONE ACCOUNT BELOW THE LINE, because the obvious
 * version of this test does not discriminate.
 *
 * The first draft ran 20 mistype-then-succeed cycles across BUYER and MAKER —
 * but that is 20 ATTEMPTS across only 2 DISTINCT accounts, and 2 never
 * approaches a threshold of 10. It passed with clear-on-success DELETED, which
 * makes it worthless as a guard. Over HTTP a "success" needs a real account
 * with a real password, and this platform has two of them, so 20 distinct
 * successful accounts cannot be staged here at all.
 *
 * So: N-1 distinct accounts fail and stay failed, and ONE more fails and then
 * SUCCEEDS. If the success clears its rows the address sits at 9 distinct and
 * login works; if it does not, the address hits 10 and everything is blocked.
 * One account either side of the line.
 *
 * ⚠️ The DISTINCT-ACCOUNT property itself is proven in part 1
 * (verify-login-spray.ts [B]) with 20 synthesised accounts, and was
 * mutation-tested red there. This cell proves the ROUTE wires the clear into
 * the success path.
 */
/**
 * ⚠️ THE RECOVERING USER GOES FIRST, AND THE ORDER IS NOT COSMETIC. The first
 * version staged the 9 stale failures BEFORE the mistype — which made 10
 * distinct accounts and blocked the address before the user could log in and
 * clear anything, so the setup failed on its own arrangement rather than on
 * the behaviour under test. Fail, succeed, THEN fill the rest of the window.
 */
await wipeIp(OFFICE_IP);
await login(BUYER.phone, WRONG, OFFICE_IP); // fat-fingers once…
const officeRecovered = await login(BUYER.phone, PASSWORD, OFFICE_IP); // …then gets it right
for (let i = 0; i < LOGIN_SPRAY_DISTINCT_ACCOUNTS - 1; i++) {
  await login(`98765${String(82000 + i)}`, WRONG, OFFICE_IP);
}
check(
  "B0 SETUP the mistyping user's own login succeeds",
  officeRecovered.status === 200,
  `HTTP ${officeRecovered.status}`
);

const officeStillWorks = await login(BUYER.phone, PASSWORD, OFFICE_IP);
check(
  `B1 ⚠️ ${LOGIN_SPRAY_DISTINCT_ACCOUNTS - 1} stale failures + 1 recovered user = ${LOGIN_SPRAY_DISTINCT_ACCOUNTS - 1} distinct → login STILL WORKS`,
  officeStillWorks.status === 200,
  officeStillWorks.status === 200
    ? "one account below the line — the success cleared its rows"
    : `HTTP ${officeStillWorks.status} — WRONGLY BLOCKED; the clear did not happen`
);
check(
  `B2 …and exactly ${LOGIN_SPRAY_DISTINCT_ACCOUNTS - 1} rows remain — the recovered user's were cleared, the rest were not`,
  (await rowsForIp(OFFICE_IP)).length === LOGIN_SPRAY_DISTINCT_ACCOUNTS - 1,
  `${(await rowsForIp(OFFICE_IP)).length} rows (expected ${LOGIN_SPRAY_DISTINCT_ACCOUNTS - 1})`
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] ⚠️ [I23] IS UNTOUCHED — single-account brute force still locks");

await wipeIp(HAMMER_IP);
await wipeCredentials();
await setPassword(BUYER.id, PASSWORD);

// 10 failures against ONE account. This is [I23]'s job, NOT the spray control's
// — conflating them would mean one user's bad day locks out their whole office.
for (let i = 0; i < 10; i++) await login(BUYER.phone, WRONG, HAMMER_IP);
const row = await credentialOf(BUYER.id);
check(
  "C1 ⚠️ per-account lockout still fires at 10 — 2.10 did not weaken 2.7",
  row?.locked_until !== null && row?.locked_until !== undefined,
  `failed_attempts=${row?.failed_attempts} locked_until=${row?.locked_until ?? "null"}`
);
check(
  "C2 ⚠️ …and the CORRECT password is refused during that lockout",
  (await login(BUYER.phone, PASSWORD, "203.0.113.251")).status === 401
);
check(
  "C3 ⚠️ 10 failures on ONE account did NOT trip the spray control — distinct count is 1",
  (await login(MAKER.phone, WRONG, HAMMER_IP)).status === 401 &&
    (await rowsForIp(HAMMER_IP)).length > 0,
  "a different account from the same IP is still evaluated normally, not pre-blocked"
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] ⚠️ ENUMERATION — a blocked address reveals nothing about accounts");

await wipeIp(SPRAY_IP);
for (let i = 0; i < LOGIN_SPRAY_DISTINCT_ACCOUNTS; i++) {
  await login(`98765${String(81000 + i)}`, WRONG, SPRAY_IP);
}
const blockedRegistered = await login(BUYER.phone, WRONG, SPRAY_IP);
const blockedAbsent = await login(ABSENT, WRONG, SPRAY_IP);
check(
  "D1 ⚠️ from a BLOCKED address, a registered and an unregistered number are BYTE-IDENTICAL",
  blockedRegistered.status === blockedAbsent.status &&
    blockedRegistered.body === blockedAbsent.body,
  `${blockedRegistered.status}:${blockedRegistered.body}`
);
check(
  "D2 ⚠️ …and identical to an ordinary failure from a CLEAN address — one shape for everything",
  blockedRegistered.status === normalFailure.status && blockedRegistered.body === normalFailure.body
);
check(
  "D3 ⚠️ the block is decided from the ADDRESS alone — it reads no account state",
  (await login(ABSENT, PASSWORD, SPRAY_IP)).body === blockedRegistered.body,
  "a correct-looking password for a non-existent account gets the same answer"
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] ⚠️ FAIL-OPEN ON THE LIVE ROUTE — a DB blip must not lock everyone out");

/**
 * ⚠️ SUBPROCESS WITH A COLD MODULE GRAPH — an in-process re-import keeps the
 * cached db module and reports a false pass.
 *
 * ⚠️ THE EXPECTED ANSWER IS THE OPPOSITE OF EVERY OTHER THROTTLE HERE. This
 * must ALLOW, because fail-closed would lock every user out of the platform on
 * a database blip and buy nothing — the same outage stops
 * verifyPasswordCredential authenticating anyone ([I36]).
 */
const brokenUrl = SUPABASE_URL.replace(".supabase.co", "-BROKEN.supabase.co");
let failOpen = "";
try {
  failOpen = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "./scripts/register-ts-resolve.mjs",
      "--input-type=module",
      "-e",
      `
      const { checkLoginSprayThrottle, hashIp } = await import("./app/lib/otpThrottle.server.ts");
      const d = await checkLoginSprayThrottle({ ipHash: hashIp("203.0.113.99") });
      console.log(d.allowed ? "ALLOWED" : "REFUSED");
      `,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: brokenUrl,
        SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
        SESSION_TOKEN_SECRET: TOKEN_SECRET,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  ).trim();
} catch (e) {
  failOpen = `child failed: ${(e as Error).message.slice(0, 120)}`;
}
check(
  "E1 ⚠️ an unreadable counter ALLOWS — login survives a DB blip ([I36])",
  failOpen.includes("ALLOWED"),
  failOpen
);

const routeCode = readFileSync("app/api/auth/password-login/route.ts", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const body = routeCode.split("export async function POST")[1] ?? "";
check(
  "E2 ⚠️ the spray check runs BEFORE the argon2 verify — a spray must not buy free compute",
  body.indexOf("checkLoginSprayThrottle") < body.indexOf("verifyPasswordCredential"),
  "asserted on the handler body, not the import list"
);
check(
  "E3 ⚠️ the failure is recorded AFTER the verify — the design counts accounts that FAILED",
  body.indexOf("verifyPasswordCredential") < body.indexOf("recordLoginFailure")
);
check(
  "E4 ⚠️ the clear runs on the SUCCESS path only — [I35]'s NAT safety depends on it",
  body.indexOf("recordLoginFailure") < body.indexOf("clearLoginFailuresFor")
);

// ─────────────────────────────────────────────────────────────────────────
section("[Z] CLEANUP");
for (const ip of [...ALL_IPS, "203.0.113.250", "203.0.113.251"]) await wipeIp(ip);
await wipeCredentials();
let leftover = 0;
for (const ip of ALL_IPS) leftover += (await rowsForIp(ip)).length;
check("Z1 no otp_requests rows left behind for this suite's addresses", leftover === 0, `${leftover}`);
check(
  "Z2 no credentials left behind FOR THIS SUITE'S ACCOUNTS",
  ((await (await rest(`user_credentials?${TEST_IDS}&select=id`)).json()) as unknown[]).length === 0
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(failed ? 1 : 0);
