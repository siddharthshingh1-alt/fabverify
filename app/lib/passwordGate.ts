/**
 * THE MANDATORY-PASSWORD GATE'S CLIENT STATE. Chunk 2.6b (M10).
 *
 * Browser-safe, no I/O, no secrets — a tiny shared module so the login page,
 * the set-password screen and AuthGuard all agree on one key name. Three
 * copies of the string `"fabverify_has_password"` is how a guard and a writer
 * silently stop talking to each other.
 *
 * ⚠️ THIS IS A UX MIRROR, NOT AN AUTHORISATION FACT. It is client-writable, so
 * a user with devtools can flip it and get a flash of the app before the
 * background check corrects them. That is acceptable BECAUSE NOTHING IS
 * PROTECTED BY IT: requiring a password is a product rule, and every API route
 * still enforces real authorisation server-side. Exactly the same posture
 * AuthGuard already takes toward the session signal it reads.
 *
 * ⚠️ THREE STATES, NOT TWO — and the third is the one that matters.
 *   "1"     → has a password
 *   "0"     → definitely has none  → the guard redirects
 *   absent  → UNKNOWN              → the guard must NOT redirect
 * "Unknown" happens for sessions that predate this chunk, and whenever the
 * status endpoint answers 503. Treating unknown as "no password" would force
 * every user onto a set-password screen during a database outage — a screen
 * that cannot write, on a route they cannot leave. Trapped.
 */

export const HAS_PASSWORD_KEY = "fabverify_has_password";

export type PasswordGateState = "has" | "missing" | "unknown";

/** Read the fast, synchronous signal. Never throws. */
export function readPasswordGate(): PasswordGateState {
  try {
    const raw = localStorage.getItem(HAS_PASSWORD_KEY);
    if (raw === "1") return "has";
    if (raw === "0") return "missing";
    return "unknown";
  } catch {
    // Storage unavailable (private mode, quota). Unknown is the safe answer:
    // it means "do not redirect", so a storage failure can never strand
    // someone on the set-password screen.
    return "unknown";
  }
}

/** Record what the server said. Never throws. */
export function markHasPassword(has: boolean): void {
  try {
    localStorage.setItem(HAS_PASSWORD_KEY, has ? "1" : "0");
  } catch {
    // Best effort. Losing the mirror degrades to "unknown", which costs one
    // extra status fetch — never a lockout.
  }
}

export function clearPasswordGate(): void {
  try {
    localStorage.removeItem(HAS_PASSWORD_KEY);
  } catch {
    /* best effort */
  }
}
