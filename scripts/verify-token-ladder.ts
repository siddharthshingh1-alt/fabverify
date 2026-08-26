/**
 * CHUNK 2.5b PIECE 3 — THE RESOLUTION LADDER. Our token, wired in.
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-token-ladder.ts
 *
 * ⚠️⚠️ THIS IS THE AUTH-BYPASS SURFACE. The token MODULE was proven alone
 * (verify-session-token.ts, 72 assertions, no database). This suite proves the
 * part the module could not: that a verified token resolves to the RIGHT
 * ACCOUNT, that a bad one resolves to NONE, and that the Supabase fallback
 * every currently-live session depends on still works.
 *
 * ⚠️ NODE_ENV IS FORCED TO "production" BEFORE THE IMPORT, and that is
 * load-bearing. `auth.ts` reads `isProduction` at MODULE LOAD; under the dev
 * default `getVerifiedCallerPhone` takes the x-dev-phone branch and NONE of
 * the token code below ever executes. A suite that forgot this would pass
 * every assertion while testing nothing — the same false-pass shape that hit
 * chunk 2.5a's outage test twice.
 *
 * ⚠️ NO DEV SERVER. The functions are called directly with hand-built Request
 * objects, which is both cheaper and lets us count database round trips.
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

// ⚠️ THE LINE THE WHOLE SUITE DEPENDS ON. See the header note.
//
// Assigned through Object.assign because `NODE_ENV` is typed readonly — the
// cast is a type-level workaround only; the runtime assignment is ordinary and
// must happen BEFORE auth.ts is imported, since `isProduction` is a
// module-load constant.
Object.assign(process.env, { NODE_ENV: "production" });

const SUPABASE_URL = envVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = envVar("SUPABASE_SERVICE_ROLE_KEY");

const BUYER = { phone: "9999999991", id: "5b616a97-9d5d-4fd4-be4e-8fe7acecd613" };
const MAKER = { phone: "9999999992", id: "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33" };
const PASSWORD = "orchid-lantern-monsoon-77";

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

const credentialRow = async (userId: string) =>
  (await sql(`user_credentials?user_id=eq.${userId}&select=token_epoch,updated_at`))?.[0] ?? null;

// ── ROUND-TRIP INSTRUMENTATION (installed before the app modules load) ────
let fetchCount = 0;
globalThis.fetch = async function instrumented(...args: Parameters<typeof realFetch>) {
  fetchCount++;
  return realFetch(...args);
};
async function countQueries<T>(run: () => Promise<T>): Promise<{ value: T; queries: number }> {
  fetchCount = 0;
  const value = await run();
  return { value, queries: fetchCount };
}

console.log("\nCHUNK 2.5b PIECE 3 — the resolution ladder");
console.log("=".repeat(74));

const { issueSessionToken } = await import("../app/lib/sessionToken.server.ts");
const { setPassword } = await import("../app/lib/authProvider.server.ts");
const { getVerifiedUser, getVerifiedCallerPhone } = await import("../app/lib/auth.ts");

/** A Request carrying a bearer token, exactly as apiClient would send it. */
const bearer = (token: string) =>
  new Request("https://fabverify.test/api/anything", {
    headers: { authorization: `Bearer ${token}` },
  });

// ── OUTAGE CHILD ─────────────────────────────────────────────────────────
if (process.argv.includes("--outage-child")) {
  const token = await issueSessionToken(BUYER.id, 0);
  try {
    const result = await getVerifiedUser(bearer(token));
    console.log(`CHILD:returned:${JSON.stringify(result)}`);
  } catch {
    console.log("CHILD:threw");
  }
  process.exit(0);
}

// ── SETUP ────────────────────────────────────────────────────────────────
await deleteCredentials(BUYER.id);
await deleteCredentials(MAKER.id);
const seeded = await setPassword(BUYER.id, PASSWORD);
check("SETUP buyer has a credential", seeded.ok === true);
const cred = await credentialRow(BUYER.id);
const EPOCH: number = cred?.token_epoch ?? -1;
check("SETUP …with a readable token_epoch", EPOCH === 0, `epoch = ${EPOCH}`);

// ─────────────────────────────────────────────────────────────────────────
section("[A] OUR TOKEN RESOLVES — to the right account, by the right branch");

const good = await issueSessionToken(BUYER.id, EPOCH);
const a1 = await getVerifiedUser(bearer(good));
check("A1 a token we issued authenticates", a1.ok === true);
check(
  "A2 ⚠️ …and resolves to the CORRECT users row",
  a1.ok && a1.user.id === BUYER.id,
  a1.ok ? a1.user.id : "n/a"
);
check(
  "A3 ⚠️ …via the LOCAL branch, not by silently falling back to phone",
  a1.ok && a1.via === "local",
  a1.ok ? `via = ${a1.via}` : "n/a"
);

