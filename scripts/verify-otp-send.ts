/**
 * CHUNK 2.6c VERIFICATION — POST /api/auth/otp/send
 *
 * Run:  npm run dev        (in another terminal, must be `next dev`)
 *       node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-otp-send.ts
 *
 * ⚠️ THIS SUITE MUST NEVER RUN AGAINST A PRODUCTION BUILD, and section [0]
 * refuses to continue if it might be. Under `next dev` the server's
 * isProductionRuntime gate short-circuits sendOtpServerSide BEFORE the
 * provider, so no SMS can be sent no matter how many requests this makes.
 * Against `next start` the same requests would send REAL SMS to real numbers —
 * including numbers belonging to strangers. The guard is not a formality.
 *
 * ⚠️ WHAT LOCALHOST CAN AND CANNOT PROVE, stated up front because this project
 * has been burned by the opposite assumption:
 *   CAN  — the throttle arithmetic, the fail-closed behaviour, the enumeration
 *          contract at the HTTP layer, the hashing, the wiring, and that no
 *          raw phone number is ever stored.
 *   CANNOT — the provider leg. The browser's A10 bypass returns before the
 *          fetch, and the server's NODE_ENV gate returns before the provider,
 *          so the real Supabase send is unreachable from here. That is the
 *          production run, and the D4 timing residual is measured there.
 *
 * ⚠️ IT WRITES REAL ROWS to otp_requests and deletes them again in section
 * [Z]. It touches no other table, and it never writes to `users`,
 * `user_credentials` or `auth_identities`.
 *
 * Reads Supabase keys and SESSION_TOKEN_SECRET from .env.local at runtime;
 * embeds no secrets.
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";

// ── ENVIRONMENT ──────────────────────────────────────────────────────────

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1].trim();
};

const SUPABASE_URL = envVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = envVar("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = envVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const TOKEN_SECRET = envVar("SESSION_TOKEN_SECRET");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

/**
 * REGISTERED dev-bypass account (buyer Anita). Used as the "this number has an
 * account" side of every enumeration comparison.
 */
const REGISTERED = "9999999991";

/**
 * ⚠️ NUMBERS THAT MUST NOT BELONG TO A REAL PERSON. These are only ever used
 * against a dev server that cannot send, but they are chosen from a range that
 * is not in use rather than picked at random, because a copy-paste of this
 * suite against a production build must not text a stranger.
 */
const UNREGISTERED = "9876500001";
const THROTTLE_TARGET = "9876500002";
const HOURLY_TARGET = "9876500003";
const TIMING_TARGET = "9876500004";
const HASH_TARGET = "9876500005";

const ALL_TEST_PHONES = [
  REGISTERED,
  UNREGISTERED,
  THROTTLE_TARGET,
  HOURLY_TARGET,
  TIMING_TARGET,
  HASH_TARGET,
];

// ── THE HASH, RE-DERIVED INDEPENDENTLY ───────────────────────────────────

/**
 * ⚠️ RE-IMPLEMENTED HERE ON PURPOSE, not imported from the app.
 *
 * Importing hashPhone would make this suite agree with the implementation by
 * construction and prove nothing about it. Deriving the key from the same
 * documented inputs is what turns "the code computes some hash" into "the code
 * computes THIS hash" — and it is also how cleanup finds the rows to delete
 * without ever storing a phone number.
 */
const HASH_KEY = createHmac("sha256", TOKEN_SECRET)
  .update("fabverify/otp-throttle-hash/v1")
  .digest();

const phoneHash = (last10: string) =>
  createHmac("sha256", HASH_KEY).update(`phone:${last10}`).digest("hex");

/** Same independent re-derivation for the IP, mirroring hashIp's `ip:` label. */
const ipHash = (ip: string) =>
  createHmac("sha256", HASH_KEY).update(`ip:${ip}`).digest("hex");

// ── HARNESS ──────────────────────────────────────────────────────────────

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

function section(title: string) {
  console.log(`\n${title}`);
}

