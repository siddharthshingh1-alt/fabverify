/**
 * CHUNK 2.7 VERIFICATION — per-account lockout on verifyPasswordCredential()
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-password-lockout.ts
 *
 * ⚠️ NO DEV SERVER, NO HTTP, NO LOGIN WIRING — deliberately, and it is the
 * point of the chunk's sequencing. The function under test still has ZERO
 * route importers ([I18]); lockout is being built BEFORE 2.6 opens the HTTP
 * surface, not after. So this suite imports the real seam and calls it
 * in-process, the same way chunk 2.5a's did.
 *
 * ⚠️ THE TWO FLAGS: `--conditions=react-server` neutralises the `server-only`
 * guard on the hashing module; `--import ./scripts/register-ts-resolve.mjs`
 * teaches Node the extensionless relative imports the Next.js bundler already
 * understands.
 *
 * ── WHAT THIS SUITE IS ACTUALLY FOR ──────────────────────────────────────
 * Two properties, neither of which shows up in functional testing:
 *
 *   1. THE LOCKOUT ACTUALLY STOPS ENTRY. A correct password must be refused
 *      during the cooldown. A lockout that counts perfectly and then lets the
 *      right password through is decorative.
 *
 *   2. IT DOES NOT BECOME AN ENUMERATION ORACLE. A prober must not be able to
 *      tell a locked account from a wrong password from a phone number that
 *      holds no account — in VALUE or in COST. The natural implementation
 *      (check the lock, return early) breaks this by answering FASTER for
 *      locked accounts, and an attacker can create that condition on demand.
 *      Sections [C] and [D] exist for exactly this.
 *
 * Writes real credentials for two dev-bypass accounts and deletes them.
 * Does NOT touch the artisan account (9654324268) — reserved single-use test
 * condition for item 1's outstanding production session.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1].trim();
};

// db.ts reads these at module load, so they must be set before the import.
// ⚠️ `||=`, NOT `=` — the outage subprocess in section [I] is launched with a
// deliberately broken host, and a plain assignment would overwrite it with the
// working value, making the outage test silently verify nothing.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= envVar("NEXT_PUBLIC_SUPABASE_URL");
process.env.SUPABASE_SERVICE_ROLE_KEY ||= envVar("SUPABASE_SERVICE_ROLE_KEY");
// ⚠️ REQUIRED SINCE CHUNK 2.5b, even though this suite issues no tokens.
// authProvider.server now imports sessionToken.server, which THROWS at module
// load when the signing secret is absent (D12 — a published default signing
// key is total forgery, not a degraded client). So every consumer of the auth
// seam now needs it present, including tests that never mint a token.
process.env.SESSION_TOKEN_SECRET ||= envVar("SESSION_TOKEN_SECRET");

const SUPABASE_URL = envVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = envVar("SUPABASE_SERVICE_ROLE_KEY");

const BUYER = { phone: "9999999991", id: "5b616a97-9d5d-4fd4-be4e-8fe7acecd613" };
const MAKER = { phone: "9999999992", id: "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33" };

const SHARED_PASSWORD = "orchid-lantern-monsoon-77";
const WRONG_PASSWORD = "granite-harbour-velvet-08";

// A well-formed Indian mobile that holds no account. Never dialled.
const ABSENT_PHONE = "9111100001";

const THRESHOLD = 10;
const LOCKOUT_MINUTES = 15;

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
  const response = await realFetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const deleteCredentials = (userId: string) =>
  sql(`user_credentials?user_id=eq.${userId}`, { method: "DELETE" });

/** Read the lockout columns straight from the table, bypassing the seam. */
async function credentialRow(userId: string) {
  const rows = await sql(
    `user_credentials?user_id=eq.${userId}&select=failed_attempts,last_failed_at,locked_until,updated_at`
  );
  return rows?.[0] ?? null;
}

