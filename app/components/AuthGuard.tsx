"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

/**
 * Gates every PLATFORM route tree (/brand, /manufacturer, /enterprise, …).
 *
 * WHY THIS EXISTS: before this, no platform route checked for a session at
 * all. `useTypeGuard` compares `user.userType` against the expected type, but
 * a signed-out UserContext falls back to `defaultUser` — whose userType is
 * 'buyer' — so every buyer route authorised a signed-out visitor. Anyone
 * could open /brand/dashboard and browse the shell, and a signed-out user
 * pressing Back landed straight back on it.
 *
 * WHAT IT IS — AND IS NOT: this is a UX/perception guard, the same class as
 * ChatAuthGuard, which it is modelled on. It is NOT the security boundary.
 * Real authorisation lives server-side in the API routes (getVerifiedUser /
 * getVerifiedCallerPhone + ownership checks); those answer 401 to a
 * signed-out caller for reads AND writes, which is why the shell a signed-out
 * visitor could reach was always empty. This stops the app LOOKING signed-in,
 * which on a trust/money platform matters on its own.
 *
 * HYBRID CHECK, in two stages:
 *   1. FAST — read the localStorage session signal synchronously and decide
 *      immediately. No spinner flash on the overwhelmingly common path.
 *   2. REAL — then confirm an actual Supabase session in the background and
 *      bounce if it is gone (e.g. expired or revoked in another tab). This is
 *      what makes it a genuine check rather than a trust of client state.
 *
 * TWO MODES, mirroring the server-side split for the same reason:
 *   "profile" (default) — an existing, onboarded account. Signal is
 *                         `fabverify_profile`, exactly what ChatAuthGuard
 *                         uses, so both products agree on "logged in".
 *   "phone"             — /onboarding/* only. A first-time user has PROVEN
 *                         their phone but has no profile yet — onboarding is
 *                         what creates it. Gating onboarding on the profile
 *                         would bounce every new signup back to login
 *                         forever. Same distinction as getVerifiedCallerPhone
 *                         vs getVerifiedUser on the server.
 */

type Mode = "profile" | "phone";

/**
 * PUBLIC EXCEPTIONS — the manufacturer directory, browsable before login.
 *
 * "Browsing pre-login is core to the marketplace; require auth to ACT, never
 * to look" (PROJECT_MEMORY / DECISIONS). The discovery list and manufacturer
 * profile pages live INSIDE the guarded /brand tree, so without this
 * exception a prospective buyer could not look at any manufacturer before
 * signing up.
 *
 * DELIBERATELY NARROW. Only the BUYER discovery path is public, because only
 * `buyer` maps to the manufacturer directory (routing.ts DISCOVERY_SLUG).
 * Every other user type's discovery slug is 'buyers' or 'clients' —
 * /manufacturer/buyers, /mill/buyers, /talent/designer/clients — which browse
 * BUYERS, i.e. private commercial data. Those must stay guarded, so this is
 * an exact-and-prefix list, never a substring or wildcard match.
 *
 * `/manufacturers` and `/manufacturers/[id]` are unguarded redirect shims
 * (no layout.tsx of their own) that land on the paths below. They are listed
 * anyway so the intent is explicit and adding a layout there later cannot
 * silently re-break public browsing.
 */
const PUBLIC_EXACT = ["/manufacturers", "/brand/manufacturers"];

// Trailing slash is REQUIRED. Matching on "/brand/manufacturers" as a bare
// prefix would also open a future "/brand/manufacturers-admin"; and note the
// singular "/manufacturer/..." tree (the manufacturer's OWN workspace —
// dashboard, orders, buyers) shares no prefix with these entries and stays
// fully guarded.
const PUBLIC_PREFIXES = ["/manufacturers/", "/brand/manufacturers/"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// DECISIONS A10: the dev OTP bypass is gated on hostname, never NODE_ENV.
// The 123456 bypass never creates a Supabase session, so stage 2 MUST be
// skipped on localhost — enforcing it there would bounce every developer out
// of the app on every page load.
function isDevHost() {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  );
}

export default function AuthGuard({
  children,
  mode = "profile",
}: {
  children: React.ReactNode;
  mode?: Mode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorised, setAuthorised] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Depends on `pathname`, so it re-runs on every client-side navigation —
    // including browser Back. That is what stops a signed-out user pressing
    // Back onto a platform page: the check runs again and bounces them,
    // with no hard refresh needed.
    const check = () => {
      // Public marketplace browsing — render immediately, skip BOTH stages.
      // Checked first so a logged-out visitor is never bounced off the
      // directory, and re-evaluated on every navigation because `pathname`
      // is an effect dependency.
      if (isPublicPath(pathname)) {
        setAuthorised(true);
        return;
      }

      const key = mode === "phone" ? "fabverify_auth" : "fabverify_profile";

      let local: string | null = null;
      try {
        local = localStorage.getItem(key);
      } catch {
        // Storage unavailable (private mode / blocked) — treat as signed out
        // rather than letting someone through on an exception.
      }

      if (!local) {
        setAuthorised(false);
        router.replace("/login");
        return;
      }

      // Stage 1 passed — render immediately, no spinner flash.
      setAuthorised(true);

      // Stage 2: confirm a REAL session. Production only, per A10 above.
      if (isDevHost()) return;

      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (cancelled) return;
          if (!data.session) {
            setAuthorised(false);
            router.replace("/login");
          }
        })
        .catch(() => {
          // A network failure is NOT proof of a dead session. Leaving the
          // user in place is the correct call: the API is the real boundary
          // and answers 401 on its own if the session is genuinely gone.
          // Bouncing here would log people out over a flaky connection.
        });
    };

    check();

    // bfcache: a page restored from the back/forward cache does not re-run
    // effects, so re-check on `pageshow` when `persisted` is set. The symptom
    // we measured was a live re-render rather than a bfcache restore, but
    // this closes the other path rather than leaving it to chance.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) check();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname, mode, router]);

  // Render nothing while bouncing — never flash protected chrome at someone
  // who is on their way to /login.
  if (!authorised) return null;

  return <>{children}</>;
}
