/**
 * BACKUP detection for "the SMS provider cannot serve this number".
 *
 * WHY THIS FILE EXISTS (chunk 1.7, 2026-07-31)
 * Chunk 1.6 kept this check inline in login/page.tsx as belt-and-suspenders
 * behind the seam's structured `provider_unavailable` signal. Chunk 1.7 puts
 * signup on the same seam and needs the same backup — so the choice was
 * duplicate it into a second page or extract it once. Extracted, because a
 * duplicated copy is exactly the login/signup drift the auth seam exists to
 * prevent.
 *
 * ⚠️ DELIBERATELY *NOT* IN authProvider.ts, and that is the whole point.
 * This is insurance against the SEAM's own heuristic
 * (authProvider.ts sendOtp) being narrowed or changed later. A backup that
 * lives in the same file as the thing it is backing up is not a backup. Keep
 * it here, outside the seam.
 *
 * ⚠️ HONEST STATUS: currently UNREACHABLE BY CONSTRUCTION. The seam derives
 * `provider_unavailable` with the identical three-substring test on the
 * identical string, so any message this would catch has already been
 * classified upstream and never reaches a caller as `reason: "error"`. Do NOT
 * read its presence as evidence the structured signal is insufficient. It can
 * be deleted once that signal has been proven in production over time.
 *
 * WHY THE BRANCH MATTERS AT ALL: Twilio is on a trial that only delivers to
 * verified caller IDs, so a real user on an unverified number must be shown
 * the WhatsApp/waitlist fallback rather than a dead-end OTP screen. Whether a
 * Twilio trial "unverified number" error actually matches this heuristic is
 * still UNKNOWN and recorded as an untested path in TASKS.md — neither this
 * file nor chunk 1.7 changes that either way.
 *
 * Browser-safe: no imports, no provider SDK, pure string inspection.
 */

export const looksLikeProviderProblem = (
  message: string | undefined
): boolean => {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("not configured") || m.includes("provider") || m.includes("sms")
  );
};