/** Force lockout state directly, so expiry can be tested without waiting. */
const forceState = (userId: string, patch: Record<string, unknown>) =>
  sql(`user_credentials?user_id=eq.${userId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

// ── FETCH INSTRUMENTATION ────────────────────────────────────────────────
//
// ⚠️ INSTALLED BEFORE THE APP MODULES ARE IMPORTED: supabase-js may capture a
// fetch reference at module load, and a patch applied afterwards would observe
// nothing while every assertion still "passed".
//
// ⚠️ WHY NOT WALL-CLOCK MEDIANS — chunk 2.5a proved they are worthless here.
// Against Supabase Singapore a round trip is hundreds of milliseconds with
// hundreds more of jitter, which swamps the ~45 ms argon2 signal completely:
// the first version of 2.5a's suite reported "wrong password" as SLOWER than
// "correct password", two paths doing byte-identical work. Splitting each call
// into NETWORK and LOCAL time makes both leak classes measurable directly:
//   · a missing database round trip → fetchCount differs (exact, integer)
//   · a skipped argon2 verify       → localMs collapses (~45 ms → ~0 ms)
let fetchCount = 0;
let fetchMs = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async function instrumented(...args: Parameters<typeof realFetch>) {
  fetchCount++;
  const start = performance.now();
  try {
    return await realFetch(...args);
  } finally {
    fetchMs += performance.now() - start;
  }
};

async function measure(run: () => Promise<unknown>) {
  fetchCount = 0;
  fetchMs = 0;
  const start = performance.now();
  const value = await run();
  const totalMs = performance.now() - start;
  return { value, totalMs, fetchCount, fetchMs, localMs: totalMs - fetchMs };
}

console.log("\nCHUNK 2.7 — per-account lockout (no login wiring)");
console.log("=".repeat(74));

const { setPassword, verifyPasswordCredential } = await import(
  "../app/lib/authProvider.server.ts"
);

type Result = Awaited<ReturnType<typeof verifyPasswordCredential>>;

// ── OUTAGE CHILD MODE ────────────────────────────────────────────────────
// See section [I]. An in-process re-import CANNOT test this: a cache-busting
// query string on authProvider.server.ts still resolves its `./db` specifier
// to the already-cached module holding a working client. Chunk 2.5a's first
// version did exactly that and reported a false pass.
if (process.argv.includes("--outage-child")) {
  try {
    const result = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
    console.log(`CHILD:returned:${JSON.stringify(result)}`);
  } catch {
    console.log("CHILD:threw");
  }
  process.exit(0);
}

/** Reset an account to a clean, unlocked credential. */
async function reseed(userId: string) {
  await deleteCredentials(userId);
  const seeded = await setPassword(userId, SHARED_PASSWORD);
  if (!seeded.ok) throw new Error(`could not seed ${userId}`);
}

// ── SETUP ────────────────────────────────────────────────────────────────
await reseed(BUYER.id);
await reseed(MAKER.id);
// MAKER keeps its password for most of the suite; section [C] removes it to
// create the "account exists, no password set" case.

const seedRow = await credentialRow(BUYER.id);
check("SETUP credential seeded and counter starts at zero", seedRow?.failed_attempts === 0);
check("SETUP …and starts unlocked", seedRow?.locked_until === null);

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE THRESHOLD — and the off-by-one in the direction real users hit");

for (let i = 1; i <= THRESHOLD - 1; i++) {
  await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
}
const after9 = await credentialRow(BUYER.id);
check(
  `A1 ${THRESHOLD - 1} consecutive failures increment the counter exactly`,
  after9?.failed_attempts === THRESHOLD - 1,
  `failed_attempts = ${after9?.failed_attempts}`
);
check(
  `A2 …and do NOT lock the account (${THRESHOLD - 1} < ${THRESHOLD})`,
  after9?.locked_until === null
);

// ⚠️ THE MOST IMPORTANT TEST IN SECTION [A]. An off-by-one that locks at 9 is
// invisible to an attacker and hits only real users who mistyped.
const a3 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check(
  `A3 ⚠️ after ${THRESHOLD - 1} failures the CORRECT password STILL WORKS`,
  a3.ok === true,
  a3.ok ? "ok:true" : `refused: ${JSON.stringify(a3)}`
);

await reseed(BUYER.id);
for (let i = 1; i <= THRESHOLD; i++) {
  await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
}
const after10 = await credentialRow(BUYER.id);
check(
  `A4 the ${THRESHOLD}th failure LOCKS the account`,
  after10?.locked_until !== null,
  `locked_until = ${after10?.locked_until}`
);
check(
  `A5 …with the counter at exactly ${THRESHOLD}`,
  after10?.failed_attempts === THRESHOLD,
  `failed_attempts = ${after10?.failed_attempts}`
);
const lockMs = Date.parse(after10?.locked_until ?? "") - Date.now();
check(
  `A6 …and a cooldown of ~${LOCKOUT_MINUTES} minutes`,
  lockMs > (LOCKOUT_MINUTES - 1) * 60_000 && lockMs <= LOCKOUT_MINUTES * 60_000 + 5_000,
  `${Math.round(lockMs / 1000)}s remaining`
);
check("A7 last_failed_at was recorded", after10?.last_failed_at !== null);

// ─────────────────────────────────────────────────────────────────────────
section("[B] THE LOCK ACTUALLY STOPS ENTRY — the 11th attempt");

// ⚠️ THE CENTRAL SECURITY CLAIM OF THE CHUNK. Everything else can be right and
// this still be wrong, and if it is wrong the lockout is decorative.
const b1 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check(
  "B1 ⚠️ during lockout the CORRECT password is REJECTED",
  b1.ok === false,
  b1.ok ? "LET IN — brute force is not stopped" : "refused"
);
check(
  "B2 …and the proven owner is TOLD they are locked, not that they are wrong",
  b1.ok === false && b1.reason === "account-locked",
  b1.ok === false ? b1.reason : "n/a"
);
check(
  "B3 …with a usable wait time",
  b1.ok === false &&
    b1.reason === "account-locked" &&
    b1.retryAfterSeconds > 0 &&
    b1.retryAfterSeconds <= LOCKOUT_MINUTES * 60,
  b1.ok === false && b1.reason === "account-locked" ? `${b1.retryAfterSeconds}s` : "n/a"
);

const lockedAt = await credentialRow(BUYER.id);
for (let i = 0; i < 5; i++) {
  await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
  await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
}
const afterHammer = await credentialRow(BUYER.id);
check(
  "B4 ⚠️ hammering a locked account does NOT extend the cooldown",
  afterHammer?.locked_until === lockedAt?.locked_until,
  `${lockedAt?.locked_until} → ${afterHammer?.locked_until}`
);
check(
  "B5 …and does NOT climb the counter (the user waits exactly what they were told)",
  afterHammer?.failed_attempts === THRESHOLD,
  `failed_attempts = ${afterHammer?.failed_attempts}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] ENUMERATION — a prober must learn NOTHING (the [I17] guarantee)");

