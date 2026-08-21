/**
 * CHUNK 2.5b — THE FULL NO-BYPASS SUITE. Issue + verify together.
 *
 * Run:  node --conditions=react-server --import ./scripts/register-ts-resolve.mjs \
 *            scripts/verify-session-token.ts
 *
 * ⚠️ NO DATABASE, NO NETWORK, NO SERVER — deliberately. Token verification is
 * pure computation, so every attack in the D-register can be proven exactly,
 * with no flakiness and no environment to blame. That is precisely why the
 * epoch and account-existence checks (D10, D11) are NOT in the verifier: they
 * need a database, and keeping them out is what makes this matrix decisive.
 *
 * ⚠️ HOSTILE TOKENS ARE FORGED BY HAND HERE, not produced by our own issuer.
 * A suite that only feeds a verifier its own issuer's output tests agreement,
 * not security — an attacker does not use our SignJWT. Every attack token
 * below is assembled from raw base64url segments with `node:crypto`, exactly
 * as an attacker would.
 */

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

const env = readFileSync(".env.local", "utf8");
const envVar = (key: string): string => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1].trim();
};

process.env.SESSION_TOKEN_SECRET ||= envVar("SESSION_TOKEN_SECRET");
const SECRET = envVar("SESSION_TOKEN_SECRET");

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

// ── HAND-ROLLED JWT FORGERY (what an attacker actually does) ─────────────

const b64url = (input: string | Buffer): string =>
  Buffer.from(input as never)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const b64urlJson = (o: unknown) => b64url(JSON.stringify(o));

/** Assemble a token from arbitrary header/payload, signed with any key — or not at all. */
function forge(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  options: { key?: string | null; signature?: string } = {}
): string {
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  if (options.signature !== undefined) return `${h}.${p}.${options.signature}`;
  if (options.key === null) return `${h}.${p}.`; // alg:none — empty signature
  const sig = createHmac("sha256", options.key ?? SECRET)
    .update(`${h}.${p}`)
    .digest();
  return `${h}.${p}.${b64url(sig)}`;
}

const now = () => Math.floor(Date.now() / 1000);

// Typed as `string`, not inferred as literals: test 6b deliberately asserts
// that A's token never resolves to B, and with literal types TypeScript
// narrows that comparison to "provably never equal" and errors on it. The
// runtime check is the point — it must survive the type checker.
const USER_A: string = "5b616a97-9d5d-4fd4-be4e-8fe7acecd613";
const USER_B: string = "f75076b6-f801-4cf4-abaf-6ecbfa1c5b33";

/** The exact claim set our issuer emits — the baseline every attack mutates. */
const validClaims = (overrides: Record<string, unknown> = {}) => ({
  epoch: 0,
  amr: ["pwd"],
  iss: "fabverify",
  aud: "fabverify-api",
  sub: USER_A,
  iat: now(),
  exp: now() + 604800,
  ...overrides,
});

const VALID_HEADER = { alg: "HS256", typ: "JWT" };

console.log("\nCHUNK 2.5b — FULL NO-BYPASS SUITE (issue + verify)");
console.log("=".repeat(74));

const { issueSessionToken, verifySessionToken } = await import(
  "../app/lib/sessionToken.server.ts"
);

/** Assert a token is refused, with the generic shape and no throw. */
async function mustReject(name: string, token: unknown, note = "") {
  let result: unknown;
  let threw = false;
  try {
    result = await verifySessionToken(token);
  } catch {
    threw = true;
  }
  const rejected = !threw && JSON.stringify(result) === '{"ok":false}';
  check(name, rejected, threw ? "⚠️ THREW instead of returning {ok:false}" : note);
}

// ═════════════════════════════════════════════════════════════════════════
section("[1] VALID TOKEN → resolves to the RIGHT user");

const validA = await issueSessionToken(USER_A, 0);
const r1 = await verifySessionToken(validA);
check("1a a token from our own issuer verifies", r1.ok === true);
check("1b …and resolves to the user it was minted for", r1.ok && r1.userId === USER_A, r1.ok ? r1.userId : "n/a");
check("1c …carrying the token_epoch it was minted under", r1.ok && r1.epoch === 0);

const validB = await issueSessionToken(USER_B, 3);
const r1b = await verifySessionToken(validB);
check("1d a second user's token resolves to THAT user", r1b.ok && r1b.userId === USER_B);
check("1e …with that user's epoch", r1b.ok && r1b.epoch === 3);
check(
  "1f the two tokens do not resolve to the same account",
  r1.ok && r1b.ok && r1.userId !== r1b.userId
);

// ═════════════════════════════════════════════════════════════════════════
section("[2] TAMPERED TOKEN (payload changed) → REJECTED");

const [vh, vp, vs] = validA.split(".");

