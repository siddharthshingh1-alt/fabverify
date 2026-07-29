"use client";

import { useEffect, useState } from "react";

/**
 * "Does this device have a local session?" — for deciding what CHROME to
 * render, never for authorisation.
 *
 * SAME SIGNAL AS THE GUARDS. `fabverify_profile` is exactly what
 * AuthGuard (profile mode) and ChatAuthGuard check, so all three agree on
 * "logged in". The key is repeated here rather than shared because the
 * guard logic is proven and deliberately left untouched — if you ever change
 * the signal in one place, change it in all three.
 *
 * NOT AUTHORISATION. A signed-out visitor reaching a public page gets a
 * public shell; that is a presentation decision. What actually protects data
 * is the server-side API auth (getVerifiedUser + ownership checks), which
 * answers 401 regardless of what any component renders.
 *
 * Read synchronously on first client render (lazy initialiser) so the public
 * shell paints correctly the first time — a stranger must never see the
 * logged-in left panel flash before it disappears. `mounted` is still
 * reported so callers can hold off until the value is known to be
 * client-truth rather than an SSR default.
 */
export function useIsSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return Boolean(localStorage.getItem("fabverify_profile"));
    } catch {
      return false;
    }
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setSignedIn(Boolean(localStorage.getItem("fabverify_profile")));
    } catch {
      setSignedIn(false);
    }
  }, []);

  return { signedIn, mounted };
}