// BUYER is locked. MAKER loses its credential: "account exists, no password".
await deleteCredentials(MAKER.id);

const probes: Record<string, Result> = {
  "unknown phone, wrong password": await verifyPasswordCredential(ABSENT_PHONE, WRONG_PASSWORD),
  "unknown phone, the real password": await verifyPasswordCredential(
    ABSENT_PHONE,
    SHARED_PASSWORD
  ),
  "real account, no password set": await verifyPasswordCredential(MAKER.phone, SHARED_PASSWORD),
  "LOCKED account, wrong password": await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD),
  "malformed phone": await verifyPasswordCredential("not-a-phone", WRONG_PASSWORD),
  "non-string password": await verifyPasswordCredential(BUYER.phone, { evil: true }),
};

const shapes = new Set(Object.values(probes).map((r) => JSON.stringify(r)));
check(
  "C1 ⚠️ every prober-reachable outcome is the IDENTICAL value",
  shapes.size === 1,
  `${shapes.size} distinct shape(s): ${[...shapes].join(" | ")}`
);
check(
  "C2 …and that value is the generic failure, never the locked one",
  [...shapes][0] === JSON.stringify({ ok: false, reason: "invalid-credentials" }),
  [...shapes][0]
);
for (const [label, result] of Object.entries(probes)) {
  check(
    `C3 ${label} → no hint the account exists or is locked`,
    result.ok === false && result.reason === "invalid-credentials"
  );
}

