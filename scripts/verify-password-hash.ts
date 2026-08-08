/**
 * CHUNK 2.2 VERIFICATION — app/lib/passwordHash.server.ts
 *
 * Run:  node --conditions=react-server scripts/verify-password-hash.ts
 *
 * ⚠️ WHY THE --conditions FLAG: passwordHash.server.ts starts with
 * `import "server-only"`, whose default export THROWS on purpose (that is how
 * it fails a build when a Client Component imports it). Next.js resolves it to
 * an empty module via the `react-server` export condition; this flag makes
 * plain Node do the same. Without it the import throws before a single test
 * runs. Node 24 executes .ts directly via type stripping, so no build step and
 * no test framework are needed — but the `@/` path alias does NOT resolve
 * under plain Node, hence the relative import below.
 *
 * COMMITTED, not a throwaway: this is what you re-run when the OWASP
 * parameters are raised or the library is swapped. A security module's proof
 * should not be a paragraph in a changelog.
 *
 * WHAT THIS SUITE IS FOR: every failure mode below produces a system that
 * WORKS PERFECTLY while being broken. Functional testing alone cannot find any
 * of them — a wrong variant, a static salt and a weak cost factor all log in
 * and out flawlessly. Each test targets one specific silent failure.
 */

import {
  hashPassword,
  verifyPasswordHash,
  needsRehash,
  ARGON2ID_PARAMS,
} from "../app/lib/passwordHash.server.ts";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const PASSWORD = "correct horse battery staple";

console.log("\nCHUNK 2.2 — argon2id hashing module verification");
console.log("=".repeat(72));

// ─────────────────────────────────────────────────────────────────────
console.log("\n[A] CORE ROUND TRIP — right password true, wrong password false");

const t0 = Date.now();
const hash = await hashPassword(PASSWORD);
const hashMs = Date.now() - t0;

check("A1 correct password verifies TRUE", (await verifyPasswordHash(PASSWORD, hash)) === true);
check("A2 wrong password verifies FALSE", (await verifyPasswordHash("wrong password", hash)) === false);
check("A3 near-miss (one char off) verifies FALSE", (await verifyPasswordHash("correct horse battery stapl", hash)) === false);
check("A4 empty password verifies FALSE", (await verifyPasswordHash("", hash)) === false);
check("A5 case-changed password verifies FALSE", (await verifyPasswordHash(PASSWORD.toUpperCase(), hash)) === false);

// ─────────────────────────────────────────────────────────────────────
console.log("\n[B] SALTING — the silent catastrophe (static salt = rainbow tables)");

const hashA = await hashPassword(PASSWORD);
const hashB = await hashPassword(PASSWORD);

check("B1 same password hashed twice gives DIFFERENT hashes", hashA !== hashB);

const saltOf = (h: string) => h.split("$")[4];
check("B2 the SALT segments differ (not just the digest)", saltOf(hashA) !== saltOf(hashB), `${saltOf(hashA)?.slice(0, 12)}… vs ${saltOf(hashB)?.slice(0, 12)}…`);
check("B3 both independently verify TRUE", (await verifyPasswordHash(PASSWORD, hashA)) && (await verifyPasswordHash(PASSWORD, hashB)));

const salts = new Set<string>();
for (let i = 0; i < 8; i++) salts.add(saltOf(await hashPassword(PASSWORD)));
check("B4 8 hashes produce 8 DISTINCT salts", salts.size === 8, `${salts.size}/8 unique`);

// ─────────────────────────────────────────────────────────────────────
console.log("\n[C] VARIANT / VERSION / PARAMETERS — read back OUT of the output");
console.log("      (proves configuration was APPLIED, not merely passed in)");

check("C1 encoded string starts with $argon2id$ (NOT argon2i or argon2d)", hash.startsWith("$argon2id$"), hash.slice(0, 10));
check("C2 argon2 version is v=19", hash.includes("$v=19$"));

const params = /\$m=(\d+),t=(\d+),p=(\d+)\$/.exec(hash);
const [, m, t, p] = params ?? [];

// ⚠️ Asserted against LITERAL numbers, deliberately NOT against
// ARGON2ID_PARAMS. Comparing the output to the module's own constant is
// circular — it would pass even if that constant had been set to something
// weak. These literals are the independent statement of what OWASP requires.
check("C3 memory cost m = 19456 KiB (19 MiB) [literal, not the module constant]", Number(m) === 19456, `m=${m}`);
check("C4 iterations t = 2 [literal]", Number(t) === 2, `t=${t}`);
check("C5 parallelism p = 1 [literal]", Number(p) === 1, `p=${p}`);
check("C6 module constant AGREES with the emitted hash", Number(m) === ARGON2ID_PARAMS.memorySize && Number(t) === ARGON2ID_PARAMS.iterations && Number(p) === ARGON2ID_PARAMS.parallelism);
check("C7 encoded length is plausible for a 32-byte hash + 16-byte salt", hash.length >= 90 && hash.length <= 110, `${hash.length} chars`);

// ─────────────────────────────────────────────────────────────────────
console.log("\n[D] TAMPERED / MALFORMED INPUT — must fail SAFELY, never throw, never true");

const flip = (h: string) => {
  const parts = h.split("$");
  const digest = parts[5];
  const swapped = digest[0] === "A" ? "B" : "A";
  parts[5] = swapped + digest.slice(1);
  return parts.join("$");
};

