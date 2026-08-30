"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import type { UserType } from "../context/UserContext";
import { getBasePath } from "../lib/routing";
import {
  armGuardStuckTimer,
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
    // that `authorized` could stay false FOREVER, rendering a blank screen
    // with no error, no spinner and no way out. This hook cannot render, so
    // instead it guarantees the null is TRANSIENT: it always ends in a
    // navigation. See app/lib/guardRecovery.ts.
    //
    // ⚠️ settle() IS CALLED SYNCHRONOUSLY ON EVERY DECISION BRANCH, never left
    // to the cleanup. The first version of this hook disarmed only in cleanup,
    // which does not run while a user sits on a resolved page — so the timer
    // fired anyway and signed people out 2.5s after the dashboard loaded.
    const timer = armGuardStuckTimer("typeguard-unresolved");

    // Undecided: mounted has not happened yet, so the timer stays ARMED. This
    // is the one branch that must not settle.
    if (!mounted) return () => timer.cancel();

    const allowed = Array.isArray(expected) ? expected.includes(user.userType) : user.userType === expected;
    if (!allowed) {
      timer.settle();
      // Loop budget: cross-type bounces that never converge (A sends you to B,
      // B sends you back to A) remount this hook every lap, so a per-mount
      // timer can never see it. The counter outlives the component.
      if (claimGuardRedirect()) router.replace(`${getBasePath(user.userType)}/dashboard`);
      else recoverToLogin("typeguard-redirect-loop");
      return () => timer.cancel();
    }

    timer.settle();
    clearGuardRedirects();
    setAuthorized(true);
    return () => timer.cancel();
  }, [mounted, user, expected, router]);

  return authorized;
}
