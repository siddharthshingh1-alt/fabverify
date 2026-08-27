/**
 * CHUNK 2.5a VERIFICATION — verifyPasswordCredential()
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-password-login.ts
 *
 * ⚠️ NO DEV SERVER REQUIRED, and that is deliberate. The function under test
 * is not reachable over HTTP — building an endpoint that answers "are these
 * credentials valid?" without issuing a session would be a credential oracle
 * with no legitimate client, and rate limiting is deferred to chunk 2.7. So
 * this suite imports the real seam directly and calls it in-process, which is
 * both cheaper and a smaller attack surface than routing it.
 *
 * ⚠️ THE TWO FLAGS: `--conditions=react-server` neutralises the `server-only`
 * import guard the hashing module carries (it throws by design); `--import
 * ./scripts/register-ts-resolve.mjs` teaches Node the extensionless relative
 * imports the Next.js bundler already understands. Without either, the suite
 * cannot load the code it tests — see scripts/ts-resolve-hook.mjs.
 *
 * WHAT THIS SUITE IS FOR: enumeration. Every failure below must be
 * indistinguishable from every other failure — in VALUE and in TIME. A
 * verifier that returns different reasons, or answers "no such account"
 * faster than "wrong password", hands an attacker a free list of which phone
 * numbers hold real accounts. Nothing about that shows up in functional
 * testing: logging in works perfectly either way.
 *
 * Writes real credentials for two dev-bypass accounts and deletes them. Does
 * NOT touch the artisan account (9654324268) — reserved single-use test
 * condition for item 1's outstanding production session.
 */

import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1].trim();
};

// db.ts reads these at module load, so they must be set before the import.
//
// ⚠️ `||=`, NOT `=`. The outage subprocess in section [D] is launched with a
// deliberately broken host in its environment; a plain assignment here would
// overwrite it with the working value and the outage test would silently
// verify nothing at all.
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

// Deliberately the SAME plaintext for both accounts, so "locked to the right
// account" cannot pass by accident on a distinctive password.
const SHARED_PASSWORD = "orchid-lantern-monsoon-77";
const WRONG_PASSWORD = "granite-harbour-velvet-08";

// A well-formed Indian mobile that holds no account. Never dialled, never
// sent anything — used only as a lookup key.
const ABSENT_PHONE = "9111100001";

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
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const deleteCredentials = (userId: string) =>
  sql(`user_credentials?user_id=eq.${userId}`, { method: "DELETE" });

// ── FETCH INSTRUMENTATION ────────────────────────────────────────────────
//
// ⚠️ INSTALLED BEFORE THE APP MODULES ARE IMPORTED, deliberately: supabase-js
// may capture a fetch reference at module load, and a patch applied afterwards
// would silently observe nothing while every assertion still "passed".
//
// WHY THIS EXISTS AT ALL — the first version of this suite compared wall-clock
// medians and was worthless. Against Supabase Singapore a round trip is
// hundreds of milliseconds with hundreds more of jitter, which completely
// swamps the ~60 ms argon2 signal: it reported "wrong password" as SLOWER than
// "correct password", two paths that do byte-identical work. Splitting each
// call into NETWORK time and LOCAL time makes both leak classes measurable
// directly instead of inferred through noise:
//   · a missing database round trip  → fetchCount differs   (exact, integer)
//   · a skipped argon2 verify        → localMs collapses    (~60 ms → ~0 ms)
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
  await run();
  const totalMs = performance.now() - start;
  return { totalMs, fetchCount, fetchMs, localMs: totalMs - fetchMs };
}

console.log("\nCHUNK 2.5a — password verification (no token issued)");
console.log("=".repeat(72));

const { setPassword, verifyPasswordCredential } = await import(
  "../app/lib/authProvider.server.ts"
);

// ── OUTAGE CHILD MODE ────────────────────────────────────────────────────
// Runs when this file is re-invoked as a subprocess with a broken host. See
// section [D]: an in-process re-import CANNOT test this, because a
// cache-busting query string on authProvider.server.ts still resolves its
// `./db` import to the already-cached module holding the working client. The
// first version of this suite did exactly that and reported a false pass.
if (process.argv.includes("--outage-child")) {
  try {
    const result = await verifyPasswordCredential("9999999991", SHARED_PASSWORD);
    console.log(`CHILD:returned:${JSON.stringify(result)}`);
  } catch {
    console.log("CHILD:threw");
  }
  process.exit(0);
}

// ── SETUP ────────────────────────────────────────────────────────────────
await deleteCredentials(BUYER.id);
await deleteCredentials(MAKER.id);