// ⚠️ THE INFORMATIVE RESPONSE MUST BE UNREACHABLE WITHOUT THE PASSWORD. Not
// "is not currently returned" — unreachable. Fuzzed, because a single wrong
// password proves very little about a branch.
let leaked = 0;
for (let i = 0; i < 12; i++) {
  const r = await verifyPasswordCredential(BUYER.phone, `guess-${i}-${Math.random()}`);
  if (r.ok === false && r.reason === "account-locked") leaked++;
}
check(
  "C4 ⚠️ 12 wrong guesses against the LOCKED account never reveal the lock",
  leaked === 0,
  `${leaked} leak(s)`
);

// The type itself is the control — a third reason would reopen the oracle.
const seamSource = readFileSync("app/lib/authProvider.server.ts", "utf8");
const reasons = [
  ...seamSource
    .slice(
      seamSource.indexOf("export type PasswordVerification"),
      seamSource.indexOf("const INVALID")
    )
    .matchAll(/reason: "([a-z-]+)"/g),
].map((m) => m[1]);
check(
  "C5 PasswordVerification still admits exactly TWO failure reasons",
  reasons.length === 2 &&
    reasons.includes("invalid-credentials") &&
    reasons.includes("account-locked"),
  reasons.join(", ")
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] COST — the leak the early-return implementation would have created");

// ⚠️ THIS IS THE SECTION THAT CATCHES `if (isLocked) return INVALID` PLACED
// ABOVE THE HASH. That version passes every test in [A], [B] and [C] and is
// still a worse enumeration oracle than the one 2.5a closed: it answers
// locked accounts ~45 ms faster, and an attacker manufactures the condition
// by hammering any number ten times.
await reseed(MAKER.id);

const paths = {
  "unknown phone": () => verifyPasswordCredential(ABSENT_PHONE, WRONG_PASSWORD),
  "wrong password, unlocked": () => verifyPasswordCredential(MAKER.phone, WRONG_PASSWORD),
  "correct password, unlocked": () => verifyPasswordCredential(MAKER.phone, SHARED_PASSWORD),
  "wrong password, LOCKED": () => verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD),
  "correct password, LOCKED": () => verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD),
};

const measured: Record<string, { fetchCount: number; localMs: number }> = {};
for (const [label, run] of Object.entries(paths)) {
  // Two runs, keep the faster local time — the first pays any lazy warm-up.
  const a = await measure(run);
  const b = await measure(run);
  measured[label] = {
    fetchCount: b.fetchCount,
    localMs: Math.min(a.localMs, b.localMs),
  };
  console.log(
    `        ${label.padEnd(28)} ${measured[label].fetchCount} round trips · ` +
      `${measured[label].localMs.toFixed(1)} ms local`
  );
}

const counts = new Set(Object.values(measured).map((m) => m.fetchCount));
check(
  "D1 ⚠️ every path costs the SAME number of database round trips",
  counts.size === 1,
  `counts: ${[...counts].join(", ")}`
);

const locals = Object.values(measured).map((m) => m.localMs);
check(
  "D2 ⚠️ the LOCKED paths still pay the full argon2id cost (no early return)",
  Math.min(...locals) > 20,
  `slowest ${Math.max(...locals).toFixed(1)} ms · fastest ${Math.min(...locals).toFixed(1)} ms`
);
check(
  "D3 …and no path is an outlier that would stand out of the noise",
  Math.max(...locals) - Math.min(...locals) < Math.min(...locals),
  `spread ${(Math.max(...locals) - Math.min(...locals)).toFixed(1)} ms`
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] AUTO-EXPIRY — the user just waits, nobody unlocks anything");

// Backdated rather than waited: a 15-minute sleep in a test suite is a suite
// nobody runs.
await forceState(BUYER.id, {
  locked_until: new Date(Date.now() - 1000).toISOString(),
});
const e1 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check(
  "E1 ⚠️ once the cooldown expires, the correct password works again",
  e1.ok === true,
  e1.ok ? "ok:true" : JSON.stringify(e1)
);
const afterExpiry = await credentialRow(BUYER.id);
check("E2 …and the counter is cleared", afterExpiry?.failed_attempts === 0);
check("E3 …and locked_until is cleared", afterExpiry?.locked_until === null);

