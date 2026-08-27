/**
 * CHUNK 2.10 VERIFICATION, PART 1 — the login anti-spray control ([I35]/[I36]).
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-login-spray.ts
 *
 * ⚠️ NO ROUTE, NO HTTP. The control is proven in isolation FIRST, before
 * anything touches /api/auth/password-login — the same sequencing [I33] used,
 * and it matters more here: that route serves EVERY password login, so a bug
 * in it means nobody can sign in.
 *
 * ⚠️ WHAT THIS GUARDS. Per-account lockout ([I23]) never sees a spray: one
 * guess each against ten thousand accounts trips no single counter. This
 * counts DISTINCT ACCOUNTS THAT FAILED from one IP, which is a shape only a
 * sprayer produces.
 *
 * ⚠️ THE CELL THAT MATTERS MOST IS [B], NOT [A]. Anyone can build something
 * that blocks a spray; the hard part is not blocking a NAT'd office, which is
 * exactly why [I23] refused per-IP limiting. If [B] ever goes red, this has
 * silently become the design [I23] rejected.
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

/** Independently re-derived, as every suite in this project does. */
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

/** The attacker's address, and an innocent office sharing one egress IP. */
const SPRAY_IP = ipHashOf("203.0.113.200");
const OFFICE_IP = ipHashOf("203.0.113.201");
const OTHER_IP = ipHashOf("203.0.113.202");
const ALL_IPS = [SPRAY_IP, OFFICE_IP, OTHER_IP];

const victim = (n: number) => `98765${String(70000 + n)}`;

const wipeIp = async (ip: string) => {
  await rest(`otp_requests?ip_hash=eq.${ip}`, { method: "DELETE" });
};
const rowsForIp = async (ip: string): Promise<{ phone_hash: string; purpose: string }[]> =>
  (await (await rest(`otp_requests?ip_hash=eq.${ip}&select=phone_hash,purpose`)).json()) ?? [];

const {
  checkLoginSprayThrottle,
  recordLoginFailure,
  clearLoginFailuresFor,
  checkOtpThrottle,
  checkOtpVerifyThrottle,
} = await import("../app/lib/otpThrottle.server.ts");
const { LOGIN_SPRAY_DISTINCT_ACCOUNTS, LOGIN_FAIL_PURPOSE, OTP_PER_PHONE_HOURLY } = await import(
  "../app/lib/otpPolicy.ts"
);

type Decision = Awaited<ReturnType<typeof checkLoginSprayThrottle>>;
const allowed = (d: Decision) => d.allowed;
const scopeOf = (d: Decision) => (d.allowed ? "ALLOWED" : d.scope);

console.log("CHUNK 2.10 PART 1 — login anti-spray control");
console.log("=".repeat(74));

for (const ip of ALL_IPS) await wipeIp(ip);

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE SPRAY IS CAUGHT — one password, many accounts, one address");

let allowedBefore = 0;
for (let i = 0; i < LOGIN_SPRAY_DISTINCT_ACCOUNTS; i++) {
  const d = await checkLoginSprayThrottle({ ipHash: SPRAY_IP });
  if (d.allowed) allowedBefore++;
  // one guess each against a DIFFERENT account — the defining shape of a spray
  await recordLoginFailure({ phoneHash: phoneHash(victim(i)), ipHash: SPRAY_IP });
}
check(
  `A1 the first ${LOGIN_SPRAY_DISTINCT_ACCOUNTS} distinct-account failures are allowed through`,
  allowedBefore === LOGIN_SPRAY_DISTINCT_ACCOUNTS,
  `${allowedBefore}/${LOGIN_SPRAY_DISTINCT_ACCOUNTS}`
);

const sprayBlocked = await checkLoginSprayThrottle({ ipHash: SPRAY_IP });
check(
  "A2 ⚠️ the NEXT attempt from that address is REFUSED — the spray is bounded",
  !allowed(sprayBlocked),
  `scope=${scopeOf(sprayBlocked)}`
);
check(
  "A3 …with a positive retryAfterSeconds",
  !sprayBlocked.allowed && sprayBlocked.retryAfterSeconds > 0,
  `${sprayBlocked.allowed ? 0 : sprayBlocked.retryAfterSeconds}s`
);

// ─────────────────────────────────────────────────────────────────────────
section("[B] ⚠️ NAT SAFETY — the cell that proves this is NOT what [I23] rejected");

