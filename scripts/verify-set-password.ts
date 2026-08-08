/**
 * CHUNK 2.4 VERIFICATION — POST /api/account/password
 *
 * Run:  npm run dev        (in another terminal, must be `next dev`)
 *       node --conditions=react-server scripts/verify-set-password.ts
 *
 * ⚠️ THE --conditions FLAG IS REQUIRED. This suite imports verifyPasswordHash
 * to assert independently that a stored hash really is a hash OF the password
 * that was set — and passwordHash.server.ts starts with `import "server-only"`,
 * whose default export throws on purpose. Next.js resolves it to an empty
 * module via the `react-server` export condition; this flag makes plain Node
 * do the same. Without it the import throws before a single test runs. That
 * throw is the server-only guard working, not a defect.
 *
 * ⚠️ REQUIRES `next dev`, NOT `next start`. The suite authenticates with the
 * `x-dev-phone` header, which app/lib/auth.ts accepts only when NODE_ENV is
 * "development". That is a deliberate gate, not a shortcut — and it is why
 * running this against a production build returns 401 on everything.
 *
 * WHY LOCALHOST IS SUFFICIENT HERE, stated because this project has been
 * burned by the opposite assumption: nothing in this route sits behind a
 * production-only branch. Ownership derivation, the re-verification gate,
 * policy validation, hashing and the write are byte-identical in dev and
 * production. The ONLY difference is how the caller proved their identity,
 * and that path was proven end-to-end with a real production token in chunks
 * 1.5/1.9. Compare AuthGuard stage 2 and apiClient's token branch, which
 * genuinely cannot be reached from localhost and are still recorded unproven.
 *
 * ⚠️ THIS SUITE WRITES REAL ROWS to user_credentials for two dev-bypass test
 * accounts, then deletes them. It does NOT touch the artisan account
 * (9654324268) — that account's unlinked state is a single-use test condition
 * reserved for item 1's outstanding production session.
 *
 * Reads Supabase keys from .env.local at runtime; embeds no secrets.
 */

import { readFileSync } from "node:fs";

// ── ENVIRONMENT ──────────────────────────────────────────────────────────

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1].trim();
};

const SUPABASE_URL = envVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = envVar("SUPABASE_SERVICE_ROLE_KEY");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const BUYER = {
  phone: "9999999991",
  id: "5b616a97-9d5d-4fd4-be4e-8fe7acecd613",
  label: "buyer (Anita)",
};
const MAKER = {
  phone: "9999999992",
  id: "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33",
  label: "manufacturer (Ramesh)",
};

// Passwords used throughout. All clear the policy; each is distinct so a
// stale hash can never be mistaken for a fresh one.
const PW_FIRST = "orchid-lantern-monsoon-77";
const PW_SECOND = "granite-harbour-velvet-08";
const PW_THIRD = "juniper-cascade-ribbon-31";
const PW_MAKER = "saffron-thicket-marble-64";

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

// ── SERVICE-ROLE DB ACCESS (bypasses RLS — sees what anon cannot) ────────

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

type CredentialRow = {
  id: string;
  user_id: string;
  credential_type: string;
  password_hash: string;
  token_epoch: number;
  failed_attempts: number;
  must_change_password: boolean;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
};

const credentialsFor = (userId: string): Promise<CredentialRow[]> =>
  sql(`user_credentials?user_id=eq.${userId}&select=*`);

const allCredentials = (): Promise<CredentialRow[]> =>
  sql("user_credentials?select=*");

const deleteCredentials = (userId: string) =>
  sql(`user_credentials?user_id=eq.${userId}`, { method: "DELETE" });

async function usersFingerprint(): Promise<string> {
  const rows = await sql("users?select=*&order=id");
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 16);
}

// ── THE ROUTE UNDER TEST ─────────────────────────────────────────────────