// The clean-slate rule: a survived counter would re-lock on the next typo,
// leaving the user one attempt per cooldown for ever.
await forceState(BUYER.id, {
  failed_attempts: THRESHOLD,
  locked_until: new Date(Date.now() - 1000).toISOString(),
});
await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
const afterExpiredFail = await credentialRow(BUYER.id);
check(
  "E4 ⚠️ a failure after expiry restarts at 1, not at 11",
  afterExpiredFail?.failed_attempts === 1,
  `failed_attempts = ${afterExpiredFail?.failed_attempts}`
);
check("E5 …and does not immediately re-lock", afterExpiredFail?.locked_until === null);

// ─────────────────────────────────────────────────────────────────────────
section("[F] SUCCESS RESETS THE COUNTER");

await reseed(BUYER.id);
for (let i = 0; i < 4; i++) await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
const before = await credentialRow(BUYER.id);
check("F1 four failures counted", before?.failed_attempts === 4);

const f2 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check("F2 the correct password succeeds", f2.ok === true);
const afterSuccess = await credentialRow(BUYER.id);
check(
  "F3 ⚠️ a successful login RESETS the counter to zero",
  afterSuccess?.failed_attempts === 0,
  `failed_attempts = ${afterSuccess?.failed_attempts}`
);
check("F4 …and clears last_failed_at", afterSuccess?.last_failed_at === null);
check("F5 …and leaves the account unlocked", afterSuccess?.locked_until === null);

// So the reset is real, not cosmetic: a fresh run to the threshold must work.
for (let i = 0; i < THRESHOLD - 1; i++) {
  await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
}
const f6 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check(
  `F6 …so ${THRESHOLD - 1} fresh failures still leave the account usable`,
  f6.ok === true
);

// ─────────────────────────────────────────────────────────────────────────
section("[G] RAPID AND CONCURRENT — the counter must not be cheatable");

await reseed(BUYER.id);
const sequential = [];
for (let i = 1; i <= THRESHOLD; i++) {
  await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
  sequential.push((await credentialRow(BUYER.id))?.failed_attempts);
}
check(
  "G1 rapid SEQUENTIAL attempts count exactly 1..N — no skips, no double counts",
  JSON.stringify(sequential) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  sequential.join(",")
);
const g2 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check("G2 …and the account is locked at exactly N", g2.ok === false);

// ⚠️ THE RACE. PostgREST cannot express `failed_attempts = failed_attempts + 1`
// (documented in db.ts), so the increment is read-modify-write. UNGUARDED, ten
// simultaneous guesses all read the same counter and all write the same value,
// so the counter advances by ONE — a lockout that fails open under exactly the
// load an attacker generates, while every sequential test above still passes.
await reseed(BUYER.id);
await Promise.all(
  Array.from({ length: THRESHOLD }, () =>
    verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD)
  )
);
const burst = await credentialRow(BUYER.id);
check(
  "G3 ⚠️ a parallel burst is NOT collapsed to a single increment",
  (burst?.failed_attempts ?? 0) > 1,
  `${THRESHOLD} parallel attempts advanced the counter to ${burst?.failed_attempts}`
);

// Bounded retry cannot make a burst count exactly; what must hold is that
// repeating it still reaches the lock rather than guessing for ever.
let bursts = 1;
while (bursts < 8 && (await credentialRow(BUYER.id))?.locked_until === null) {
  await Promise.all(
    Array.from({ length: THRESHOLD }, () =>
      verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD)
    )
  );
  bursts++;
}
const burstRow = await credentialRow(BUYER.id);
check(
  "G4 ⚠️ sustained parallel guessing still reaches the lock",
  burstRow?.locked_until !== null,
  `locked after ${bursts} burst(s) of ${THRESHOLD}`
);
const g5 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check("G5 …and the correct password is refused once it does", g5.ok === false);