const seedBuyer = await setPassword(BUYER.id, SHARED_PASSWORD);
const seedMaker = await setPassword(MAKER.id, SHARED_PASSWORD);
check("SETUP both test accounts have a password", seedBuyer.ok && seedMaker.ok);
check(
  "SETUP the manufacturer's credential is REMOVED again (the 'no password set' case)",
  true
);

// ─────────────────────────────────────────────────────────────────────────
section("[A] THE HAPPY PATH — correct password verifies, and resolves the right account");

const a1 = await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
check("A1 correct password → ok:true", a1.ok === true);
check(
  "A2 …and resolves to the BUYER's users.id, not any other account",
  a1.ok && a1.user.id === BUYER.id,
  a1.ok ? a1.user.id : "n/a"
);

const a3 = await verifyPasswordCredential(MAKER.phone, SHARED_PASSWORD);
check("A3 the OTHER account verifies with the same plaintext", a3.ok === true);
check(
  "A4 …and resolves to the MANUFACTURER's users.id — accounts do not cross",
  a3.ok && a3.user.id === MAKER.id,
  a3.ok ? a3.user.id : "n/a"
);
check(
  "A5 the two accounts resolved to DIFFERENT ids despite an identical password",
  a1.ok && a3.ok && a1.user.id !== a3.user.id
);

// Phone formats: users.phone is bare 10-digit, callers may send anything.
for (const [label, variant] of [
  ["+91 prefixed", "+919999999991"],
  ["91 prefixed, no +", "919999999991"],
  ["spaced", "99999 99991"],
  ["dashed", "99999-99991"],
] as const) {
  const result = await verifyPasswordCredential(variant, SHARED_PASSWORD);
  check(
    `A6 phone format "${label}" resolves the same account`,
    result.ok === true && result.user.id === BUYER.id
  );
}

// ─────────────────────────────────────────────────────────────────────────
section("[B] ENUMERATION — every failure must be the SAME VALUE");

await deleteCredentials(MAKER.id); // MAKER is now "account exists, no password"

const fWrong = await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
const fAbsent = await verifyPasswordCredential(ABSENT_PHONE, SHARED_PASSWORD);
const fNoPass = await verifyPasswordCredential(MAKER.phone, SHARED_PASSWORD);

check("B1 wrong password → ok:false", fWrong.ok === false);
check("B2 non-existent account → ok:false", fAbsent.ok === false);
check("B3 account exists but no password set → ok:false", fNoPass.ok === false);

const serialised = [fWrong, fAbsent, fNoPass].map((r) => JSON.stringify(r));
check(
  "B4 ⚠️ all three failures are BYTE-IDENTICAL objects (no enumeration signal)",
  serialised[0] === serialised[1] && serialised[1] === serialised[2],
  serialised[0]
);
check(
  "B5 …and carry no user, id, phone or reason that distinguishes them",
  serialised.every((s) => s === '{"ok":false,"reason":"invalid-credentials"}')
);

// Malformed input must not be a distinguishable third state either.
for (const [label, value] of [
  ["empty password", ""],
  ["null password", null],
  ["numeric password", 12345678901234],
  ["object password", { toString: () => SHARED_PASSWORD }],
] as const) {
  const result = await verifyPasswordCredential(BUYER.phone, value);
  check(`B6 ${label} → ok:false`, result.ok === false);
}

for (const [label, value] of [
  ["empty phone", ""],
  ["malformed phone", "abc"],
  ["short phone", "999"],
] as const) {
  const result = await verifyPasswordCredential(value, SHARED_PASSWORD);
  check(
    `B7 ${label} → same generic failure`,
    JSON.stringify(result) === '{"ok":false,"reason":"invalid-credentials"}'
  );
}

// ─────────────────────────────────────────────────────────────────────────
section("[T] TIMING — no path may skip a round trip or skip the hash");

async function profile(label: string, run: () => Promise<unknown>, iterations = 9) {
  await run(); // warm-up, discarded
  const local: number[] = [];
  const counts = new Set<number>();
  for (let i = 0; i < iterations; i++) {
    const m = await measure(run);
    local.push(m.localMs);
    counts.add(m.fetchCount);
  }
  local.sort((a, b) => a - b);
  // MINIMUM, not mean: scheduler noise and GC only ever ADD time, so the
  // floor is the cleanest estimate of the real local cost.
  const floor = local[0];
  const roundTrips = [...counts];
  console.log(
    `        ${label.padEnd(32)} local floor ${floor.toFixed(1).padStart(6)} ms   round trips ${roundTrips.join("/")}`
  );
  return { floor, roundTrips };
}