await mustReject(
  "2a epoch bumped in the payload, original signature kept",
  `${vh}.${b64urlJson({ ...JSON.parse(Buffer.from(vp, "base64url").toString()), epoch: 999 })}.${vs}`
);
await mustReject(
  "2b expiry extended by a year, original signature kept",
  `${vh}.${b64urlJson(validClaims({ exp: now() + 31536000 }))}.${vs}`
);
await mustReject("2c a single character flipped in the payload segment",
  `${vh}.${vp.slice(0, -1)}${vp.slice(-1) === "A" ? "B" : "A"}.${vs}`);
await mustReject("2d a single character flipped in the signature segment",
  `${vh}.${vp}.${vs.slice(0, -1)}${vs.slice(-1) === "A" ? "B" : "A"}`);
await mustReject("2e signature segment removed entirely", `${vh}.${vp}.`);
await mustReject("2f signature replaced with an empty string", `${vh}.${vp}.${""}`);

// ═════════════════════════════════════════════════════════════════════════
section("[3] FORGED TOKEN / WRONG SECRET → REJECTED");

await mustReject(
  "3a perfectly well-formed claims, signed with a DIFFERENT secret",
  forge(VALID_HEADER, validClaims(), { key: "an-attacker-secret-".repeat(4) }),
  "the whole token is valid except the key"
);
await mustReject(
  "3b signed with a near-miss secret (one character off)",
  forge(VALID_HEADER, validClaims(), { key: SECRET.slice(0, -1) + (SECRET.slice(-1) === "a" ? "b" : "a") })
);
await mustReject(
  "3c signed with an empty secret",
  forge(VALID_HEADER, validClaims(), { key: "" })
);
await mustReject(
  "3d random bytes pasted in as the signature",
  forge(VALID_HEADER, validClaims(), { signature: b64url(Buffer.alloc(32, 7)) })
);

// ═════════════════════════════════════════════════════════════════════════
section("[4] ⚠️ ALGORITHM CONFUSION → REJECTED (the critical one)");

await mustReject(
  '4a ⚠️ alg:"none" with the signature stripped — THE classic total bypass',
  forge({ alg: "none", typ: "JWT" }, validClaims(), { key: null }),
  "claims are otherwise perfectly valid"
);
await mustReject(
  '4b alg:"none" with a junk signature attached',
  forge({ alg: "none", typ: "JWT" }, validClaims(), { signature: "anything" })
);
await mustReject(
  '4c alg:"NONE" (uppercase — case-based filter evasion)',
  forge({ alg: "NONE", typ: "JWT" }, validClaims(), { key: null })
);
await mustReject(
  '4d alg:"nOnE" (mixed case)',
  forge({ alg: "nOnE", typ: "JWT" }, validClaims(), { key: null })
);
/** A token whose header claims `alg` and whose signature is a GENUINELY valid
 *  MAC under that algorithm, using our real secret. The strongest form of the
 *  substitution attack: everything is correct except the algorithm. */
function forgeWithAlgorithm(alg: string, hash: string): string {
  const h = b64urlJson({ alg, typ: "JWT" });
  const p = b64urlJson(validClaims());
  const sig = createHmac(hash, SECRET).update(`${h}.${p}`).digest();
  return `${h}.${p}.${b64url(sig)}`;
}

await mustReject(
  "4e ⚠️ alg swapped to HS512, correctly signed with OUR real secret",
  forgeWithAlgorithm("HS512", "sha512"),
  "a genuinely valid HS512 MAC — only the algorithm differs"
);
await mustReject(
  "4f alg swapped to HS384, correctly signed with our real secret",
  forgeWithAlgorithm("HS384", "sha384")
);
await mustReject(
  "4g ⚠️ alg:RS256 with an HMAC signature (HS/RS substitution attack)",
  forge({ alg: "RS256", typ: "JWT" }, validClaims())
);
await mustReject(
  "4h alg:ES256 with an HMAC signature",
  forge({ alg: "ES256", typ: "JWT" }, validClaims())
);
// ── KEY-SELECTION HEADERS ────────────────────────────────────────────────
// ⚠️ THE FIRST VERSION OF 4i–4k TESTED THE WRONG PROPERTY and is worth
// recording. It forged these headers onto tokens signed with our REAL secret
// and demanded rejection. Those tokens are correctly signed, so accepting them
// is right — and an attacker cannot build one without the secret, at which
// point the header fields are the least of the problem.
//
// The actual danger of kid/jwk/jku is that a verifier RESOLVES THE SIGNING KEY
// FROM THEM — attacker-controlled data choosing the key that checks the
// attacker's signature. We pass a fixed key, so they should be inert. That is
// the property worth proving, and it needs the header to point at a key the
// attacker actually signed with.
const ATTACKER_KEY = "attacker-controlled-key-attacker-controlled-key";

