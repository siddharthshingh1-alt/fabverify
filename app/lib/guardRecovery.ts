/**
 * GUARD RECOVERY — the floor under every client-side guard.
 *
 * ⚠️ WHY THIS EXISTS. On 2026-08-29 a real first login on a non-enterprise
 * account reached a BLANK SCREEN and stayed there. Not a crash, not an error,
 * not a spinner — nothing. Diagnosing it took a whole session and a database
 * archaeology dig, because the failure carried ZERO information: a guard
 * rendering `null` is indistinguishable from a hang, a crash, and a bug, for
 * the user AND for us.
 *
 * The three guards (AuthGuard, useTypeGuard, useEnterpriseAccess) each had the
 * same shape — `if (!authorised) return null` — which is correct for the
 * instant while a redirect is in flight and catastrophic when that instant
 * never ends.
 *
 * ⚠️ THE RULE THIS FILE BUYS: a guard may render nothing only while a
 * decision is genuinely pending. It must never be the terminal state.
 *
 * NOTE ON SCOPE: this is the guards' own safety net. It deliberately does NOT
 * fix why a guard fails to resolve — that is the separate root-cause chunk.
 * What it guarantees is that any such failure is VISIBLE instead of silent.
 */

/** Below this, render nothing — a normal navigation resolves well inside it,
 *  so there is no spinner flash on every page change. */
export const GUARD_SPINNER_AFTER_MS = 600;

/** Past this, the guard has failed to reach a decision. Show a real error. */
export const GUARD_STUCK_AFTER_MS = 2500;

const LOOP_KEY = "fabverify_guard_redirects";

/** More than this many guard-issued redirects inside the window means the
 *  guards are bouncing the user between routes rather than converging. */
const LOOP_BUDGET = 4;
const LOOP_WINDOW_MS = 4000;

type LoopRecord = { count: number; since: number };

function readLoopRecord(): LoopRecord | null {
  try {
    const raw = sessionStorage.getItem(LOOP_KEY);
    return raw ? (JSON.parse(raw) as LoopRecord) : null;
  } catch {
    // sessionStorage unavailable (private mode / blocked). Loop detection is
    // a safety net, not a security control — degrade to "no detection" rather
    // than throwing inside a guard, which would replace a blank screen with a
    // white one for a different reason.
    return null;
  }
}

function writeLoopRecord(record: LoopRecord | null) {
  try {
    if (record) sessionStorage.setItem(LOOP_KEY, JSON.stringify(record));
    else sessionStorage.removeItem(LOOP_KEY);
  } catch {
    /* same reasoning as readLoopRecord */
  }
}

/**
 * Called by a guard immediately BEFORE it issues a redirect.
 *
 * Returns true when the redirect is within budget and should proceed, false
 * when the guards are looping and the caller must recover instead.
 *
 * ⚠️ A PER-MOUNT TIMER CANNOT CATCH A REDIRECT LOOP, which is exactly why
 * this counter exists and lives in sessionStorage rather than React state. In
 * a loop each page load MOUNTS A FRESH GUARD, so every individual mount is
 * short-lived and its stuck-timer never fires — the user sees a blank
 * flickering screen forever while no single component ever waits long enough
 * to notice. The count has to outlive the component to see the pattern.
 */
export function claimGuardRedirect(): boolean {
  const now = Date.now();
  const record = readLoopRecord();

  if (!record || now - record.since > LOOP_WINDOW_MS) {
    writeLoopRecord({ count: 1, since: now });
    return true;
  }

  const count = record.count + 1;
  writeLoopRecord({ count, since: record.since });
  return count <= LOOP_BUDGET;
}

/**
 * Called when a guard resolves successfully. Clears the budget so ordinary
 * navigation — which legitimately passes through several guards — can never
 * accumulate its way into a false loop detection.
 */
export function clearGuardRedirects() {
  writeLoopRecord(null);
}

/**
 * The terminal recovery for a guard that cannot resolve or is looping.
 *
 * ⚠️ IT SIGNS THE USER OUT OF CLIENT STATE, DELIBERATELY. Reaching here means
 * the guards cannot agree on who this user is, so the identity mirrors are the
 * prime suspect and leaving them in place would loop straight back. Clearing
 * them makes /login render normally (it auto-forwards only when it finds a
 * live `fabverify_auth`), which is what makes this an exit rather than another
 * lap.
 *
 * ⚠️ It does NOT revoke the server-side session — this is client-state
 * recovery, not a security action, and a guard is not an authorisation
 * boundary. The user logs back in and continues; nothing is destroyed.
 *
 * ⚠️ A HARD NAVIGATION, NOT router.replace(). The same reasoning as
 * /onboarding/password's leaveForApp(): a client-side navigation preserves the
 * very React state that is already wrong. A full page load guarantees every
 * provider re-reads storage from scratch.
 */
export function recoverToLogin(reason: string) {
  const MIRRORS = [
    "fabverify_auth",
    "fabverify_profile",
    "fabverify_user",
    "fabverify_user_type",
    "userType",
    "fabverify_position",
    "fabverify_enterprise",
    "fabverify_enterprise_position",
  ];
  try {
    MIRRORS.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage blocked — the navigation below still gets them out */
  }
  clearGuardRedirects();

  // The reason rides in the URL so a support conversation, or the next
  // debugging session, starts with the failing guard already named instead of
  // with "the screen was blank".
  window.location.href = `/login?recovered=${encodeURIComponent(reason)}`;
}