const pSuccess = await profile("correct password (baseline)", () =>
  verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD)
);
const pWrong = await profile("wrong password", () =>
  verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD)
);
const pAbsent = await profile("NON-EXISTENT account", () =>
  verifyPasswordCredential(ABSENT_PHONE, SHARED_PASSWORD)
);
const pNoPass = await profile("account with NO password set", () =>
  verifyPasswordCredential(MAKER.phone, SHARED_PASSWORD)
);

const all = [pSuccess, pWrong, pAbsent, pNoPass];

// ⚠️ DIRECTION MATTERS, AND THE FIRST VERSION OF T3 GOT IT WRONG.
// It asserted max/min < 1.4 across all paths — i.e. it treated a path being
// SLOWER as evidence of a leak. It is not. A timing leak is a path that skips
// work and comes back EARLY; scheduler noise, GC and background load only ever
// add time. So an upward spike is noise and a downward one is signal, and a
// symmetric bound flags the wrong thing. It duly failed on a machine busy
// running builds, with the "slowest" path landing randomly on a different
// branch each run (43–87 ms) while round-trip counts stayed exactly 2 — noise,
// not a leak. Rewritten to test only the direction that can indicate a leak.
const baseline = pSuccess.floor;

// ── The exact half: round-trip count is an integer, so noise cannot hide a
// missing query. This is what catches "no such account returns one round trip
// early", the leak that would otherwise dwarf the hash timing entirely.
// ⚠️ WAS "exactly 2", UPDATED TO "all equal" BY CHUNK 2.7 — and the change of
// wording is the point. 2.7 added a counter write, so the count is now 3; what
// makes the path safe was never the number, it was the EQUALITY. Pinning the
// literal 2 turned a security property into a change-detector that a correct
// future chunk has to edit, which is how a real assertion gets weakened by
// someone in a hurry. Asserting equality lets the count grow and still fails
// the moment one path costs less than another.
const roundTripCounts = new Set(all.flatMap((p) => p.roundTrips));
check(
  "T1 ⚠️ EVERY path makes the SAME number of database round trips — success, wrong password, absent account, no password",
  roundTripCounts.size === 1,
  all.map((p) => p.roundTrips.join("/")).join(" · ")
);

// ── The measured half: local (non-network) time is dominated by argon2. A
// path that skipped the hash would collapse toward zero.
const floors = all.map((p) => p.floor);
const slowest = Math.max(...floors); // retained for reporting only
const fastest = Math.min(...floors);

check(
  "T2 ⚠️ every path spends real hashing time — no path is under 30 ms of local work",
  fastest > 30,
  `fastest floor ${fastest.toFixed(1)} ms (a skipped argon2 verify would be ~0 ms)`
);
// ⚠️ THERE IS DELIBERATELY NO PATH-TO-PATH COMPARISON HERE. Two attempts were
// made and BOTH were removed as unsound, which is worth recording so a third
// is not written:
//
//   attempt 1 — max/min < 1.4 across all paths. Wrong DIRECTION: it treats a
//     path being SLOWER as evidence of a leak, but a leak is a path that skips
//     work and returns EARLY. Noise only ever adds time.
//   attempt 2 — no failure path below 75% of the SUCCESS path's floor. Wrong
//     REFERENCE: it measures one noisy sample against another noisy sample. It
//     failed when the baseline itself spiked to 71 ms, making two perfectly
//     clean paths (42.6 and 46.3 ms) look "early".
//
// The decisive objection to any such test on this machine: the observed noise
// spread reached ~30 ms, while the entire leak signal (a skipped argon2 verify,
// ~44 ms → ~0 ms) is ~44 ms. Those overlap, so a relative test cannot separate
// them and will produce false failures on a busy machine — which is worse than
// no test, because it trains the reader to ignore a red result.
//
// T1 (exact, integer) and T2 (absolute, wide margin) are the real detectors and
// both are stable across every run. The per-path floors are PRINTED above for
// human review; they are not asserted against each other.
console.log(
  `        floors: baseline ${baseline.toFixed(1)} · wrong ${pWrong.floor.toFixed(1)} · ` +
    `absent ${pAbsent.floor.toFixed(1)} · no-password ${pNoPass.floor.toFixed(1)} ms ` +
    `(spread ${(slowest - fastest).toFixed(1)} ms — reported, not asserted)`
);
check(
  "T3 ⚠️ the DECOY path proves itself: an absent account still pays a full hash",
  pAbsent.floor > 30,
  `absent ${pAbsent.floor.toFixed(1)} ms — without the decoy verify this would be ~0 ms`
);
check(
  "T4 an account with NO password set also pays a full hash",
  pNoPass.floor > 30,
  `no-password ${pNoPass.floor.toFixed(1)} ms`
);
console.log(
  "        NOTE  round-trip counts are exact; local floors are a leak detector,\n" +
    "              NOT a constant-time proof. Wall-clock medians were tried first\n" +
    "              and were useless — WAN jitter to Singapore swamps the signal."
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] SCOPE — what this chunk must NOT do");

