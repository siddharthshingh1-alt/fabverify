"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import {
  armGuardStuckTimer,
  claimGuardRedirect,
  clearGuardRedirects,
  recoverToLogin,
} from "../lib/guardRecovery";

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
    // Same floor as useTypeGuard — see the note there and in
    // app/lib/guardRecovery.ts. Enterprise was the ONE account type that
    // routed around the 2026-08-29 blank screen (it uses this hook rather than
    // useTypeGuard), which is exactly why every production test until then
    // passed. It gets the same safety net so that exemption cannot hide the
    // next one — and the same synchronous settle(), because it shipped the
    // same cleanup-only regression.
    const timer = armGuardStuckTimer("enterprise-guard-unresolved");

    if (!mounted) return () => timer.cancel();

    if (!user.isEnterprise) {
      timer.settle();
      if (claimGuardRedirect()) router.replace("/dashboard");
      else recoverToLogin("enterprise-guard-redirect-loop");
      return () => timer.cancel();
    }

    timer.settle();
    clearGuardRedirects();
    setAuthorized(true);
    return () => timer.cancel();
  }, [mounted, user, router]);

  return authorized;
}