/** Service-role REST helper — the suite's independent view of the database. */
async function rest(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function rowsFor(last10: string): Promise<Array<Record<string, unknown>>> {
  const res = await rest(`otp_requests?phone_hash=eq.${phoneHash(last10)}&select=*`);
  return res.ok ? await res.json() : [];
}

async function deleteRowsFor(last10: string) {
  await rest(`otp_requests?phone_hash=eq.${phoneHash(last10)}`, { method: "DELETE" });
}

/** Exact row count for a table, via PostgREST's count=exact. */
const countOf = async (table: string) => {
  const res = await rest(`${table}?select=id`, { headers: { Prefer: "count=exact" } });
  const range = res.headers.get("content-range");
  return range ? Number(range.split("/")[1]) : -1;
};

type SendResponse = { status: number; body: string; retryAfter: string | null; ms: number };

async function send(
  phone: unknown,
  purpose?: string,
  extraHeaders: Record<string, string> = {}
): Promise<SendResponse> {
  const started = performance.now();
  const res = await fetch(`${BASE}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(purpose === undefined ? { phone } : { phone, purpose }),
  });
  const body = await res.text();
  return {
    status: res.status,
    body,
    retryAfter: res.headers.get("retry-after"),
    ms: performance.now() - started,
  };
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * ⚠️ COMMENT-STRIPPED SOURCE, and this is a direct lesson from chunk 2.8a.
 *
 * That chunk's assertions used `git grep`, which searches TRACKED files only,
 * and stayed green while the file they were checking was untracked. The same
 * class of mistake here would be asserting on RAW text: this chunk's own seam
 * DESCRIBES the call it removed ("this used to call supabase.auth.signInWithOtp
 * directly") in a comment, so a raw search would report the send is still
 * browser-direct. Assert on what executes, never on what is written near it.
 */
function codeOf(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

// ═════════════════════════════════════════════════════════════════════════

console.log("CHUNK 2.6c — OTP SEND HARDENING");
console.log(`   base: ${BASE}`);

// ─────────────────────────────────────────────────────────────────────────
section("[0] SAFETY GUARD — refuse to run where a real SMS could be sent");

/**
 * `x-dev-phone` is accepted by app/lib/auth.ts ONLY when NODE_ENV is
 * "development" — the same gate that short-circuits the provider send. A 200
 * here proves the server is `next dev`; anything else means it may be a
 * production build, where every send below would be real.
 */
/**
 * ⚠️ THE `?phone=` PARAM IS LOAD-BEARING, NOT DECORATION. GET /api/orders
 * returns 400 "phone is required" BEFORE it ever calls getVerifiedUser
 * (app/api/orders/route.ts:18-20), so a probe without it answers 400 on a dev
 * server and a production build alike — the guard would abort every run and
 * discriminate nothing. With the param the route reaches the auth check, which
 * is the only place the header is honoured: dev + header → 200, and a
 * production build ignores the header entirely → 401.
 */
const devProbe = await fetch(`${BASE}/api/orders?phone=${REGISTERED}`, {
  headers: { "x-dev-phone": REGISTERED },
});

const isDevServer = devProbe.status === 200;
check(
  "0.1 ⚠️ server is `next dev` (x-dev-phone accepted) — no real SMS is possible",
  isDevServer,
  `GET /api/orders → ${devProbe.status}`
);

if (!isDevServer) {
  console.log(
    "\n🛑 ABORTING BEFORE ANY SEND. The server did not accept the dev header, so it " +
      "may be a production build — running this suite there would send real SMS to " +
      "real numbers. Start `npm run dev` and re-run."
  );
  process.exit(1);
}

// Start from a clean slate so a previous run's rows cannot satisfy or break a
// limit here.
for (const phone of ALL_TEST_PHONES) await deleteRowsFor(phone);

/**
 * ⚠️ BLAST RADIUS IS MEASURED AS A DELTA, NOT AGAINST A PINNED NUMBER.
 *
 * Section [H] used to assert `user_credentials === 1 (the founder's password)`.
 * That literal was already false when this chunk was verified: a sibling suite
 * had deleted the row two days earlier with an unfiltered wipe, so [H] failed
 * while reporting nothing about THIS chunk — which is the only thing it exists
 * to check. Same class of mistake as F6's NULL and G3's latency budget.
 *
 * The property is "2.6c touches neither table", and a before/after comparison
 * states exactly that — at any row count, including zero.
 */
const BASELINE = {
  auth_identities: await countOf("auth_identities"),
  user_credentials: await countOf("user_credentials"),
};
console.log(
  `        baseline — auth_identities: ${BASELINE.auth_identities}, ` +
    `user_credentials: ${BASELINE.user_credentials}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE TABLE AND ITS RLS — proven from OUTSIDE the SQL editor");

const tableProbe = await rest("otp_requests?select=id&limit=1");
check(
  "A1 otp_requests exists and is readable with the service role",
  tableProbe.ok,
  `${tableProbe.status}`
);

if (!tableProbe.ok) {
  console.log(
    "\n🛑 The table is missing. Apply supabase/migrations/004_otp_requests.sql in the " +
      "Supabase SQL Editor (STEP 1), then re-run. Nothing below can pass without it."
  );
  process.exit(1);
}

/**
 * ⚠️ THE CONCLUSIVE RLS PROOF, and the only one that means anything. The SQL
 * Editor connects as a privileged role that BYPASSES RLS, so it can never
 * prove the anon key is denied; and an anon SELECT returning `200 []` on an
 * empty table proves nothing either. An anon INSERT returning 42501 does.
 * Same proof chunks 1.2 and 2.1 used for auth_identities and user_credentials.
 */
const anonInsert = await fetch(`${SUPABASE_URL}/rest/v1/otp_requests`, {
  method: "POST",
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ phone_hash: "anon-rls-probe-2-6-c" }),
});
const anonBody = await anonInsert.text();
check(
  "A2 ⚠️ anon INSERT is REFUSED (RLS deny-all) — 42501",
  anonInsert.status === 401 || anonInsert.status === 403 || anonBody.includes("42501"),
  `${anonInsert.status} ${anonBody.slice(0, 80)}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[W] WIRING — the browser really does go through our route");

const seamCode = codeOf("app/lib/authProvider.ts");

check(
  "W1 ⚠️ the SEND IS NO LONGER BROWSER-DIRECT — no signInWithOtp call in the client seam",
  !seamCode.includes("signInWithOtp"),
  "asserted against comment-stripped source, not raw text"
);
check(
  "W2 …and the seam posts to our route instead",
  seamCode.includes("/api/auth/otp/send"),
  "the 2.6a lesson: backend assertions can be green while nothing calls them"
);
check(
  "W3 the client seam still owns verifyOtp against the provider (UNTOUCHED path)",
  seamCode.includes("supabase.auth.verifyOtp"),
  "2.6c must not move verification — that is 2.8a's server-side gate, not this"
);

const routeCode = codeOf("app/api/auth/otp/send/route.ts");
check("W4 the route calls the server seam's send", routeCode.includes("sendOtpServerSide"));
check("W5 the route consults the throttle", routeCode.includes("checkOtpThrottle"));
check("W6 the route records the attempt", routeCode.includes("recordOtpAttempt"));

/**
 * ⚠️ THE DRIFT DETECTOR FOR D6. RESEND_SECONDS must be defined exactly once —
 * in the policy module — and both pages must read it from there. If a future
 * edit reintroduces a literal, the server cooldown and the client countdown
 * can disagree again, which is a 429 on a button the UI just enabled.
 */
for (const page of ["app/login/page.tsx", "app/signup/page.tsx"]) {
  const code = codeOf(page);
  check(
    `W7 ${page} takes the countdown from the shared policy, not a literal`,
    code.includes("OTP_RESEND_SECONDS") && !/RESEND_SECONDS\s*=\s*\d/.test(code)
  );
}

/**
 * The seam keeps its own inline copy of the phone-shape rule (see the note in
 * otpPolicy.ts). That is deliberate, so the agreement is asserted rather than
 * assumed — these are the boundaries where a divergence would actually bite.
 */
section("[W] …and the two phone-shape rules agree on every boundary");
const shapeCases: Array<[string, boolean]> = [
  ["9999999991", true],
  ["6000000000", true],
  ["7000000000", true],
  ["8000000000", true],
  ["5999999999", false],
  ["999999999", false],
];
for (const [candidate, expected] of shapeCases) {
  const routeVerdict = (await send(candidate, "login")).status !== 400;
  check(
    `W8 "${candidate}" → ${expected ? "accepted" : "rejected"} by the route's shape rule`,
    routeVerdict === expected
  );
  if (expected) await deleteRowsFor(candidate);
}

// ─────────────────────────────────────────────────────────────────────────
section("[B] SHAPE — 400 is for malformed input, never for an account fact");

const junkBody = await fetch(`${BASE}/api/auth/otp/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "not json at all",
});
check("B1 unparseable body → 400", junkBody.status === 400, `${junkBody.status}`);

check("B2 missing phone → 400", (await send(undefined, "login")).status === 400);
check("B3 non-string phone → 400", (await send(9999999991 as unknown, "login")).status === 400);
check("B4 empty phone → 400", (await send("", "login")).status === 400);
check("B5 nine digits → 400", (await send("999999999", "login")).status === 400);
check("B6 leading 5 → 400", (await send("5999999999", "login")).status === 400);

const wrongMethod = await fetch(`${BASE}/api/auth/otp/send`, { method: "GET" });
check("B7 GET → 405 (Next.js, no handler code)", wrongMethod.status === 405, `${wrongMethod.status}`);

// ─────────────────────────────────────────────────────────────────────────
section("[C] ⚠️ ENUMERATION — registered and unregistered must be identical");

await deleteRowsFor(REGISTERED);
await deleteRowsFor(UNREGISTERED);

const loginKnown = await send(REGISTERED, "login");
const loginUnknown = await send(UNREGISTERED, "login");

check(
  "C1 login: same STATUS for a registered and an unregistered number",
  loginKnown.status === loginUnknown.status,
  `${loginKnown.status} vs ${loginUnknown.status}`
);
check(
  "C2 login: BYTE-IDENTICAL body",
  loginKnown.body === loginUnknown.body,
  JSON.stringify(loginKnown.body)
);

await deleteRowsFor(REGISTERED);
await deleteRowsFor(UNREGISTERED);

const resetKnown = await send(REGISTERED, "reset");
const resetUnknown = await send(UNREGISTERED, "reset");

check(
  "C3 ⚠️ reset: same STATUS for a registered and an unregistered number",
  resetKnown.status === resetUnknown.status,
  `${resetKnown.status} vs ${resetUnknown.status}`
);
check(
  "C4 ⚠️ reset: BYTE-IDENTICAL body — the provider's refusal is swallowed",
  resetKnown.body === resetUnknown.body,
  JSON.stringify(resetKnown.body)
);
check(
  "C5 the accepted body carries NO account information at all",
  resetKnown.body === '{"ok":true}',
  resetKnown.body
);

/**
 * ⚠️ A ROW IS RECORDED FOR A NUMBER WITH NO ACCOUNT. This is the property the
 * table was built without a foreign key to have: an attacker probing unknown
 * numbers must be counted, or the throttle is blind to exactly the abuse it
 * exists to stop.
 */
check(
  "C6 ⚠️ an UNREGISTERED number is still counted (no FK to users, by design)",
  (await rowsFor(UNREGISTERED)).length > 0
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] THE THROTTLE — the limits actually bind");

await deleteRowsFor(THROTTLE_TARGET);

const first = await send(THROTTLE_TARGET, "login");
check("D1 first request is accepted", first.status === 200, `${first.status}`);

const second = await send(THROTTLE_TARGET, "login");
check("D2 ⚠️ an immediate second request is REFUSED (cooldown)", second.status === 429, `${second.status}`);
check("D3 …with a Retry-After header", second.retryAfter !== null, `Retry-After: ${second.retryAfter}`);

const secondJson = JSON.parse(second.body) as { retryAfterSeconds?: number; message?: string };
check(
  "D4 …and a positive retryAfterSeconds the UI can count down",
  typeof secondJson.retryAfterSeconds === "number" && secondJson.retryAfterSeconds > 0,
  `${secondJson.retryAfterSeconds}s`
);
check(
  "D5 a refused request records NOTHING — the counter cannot be advanced by hammering",
  (await rowsFor(THROTTLE_TARGET)).length === 1,
  `${(await rowsFor(THROTTLE_TARGET)).length} row(s)`
);

/**
 * ⚠️ NO LITERAL THRESHOLD IS PINNED HERE, and that is deliberate — chunk 2.7
 * recorded that pinning "exactly 2 round trips" turned a security property
 * into a change-detector that a correct future chunk has to edit, which is how
 * a real assertion gets weakened by someone in a hurry. The property under test
 * is "the hourly cap binds", so the suite reads the cap from the policy module
 * and drives to it.
 */
const { OTP_PER_PHONE_HOURLY, OTP_RESEND_SECONDS, OTP_RESET_FLOOR_MS } = await import(
  "../app/lib/otpPolicy.ts"
);

check(
  "D6 the client countdown and the server cooldown are the SAME constant",
  typeof OTP_RESEND_SECONDS === "number" && OTP_RESEND_SECONDS > 0,
  `${OTP_RESEND_SECONDS}s`
);

/**
 * Drive the hourly cap. The cooldown is bypassed by BACKDATING the recorded
 * rows rather than by waiting 45s per request — the rows are what the throttle
 * reads, so this exercises the real arithmetic, just without the wall-clock
 * cost. Each row is placed far enough back to clear the cooldown and well
 * inside the hour.
 */
await deleteRowsFor(HOURLY_TARGET);
const hash = phoneHash(HOURLY_TARGET);
for (let i = 0; i < OTP_PER_PHONE_HOURLY; i++) {
  await rest("otp_requests", {
    method: "POST",
    body: JSON.stringify({
      phone_hash: hash,
      purpose: "login",
      // Spread across the hour, all older than the cooldown.
      created_at: new Date(Date.now() - (i + 1) * 5 * 60 * 1000).toISOString(),
    }),
  });
}

const overHourly = await send(HOURLY_TARGET, "login");
check(
  "D7 ⚠️ the HOURLY per-number cap binds once it is reached",
  overHourly.status === 429,
  `${OTP_PER_PHONE_HOURLY} prior requests → ${overHourly.status}`
);

/**
 * ⚠️ THE MESSAGE MUST NOT TRIP THE WHATSAPP FALLBACK. The browser seam maps a
 * throttle refusal onto `reason: "error"`, and both pages then run
 * looksLikeProviderProblem() over the message as a BACKUP check. If this
 * string ever contained "sms", "provider" or "not configured", a throttled
 * user would be shown the WhatsApp/waitlist dead-end instead of "wait and
 * retry" — a real regression, reachable by an innocent copy edit.
 */
const throttleMessage = (JSON.parse(overHourly.body) as { message?: string }).message ?? "";
const { looksLikeProviderProblem } = await import("../app/lib/providerFallback.ts");
check(
  "D8 ⚠️ the throttle message does NOT look like a provider problem",
  !looksLikeProviderProblem(throttleMessage),
  JSON.stringify(throttleMessage)
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] ⚠️ FAIL-CLOSED — an unreadable counter must never allow a send");

/**
 * ⚠️ SUBPROCESS WITH A COLD MODULE GRAPH. An in-process re-import keeps the
 * cached db module and reports a false pass — learned three times in M10, most
 * recently in 2.8a. The child gets a valid URL with an UNRESOLVABLE hostname:
 * a malformed URL would make createClient throw at module load and prove
 * nothing about the outage path.
 */
const brokenUrl = SUPABASE_URL.replace(".supabase.co", "-BROKEN.supabase.co");
let failClosedProof = "";
try {
  failClosedProof = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "./scripts/register-ts-resolve.mjs",
      // ⚠️ REQUIRED: `node -e` defaults to CommonJS, where the top-level await
      // below is a syntax error — the child would fail for a reason that has
      // nothing to do with what is being tested, and the assertion would
      // "fail" without ever exercising the outage path.
      "--input-type=module",
      "-e",
      `
      const { checkOtpThrottle, hashPhone } = await import("./app/lib/otpThrottle.server.ts");
      try {
        const decision = await checkOtpThrottle({ phoneHash: hashPhone("9999999999"), ipHash: null });
        console.log(decision.allowed ? "ALLOWED" : "REFUSED");
      } catch {
        console.log("THREW");
      }
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
} catch (error) {
  failClosedProof = `child failed: ${(error as Error).message.slice(0, 120)}`;
}

check(
  "E1 ⚠️ the throttle THROWS when the counter is unreadable (never 'ALLOWED')",
  failClosedProof.includes("THREW"),
  failClosedProof
);

/**
 * ⚠️ THE SECRET FAILS CLOSED TOO. A missing SESSION_TOKEN_SECRET must stop the
 * module loading rather than fall back to a default — [I19]'s doctrine, which
 * exists because a published default key is a hole, not a degraded client.
 */
let secretProof = "";
try {
  secretProof = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "./scripts/register-ts-resolve.mjs",
      // ⚠️ REQUIRED: `node -e` defaults to CommonJS, where the top-level await
      // below is a syntax error — the child would fail for a reason that has
      // nothing to do with what is being tested, and the assertion would
      // "fail" without ever exercising the outage path.
      "--input-type=module",
      "-e",
      `
      try {
        await import("./app/lib/otpThrottle.server.ts");
        console.log("LOADED");
      } catch {
        console.log("REFUSED");
      }
      `,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, SESSION_TOKEN_SECRET: "" },
    }
  ).trim();
} catch (error) {
  secretProof = `child failed: ${(error as Error).message.slice(0, 120)}`;
}

check(
  "E2 ⚠️ the module REFUSES TO LOAD without SESSION_TOKEN_SECRET (no default key)",
  secretProof.includes("REFUSED"),
  secretProof
);

// ─────────────────────────────────────────────────────────────────────────
section("[F] THE STORED ROW — a counter, not a PII pile");

await deleteRowsFor(HASH_TARGET);
await send(HASH_TARGET, "login");
const stored = await rowsFor(HASH_TARGET);

check("F1 exactly one row was recorded", stored.length === 1, `${stored.length}`);

const rowText = JSON.stringify(stored);
check(
  "F2 ⚠️ the RAW PHONE NUMBER appears NOWHERE in the stored row",
  !rowText.includes(HASH_TARGET),
  "the whole point of hashing before the data layer"
);
check(
  "F3 the row carries a keyed hash, not a bare digest of the number",
  stored[0]?.phone_hash === phoneHash(HASH_TARGET) &&
    stored[0]?.phone_hash !==
      createHmac("sha256", "").update(`phone:${HASH_TARGET}`).digest("hex"),
  "independently re-derived from SESSION_TOKEN_SECRET"
);
check(
  "F4 different numbers hash differently (no bucket collision)",
  phoneHash(HASH_TARGET) !== phoneHash(TIMING_TARGET)
);
check("F5 the purpose is recorded", stored[0]?.purpose === "login", String(stored[0]?.purpose));
/**
 * ⚠️ THE SECURITY PROPERTY, NOT A LITERAL ABOUT ONE ENVIRONMENT.
 *
 * This assertion used to read "no IP header on localhost → ip_hash is NULL".
 * That premise was stale rather than wrong-headed: Next.js 16's dev server
 * DOES populate `x-forwarded-for` (with `::1`), so the route correctly hashed
 * an IP it genuinely observed and the check failed on working code. Pinning a
 * literal about the environment into a security assertion is the same mistake
 * [I26] recorded for timing numbers — the environment moves and the assertion
 * turns into a false-failure generator.
 *
 * What actually matters is the property the NULL branch exists to protect:
 * a stored ip_hash is either genuinely absent, or the keyed hash of the IP
 * that was really observed — NEVER a constant that every IP-less caller shares
 * and throttles each other through.
 */
const observedIpHash = stored[0]?.ip_hash;
check(
  "F6 ip_hash is NULL, or the keyed hash of an OBSERVED ip — never a shared sentinel",
  observedIpHash === null ||
    (typeof observedIpHash === "string" && /^[0-9a-f]{64}$/.test(observedIpHash)),
  observedIpHash === null ? "null (no IP observed)" : String(observedIpHash).slice(0, 16) + "…"
);

/**
 * The positive half: feed the route an IP we choose and prove the stored value
 * is the keyed hash OF THAT IP. A sentinel bucket cannot pass this — it would
 * be the same string whatever we sent — and neither could a raw or unkeyed
 * value.
 */
const IP_A = "203.0.113.7";
const IP_B = "203.0.113.8";
await deleteRowsFor(HASH_TARGET);
await send(HASH_TARGET, "login", { "x-forwarded-for": IP_A });
const ipRowA = (await rowsFor(HASH_TARGET))[0];

check(
  "F7 the stored ip_hash is the KEYED hash of the observed IP — re-derived independently",
  ipRowA?.ip_hash === ipHash(IP_A),
  "matches HMAC(key, `ip:` + the IP we sent)"
);
check(
  "F8 ⚠️ the RAW IP appears nowhere in the row (hashed, like the phone)",
  !JSON.stringify(ipRowA).includes(IP_A)
);

await deleteRowsFor(HASH_TARGET);
await send(HASH_TARGET, "login", { "x-forwarded-for": IP_B });
const ipRowB = (await rowsFor(HASH_TARGET))[0];

check(
  "F9 ⚠️ a DIFFERENT IP lands in a DIFFERENT bucket — no shared sentinel",
  ipRowB?.ip_hash === ipHash(IP_B) && ipRowB?.ip_hash !== ipRowA?.ip_hash
);

// ─────────────────────────────────────────────────────────────────────────
section("[G] ⚠️ D4 TIMING — measured, not assumed");

/**
 * ⚠️ 2.5a's TECHNIQUE, AND ITS LIMIT. Wall-clock medians against Supabase
 * Singapore are useless for micro-differences; what is measured here is the
 * LOCAL route latency, where the network leg is loopback and the provider leg
 * does not run at all.
 *
 * So this section proves ONE half of D4 — that everything WE control is
 * uniform, and that the reset floor is really applied. The other half, the
 * provider's own send-vs-refuse difference, CANNOT be measured from localhost
 * and is the production run's job. Recorded as outstanding rather than
 * implied: see the reset suite's [G] section.
 */
/**
 * ⚠️ NINE, NOT FIVE. A five-sample median sits one unlucky outlier away from
 * jumping a whole round trip, which is how G2 and G4 both produced deltas that
 * looked like signal and were not. Nine costs about a minute and makes the
 * medians stable enough that the jitter bar below means something.
 */
const SAMPLES = 9;

async function timeSeries(phone: string, purpose: string): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    await deleteRowsFor(phone);
    times.push((await send(phone, purpose)).ms);
  }
  await deleteRowsFor(phone);
  return times;
}