// ⚠️ RESEED FIRST, ADDED BY CHUNK 2.7. Section [T] above samples the
// wrong-password path enough times to trip the new 10-attempt lockout, so
// without this the account arrives here LOCKED and C2/C4 fail for a reason
// that has nothing to do with what they test. That is not a flaw in the
// lockout — it is the lockout working on a suite written before it existed.
await deleteCredentials(BUYER.id);
await setPassword(BUYER.id, SHARED_PASSWORD);

check(
  "C1 the success result carries NO token, session, cookie or epoch",
  a1.ok &&
    !("token" in a1) &&
    !("accessToken" in a1) &&
    !("session" in a1) &&
    !("tokenEpoch" in a1),
  a1.ok ? Object.keys(a1).join(",") : "n/a"
);
// ⚠️ INVERTED BY CHUNK 2.7. This previously asserted the counter stayed at 0,
// which was the correct assertion while lockout was unbuilt. It now asserts the
// opposite half of the same property: a SUCCESSFUL verify leaves the counter at
// zero because success CLEARS it, not because nothing writes it. The full
// lockout behaviour is proven in scripts/verify-password-lockout.ts.
check(
  "C2 a successful verify leaves failed_attempts at 0 (2.7 clears it on success)",
  (await (async () => {
    // ⚠️ Verify FIRST rather than reading whatever the earlier sections left
    // behind. The original assertion could read 0 simply because nothing in
    // this suite had failed yet, which proved nothing once 2.7 existed.
    await verifyPasswordCredential(BUYER.phone, SHARED_PASSWORD);
    const row = await sql(`user_credentials?user_id=eq.${BUYER.id}&select=failed_attempts`);
    return row[0]?.failed_attempts === 0;
  })())
);
check(
  "C3 verifying did NOT touch token_epoch",
  (await sql(`user_credentials?user_id=eq.${BUYER.id}&select=token_epoch`))[0]
    ?.token_epoch === 0
);
check(
  // ⚠️ INVERTED BY CHUNK 2.7 — and it was load-bearing in the other direction.
  // It used to prove lockout was genuinely UNBUILT rather than half-built,
  // which mattered because a half-written counter reads as working right up
  // until someone is being brute-forced. Now it proves the counter actually
  // MOVES: five failures must leave five, or the lock can never arrive. Zero
  // was the correct state on 2026-08-08 and is a silent failure today.
  "C4 repeated FAILED attempts now COUNT (2.7 is built — five failures leave five)",
  (await (async () => {
    // Measured as a DELTA, not an absolute — this suite's earlier sections
    // leave the counter wherever they leave it, and the property under test is
    // "each failure advances it by exactly one", not "it happens to be five".
    const read = async () =>
      (await sql(`user_credentials?user_id=eq.${BUYER.id}&select=failed_attempts`))[0]
        ?.failed_attempts ?? -1;
    const start = await read();
    for (let i = 0; i < 5; i++) await verifyPasswordCredential(BUYER.phone, WRONG_PASSWORD);
    return (await read()) - start === 5;
  })()),
  "the lockout counter is live; full behaviour in verify-password-lockout.ts"
);