await mustReject(
  "4i ⚠️ jwk header embedding an ATTACKER key, signed with that key",
  forge(
    { alg: "HS256", typ: "JWT", jwk: { kty: "oct", k: b64url(ATTACKER_KEY) } },
    validClaims(),
    { key: ATTACKER_KEY }
  ),
  "the header must not be able to nominate the verifying key"
);
await mustReject(
  "4j ⚠️ jku header pointing at a remote key, signed with an attacker key",
  forge(
    { alg: "HS256", typ: "JWT", jku: "https://attacker.example/keys.json" },
    validClaims(),
    { key: ATTACKER_KEY }
  )
);
await mustReject(
  "4k ⚠️ kid header naming another key, signed with an attacker key",
  forge(
    { alg: "HS256", typ: "JWT", kid: "attacker-key-1" },
    validClaims(),
    { key: ATTACKER_KEY }
  )
);
const inertHeaders = await verifySessionToken(
  forge({ alg: "HS256", typ: "JWT", kid: "ignored", jku: "https://x/y" }, validClaims())
);
check(
  "4l …while the SAME headers on a token signed with our real key are simply IGNORED",
  inertHeaders.ok === true,
  "proves the fields are inert decoration, not a key-selection channel"
);
await mustReject("4m alg omitted from the header entirely",
  forge({ typ: "JWT" } as Record<string, unknown>, validClaims()));

// ═════════════════════════════════════════════════════════════════════════
section("[5] EXPIRED TOKEN → REJECTED");

await mustReject(
  "5a expired one hour ago, correctly signed",
  forge(VALID_HEADER, validClaims({ iat: now() - 7200, exp: now() - 3600 }))
);
await mustReject(
  "5b expired one second ago (boundary, beyond clock tolerance)",
  forge(VALID_HEADER, validClaims({ exp: now() - 60 }))
);
await mustReject(
  "5c ⚠️ exp claim REMOVED — must be rejected, NOT treated as eternal",
  (() => {
    const c = validClaims() as Record<string, unknown>;
    delete c.exp;
    return forge(VALID_HEADER, c);
  })(),
  "a JWT with no exp never expires unless the verifier requires one"
);
await mustReject(
  "5d exp present but null",
  forge(VALID_HEADER, validClaims({ exp: null }))
);
await mustReject(
  "5e exp as a string rather than a number",
  forge(VALID_HEADER, validClaims({ exp: String(now() + 3600) }))
);
const stillValid = await verifySessionToken(forge(VALID_HEADER, validClaims({ exp: now() + 60 })));
check("5f a token expiring in 60s is still ACCEPTED (expiry is not over-eager)", stillValid.ok === true);

// ═════════════════════════════════════════════════════════════════════════
section("[6] ⚠️ TOKEN FOR USER A CANNOT ACT AS USER B");

await mustReject(
  "6a A's token with sub rewritten to B, A's signature kept — signature breaks",
  `${vh}.${b64urlJson(validClaims({ sub: USER_B }))}.${vs}`,
  "the MAC covers the sub claim"
);
const aToken = await issueSessionToken(USER_A, 0);
const aResult = await verifySessionToken(aToken);
check(
  "6b ⚠️ a VALID token for A resolves to A and NEVER to B",
  aResult.ok && aResult.userId === USER_A && aResult.userId !== USER_B,
  aResult.ok ? aResult.userId : "n/a"
);
check(
  "6c across 20 verifications the same token never resolves to a different account",
  await (async () => {
    for (let i = 0; i < 20; i++) {
      const r = await verifySessionToken(aToken);
      if (!r.ok || r.userId !== USER_A) return false;
    }
    return true;
  })()
);
// ⚠️ SCOPE BOUNDARY, and the first version of this test got it wrong by
// demanding rejection. A well-formed UUID that happens to match no account is
// AUTHENTIC — it is signed by us — and forging one requires the secret, at
// which point the attacker could mint a token for a real user instead and the
// header of this test would be moot. "Does this account exist?" is a DATABASE
// question and belongs to the wiring step (**D11**), which the verifier's own
// contract states it does not answer. Asserting it here would have forced a
// database call into a function whose whole value is being provable without
// one.
const orphanSub = await verifySessionToken(
  forge(VALID_HEADER, validClaims({ sub: "00000000-0000-0000-0000-000000000000" }))
);
check(
  "6d a correctly-signed token for a NON-EXISTENT uuid verifies here, and is D11's job to reject",
  orphanSub.ok === true && orphanSub.userId === "00000000-0000-0000-0000-000000000000",
  "⚠️ the account-existence check MUST be enforced at the wiring step"
);
await mustReject("6e sub as a number", forge(VALID_HEADER, validClaims({ sub: 42 })));
await mustReject("6f sub as an object", forge(VALID_HEADER, validClaims({ sub: { id: USER_B } })));
await mustReject("6g sub as an array", forge(VALID_HEADER, validClaims({ sub: [USER_A] })));
await mustReject("6h sub as an empty string", forge(VALID_HEADER, validClaims({ sub: "" })));
await mustReject("6i sub as a SQL-injection string", forge(VALID_HEADER, validClaims({ sub: "' OR '1'='1" })));
await mustReject(
  "6j sub claim removed entirely",
  (() => {
    const c = validClaims() as Record<string, unknown>;
    delete c.sub;
    return forge(VALID_HEADER, c);
  })()
);

