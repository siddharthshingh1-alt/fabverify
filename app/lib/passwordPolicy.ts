/**
 * FabVerify PASSWORD POLICY — what counts as an acceptable password.
 *
 * Pure functions, no I/O, no secrets. Browser-safe by construction so the
 * login/settings UI can reuse it later for live feedback — but ⚠️ THE SERVER
 * ALWAYS REVALIDATES. Client-side validation here is UX, never the boundary,
 * exactly as AuthGuard is a UX guard and the API auth is the real one.
 *
 * ── THE MODEL: LENGTH OVER COMPLEXITY ────────────────────────────────────
 * Per NIST SP 800-63B (which OWASP now follows): a long password beats a
 * short one with forced symbol/case rules. Composition rules are deliberately
 * NOT implemented — they push users to `Password1!` and its cousins, which is
 * a predictable pattern, not entropy. What IS implemented is a length floor,
 * a blocklist, and structural checks that catch the ways a *long* password
 * can still be trivially guessable.
 *
 * ⚠️ THE 12-CHARACTER FLOOR DOES MOST OF THE WORK, and it changes what the
 * blocklist is for. NIST's absolute floor is 8; its current recommendation is
 * 15. At 12, the entire classic weak-password list — password, 123456,
 * qwerty, letmein, iloveyou — is ALREADY REJECTED ON LENGTH. So the blocklist
 * below is deliberately NOT a copy of "top 1000 passwords"; most of that list
 * is unreachable here. It targets the ways users reach 12+ characters badly:
 * padding a weak word, repeating it, running along the keyboard, or counting.
 */

// ── THE CONSTANTS ────────────────────────────────────────────────────────

/**
 * ⚠️ ONE CONSTANT, ONE PLACE. Raising or lowering the floor is a policy
 * decision — change it here and nowhere else.
 *
 * 12: NIST's floor is 8 and its recommendation is 15; 12 is the defensible
 * middle that does not feel punitive on a phone keypad.
 */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * ⚠️ NOT A SECURITY LIMIT — A DENIAL-OF-SERVICE BOUND, and it is load-bearing.
 * Each hash costs 19 MiB of memory-hard work (see passwordHash.server.ts). An
 * unbounded input would let one caller push arbitrarily large buffers through
 * argon2id and exhaust a serverless function. 128 is far above any real
 * passphrase and far below anything that hurts.
 *
 * ⚠️ NEVER truncate to fit this — reject instead. Silent truncation means a
 * user's 200-character passphrase is really its first 128, which is invisible
 * to them and permanently weakens the credential.
 */
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Below this many DISTINCT characters, a 12+ character password is structural
 * padding rather than a secret: "aaaaaaaaaaaa" (1), "abababababab" (2),
 * "abcabcabcabc" (3). Set at 5 — low enough that real passphrases
 * ("the cat sat") pass comfortably.
 */
const MIN_DISTINCT_CHARACTERS = 5;

/**
 * Head-of-distribution weak bases. Matched after normalisation (case-folded,
 * leetspeak un-mapped, non-alphanumerics dropped), so `P@ssw0rd-P@ssw0rd`
 * collapses onto `password` and is caught.
 *
 * ⚠️ HONEST SCOPE: this is a curated head of the distribution, NOT a breach
 * corpus. It cannot know that a specific password appeared in a specific
 * dump. The upgrade is HaveIBeenPwned's k-anonymity range API — deliberately
 * not taken now: it is a network call on the password-set path, which brings
 * a new external dependency (X5 wants a seam), added latency, and a
 * fail-open/fail-closed decision. Logged as a future improvement, not a gap
 * we are unaware of.
 */
const WEAK_BASES = [
  "password", "passwort", "passwords", "pass", "passcode", "letmein",
  "welcome", "admin", "administrator", "root", "login", "user", "guest",
  "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "zxcvbnm",
  "iloveyou", "princess", "sunshine", "monkey", "dragon", "football",
  "baseball", "superman", "batman", "master", "shadow", "michael",
  "jennifer", "trustno", "whatever", "freedom", "starwars", "computer",
  "internet", "samsung", "google", "facebook", "abc", "abcd", "abcde",
  "secret", "changeme", "default", "temp", "test", "testing", "demo",
  "india", "bharat", "mumbai", "delhi", "chennai", "kolkata", "bangalore",
  "krishna", "ganesh", "shiva", "ganpati", "sairam", "omnamahshivaya",
  "fabverify", "fabindia", "garment", "textile", "fabric", "apparel",
];

