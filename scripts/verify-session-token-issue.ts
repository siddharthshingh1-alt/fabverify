/**
 * CHUNK 2.5b PIECE 1 — issueSessionToken() in isolation.
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-session-token-issue.ts
 *
 * ⚠️ NO DATABASE, NO NETWORK, NO SERVER. Token issuance is pure computation,
 * which is exactly why it is worth proving alone before anything consumes it.
 *
 * ⚠️ THE SIGNATURE IS CHECKED WITH `node:crypto`, NOT WITH `jose`. Verifying
 * jose's output using jose would only prove jose agrees with itself — a
 * self-consistent bug (wrong key, wrong algorithm, wrong signing input) would
 * pass. An independent HMAC-SHA256 computed by hand against the raw env
 * secret is what actually proves the token is signed with OUR secret using
 * the algorithm we pinned. Piece 2's verifier is not used here at all; it
 * does not exist yet, deliberately.
 */

import { readFileSync } from "node:fs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { execFileSync } from "node:child_process";

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1].trim();
};

// ⚠️ THE BOOT-CHILD GUARD IS LOAD-BEARING — DO NOT SIMPLIFY IT AWAY.
// Section [I] re-invokes this file as a subprocess with SESSION_TOKEN_SECRET
// deliberately deleted or emptied. Without this guard the child would read
// .env.local right here and hand the real secret straight back, so the two
// most important boot cases ("absent" and "empty") would silently test
// nothing and report a PASS. That is exactly what happened on the first run:
// `||=` skips a truthy value, so the whitespace and short-secret cases threw
// correctly while absent and empty were quietly repopulated.
if (!process.env.FABVERIFY_BOOT_CHILD) {
  process.env.SESSION_TOKEN_SECRET ||= envVar("SESSION_TOKEN_SECRET");
}
// Read from .env.local directly rather than from process.env: the child
// blanks the env var, but the independent HMAC check still needs the true
// value to compare against.
const RAW_SECRET = envVar("SESSION_TOKEN_SECRET");

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
const section = (t: string) => console.log(`\n${t}`);

const b64urlDecode = (segment: string): string =>
  Buffer.from(segment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

console.log("\nCHUNK 2.5b PIECE 1 — issueSessionToken (ISSUE ONLY, verify not built yet)");
console.log("=".repeat(74));

// ── CHILD MODE: boot-failure cases need a cold process (module-load throw) ──
if (process.argv.includes("--boot-child")) {
  try {
    await import("../app/lib/sessionToken.server.ts");
    console.log("CHILD:loaded");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`CHILD:threw:${message}`);
  }
  process.exit(0);
}

const { issueSessionToken, SESSION_TOKEN_CONTRACT } = await import(
  "../app/lib/sessionToken.server.ts"
);

const USER_A = "5b616a97-9d5d-4fd4-be4e-8fe7acecd613";
const USER_B = "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33";

const token = await issueSessionToken(USER_A, 0);
const [headerB64, payloadB64, signatureB64] = token.split(".");
const header = JSON.parse(b64urlDecode(headerB64));
const payload = JSON.parse(b64urlDecode(payloadB64));

// ─────────────────────────────────────────────────────────────────────────
section("[A] SHAPE — a compact JWS, three segments");

check("A1 token is a string", typeof token === "string");
check("A2 exactly three dot-separated segments", token.split(".").length === 3);
check("A3 all three segments are non-empty", [headerB64, payloadB64, signatureB64].every(Boolean));

// ─────────────────────────────────────────────────────────────────────────
section("[B] ALGORITHM PINNED — the exact algorithm, nothing swappable (D2/D3)");

check("B1 header.alg is exactly \"HS256\"", header.alg === "HS256", `alg=${JSON.stringify(header.alg)}`);
check("B2 header.alg is NOT \"none\"", header.alg !== "none");
check("B3 header.alg is NOT an RSA/EC algorithm", !/^(RS|ES|PS|Ed)/.test(String(header.alg)));
check("B4 header.typ is \"JWT\"", header.typ === "JWT", `typ=${JSON.stringify(header.typ)}`);
check(
  "B5 header carries NO key-selection field an attacker could steer (kid/jku/jwk/x5u)",
  !("kid" in header) && !("jku" in header) && !("jwk" in header) && !("x5u" in header),
  `header keys: ${Object.keys(header).join(",")}`
);
check(
  "B6 the module's pinned constant agrees with what was actually emitted",
  SESSION_TOKEN_CONTRACT.algorithm === header.alg
);
console.log(`        emitted header: ${JSON.stringify(header)}`);

// ─────────────────────────────────────────────────────────────────────────
section("[C] SIGNED WITH OUR SECRET — checked independently via node:crypto");

const expectedSignature = createHmac("sha256", RAW_SECRET)
  .update(`${headerB64}.${payloadB64}`)
  .digest();