// ─────────────────────────────────────────────────────────────────────────
section("[H] ISOLATION — still no HTTP surface, still no login wiring");

const grep = (pattern: string) => {
  try {
    return execFileSync("git", ["grep", "-l", pattern, "--", "app/"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
};
const importers = grep("verifyPasswordCredential")
  .split("\n")
  .filter((f) => f && f !== "app/lib/authProvider.server.ts");
// ⚠️ REWRITTEN BY CHUNK 2.6a. This asserted ZERO importers, which was [I18]'s
// deferral condition — and 2.6a added the legitimate client that ends it: a
// login route that issues a session AND inherits this lockout, because the
// lockout lives inside the seam function rather than in the route. The
// property that still matters is that there is exactly ONE caller, so no
// second endpoint can reach the verifier without the lockout coming with it.
//
// ⚠️ `git grep` sees TRACKED files only, so this check was blind to the new
// route until it was committed — and would be equally blind to an
// uncommitted one. The allowlist below is matched against the same git-based
// search this suite already uses; the filesystem-walking version lives in
// verify-password-login.ts C5, which is the authoritative check.
const ALLOWED_VERIFIER_IMPORTERS = ["app/api/auth/password-login/route.ts"];
check(
  "H1 ⚠️ ONLY the login route imports verifyPasswordCredential — lockout travels with it",
  importers.every((f) => ALLOWED_VERIFIER_IMPORTERS.includes(f)),
  importers.join(", ") || "none"
);
const routeImporters = grep("recordFailedPasswordAttempt")
  .split("\n")
  .filter((f) => f && !f.startsWith("app/lib/"));
check("H2 the lockout writes are not reachable from any route", routeImporters.length === 0);

// Nothing about lockout state may reach a log — server logs outlive requests.
const logged: string[] = [];
const realLog = console.log;
const realError = console.error;
console.log = (...a: unknown[]) => void logged.push(a.join(" "));
console.error = (...a: unknown[]) => void logged.push(a.join(" "));
await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
await verifyPasswordCredential(ABSENT_PHONE, WRONG_PASSWORD);
console.log = realLog;
console.error = realError;
check("H3 verification logs nothing at all", logged.length === 0, `${logged.length} line(s)`);

// ─────────────────────────────────────────────────────────────────────────
section("[I] OUTAGE — a dead database must not silently disable the lockout");

// ⚠️ SUBPROCESS, NOT AN IN-PROCESS RE-IMPORT. Chunk 2.5a's first version
// re-imported with a cache-busting query string, which still resolved `./db`
// to the cached module holding a working client — a false pass. Third time
// this trap has appeared in M10; assume any outage test is wrong until it
// fails for the reason you expect.
const childOutput = execFileSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--import",
    "./scripts/register-ts-resolve.mjs",
    "scripts/verify-password-lockout.ts",
    "--outage-child",
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL.replace(".supabase.co", "-BROKEN.supabase.co"),
    },
  }
);
const childThrew = childOutput.includes("CHILD:threw");
const childReturned = /CHILD:returned:(.*)/.exec(childOutput)?.[1]?.trim() ?? "";
check(
  "I1 ⚠️ an unreachable database THROWS rather than answering",
  childThrew,
  childThrew ? "threw → caller maps to 503" : `returned ${childReturned}`
);
check(
  "I2 …so an outage never fails OPEN (silently unthrottled)",
  !childReturned.includes('"ok":true')
);
check(
  "I3 …and never fails CLOSED as a fake lockout either",
  !childReturned.includes("account-locked")
);

// ── CLEANUP ──────────────────────────────────────────────────────────────
await deleteCredentials(BUYER.id);
await deleteCredentials(MAKER.id);
check(
  "Z1 cleanup: no credentials left behind",
  (await sql("user_credentials?select=id")).length === 0
);
check(
  "Z2 auth_identities untouched (password writes none — I11)",
  (await sql("auth_identities?select=id")).length === 1
);

console.log("\n" + "=".repeat(74));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(74) + "\n");
process.exit(failed ? 1 : 0);