// ⚠️ Without this, a broken local branch is INVISIBLE: the phone fallback
// answers correctly and only the query count betrays it.
const { queries } = await countQueries(() => getVerifiedUser(bearer(good)));
check(
  "A4 ⚠️ costs exactly ONE database round trip (the embedded join, no re-resolve)",
  queries === 1,
  `${queries} quer${queries === 1 ? "y" : "ies"}`
);

const a5 = await getVerifiedCallerPhone(bearer(good));
check(
  "A5 the trust root reports providerUid NULL — no provider identity ([I11])",
  a5.ok === true && a5.providerUid === null
);
check(
  "A6 …and the phone it reports is the account's own",
  a5.ok === true && a5.phone === BUYER.phone,
  a5.ok ? a5.phone : "n/a"
);

// A password session must never fabricate an auth_identities row.
const identitiesBefore = (await sql("auth_identities?select=id")).length;
await getVerifiedUser(bearer(good));
const identitiesAfter = (await sql("auth_identities?select=id")).length;
check(
  "A7 ⚠️ a local-token request writes NO auth_identities row",
  identitiesBefore === identitiesAfter,
  `${identitiesBefore} → ${identitiesAfter}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[B] REVOCATION — token_epoch stops being inert");

// ⚠️ THE STALE TOKEN IS MADE STALE THE REAL WAY — by moving the epoch
// UNDERNEATH a token that was valid when minted. Minting one at `epoch - 1`
// was the first attempt and it is not the same test: `issueSessionToken`
// rejects a negative epoch outright, so that version proved the ISSUER's
// input guard while never reaching the verifier at all.
const ahead = await issueSessionToken(BUYER.id, EPOCH + 1);
const b1 = await getVerifiedUser(bearer(ahead));
check(
  "B1 a token claiming a FUTURE epoch is refused (must EQUAL, never merely differ)",
  b1.ok === false,
  b1.ok ? "ACCEPTED" : "refused"
);

// Changing the password bumps the epoch — the 2.8 reset mechanism, proven.
await setPassword(BUYER.id, "harbour-thistle-cobalt-41", PASSWORD);
const bumped = await credentialRow(BUYER.id);
check(
  "B2 changing the password bumped token_epoch",
  bumped?.token_epoch === EPOCH + 1,
  `${EPOCH} → ${bumped?.token_epoch}`
);
const b3 = await getVerifiedUser(bearer(good));
check(
  "B3 ⚠️ THE ORIGINAL TOKEN IS NOW DEAD — a password change ends existing sessions",
  b3.ok === false,
  b3.ok ? "STILL VALID — reset cannot evict an intruder" : "refused"
);
check(
  "B4 …and it was refused as UNAUTHENTICATED (401), not as an outage (503)",
  b3.ok === false && b3.reason === "unauthenticated",
  b3.ok === false ? b3.reason : "n/a"
);

// Credential deleted underneath a live token → fail CLOSED.
const afterBump = await credentialRow(BUYER.id);
const liveToken = await issueSessionToken(BUYER.id, afterBump.token_epoch);
check("B5 a freshly-minted token works", (await getVerifiedUser(bearer(liveToken))).ok === true);
await deleteCredentials(BUYER.id);
const b6 = await getVerifiedUser(bearer(liveToken));
check(
  "B6 ⚠️ credential DELETED under a live token → refused (fails closed, not open)",
  b6.ok === false,
  b6.ok ? "STILL VALID — deleting a credential grants immortality" : "refused"
);

// ─────────────────────────────────────────────────────────────────────────
section("[C] THE SUPABASE FALLBACK — the highest-consequence regression");

// ⚠️ Every currently-live session is a Supabase JWT. If our verifier swallowed
// them, every existing user would be logged out at once.
const supabaseShaped =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  Buffer.from(JSON.stringify({ sub: BUYER.id, phone: "919999999991", exp: 9999999999 }))
    .toString("base64url") +
  ".not-our-signature";
const { queries: fallbackQueries, value: c1 } = await countQueries(() =>
  getVerifiedUser(bearer(supabaseShaped))
);
check(
  "C1 ⚠️ a Supabase-shaped token is NOT accepted by our verifier",
  c1.ok === false,
  c1.ok ? "CROSS-ACCEPTED — total bypass" : "rejected by ours"
);
check(
  "C2 ⚠️ …and it REACHED Supabase to be judged (the fallback actually ran)",
  fallbackQueries > 0,
  `${fallbackQueries} outbound call(s) — 0 would mean we swallowed it`
);
check(
  "C3 garbage is rejected without reaching a users lookup",
  (await getVerifiedUser(bearer("garbage.not.a.token"))).ok === false
);
check("C4 an empty bearer is rejected", (await getVerifiedUser(bearer(""))).ok === false);
check(
  "C5 a missing Authorization header is rejected",
  (await getVerifiedUser(new Request("https://fabverify.test/api/x"))).ok === false
);

// ─────────────────────────────────────────────────────────────────────────
section("[D] CROSS-ACCOUNT — a token for one account never resolves another");

await setPassword(MAKER.id, PASSWORD);
const makerCred = await credentialRow(MAKER.id);
const makerToken = await issueSessionToken(MAKER.id, makerCred.token_epoch);
const d1 = await getVerifiedUser(bearer(makerToken));
check("D1 the maker's token resolves the maker", d1.ok && d1.user.id === MAKER.id);
check(
  "D2 ⚠️ …and NOT the buyer, despite an identical password",
  d1.ok && d1.user.id !== BUYER.id
);

// A signature-valid token whose sub is a real UUID that owns no account.
const orphan = await issueSessionToken("00000000-0000-0000-0000-000000000000", 0);
check(
  "D3 a valid signature over a non-existent account → 401, not a crash",
  (await getVerifiedUser(bearer(orphan))).ok === false
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] OUTAGE — Issue E on the new database read");

// ⚠️ getVerifiedCallerPhone had NO database access before this chunk. The
// local branch adds one, so it can now fail for a reason that is NOT an
// authentication problem — and answering 401 would tell a user with a
// perfectly good password that they must log in again.
const childOutput = execFileSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--import",
    "./scripts/register-ts-resolve.mjs",
    "scripts/verify-token-ladder.ts",
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
const childReturned = /CHILD:returned:(.*)/.exec(childOutput)?.[1]?.trim() ?? "";
check(
  "E1 ⚠️ an unreachable database answers UNAVAILABLE (503), never UNAUTHENTICATED (401)",
  childReturned.includes("unavailable"),
  childReturned || "(threw)"
);
check("E2 …and never authenticates during one", !childReturned.includes('"ok":true'));

// ─────────────────────────────────────────────────────────────────────────
section("[F] THE SEAM HOLDS — the signing key must not reach the browser");

// ⚠️ MATCH IMPORT STATEMENTS, NOT THE WHOLE FILE. The first version of this
// grepped the raw text and failed on the header COMMENT, which explains at
// length why supabaseAdmin must not be imported here. A test that cannot tell
// a warning about a thing from the thing itself is worse than no test: it
// would have gone green the moment someone deleted the comment.
const clientImports = readFileSync("app/lib/authProvider.ts", "utf8")
  .split("\n")
  .filter((line) => /^\s*import\s/.test(line))
  .join("\n");
check(
  "F1 ⚠️ the browser half does NOT import sessionToken.server",
  !clientImports.includes("sessionToken.server"),
  "importing it would bundle the signing secret into the client"
);
check(
  "F2 …and does not import supabaseAdmin either",
  !clientImports.includes("supabaseAdmin"),
  clientImports.replace(/\n/g, " · ")
);
check(
  "F3 the server half still guards with server-only",
  readFileSync("app/lib/sessionToken.server.ts", "utf8").startsWith('import "server-only"')
);

// ── CLEANUP ──────────────────────────────────────────────────────────────
await deleteCredentials(BUYER.id);
await deleteCredentials(MAKER.id);
/**
 * ⚠️ SCOPED TO THIS SUITE'S OWN ACCOUNTS — this cell used to count the WHOLE
 * TABLE and started failing the moment a real credential existed that this
 * suite did not create (the founder's enterprise password, set during the
 * 2.6c production test).
 *
 * Same class as the 2026-08-22 incident that destroyed that password: a suite
 * must never assert — or act on — ownership of rows it did not create. The
 * DELETEs above were already correctly scoped by `user_id`, so nothing was at
 * risk here; this assertion was simply describing a world where the platform
 * has no real users, and `user_credentials` stops being that world with every
 * account [I27]'s gate converts. Caught 2026-08-27 while building 2.8b; the
 * sibling suites were fixed on 2026-08-24 and this one was missed.
 */
check(
  "Z1 cleanup: no credentials left behind FOR THIS SUITE'S ACCOUNTS",
  (
    await sql(`user_credentials?user_id=in.(${BUYER.id},${MAKER.id})&select=id`)
  ).length === 0
);
check(
  "Z2 auth_identities untouched (1 row, the chunk 1.3 backfill)",
  (await sql("auth_identities?select=id")).length === 1
);

console.log("\n" + "=".repeat(74));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(74) + "\n");
process.exit(failed ? 1 : 0);