const actualSignature = Buffer.from(
  signatureB64.replace(/-/g, "+").replace(/_/g, "/"),
  "base64"
);

check(
  "C1 ⚠️ signature is a valid HMAC-SHA256 over header.payload using OUR env secret",
  expectedSignature.length === actualSignature.length &&
    timingSafeEqual(expectedSignature, actualSignature),
  "computed independently with node:crypto, not with jose"
);

const wrongSignature = createHmac("sha256", "a-different-secret-".repeat(3))
  .update(`${headerB64}.${payloadB64}`)
  .digest();
check(
  "C2 …and a DIFFERENT secret produces a different signature (the check is meaningful)",
  !wrongSignature.equals(actualSignature)
);
check("C3 signature is 32 bytes (SHA-256 output)", actualSignature.length === 32);

// ─────────────────────────────────────────────────────────────────────────
section("[D] USER BINDING — the token names one account, inside the signature (D5)");

check("D1 sub is exactly the userId passed in", payload.sub === USER_A, payload.sub);

const tokenB = await issueSessionToken(USER_B, 0);
const payloadB = JSON.parse(b64urlDecode(tokenB.split(".")[1]));
check("D2 a different user gets a different sub", payloadB.sub === USER_B);
check("D3 …and therefore a different token", token !== tokenB);

// The D5 proof: swap A's sub for B's and the signature no longer matches.
const forgedPayload = Buffer.from(
  JSON.stringify({ ...payload, sub: USER_B }),
  "utf8"
)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");
const forgedExpected = createHmac("sha256", RAW_SECRET)
  .update(`${headerB64}.${forgedPayload}`)
  .digest();
check(
  "D4 ⚠️ rewriting sub from A to B BREAKS the signature — a token for A cannot become a token for B",
  !forgedExpected.equals(actualSignature),
  "the MAC covers the sub claim"
);

check(
  "D5 sub is validated at issue time — a non-UUID is refused",
  await (async () => {
    for (const bad of ["", "not-a-uuid", "12345", "'; DROP TABLE users;--"]) {
      try {
        await issueSessionToken(bad, 0);
        return false;
      } catch {
        /* expected */
      }
    }
    return true;
  })()
);
check(
  "D6 …including non-string subjects (undefined / null / number / object)",
  await (async () => {
    for (const bad of [undefined, null, 42, {}, []] as unknown[]) {
      try {
        await issueSessionToken(bad as string, 0);
        return false;
      } catch {
        /* expected */
      }
    }
    return true;
  })()
);

// ─────────────────────────────────────────────────────────────────────────
section("[E] EXPIRY — always present, and the right length (D4)");

check("E1 exp is present", typeof payload.exp === "number", `exp=${payload.exp}`);
check("E2 iat is present", typeof payload.iat === "number", `iat=${payload.iat}`);
check(
  "E3 exp − iat is exactly 7 days",
  payload.exp - payload.iat === 7 * 24 * 60 * 60,
  `${(payload.exp - payload.iat) / 86400} days`
);
check("E4 exp is in the future", payload.exp > Math.floor(Date.now() / 1000));
check(
  "E5 the module constant agrees with the emitted lifetime",
  SESSION_TOKEN_CONTRACT.ttlSeconds === payload.exp - payload.iat
);

// ─────────────────────────────────────────────────────────────────────────
section("[F] CLAIMS — issuer, audience, epoch, amr; and NOTHING ELSE");

check("F1 iss is \"fabverify\"", payload.iss === "fabverify", payload.iss);
check("F2 aud is \"fabverify-api\"", payload.aud === "fabverify-api", payload.aud);
check("F3 epoch is the value passed", payload.epoch === 0);
check("F4 amr records the authentication method", JSON.stringify(payload.amr) === '["pwd"]');

const epochToken = await issueSessionToken(USER_A, 7);
check(
  "F5 a different token_epoch is carried through",
  JSON.parse(b64urlDecode(epochToken.split(".")[1])).epoch === 7
);
check(
  "F6 a non-integer / negative epoch is refused",
  await (async () => {
    for (const bad of [-1, 1.5, NaN, "0", null, undefined] as unknown[]) {
      try {
        await issueSessionToken(USER_A, bad as number);
        return false;
      } catch {
        /* expected */
      }
    }
    return true;
  })()
);

const claimKeys = Object.keys(payload).sort();
check(
  "F7 ⚠️ the payload contains EXACTLY the seven expected claims — no extras",
  JSON.stringify(claimKeys) ===
    JSON.stringify(["amr", "aud", "epoch", "exp", "iat", "iss", "sub"]),
  claimKeys.join(",")
);
console.log(`        emitted payload: ${JSON.stringify(payload)}`);

// ─────────────────────────────────────────────────────────────────────────
section("[G] NO PII, AND NO SECRET, INSIDE THE TOKEN");

