const CHAT_REDIRECT_KEY = "fabverify_chat_redirect";

/**
 * Reads and clears the chat route saved by ChatAuthGuard when it bounced an
 * unauthenticated visitor to /signup. Called from every real "onboarding is
 * done" endpoint (the generic /dashboard redirector, each per-type
 * onboarding flow's terminal redirect, and signup itself when a profile
 * already exists) so the visitor lands back where they actually meant to go
 * instead of their default dashboard.
 */
export function consumePendingChatRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const path = localStorage.getItem(CHAT_REDIRECT_KEY);
  if (path) localStorage.removeItem(CHAT_REDIRECT_KEY);
  return path;
}

/**
 * Non-destructive read of the same value, for pages that want to adjust
 * their copy (e.g. /login explaining why it's asking) without consuming
 * the redirect before auth actually succeeds.
 */
export function peekPendingChatRedirect(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CHAT_REDIRECT_KEY);
}
