"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

/**
 * Gates access to /enterprise/* pages.
 * Authorized when the signed-in position is MD/CEO or Head of Operations
 * (the Brand/Buyer positions this section was built for), or when the
 * separate Enterprise Brand onboarding flow has run (fabverify_enterprise
 * profile present). Anyone else is bounced to /dashboard.
 */
export function useEnterpriseAccess() {
  const { user, mounted } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    let storedPosition: string | null = null;
    let hasEnterpriseProfile = false;
    try {
      storedPosition = localStorage.getItem("fabverify_position");
      hasEnterpriseProfile = !!localStorage.getItem("fabverify_enterprise");
    } catch {}

    const position = user.position ?? storedPosition;
    const isEnterprise =
      position === "md_ceo" || position === "head_operations" || hasEnterpriseProfile;

    if (!isEnterprise) {
      router.replace("/dashboard");
      return;
    }
    setAuthorized(true);
  }, [mounted, user, router]);

  return authorized;
}