async function setPassword(
  actor: { phone: string } | null,
  body: unknown,
  extraHeaders: Record<string, string> = {}
) {
  const response = await fetch(`${BASE}/api/account/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(actor ? { "x-dev-phone": actor.phone } : {}),
      ...extraHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  let json: Record<string, unknown> = {};
  try {
    json = await response.json();
  } catch {
    /* empty body is fine for some statuses */
  }
  return { status: response.status, json };
}

// ── RUN ──────────────────────────────────────────────────────────────────

console.log("\nCHUNK 2.4 — set-password endpoint verification");
console.log("=".repeat(72));

// Preflight: the server must be reachable AND in dev mode, or every result
// below is meaningless.
const preflight = await fetch(`${BASE}/api/test-db`).catch(() => null);
if (!preflight || !preflight.ok) {
  console.error(`\nABORT: ${BASE} is not answering. Start \`npm run dev\` first.\n`);
  process.exit(1);
}

const fingerprintBefore = await usersFingerprint();
console.log(`users fingerprint (before): ${fingerprintBefore}`);

// Start from a known-clean slate so no earlier run can mask a failure.
await deleteCredentials(BUYER.id);
await deleteCredentials(MAKER.id);
check(
  "PRE  user_credentials is empty for both test accounts",
  (await allCredentials()).filter((r) => [BUYER.id, MAKER.id].includes(r.user_id))
    .length === 0
);

// ─────────────────────────────────────────────────────────────────────────
section("[A] FIRST-TIME SET — session alone is sufficient (DB shows no credential)");

const a1 = await setPassword(BUYER, { password: PW_FIRST });
check("A1 first-time set returns 200", a1.status === 200, `status ${a1.status}`);
check("A2 response reports created=true", a1.json.created === true);

const buyerRows = await credentialsFor(BUYER.id);
check("A3 exactly ONE credential row exists", buyerRows.length === 1, `${buyerRows.length} row(s)`);
check("A4 row is owned by the buyer's users.id", buyerRows[0]?.user_id === BUYER.id);
check("A5 credential_type is 'password'", buyerRows[0]?.credential_type === "password");

const storedHash = buyerRows[0]?.password_hash ?? "";
check(
  "A6 stored value is an argon2id PHC string",
  /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/.test(storedHash),
  storedHash.slice(0, 34)
);
check("A7 stored value is NOT the plaintext", storedHash !== PW_FIRST);
check(
  "A8 plaintext appears NOWHERE in the stored row",
  !JSON.stringify(buyerRows[0]).includes(PW_FIRST)
);

const { verifyPasswordHash } = await import("../app/lib/passwordHash.server.ts");
check(
  "A9 the stored hash genuinely verifies the password that was set",
  (await verifyPasswordHash(PW_FIRST, storedHash)) === true
);
check(
  "A10 the stored hash does NOT verify a different password",
  (await verifyPasswordHash(PW_SECOND, storedHash)) === false
);
check("A11 password_changed_at was set", Boolean(buyerRows[0]?.password_changed_at));
check("A12 token_epoch starts at 0 on first-time set", buyerRows[0]?.token_epoch === 0);
check("A13 must_change_password is false", buyerRows[0]?.must_change_password === false);

// ─────────────────────────────────────────────────────────────────────────
section("[C] CHANGE — re-verification is mandatory once a credential exists");

const hashBeforeChange = storedHash;

const c1 = await setPassword(BUYER, { password: PW_SECOND });
check("C1 change WITHOUT currentPassword → 403", c1.status === 403, `status ${c1.status}`);
check(
  "C2 …and the stored hash is byte-identical (nothing written)",
  (await credentialsFor(BUYER.id))[0]?.password_hash === hashBeforeChange
);

const c3 = await setPassword(BUYER, {
  password: PW_SECOND,
  currentPassword: "definitely-not-the-password",
});
check("C3 change with WRONG currentPassword → 403", c3.status === 403, `status ${c3.status}`);
check(
  "C4 …and the stored hash is still byte-identical",
  (await credentialsFor(BUYER.id))[0]?.password_hash === hashBeforeChange
);

const c5 = await setPassword(BUYER, { password: PW_SECOND, currentPassword: "" });
check("C5 change with EMPTY currentPassword → 403", c5.status === 403, `status ${c5.status}`);

const c6 = await setPassword(BUYER, {
  password: PW_SECOND,
  currentPassword: PW_FIRST,
});
check("C6 change WITH correct currentPassword → 200", c6.status === 200, `status ${c6.status}`);
check("C7 response reports created=false (a change, not a create)", c6.json.created === false);

