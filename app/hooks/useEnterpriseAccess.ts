"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

/**
 * Gates access to /enterprise/* pages.
 *
 * Authorized only when the DATABASE says this account is an enterprise
 * (users.user_type = 'enterprise', surfaced as user.isEnterprise via
 * app/lib/accountType.ts). Anyone else is bounced to /dashboard.
 *
 * This previously authorized on `position === "md_ceo" || position ===
 * "head_operations"` or the mere presence of a `fabverify_enterprise`
 * localStorage key. Both were unsound: the Position union (solo_founder,
 * md_ceo, …) overlaps EnterprisePosition on exactly those two values, so a
 * solo Brand Builder who picked "MD / CEO" during /onboarding/position
 * passed this gate — and a localStorage key is client-writable, so anyone
 * could set it. Capability now comes from a real server-side fact.
 *
 * Still a client-side UX guard, not authorization — the enforcing check is
 * the server-side one in the API routes (app/lib/auth.ts).
 */
export function useEnterpriseAccess() {
  const { user, mounted } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    if (!user.isEnterprise) {
      router.replace("/dashboard");
      return;
    }
    setAuthorized(true);
  }, [mounted, user, router]);

  return authorized;
}