// A JWT payload is base64url, NOT encryption — anyone holding the token reads
// every claim. These are the real values from the two test accounts.
const PII = [
  "9999999991", "9999999992", "919999999991",
  "Anita", "anita@testbrand.com",
  "Ramesh", "ramesh@jaipur-ethnic.com",
  "buyer", "manufacturer",
];
const decodedWhole = `${b64urlDecode(headerB64)}${b64urlDecode(payloadB64)}`;
for (const value of PII) {
  check(`G1 token contains no PII: "${value}"`, !decodedWhole.includes(value));
}
check(
  "G2 ⚠️ the SIGNING SECRET does not appear anywhere in the token",
  !token.includes(RAW_SECRET) && !decodedWhole.includes(RAW_SECRET)
);
check(
  "G3 …nor any 16-char prefix of it",
  !token.includes(RAW_SECRET.slice(0, 16))
);

// ─────────────────────────────────────────────────────────────────────────
section("[H] NOTHING IS LOGGED (a token in a log file is a usable credential)");

const captured: string[] = [];
const realLog = console.log;
const realError = console.error;
const realWarn = console.warn;
console.log = (...a: unknown[]) => void captured.push(a.join(" "));
console.error = (...a: unknown[]) => void captured.push(a.join(" "));
console.warn = (...a: unknown[]) => void captured.push(a.join(" "));
await issueSessionToken(USER_A, 3);
try {
  await issueSessionToken("bad", 0);
} catch {
  /* expected */
}
console.log = realLog;
console.error = realError;
console.warn = realWarn;

check("H1 issuing logs nothing at all", captured.length === 0, `${captured.length} line(s)`);
check(
  "H2 …and a thrown error carries neither the secret nor the subject",
  await (async () => {
    try {
      await issueSessionToken("not-a-uuid-at-all", 0);
    } catch (error) {
      const m = error instanceof Error ? error.message : String(error);
      return !m.includes(RAW_SECRET) && !m.includes("not-a-uuid-at-all");
    }
    return false;
  })()
);

// ─────────────────────────────────────────────────────────────────────────
section("[I] SECRET COMES FROM ENV AND FAILS CLOSED AT BOOT (D12)");

function bootWith(secretValue: string | undefined, label: string) {
  const childEnv = { ...process.env };
  if (secretValue === undefined) delete childEnv.SESSION_TOKEN_SECRET;
  else childEnv.SESSION_TOKEN_SECRET = secretValue;
  // FABVERIFY_BOOT_CHILD stops the child re-reading .env.local over our value.
  childEnv.FABVERIFY_BOOT_CHILD = "1";
  const out = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "./scripts/register-ts-resolve.mjs",
      "scripts/verify-session-token-issue.ts",
      "--boot-child",
    ],
    { encoding: "utf8", env: childEnv }
  );
  const threw = out.includes("CHILD:threw");
  console.log(`        ${label.padEnd(30)} ${threw ? "THREW" : "LOADED"}`);
  return { threw, message: /CHILD:threw:(.*)/.exec(out)?.[1] ?? "" };
}

const bootMissing = bootWith(undefined, "secret absent");
check("I1 ⚠️ missing secret → module load THROWS (no placeholder fallback)", bootMissing.threw);
check(
  "I2 …and the error says how to generate one",
  bootMissing.message.includes("randomBytes")
);

check("I3 empty secret → THROWS", bootWith("", "secret empty").threw);
check("I4 whitespace-only secret → THROWS", bootWith("     ", "secret whitespace").threw);
check("I5 short secret → THROWS", bootWith("tooshort", "secret 8 chars").threw);
check(
  "I6 31 chars (one under the floor) → THROWS",
  bootWith("a".repeat(31), "secret 31 chars").threw
);
check(
  "I7 ⚠️ placeholder-looking secret → THROWS (length alone is not enough)",
  bootWith("placeholder-session-token-secret-value", "secret 'placeholder…'").threw
);
check(
  "I8 a real 64-char random secret → loads fine (the checks are not just refusing everything)",
  !bootWith(RAW_SECRET, "real secret").threw
);

check(
  "I9 ⚠️ the secret is NOT hardcoded anywhere in the source",
  !readFileSync("app/lib/sessionToken.server.ts", "utf8").includes(RAW_SECRET)
);
check(
  "I10 …and the module reads it from process.env, not from a file or the database",
  /process\.env\.SESSION_TOKEN_SECRET/.test(
    readFileSync("app/lib/sessionToken.server.ts", "utf8")
  )
);
check(
  "I11 …and never exports it",
  !/export\s+(const|let|function)\s+\w*(SECRET|SIGNING_KEY)/.test(
    readFileSync("app/lib/sessionToken.server.ts", "utf8")
  )
);

console.log("\n" + "=".repeat(74));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(74) + "\n");
process.exit(failed ? 1 : 0);