/** Sequences a "long" password is often padded out with. */
const SEQUENCES = [
  "0123456789", "9876543210",
  "abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba",
  "qwertyuiop", "asdfghjkl", "zxcvbnm",
  "poiuytrewq", "lkjhgfdsa", "mnbvcxz",
];

/** How much of a run has to be sequential before it is padding, not a secret. */
const MAX_SEQUENTIAL_RUN = 6;

// ── TYPES ────────────────────────────────────────────────────────────────

/**
 * Values that are guessable *for this specific user*. A password built from
 * the user's own phone number or name is weak no matter how long it is, and
 * no generic blocklist can know that. All fields optional — an unknown value
 * simply is not checked.
 */
export type PasswordContext = {
  phone?: string | null;
  name?: string | null;
  email?: string | null;
};

export type PasswordValidation =
  | { ok: true; normalised: string }
  | { ok: false; message: string };

// ── NORMALISATION ────────────────────────────────────────────────────────

/**
 * ⚠️ NFKC NORMALISATION IS NOT COSMETIC — IT IS A SILENT-FAILURE FIX.
 * The same password typed on a different keyboard, OS or IME can arrive as a
 * different byte sequence (composed vs decomposed accents, full-width Latin,
 * different Unicode spaces). Hash one form, verify the other, and the user is
 * locked out of their own account with a password they typed correctly — a
 * bug that is nearly impossible to diagnose from a support ticket.
 *
 * ⚠️ THE HASHED VALUE MUST BE THIS NORMALISED FORM, on both set AND verify,
 * or the fix accomplishes nothing. `validatePassword` returns it so the caller
 * cannot accidentally hash the raw input instead.
 *
 * Deliberately does NOT trim: leading/trailing spaces are legitimate password
 * characters, the hashing module proves it preserves them, and silently
 * trimming would change the user's password without telling them.
 */
export function normalisePassword(plain: string): string {
  return plain.normalize("NFKC");
}

/**
 * Collapses a password toward its "guessable base" for blocklist matching:
 * case-folded, leetspeak reversed, non-alphanumerics dropped. This is what
 * makes `P@ssw0rd!2024` match `password`.
 *
 * Used ONLY for comparison — never for hashing, never stored.
 */
function toComparisonForm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[$5]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[8]/g, "b")
    .replace(/[^a-z0-9]/g, "");
}

/** The shortest unit the password is a whole-number repetition of. */
function shortestRepeatedUnit(value: string): string {
  for (let size = 1; size <= value.length / 2; size++) {
    if (value.length % size !== 0) continue;
    const unit = value.slice(0, size);
    if (unit.repeat(value.length / size) === value) return unit;
  }
  return value;
}

function hasLongSequentialRun(value: string): boolean {
  const lower = value.toLowerCase();

  for (const sequence of SEQUENCES) {
    for (let i = 0; i + MAX_SEQUENTIAL_RUN <= sequence.length; i++) {
      if (lower.includes(sequence.slice(i, i + MAX_SEQUENTIAL_RUN))) return true;
    }
  }
  return false;
}

/** Longest run of digits, used to spot an embedded phone number. */
function digitRuns(value: string): string[] {
  return value.match(/\d+/g) ?? [];
}

// ── THE POLICY ───────────────────────────────────────────────────────────

/**
 * The single gate every password passes through, on set and on change.
 *
 * Returns the NORMALISED password on success — callers must hash THAT value,
 * not their original input (see normalisePassword above).
 *
 * ⚠️ Messages are deliberately specific ("at least 12 characters") rather than
 * a generic "invalid password". This endpoint is authenticated and operates
 * only on the caller's own account, so there is no enumeration surface to
 * protect: vagueness here would cost usability and buy nothing. The login
 * endpoint is the opposite case and must stay uniformly vague.
 */