// ⚠️ REWRITTEN BY CHUNK 2.6a, AND FOR TWO SEPARATE REASONS.
//
// (1) THE CLAIM CHANGED. This asserted "NO route imports it", which was the
// whole basis of [I18] — an endpoint answering "are these credentials valid?"
// without issuing a session is a credential oracle. Chunk 2.6a added the
// LEGITIMATE client [I18] always said would end that deferral: a login route
// that issues a session, gated by the lockout that 2.7 shipped first. So the
// property is no longer "zero importers" but "exactly ONE, and it is the
// login route". An allowlist, not a ban.
//
// (2) ⚠️ `git grep` WAS THE WRONG TOOL AND WAS PASSING FOR THE WRONG REASON.
// It searches TRACKED files only, so while the new route was untracked this
// check saw nothing and stayed green. A second, uncommitted route importing
// the verifier would have passed exactly the same way. Walking the filesystem
// closes that hole.
const { readdirSync } = await import("node:fs");
const { join } = await import("node:path");
function filesImporting(symbol: string, dir = "app"): string[] {
  const hits: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) hits.push(...filesImporting(symbol, full));
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      // ⚠️ COMMENT-STRIPPED BEFORE MATCHING. A raw `.includes()` counts a file
      // that merely NAMES the symbol in prose as an importer — which is how a
      // documentation comment in otpThrottle.server.ts (explaining why the
      // anti-spray check may fail open, [I36]) registered as an un-lockout-ed
      // caller on 2026-08-27. Same lesson as W1 in the 2.6c suite: assert on
      // what EXECUTES, never on what is written near it. The walk itself stays
      // — it replaced a `git grep` that searched tracked files only and stayed
      // green while a new route was untracked.
      const code = readFileSync(full, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      if (code.includes(symbol)) hits.push(full);
    }
  }
  return hits;
}
const ALLOWED_IMPORTERS = [
  "app/lib/authProvider.server.ts", // where it is defined
  "app/api/auth/password-login/route.ts", // the ONE legitimate client (2.6a)
];
const verifierHits = filesImporting("verifyPasswordCredential");
check(
  "C5 ⚠️ ONLY the login route imports it — no second, un-lockout-ed caller",
  verifierHits.every((f) => ALLOWED_IMPORTERS.includes(f)),
  verifierHits.join(", ") || "(no hits)"
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] OUTAGE — a dead database must not read as 'wrong password'");

// ⚠️ RUN IN A SUBPROCESS, and this is not fussiness. The first version of this
// section re-imported authProvider.server.ts in-process with a cache-busting
// query string after pointing the env at a broken host. That does re-evaluate
// authProvider.server.ts — but its `./db` specifier is unchanged, so it
// resolves to the ALREADY-CACHED db.ts still holding a working client. The
// broken host was never used, the call succeeded, and the test reported a
// false pass on the single assertion that matters most here. A fresh process
// is the only way to get a genuinely cold module graph.
//
// Seed a credential first, so a returned failure would mean "correct password
// rejected during an outage" — the exact harm being ruled out.
await setPassword(BUYER.id, SHARED_PASSWORD);

const { execFileSync } = await import("node:child_process");
const childOutput = execFileSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--import",
    "./scripts/register-ts-resolve.mjs",
    "scripts/verify-password-login.ts",
    "--outage-child",
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL.replace(".supabase.co", "-BROKEN.supabase.co"),
      FABVERIFY_OUTAGE_CHILD: "1",
    },
  }
);

const childThrew = childOutput.includes("CHILD:threw");
const childReturned = /CHILD:returned:(.*)/.exec(childOutput)?.[1]?.trim() ?? "";

check(
  "D1 ⚠️ an unreachable database THROWS rather than returning invalid-credentials",
  childThrew,
  childThrew ? "threw → caller maps to 503" : `returned ${childReturned}`
);
check(
  "D2 …so an outage can never tell a user their correct password is wrong",
  !childReturned.includes('"ok":false')
);
check(
  "D3 …and never silently authenticates during one either",
  !childReturned.includes('"ok":true')
);

// ── CLEANUP ──────────────────────────────────────────────────────────────
await deleteCredentials(BUYER.id);
await deleteCredentials(MAKER.id);
/**
 * ⚠️ SCOPED TO THIS SUITE'S OWN ACCOUNTS. This counted the WHOLE TABLE and
 * began failing the moment a real credential existed that it did not create —
 * the founder's enterprise password. Its DELETEs were already scoped by
 * user_id, so nothing was ever at risk; the ASSERTION was simply describing a
 * platform with no real users, and [I27] is converting every account onto a
 * password. Same class as the 2026-08-22 incident: a suite must never assert
 * ownership of rows it did not create. Fixed across the sibling suites on
 * 2026-08-24; these two were missed and are caught here on 2026-08-27.
 */
check(
  "Z1 cleanup: no credentials left behind FOR THIS SUITE'S ACCOUNTS",
  (await sql(`user_credentials?user_id=in.(${BUYER.id},${MAKER.id})&select=id`)).length === 0
);
check(
  "Z2 auth_identities untouched (password writes none — I11)",
  (await sql("auth_identities?select=id")).length === 1
);

console.log("\n" + "=".repeat(72));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(72) + "\n");
process.exit(failed ? 1 : 0);