const afterChange = await credentialsFor(BUYER.id);
check("C8 still exactly ONE row — replaced, not duplicated", afterChange.length === 1);
check("C9 the hash actually changed", afterChange[0]?.password_hash !== hashBeforeChange);
check(
  "C10 the OLD password no longer verifies",
  (await verifyPasswordHash(PW_FIRST, afterChange[0].password_hash)) === false
);
check(
  "C11 the NEW password verifies",
  (await verifyPasswordHash(PW_SECOND, afterChange[0].password_hash)) === true
);
check(
  "C12 token_epoch incremented 0 → 1 on change (DECISIONS I12; inert until 2.5)",
  afterChange[0]?.token_epoch === 1,
  `epoch ${afterChange[0]?.token_epoch}`
);

// ─────────────────────────────────────────────────────────────────────────
section("[B] CROSS-ACCOUNT — the caller can only ever touch their own account");

const b1 = await setPassword(null, { password: PW_MAKER });
check("B1 unauthenticated → 401", b1.status === 401, `status ${b1.status}`);
check(
  "B2 …and no credential was created for anyone new",
  (await credentialsFor(MAKER.id)).length === 0
);

// The impersonation shape from Groups 2b/2c: authenticate as one account
// while the body names another.
const hashBeforeImpersonation = (await credentialsFor(BUYER.id))[0].password_hash;
const b3 = await setPassword(BUYER, {
  password: PW_MAKER,
  currentPassword: PW_SECOND,
  // Every identity field an attacker might hope is honoured:
  phone: MAKER.phone,
  userId: MAKER.id,
  user_id: MAKER.id,
  id: MAKER.id,
});
check("B3 body naming ANOTHER account still returns 200 (fields ignored)", b3.status === 200);
check(
  "B4 …the manufacturer STILL has no credential — body was ignored",
  (await credentialsFor(MAKER.id)).length === 0
);
const afterImpersonation = await credentialsFor(BUYER.id);
check(
  "B5 …the write landed on the AUTHENTICATED caller instead",
  afterImpersonation.length === 1 &&
    afterImpersonation[0].user_id === BUYER.id &&
    afterImpersonation[0].password_hash !== hashBeforeImpersonation
);
check(
  "B6 …and it is the caller's own credential that now holds the new password",
  (await verifyPasswordHash(PW_MAKER, afterImpersonation[0].password_hash)) === true
);

// The manufacturer sets their own password — proves accounts are independent.
const b7 = await setPassword(MAKER, { password: PW_MAKER });
check("B7 a DIFFERENT account can set its own password → 200", b7.status === 200);
check("B8 …creating its own separate row", (await credentialsFor(MAKER.id)).length === 1);
check(
  "B9 …and the two accounts' hashes differ despite the same plaintext (per-user salt)",
  (await credentialsFor(MAKER.id))[0].password_hash !==
    (await credentialsFor(BUYER.id))[0].password_hash
);

// ─────────────────────────────────────────────────────────────────────────
section("[G] BYPASS — a CHANGE cannot be disguised as a first-time set");

const buyerHashNow = (await credentialsFor(BUYER.id))[0].password_hash;
const buyerEpochNow = (await credentialsFor(BUYER.id))[0].token_epoch;

// V1: steering credential_type would make the existence lookup miss.
const g1 = await setPassword(BUYER, { password: PW_THIRD, credential_type: "password2" });
check("G1 body credential_type='password2' → still 403 (V1 closed)", g1.status === 403, `status ${g1.status}`);

const g2 = await setPassword(BUYER, { password: PW_THIRD, credentialType: "other" });
check("G2 body credentialType='other' → still 403", g2.status === 403, `status ${g2.status}`);

const g3 = await setPassword(BUYER, {
  password: PW_THIRD,
  isFirstTime: true,
  hasPassword: false,
  firstTime: true,
  skipVerification: true,
  force: true,
});
check("G3 caller-asserted 'first time' flags → still 403", g3.status === 403, `status ${g3.status}`);