export function validatePassword(
  plain: unknown,
  context: PasswordContext = {}
): PasswordValidation {
  if (typeof plain !== "string") {
    return { ok: false, message: "Password is required." };
  }

  const normalised = normalisePassword(plain);

  // Length first — it is the cheapest check and rejects most weak input
  // before any string analysis runs.
  if (normalised.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (normalised.length > MAX_PASSWORD_LENGTH) {
    // Rejected, never truncated — see MAX_PASSWORD_LENGTH.
    return {
      ok: false,
      message: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
    };
  }

  const distinct = new Set(normalised).size;
  if (distinct < MIN_DISTINCT_CHARACTERS) {
    return {
      ok: false,
      message: "Password is too repetitive. Use a more varied mix of characters.",
    };
  }

  const comparison = toComparisonForm(normalised);

  // A long password that is one short word repeated is as guessable as the
  // word: "passwordpassword" must not pass because it cleared 12 characters.
  const unit = shortestRepeatedUnit(comparison);
  if (unit !== comparison && WEAK_BASES.includes(unit)) {
    return {
      ok: false,
      message: "Password is a repeated common word. Choose something less predictable.",
    };
  }

  if (WEAK_BASES.includes(comparison)) {
    return {
      ok: false,
      message: "This password is too common. Choose something less predictable.",
    };
  }

  // A weak base padded to length — "password123456", "qwertyuiop2024".
  //
  // ⚠️ CHECKED AGAINST BOTH FORMS, AND THIS IS A BUG FIX, NOT BELT-AND-BRACES.
  // Testing only the leet-mapped form silently misses the commonest case: leet
  // mapping turns digits INTO letters (8→b, 7→t, 4→a), so `password928374`
  // becomes `password92beta` and a "weak base followed by digits" test finds
  // no digits to match. `password928374` was accepted by exactly this hole
  // during chunk 2.4's verification run. The plain form keeps digits as
  // digits; the leet form catches `P@ssw0rd`. Neither alone is sufficient.
  //
  // ⚠️ THE TEST IS A LENGTH RATIO, NOT "the remainder is all digits" — for the
  // same reason. Whatever the padding is made of, if the weak word is at least
  // half the password then the password is that word with decoration. A
  // genuinely long password that merely begins with a common word
  // ("passwordvellumharbour") has a remainder longer than the base and is
  // allowed, so this does not over-reject real passphrases.
  const plainForm = normalised.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const form of [comparison, plainForm]) {
    for (const base of WEAK_BASES) {
      if (base.length < 5 || !form.startsWith(base)) continue;

      const remainder = form.slice(base.length);
      if (remainder.length <= base.length) {
        return {
          ok: false,
          message:
            "Password is a common word with characters added. Choose something less predictable.",
        };
      }
    }
  }

  if (hasLongSequentialRun(normalised)) {
    return {
      ok: false,
      message:
        "Password contains a long keyboard or number sequence. Choose something less predictable.",
    };
  }

  // ── CONTEXT: guessable for THIS user specifically ──────────────────────
  const phoneDigits = (context.phone ?? "").replace(/\D/g, "");
  if (phoneDigits.length >= 6) {
    const tail = phoneDigits.slice(-10);
    for (const run of digitRuns(normalised)) {
      if (run.length >= 6 && (tail.includes(run) || run.includes(tail))) {
        return {
          ok: false,
          message: "Password must not contain your phone number.",
        };
      }
    }
  }

  const namePart = toComparisonForm(context.name ?? "");
  if (namePart.length >= 4 && comparison.includes(namePart)) {
    return { ok: false, message: "Password must not contain your name." };
  }

  const emailLocal = toComparisonForm((context.email ?? "").split("@")[0] ?? "");
  if (emailLocal.length >= 5 && comparison.includes(emailLocal)) {
    return {
      ok: false,
      message: "Password must not contain your email address.",
    };
  }

  return { ok: true, normalised };
}
