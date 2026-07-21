"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import type { UserType } from "../context/UserContext";
import { getBasePath } from "../lib/routing";

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
    if (!mounted) return;

    const allowed = Array.isArray(expected) ? expected.includes(user.userType) : user.userType === expected;
    if (!allowed) {
      router.replace(`${getBasePath(user.userType)}/dashboard`);
      return;
    }
    setAuthorized(true);
  }, [mounted, user, expected, router]);

  return authorized;
}