const allRowsNow = await allCredentials();
check(
  "G4 no SECOND credential row was created by any of those attempts",
  allRowsNow.filter((r) => r.user_id === BUYER.id).length === 1,
  `${allRowsNow.filter((r) => r.user_id === BUYER.id).length} row(s)`
);
check(
  "G5 no row of any other credential_type exists",
  allRowsNow.every((r) => r.credential_type === "password")
);
check(
  "G6 the buyer's hash is unchanged after every bypass attempt",
  (await credentialsFor(BUYER.id))[0].password_hash === buyerHashNow
);
check(
  "G7 token_epoch did not move either",
  (await credentialsFor(BUYER.id))[0].token_epoch === buyerEpochNow
);

// The transition first-time → change must be immediate, not cached.
await deleteCredentials(MAKER.id);
const g8a = await setPassword(MAKER, { password: PW_MAKER });
const g8b = await setPassword(MAKER, { password: PW_THIRD });
check("G8 fresh account: first set 200, immediate second set → 403", g8a.status === 200 && g8b.status === 403, `${g8a.status} then ${g8b.status}`);

// Deleting one account's credential must not affect the other's gate.
const g9 = await setPassword(BUYER, { password: PW_THIRD });
check("G9 buyer still gated after the manufacturer's row was deleted", g9.status === 403);

// ─────────────────────────────────────────────────────────────────────────
section("[D] POLICY — weak and malformed passwords rejected, passphrases allowed");

await deleteCredentials(MAKER.id);
const weak: Array<[string, string]> = [
  ["D1 too short (11 chars)", "Short1thing"],
  ["D2 common word repeated", "passwordpassword"],
  // Non-sequential digits on purpose: "password123456" is caught by the
  // SEQUENCE rule first, so it would never exercise the weak-base-plus-digits
  // rule it is named after.
  ["D3 common word + digits", "password928374"],
  ["D4 keyboard walk", "qwertyuiopasdf"],
  ["D5 number sequence", "0123456789012"],
  ["D6 too few distinct characters", "ababababababab"],
  ["D7 leetspeak common word", "P@ssw0rdP@ssw0rd"],
  ["D8 contains own phone number", `my9999999992pass`],
  ["D9 contains own name", "rameshkumar-secure-1"],
  // No sequential run and plenty of distinct characters, so this reaches the
  // MAX-LENGTH rule rather than being rejected earlier for another reason.
  ["D10 over max length (138)", "vellum-harbour-monsoon-".repeat(6)],
];

// ⚠️ EACH ITERATION IS ISOLATED. If a weak password is wrongly ACCEPTED, it
// creates a credential, and every later case then hits the change-gate and
// fails with a misleading 403 instead of its own result. That happened on the
// first run of this suite and turned one real finding into eight confusing
// failures. Cleaning up per-iteration keeps each case independently readable.
for (const [name, pw] of weak) {
  const result = await setPassword(MAKER, { password: pw });
  const detail = `status ${result.status} · ${String(result.json.error ?? "").slice(0, 52)}`;
  check(name + " → 400", result.status === 400, detail);

  if (result.status === 200) {
    console.log(`        ⚠️  ACCEPTED a password that must be rejected: ${pw}`);
    await deleteCredentials(MAKER.id);
  }
}
check(
  "D11 no credential row was created by ANY rejected password",
  (await credentialsFor(MAKER.id)).length === 0
);

const d12 = await setPassword(MAKER, {
  password: "the quick brown vellum drifts over nine sleeping harbours",
});
check("D12 a 57-character passphrase is ACCEPTED → 200", d12.status === 200, `status ${d12.status}`);
const passphraseHash = (await credentialsFor(MAKER.id))[0].password_hash;
check(
  "D13 …and it is not truncated (its 20-char prefix does NOT verify)",
  (await verifyPasswordHash("the quick brown vell", passphraseHash)) === false
);
check(
  "D14 …while the full passphrase does verify",
  (await verifyPasswordHash("the quick brown vellum drifts over nine sleeping harbours", passphraseHash)) === true
);

// ─────────────────────────────────────────────────────────────────────────
section("[H] MALFORMED REQUESTS — 400, never 500");

const h1 = await setPassword(BUYER, "not json at all");
check("H1 non-JSON body → 400", h1.status === 400, `status ${h1.status}`);

const h2 = await setPassword(BUYER, {});
check("H2 missing password field → 400", h2.status === 400, `status ${h2.status}`);