const cases: Array<[string, string]> = [
  ["D1 tampered digest (one char flipped)", flip(hash)],
  ["D2 tampered SALT segment", hash.replace(saltOf(hash)!, saltOf(hashA)!)],
  ["D3 truncated hash", hash.slice(0, hash.length - 10)],
  ["D4 empty string", ""],
  ["D5 garbage string", "not-a-hash-at-all"],
  ["D6 plausible-looking fake", "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
  ["D7 downgraded variant argon2i", hash.replace("$argon2id$", "$argon2i$")],
  ["D8 weakened params in the string", hash.replace(/m=\d+,t=\d+,p=\d+/, "m=8,t=1,p=1")],
];

for (const [name, bad] of cases) {
  let threw = false;
  let result: boolean | null = null;
  try {
    result = await verifyPasswordHash(PASSWORD, bad);
  } catch {
    threw = true;
  }
  check(`${name} → false, no throw`, threw === false && result === false, threw ? "THREW" : `returned ${result}`);
}

// null / undefined, forced past the type system the way a JS caller could
for (const [name, bad] of [["D9 null", null], ["D10 undefined", undefined]] as const) {
  let threw = false;
  let result: boolean | null = null;
  try {
    result = await verifyPasswordHash(PASSWORD, bad as unknown as string);
  } catch {
    threw = true;
  }
  check(`${name} stored value → false, no throw`, threw === false && result === false, threw ? "THREW" : `returned ${result}`);
}

// ─────────────────────────────────────────────────────────────────────
console.log("\n[E] ENCODING — unicode, whitespace, and the bcrypt 72-byte trap");

const unicode = "पासवर्ड🔐Ünïcodé";
const uHash = await hashPassword(unicode);
check("E1 Devanagari + emoji password round-trips TRUE", (await verifyPasswordHash(unicode, uHash)) === true);
check("E2 a different unicode password verifies FALSE", (await verifyPasswordHash("पासवर्ड🔐Unicode", uHash)) === false);

const spaced = "  padded password  ";
const sHash = await hashPassword(spaced);
check("E3 leading/trailing spaces are PRESERVED, not silently trimmed", (await verifyPasswordHash(spaced, sHash)) === true);
check("E4 the trimmed version does NOT verify (proves no hidden trim)", (await verifyPasswordHash(spaced.trim(), sHash)) === false);

// The classic bcrypt failure: silent truncation at 72 bytes. argon2 has no
// such limit, so a long password must NOT match its own 72-byte prefix.
const long = "A".repeat(100) + "-tail";
const longHash = await hashPassword(long);
check("E5 100+ byte password verifies TRUE", (await verifyPasswordHash(long, longHash)) === true);
check("E6 its 72-byte prefix does NOT verify (proves no bcrypt-style truncation)", (await verifyPasswordHash(long.slice(0, 72), longHash)) === false);

// ─────────────────────────────────────────────────────────────────────
console.log("\n[F] needsRehash — so cost factors can be raised without a flag day");

check("F1 current-parameter hash → FALSE", needsRehash(hash) === false);
check("F2 weakened memory → TRUE", needsRehash(hash.replace(/m=\d+/, "m=8")) === true);
check("F3 fewer iterations → TRUE", needsRehash(hash.replace(/t=\d+/, "t=1")) === true);
check("F4 different parallelism → TRUE", needsRehash(hash.replace(/p=\d+/, "p=4")) === true);
check("F5 non-argon2id variant → TRUE", needsRehash(hash.replace("$argon2id$", "$argon2i$")) === true);
check("F6 garbage → TRUE (cannot confirm current ⇒ replace)", needsRehash("nonsense") === true);

// ─────────────────────────────────────────────────────────────────────
console.log("\n[G] REAL WORK HAPPENED — a no-op/fallback implementation is instant");

check("G1 hashing took ≥ 10ms (19 MiB of memory-hard work is not free)", hashMs >= 10, `${hashMs}ms`);
check("G2 hashing took < 5000ms (not pathologically slow for a login)", hashMs < 5000, `${hashMs}ms`);

const vt0 = Date.now();
await verifyPasswordHash(PASSWORD, hash);
const rightMs = Date.now() - vt0;
const vt1 = Date.now();
await verifyPasswordHash("wrong password", hash);
const wrongMs = Date.now() - vt1;
// ⚠️ INDICATIVE ONLY, NOT PROOF. Constant-time behaviour cannot be
// established by two samples on a noisy machine. The real control is
// structural: verifyPasswordHash contains no comparison operator at all and
// delegates to the library's own argon2Verify.
console.log(`  NOTE  verify timing — correct ${rightMs}ms vs wrong ${wrongMs}ms (indicative only, not a constant-time proof)`);

// ─────────────────────────────────────────────────────────────────────
console.log("\n[H] NO PLAINTEXT LEAKAGE into the returned artefacts");

check("H1 the encoded hash does not contain the plaintext", !hash.includes(PASSWORD));
check("H2 the encoded hash does not contain the unicode plaintext", !uHash.includes(unicode));

console.log("\n" + "=".repeat(72));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
console.log("=".repeat(72) + "\n");

process.exit(failed === 0 ? 0 : 1);
