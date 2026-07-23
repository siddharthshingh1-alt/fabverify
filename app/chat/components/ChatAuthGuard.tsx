"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Gates the entire /chat subtree. "Logged in" here means the same thing
 * /login already checks before sending someone to /dashboard: a saved
 * fabverify_profile. fabverify_auth (phone + dev-mode userId) is also real
 * and set by the same signup/login flow — FabChat's data-fetching code
 * reads it directly — but presence of a profile is the correct signal for
 * "is this device logged in", same as everywhere else in the app.
 *
 * A missing profile just means this device has no local session — it says
 * nothing about whether the visitor already has a FabVerify account. Send
 * them to /login (which links out to /signup for genuinely new users)
 * rather than assuming /signup, so returning users aren't asked to sign up
 * again. /login consumes the saved fabverify_chat_redirect path itself.
 */
export default function ChatAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const profile = localStorage.getItem("fabverify_profile");

    if (!profile) {
      localStorage.setItem("fabverify_chat_redirect", pathname);
      router.replace("/login");
      return;
    }

    setAuthenticated(true);
    setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="flex h-full min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border-dark border-t-primary" />
        <span className="text-[13px] text-text-secondary">Checking your account...</span>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
