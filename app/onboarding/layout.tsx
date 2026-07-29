import type { ReactNode } from "react";
import AuthGuard from "@/app/components/AuthGuard";

// Onboarding is gated at PHONE level, not profile level.
//
// A first-time user arrives here having proven their phone via OTP but with
// no `users` row and no `fabverify_profile` yet — onboarding is what creates
// them. Using the default "profile" mode would bounce every new signup back
// to /login forever, so this passes mode="phone" and checks
// `fabverify_auth` instead.
//
// Same distinction the API layer already makes between
// getVerifiedCallerPhone() (works before an account row exists — account
// creation needs it) and getVerifiedUser() (an existing account).
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <AuthGuard mode="phone">{children}</AuthGuard>;
}