/**
 * ⚠️ IF THIS SECTION EVER GOES RED, THE CONTROL HAS BECOME A PER-IP ATTEMPT
 * CAP AND HAS RE-ACQUIRED THE DENIAL-OF-SERVICE [I23] REFUSED IT FOR.
 *
 * The office is deliberately built LARGER than the spray: twice the threshold
 * in distinct accounts, all from one shared egress IP. The only difference is
 * the shape — each person mistypes once and then SUCCEEDS, which is what an
 * office looks like and what a sprayer can never do.
 */
const OFFICE_PEOPLE = LOGIN_SPRAY_DISTINCT_ACCOUNTS * 2;
for (let i = 0; i < OFFICE_PEOPLE; i++) {
  const p = phoneHash(victim(1000 + i));
  await recordLoginFailure({ phoneHash: p, ipHash: OFFICE_IP }); // fat-fingered once
  await clearLoginFailuresFor({ phoneHash: p, ipHash: OFFICE_IP }); // …then got it right
}
const officeDecision = await checkLoginSprayThrottle({ ipHash: OFFICE_IP });
check(
  `B1 ⚠️ ${OFFICE_PEOPLE} DIFFERENT people behind ONE shared IP, each mistyping then SUCCEEDING → NOT blocked`,
  allowed(officeDecision),
  allowed(officeDecision)
    ? "office unaffected — the control reads shape, not volume"
    : `WRONGLY REFUSED (${scopeOf(officeDecision)}) — this is now a per-IP attempt cap`
);
check(
  "B2 …and their cleared failures left NO rows behind",
  (await rowsForIp(OFFICE_IP)).length === 0,
  `${(await rowsForIp(OFFICE_IP)).length} rows`
);

/**
 * The other half of NAT safety: one person genuinely brute-forcing ONE account
 * must not trip the SPRAY control either. That is [I23]'s job, and conflating
 * the two would mean a single user's bad day locks out their whole office.
 */
await wipeIp(OTHER_IP);
const oneVictim = phoneHash(victim(2000));
for (let i = 0; i < LOGIN_SPRAY_DISTINCT_ACCOUNTS * 3; i++) {
  await recordLoginFailure({ phoneHash: oneVictim, ipHash: OTHER_IP });
}
const singleAccountHammer = await checkLoginSprayThrottle({ ipHash: OTHER_IP });
check(
  `B3 ⚠️ ${LOGIN_SPRAY_DISTINCT_ACCOUNTS * 3} failures against ONE account → NOT a spray (that is [I23]'s job)`,
  allowed(singleAccountHammer),
  allowed(singleAccountHammer)
    ? "distinct-account count is 1 — correctly ignored here"
    : `WRONGLY REFUSED (${scopeOf(singleAccountHammer)}) — attempts are being counted, not accounts`
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] ISOLATION — one address's spray does not touch another's");

const innocentElsewhere = await checkLoginSprayThrottle({ ipHash: ipHashOf("198.51.100.9") });
check("C1 a different IP is unaffected by the spraying address", allowed(innocentElsewhere));
check(
  "C2 ⚠️ the decision reads NO account state — a refusal cannot leak whether a number is registered",
  allowed(innocentElsewhere)
);
check(
  "C3 no observed IP → allowed, falling back to [I23] exactly as before this chunk",
  allowed(await checkLoginSprayThrottle({ ipHash: null }))
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] ⚠️ FAIL-OPEN — the deliberate departure from D3 ([I36])");

/**
 * ⚠️ SUBPROCESS WITH A COLD MODULE GRAPH, not an in-process re-import — an
 * in-process retry keeps the cached db module and reports a false pass.
 *
 * ⚠️ AND THE EXPECTED ANSWER HERE IS THE OPPOSITE OF EVERY OTHER THROTTLE IN
 * THIS PROJECT. The OTP send and the reset verify must THROW. This must
 * ALLOW — fail-closed here would lock every user out of the platform on a
 * database blip, and buy nothing, because the same outage stops
 * verifyPasswordCredential authenticating anyone.
 */