const resetKnownTimes = await timeSeries(REGISTERED, "reset");
const resetUnknownTimes = await timeSeries(TIMING_TARGET, "reset");
const loginKnownTimes = await timeSeries(REGISTERED, "login");
const loginUnknownTimes = await timeSeries(TIMING_TARGET, "login");

const mResetKnown = median(resetKnownTimes);
const mResetUnknown = median(resetUnknownTimes);
const mLoginKnown = median(loginKnownTimes);
const mLoginUnknown = median(loginUnknownTimes);

console.log(`        reset  registered median: ${mResetKnown.toFixed(1)} ms`);
console.log(`        reset  unknown    median: ${mResetUnknown.toFixed(1)} ms`);
console.log(`        login  registered median: ${mLoginKnown.toFixed(1)} ms`);
console.log(`        login  unknown    median: ${mLoginUnknown.toFixed(1)} ms`);
console.log(`        floor: ${OTP_RESET_FLOOR_MS} ms`);

check(
  "G1 ⚠️ every reset response is held to the floor",
  Math.min(...resetKnownTimes, ...resetUnknownTimes) >= OTP_RESET_FLOOR_MS,
  `fastest reset: ${Math.min(...resetKnownTimes, ...resetUnknownTimes).toFixed(1)} ms`
);
/**
 * ⚠️ THE THRESHOLD IS MEASURED, NOT PINNED — [I26]'s lesson applied to timing.
 *
 * This read `< 100` and failed on a delta of ~208 ms. That 208 ms is NOT an
 * existence signal: the control run (two numbers that BOTH have no account)
 * produced the same ~208 ms, and the sign flips between runs. It is a bimodal
 * Supabase round trip — the link to Singapore delivers ~2.5 s or ~2.7 s, and
 * with a handful of samples the median lands on either mode.
 *
 * A hardcoded millisecond budget in a security assertion is a false-failure
 * generator: it encodes one machine's network on one day. So the bar is the
 * run's OWN observed jitter. A between-group difference smaller than the
 * within-group spread carries no information about which group you are in —
 * which is exactly the property being claimed.
 *
 * ⚠️ THIS CAN ONLY EVER BE A SMOKE TEST, and G4 in the reset suite says so.
 * Localhost never calls the provider, so the leg that could actually differ by
 * account existence does not run here at all.
 */
