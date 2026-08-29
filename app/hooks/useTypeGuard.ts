"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import type { UserType } from "../context/UserContext";
import { getBasePath } from "../lib/routing";
import {
  GUARD_STUCK_AFTER_MS,
  claimGuardRedirect,
  clearGuardRedirects,
  recoverToLogin,
} from "../lib/guardRecovery";

/**
 * Gates a per-user-type route. Authorized when the signed-in user's type is
 * (or is in) `expected`; anyone else is bounced to their own dashboard.
 * Most routes gate on a single type; `/brand/fabmerch` is shared by every
 * non-talent type (it's the talent-booking marketplace), so it passes an
 * array.
 *
 * This is a client-side UX guard only — it reads `userType` from
 * localStorage via `useUser()`, the same as `useEnterpriseAccess`. It stops
 * accidental cross-type navigation and shared URLs, but it is not real
 * authorization: there is no backend/session here, so a user can still edit
 * localStorage and pass the guard as any type. Before this app handles real
 * per-user data, this must be backed by server-side auth (e.g. Next.js
 * middleware checking a real session) rather than trusted client state.
 */
export function useTypeGuard(expected: UserType | UserType[]) {
  const { user, mounted } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // ⚠️ THE STUCK TIMER IS THE FLOOR UNDER THIS HOOK'S `null`.
    //
    // Every caller does `if (!authorized) return null`, and there are 122 of
    // them — far too many to change, and they are not the bug. The bug was
    // that `authorized` could stay false FOREVER (mounted never true, or
    // userType never resolving to the expected value), which rendered a blank
    // screen with no error, no spinner and no way out. This hook cannot
    // render, so instead it guarantees the null is TRANSIENT: it will always
    // end in a navigation. See app/lib/guardRecovery.ts.
    const stuck = setTimeout(() => {
      recoverToLogin("typeguard-unresolved");
    }, GUARD_STUCK_AFTER_MS);

    if (!mounted) return () => clearTimeout(stuck);

    const allowed = Array.isArray(expected) ? expected.includes(user.userType) : user.userType === expected;
    if (!allowed) {
      // Loop budget: cross-type bounces that never converge (A sends you to B,
      // B sends you back to A) remount this hook every lap, so the timer above
      // can never fire. The counter outlives the component and sees it.
      if (claimGuardRedirect()) router.replace(`${getBasePath(user.userType)}/dashboard`);
      else recoverToLogin("typeguard-redirect-loop");
      return () => clearTimeout(stuck);
    }

    clearGuardRedirects();
    setAuthorized(true);
    return () => clearTimeout(stuck);
  }, [mounted, user, expected, router]);

  return authorized;
}