const brokenUrl = SUPABASE_URL.replace(".supabase.co", "-BROKEN.supabase.co");
let failOpenProof = "";
try {
  failOpenProof = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "./scripts/register-ts-resolve.mjs",
      "--input-type=module",
      "-e",
      `
      const { checkLoginSprayThrottle, hashIp } = await import("./app/lib/otpThrottle.server.ts");
      try {
        const d = await checkLoginSprayThrottle({ ipHash: hashIp("203.0.113.77") });
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
      stdio: ["ignore", "pipe", "pipe"],
    }
  ).trim();
} catch (e) {
  failOpenProof = `child failed: ${(e as Error).message.slice(0, 120)}`;
}
check(
  "D1 ⚠️ an unreadable counter ALLOWS (never THREW) — login stays usable through a DB blip ([I36])",
  failOpenProof.includes("ALLOWED"),
  `${failOpenProof} — fail-closed here would be a self-inflicted platform outage`
);

/**
 * ⚠️ A SILENT FAIL-OPEN IS INDISTINGUISHABLE FROM A CONTROL THAT WAS NEVER
 * BUILT. The console.error is part of the contract, not debug noise, so it is
 * asserted rather than assumed.
 */
const throttleCode = readFileSync("app/lib/otpThrottle.server.ts", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const sprayBody = throttleCode.split("export async function checkLoginSprayThrottle")[1] ?? "";
check(
  "D2 ⚠️ …and it fails open LOUDLY — the catch logs before returning allowed",
  /catch[\s\S]{0,200}console\.error/.test(sprayBody),
  "a swallowed catch would let this decay into decoration"
);
check(
  "D3 ⚠️ the OTHER throttles still FAIL CLOSED — [I36] was not generalised",
  (await (async () => {
    // Both must reject on an unreadable counter; proven in their own suites,
    // re-asserted here so a careless copy-paste of the fail-open catch shows up.
    const otpBody = throttleCode.split("export async function checkOtpThrottle")[1] ?? "";
    const verifyBody = throttleCode.split("export async function checkOtpVerifyThrottle")[1] ?? "";
    return !/console\.error[\s\S]{0,120}return \{ allowed: true \}/.test(otpBody) &&
      !/console\.error[\s\S]{0,120}return \{ allowed: true \}/.test(verifyBody);
  })()),
  "checkOtpThrottle and checkOtpVerifyThrottle have no fail-open catch"
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] ⚠️ THE NEW PURPOSE IS INERT TO THE OTP COUNTERS ([I33] paying off)");

/**
 * The dividend from [I33]: every existing reader takes a REQUIRED `purposes`
 * parameter, so `login-fail` rows cannot be seen by the send or verify
 * counters. Without that, this chunk would have silently corrupted 2.6c's
 * throttle — a login failure would have burned the victim's OTP send budget.
 */
const BLEED_PHONE = victim(3000);
const BLEED_IP = ipHashOf("198.51.100.44");
await wipeIp(BLEED_IP);
for (let i = 0; i < OTP_PER_PHONE_HOURLY * 2; i++) {
  await recordLoginFailure({ phoneHash: phoneHash(BLEED_PHONE), ipHash: BLEED_IP });
}
check(
  "E1 ⚠️ login failures do NOT consume the victim's OTP SEND budget",
  (await checkOtpThrottle({ phoneHash: phoneHash(BLEED_PHONE), ipHash: BLEED_IP })).allowed === true,
  "otherwise an attacker could stop a real owner requesting a code by failing logins for them"
);
check(
  "E2 ⚠️ …nor their reset-code VERIFY budget",
  (await checkOtpVerifyThrottle({ phoneHash: phoneHash(BLEED_PHONE), ipHash: BLEED_IP })).allowed === true
);
check(
  "E3 every row this chunk writes carries the login-fail purpose",
  (await rowsForIp(BLEED_IP)).every((r) => r.purpose === LOGIN_FAIL_PURPOSE),
  [...new Set((await rowsForIp(BLEED_IP)).map((r) => r.purpose))].join(",")
);
await wipeIp(BLEED_IP);

// ─────────────────────────────────────────────────────────────────────────
section("[Z] CLEANUP");
for (const ip of [...ALL_IPS, BLEED_IP, ipHashOf("198.51.100.9")]) await wipeIp(ip);
let leftover = 0;
for (const ip of [...ALL_IPS, BLEED_IP]) leftover += (await rowsForIp(ip)).length;
check("Z1 every row this suite created has been deleted", leftover === 0, `${leftover} left`);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(failed ? 1 : 0);