const spread = (v: number[]) => Math.max(...v) - Math.min(...v);
const resetJitter = Math.max(spread(resetKnownTimes), spread(resetUnknownTimes));
const resetDelta = Math.abs(mResetKnown - mResetUnknown);

console.log(`        within-group jitter (the bar): ${resetJitter.toFixed(1)} ms`);

check(
  "G2 ⚠️ registered/unknown reset delta is within this run's own jitter (no signal)",
  resetDelta <= resetJitter,
  `delta ${resetDelta.toFixed(1)} ms vs jitter ${resetJitter.toFixed(1)} ms`
);

/**
 * ⚠️ ASSERTS THE CODE PATH, NOT A LATENCY NUMBER.
 *
 * This read `mLoginKnown < OTP_RESET_FLOOR_MS` and failed at 2717 ms — not
 * because login was floored, but because the real work (up to five sequential
 * Supabase round trips) is SLOWER than the 2000 ms floor on this machine. The
 * floor is currently inert locally; a latency comparison therefore tests the
 * network, not the branch.
 *
 * The claim worth defending is structural: the floor is applied to `reset` and
 * to nothing else. That is true or false in the source, at any latency.
 */
check(
  "G3 login/signup are NOT floored — the floor early-returns for every non-reset purpose",
  /purpose\s*!==\s*["']reset["']\s*\)\s*return\s+response/.test(routeCode),
  "asserted on comment-stripped source, not on a latency number"
);
/**
 * ⚠️ SAME SELF-CALIBRATING BAR AS G2, AND FOR A SHARPER REASON.
 *
 * G4 measures the UNFLOORED path, so unlike the reset cells it has no floor
 * absorbing round-trip variance — it is exposed to the full jitter of the link
 * and is the assertion most likely to false-fail on a fixed budget. It did:
 * `< 100` failed on a 228 ms delta the day the network happened to be fast
 * enough for the floor to start binding.
 *
 * A control run settles what that 228 ms was: on the login path, registered vs
 * unknown differed by 15 ms while two numbers that BOTH have no account
 * differed by 22 ms, against a within-group spread of 485 ms. The delta is a
 * five-sample median moving inside the noise, not an account fact — and it
 * cannot be one, because nothing on this path reads `users`:
 * sendOtpServerSide returns at the isProductionRuntime gate before the
 * provider, for registered and unknown numbers alike.
 */
const loginJitter = Math.max(spread(loginKnownTimes), spread(loginUnknownTimes));
const loginDelta = Math.abs(mLoginKnown - mLoginUnknown);

check(
  "G4 login: registered/unknown delta is within this run's own jitter (no signal)",
  loginDelta <= loginJitter,
  `delta ${loginDelta.toFixed(1)} ms vs jitter ${loginJitter.toFixed(1)} ms`
);

// ─────────────────────────────────────────────────────────────────────────
section("[H] BLAST RADIUS — the tables this chunk must not touch");

const authIdentitiesAfter = await countOf("auth_identities");
const userCredentialsAfter = await countOf("user_credentials");

check(
  "H1 auth_identities is untouched by this chunk",
  authIdentitiesAfter === BASELINE.auth_identities,
  `${BASELINE.auth_identities} → ${authIdentitiesAfter}`
);
check(
  "H2 user_credentials is untouched by this chunk",
  userCredentialsAfter === BASELINE.user_credentials,
  `${BASELINE.user_credentials} → ${userCredentialsAfter}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[Z] CLEANUP");

for (const phone of ALL_TEST_PHONES) await deleteRowsFor(phone);
for (const [candidate] of shapeCases) await deleteRowsFor(candidate);

let leftover = 0;
for (const phone of ALL_TEST_PHONES) leftover += (await rowsFor(phone)).length;
check("Z1 every row this suite created has been deleted", leftover === 0, `${leftover} left`);

// ═════════════════════════════════════════════════════════════════════════

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\nFAILURES:");
  for (const name of failures) console.log(`  · ${name}`);
}
process.exit(failed > 0 ? 1 : 0);