// ═════════════════════════════════════════════════════════════════════════
section("[7] GARBAGE / MALFORMED → rejected safely, never a crash");

for (const [label, value] of [
  ["empty string", ""],
  ["plain garbage", "not-a-token-at-all"],
  ["one segment", "abc"],
  ["two segments", "abc.def"],
  ["four segments", "a.b.c.d"],
  ["only dots", "..."],
  ["null", null],
  ["undefined", undefined],
  ["number", 12345],
  ["object", { token: "x" }],
  ["array", ["a", "b"]],
  ["boolean", true],
  ["a very long string", "x".repeat(100000)],
  ["non-base64 segments", "!!!.???.***"],
  ["valid base64 but not JSON", `${b64url("hello")}.${b64url("world")}.${b64url("sig")}`],
  ["JSON but not an object", `${b64urlJson([1, 2])}.${b64urlJson("str")}.sig`],
  ["a Supabase-shaped JWT (not ours)", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMzc3MjA3NS0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.fakesignature"],
] as const) {
  await mustReject(`7 ${label}`, value);
}

// ═════════════════════════════════════════════════════════════════════════
section("[8] ISSUER / AUDIENCE — a token minted for something else (D8)");

await mustReject("8a wrong issuer", forge(VALID_HEADER, validClaims({ iss: "attacker" })));
await mustReject("8b issuer removed", (() => { const c = validClaims() as Record<string, unknown>; delete c.iss; return forge(VALID_HEADER, c); })());
await mustReject("8c wrong audience", forge(VALID_HEADER, validClaims({ aud: "some-other-api" })));
await mustReject("8d audience removed", (() => { const c = validClaims() as Record<string, unknown>; delete c.aud; return forge(VALID_HEADER, c); })());
await mustReject("8e epoch removed", (() => { const c = validClaims() as Record<string, unknown>; delete c.epoch; return forge(VALID_HEADER, c); })());
await mustReject("8f epoch negative", forge(VALID_HEADER, validClaims({ epoch: -1 })));
await mustReject("8g epoch as a string", forge(VALID_HEADER, validClaims({ epoch: "0" })));
await mustReject("8h iat removed", (() => { const c = validClaims() as Record<string, unknown>; delete c.iat; return forge(VALID_HEADER, c); })());

// ═════════════════════════════════════════════════════════════════════════
section("[9] NO INFORMATION LEAK on failure, and nothing logged");

const shapes = new Set<string>();
for (const bad of [
  forge(VALID_HEADER, validClaims(), { key: "wrong-secret-wrong-secret-wrong!" }),
  forge(VALID_HEADER, validClaims({ exp: now() - 3600 })),
  forge({ alg: "none", typ: "JWT" }, validClaims(), { key: null }),
  forge(VALID_HEADER, validClaims({ iss: "attacker" })),
  "garbage",
  "",
]) {
  shapes.add(JSON.stringify(await verifySessionToken(bad)));
}
check(
  "9a ⚠️ every failure returns the IDENTICAL value — no reason distinguishes them",
  shapes.size === 1 && [...shapes][0] === '{"ok":false}',
  [...shapes].join(" | ")
);

const captured: string[] = [];
const real = { log: console.log, error: console.error, warn: console.warn };
console.log = (...a: unknown[]) => void captured.push(a.join(" "));
console.error = (...a: unknown[]) => void captured.push(a.join(" "));
console.warn = (...a: unknown[]) => void captured.push(a.join(" "));
await verifySessionToken(forge(VALID_HEADER, validClaims(), { key: "nope-nope-nope-nope-nope-nope!!" }));
await verifySessionToken("garbage");
await verifySessionToken(validA);
console.log = real.log;
console.error = real.error;
console.warn = real.warn;
check("9b verification logs nothing — success or failure", captured.length === 0, `${captured.length} line(s)`);

console.log("\n" + "=".repeat(74));
console.log(`RESULT: ${passed} passed, ${failed} failed`);
if (failed) console.log("FAILED: " + failures.join(" · "));
console.log("=".repeat(74) + "\n");
process.exit(failed ? 1 : 0);