const h3 = await setPassword(BUYER, { password: 12345678901234 });
check("H3 non-string password → 400", h3.status === 400, `status ${h3.status}`);

const h4 = await setPassword(BUYER, { password: null });
check("H4 null password → 400", h4.status === 400, `status ${h4.status}`);

const h5 = await fetch(`${BASE}/api/account/password`, {
  method: "GET",
  headers: { "x-dev-phone": BUYER.phone },
});
check("H5 GET on the route → 405", h5.status === 405, `status ${h5.status}`);

// ─────────────────────────────────────────────────────────────────────────
section("[E] NO LEAK — the credential is unreachable from the users row");

const lookup = await fetch(`${BASE}/api/dev-auth/lookup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: BUYER.phone }),
});
const lookupBody = await lookup.text();
check("E1 /api/dev-auth/lookup still answers 200", lookup.status === 200);
check(
  "E2 …and its response contains NO password_hash / credential field",
  !/password_hash|credential|token_epoch/i.test(lookupBody)
);
check(
  "E3 …and no argon2 material of any kind (the [I10] guarantee)",
  !lookupBody.includes("$argon2")
);

const anonRead = await fetch(`${SUPABASE_URL}/rest/v1/user_credentials?select=*`, {
  headers: {
    apikey: envVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    Authorization: `Bearer ${envVar("NEXT_PUBLIC_SUPABASE_ANON_KEY")}`,
  },
});
const anonRows = await anonRead.json();
check(
  "E4 anon key reads ZERO rows from user_credentials even though rows exist (RLS deny-all)",
  Array.isArray(anonRows) && anonRows.length === 0,
  `anon saw ${Array.isArray(anonRows) ? anonRows.length : "?"} of ${(await allCredentials()).length} real rows`
);

// ─────────────────────────────────────────────────────────────────────────
section("[F] NON-REGRESSION — nothing outside user_credentials was touched");

// ⚠️ `?phone=` is REQUIRED by this route (400 without it, before auth runs).
// Omitting it made the first run report a false regression.
const ordersOwn = await fetch(`${BASE}/api/orders?phone=${BUYER.phone}`, {
  headers: { "x-dev-phone": BUYER.phone },
});
check("F1 GET /api/orders authenticated → 200", ordersOwn.status === 200, `status ${ordersOwn.status}`);

const ordersAnon = await fetch(`${BASE}/api/orders?phone=${BUYER.phone}`);
check("F2 GET /api/orders anonymous → 401", ordersAnon.status === 401, `status ${ordersAnon.status}`);

const ordersCross = await fetch(`${BASE}/api/orders?phone=${MAKER.phone}`, {
  headers: { "x-dev-phone": BUYER.phone },
});
check("F2b GET /api/orders cross-account → 403", ordersCross.status === 403, `status ${ordersCross.status}`);

const convOwn = await fetch(`${BASE}/api/conversations?phone=${BUYER.phone}`, {
  headers: { "x-dev-phone": BUYER.phone },
});
check("F3 GET /api/conversations own → 200", convOwn.status === 200, `status ${convOwn.status}`);

const convCross = await fetch(`${BASE}/api/conversations?phone=${MAKER.phone}`, {
  headers: { "x-dev-phone": BUYER.phone },
});
check("F4 GET /api/conversations cross-account → 403", convCross.status === 403, `status ${convCross.status}`);

const authIdentities = await sql("auth_identities?select=id");
check(
  "F5 auth_identities still has exactly 1 row (password writes none — I11)",
  authIdentities.length === 1,
  `${authIdentities.length} row(s)`
);

// ── CLEANUP ──────────────────────────────────────────────────────────────
await deleteCredentials(BUYER.id);
await deleteCredentials(MAKER.id);

check("Z1 cleanup: user_credentials is empty again", (await allCredentials()).length === 0);

const fingerprintAfter = await usersFingerprint();
check(
  "Z2 users table byte-identical before and after the whole run",
  fingerprintAfter === fingerprintBefore,
  `${fingerprintBefore} → ${fingerprintAfter}`
);

console.log("\n" + "=".repeat(72));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(72) + "\n");
process.exit(failed ? 1 : 0);
