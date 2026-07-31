"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { consumePendingChatRedirect } from "../lib/postAuthRedirect";
// Auth goes through the SEAM, not Supabase directly (DECISIONS X5). Aliased
// because this file already has local handlers called sendOtp / verifyOtp —
// an unaliased import would be a duplicate declaration. Same aliasing as
// login/page.tsx, which moved onto the seam in chunk 1.6.
import {
  isDevBypassHost,
  sendOtp as providerSendOtp,
  signOut as providerSignOut,
  verifyOtp as providerVerifyOtp,
} from "../lib/authProvider";
// BACKUP fallback detection — see the note at its call site in sendOtp().
// The SAME definition login uses, not a copy: it was extracted to its own file
// in chunk 1.7 precisely so the two pages cannot drift on it.
import { looksLikeProviderProblem } from "../lib/providerFallback";
import { useUser } from "../context/UserContext";
import { getLandingRoute } from "../lib/routing";

const WHATSAPP_NUMBER_DISPLAY = "+91 97739 33279";
const WHATSAPP_LINK = "https://wa.me/919773933279";

// A profile already existing at this point means this is a returning user
// re-verifying (e.g. bounced here by ChatAuthGuard), not a brand-new
// signup — send them straight back to what they were trying to reach
// instead of through onboarding again. A first-time signup has no profile
// yet, so the pending redirect is left alone; the onboarding flow's own
// terminal step picks it up once a profile actually exists.
const postVerifyRoute = () =>
  localStorage.getItem("fabverify_profile") ? consumePendingChatRedirect() : null;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;
// DEV_OTP_BYPASS moved into the seam (app/lib/authProvider.ts) in chunk 1.4 —
// the seam compares the code and owns the A10 hostname gate, so login and
// signup can no longer drift on what the bypass accepts.

// Real, currently-routable dashboard for each UserContext UserType — see
// app/context/UserContext.tsx. Anything not in this map (or not yet known)
// falls back to the generic adaptive /dashboard.
// Only allow the dev OTP bypass on localhost — never in production. The check
// itself now lives in the seam (DECISIONS A10, hostname-gated not NODE_ENV);
// kept as a module-scope const so the JSX hint below behaves exactly as before.
const isDev = isDevBypassHost();

export default function SignUp() {
  const router = useRouter();
  const { applyIdentity } = useUser();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Only skip signup for a visitor who has OUR OWN app session (both
  // fabverify_auth AND a resolved user_type) — checking only for a
  // Supabase session isn't enough. With phone confirmations off in
  // Supabase, signInWithOtp() creates a session immediately, before the
  // OTP is ever verified, so a session can exist for a visitor we've never
  // actually authenticated. If our own localStorage data isn't there,
  // treat any such Supabase session as stray and clear it.
  useEffect(() => {
    async function checkAuth() {
      const auth = localStorage.getItem("fabverify_auth");
      const userType = localStorage.getItem("fabverify_user_type");

      if (auth && userType) {
        router.replace(postVerifyRoute() ?? getLandingRoute(userType));
        return;
      }

      await providerSignOut();
    }

    void checkAuth();
  }, [router]);

  useEffect(() => {
    if (step !== "otp") return;
    const interval = setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const isPhoneValid = phone.length === 10;
  const isOtpComplete = otp.every((digit) => digit !== "");

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 10));
  };

  // Sends the code via the auth seam. Phone validation, E.164 formatting, the
  // A10 localhost bypass (which short-circuits BEFORE any provider call, so no
  // SMS is attempted and 123456 is accepted at the next step) and the
  // provider-error classification all live in the seam now — so login and
  // signup cannot drift apart on any of them.
  const sendOtp = async () => {
    setIsSendingOtp(true);
    setErrorMessage("");
    setSmsUnavailable(false);

    const result = await providerSendOtp(phone);

    if (!result.ok) {
      // FALLBACK DECISION — deliberately belt-and-suspenders, identical to
      // login/page.tsx (chunk 1.6) and sharing its helper rather than copying
      // the logic.
      //
      // PRIMARY: the seam's structured `provider_unavailable`.
      // BACKUP:  re-check the message text here as well.
      //
      // ⚠️ HONEST NOTE: the backup is currently UNREACHABLE. The seam derives
      // `provider_unavailable` using the identical three-substring test on the
      // identical string, so any message that would match here has already
      // been classified upstream. It is kept on purpose as insurance against
      // the seam's heuristic being narrowed later. Do not read its presence as
      // evidence that the structured signal is insufficient.
      //
      // Why this branch matters MORE on signup than on login: with Twilio on a
      // trial that only delivers to verified caller IDs, a brand-new user on an
      // unverified number is precisely who hits this. It must show
      // WhatsApp/waitlist rather than a dead-end OTP screen — for a first-time
      // visitor that dead end is the whole signup.
      const structured = result.reason === "provider_unavailable";
      const byText =
        result.reason === "error" && looksLikeProviderProblem(result.message);

      if (structured || byText) {
        setSmsUnavailable(true);
      } else if (result.reason === "unknown") {
        setErrorMessage("Something went wrong. Please try again.");
      } else {
        // invalid_phone | error — the seam supplies the exact message that was
        // shown before this chunk.
        setErrorMessage(result.message);
      }

      setIsSendingOtp(false);
      return;
    }

    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(RESEND_SECONDS);
    setStep("otp");
    setIsSendingOtp(false);
  };

  const joinWaitlist = async () => {
    if (!waitlistEmail.trim()) return;
    setIsJoiningWaitlist(true);
    setWaitlistError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail.trim(), phone }),
      });
      if (!res.ok) throw new Error("Failed to join waitlist");
      setWaitlistJoined(true);
    } catch {
      setWaitlistError("Failed to join waitlist. Please try again.");
    }

    setIsJoiningWaitlist(false);
  };

  const handleSendOtp = () => {
    if (!isPhoneValid || isSendingOtp) return;
    void sendOtp();
  };

  const handleResendOtp = () => {
    if (countdown > 0 || isSendingOtp) return;
    void sendOtp().then(() => otpRefs.current[0]?.focus());
  };

  // Verifies the code through the seam, which handles both branches: the A10
  // localhost bypass (fixed 123456, no provider call, synthetic per-phone id)
  // and the real production path (verify the code Twilio sent, use the real
  // auth user id). Either way we then fall through to the same DATABASE lookup
  // below — the dev branch used to short-circuit and route from localStorage
  // alone, which reproduced the stale-identity bug on signup.
  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setErrorMessage("");

    // The seam returns the exact messages shown before this chunk:
    // "Development mode: enter 123456 to continue" (dev, wrong code) and
    // "Invalid OTP. Please try again." (production, bad code). It also wraps
    // the provider call in try/catch, which the old inline call did NOT — a
    // network throw used to surface as an unhandled rejection and now shows a
    // real error instead.
    const result = await providerVerifyOtp(phone, code);

    if (!result.ok) {
      setErrorMessage(result.message);
      setIsVerifying(false);
      return;
    }

    // NOT an identity key — see the seam's warning on this field. It is the
    // real auth uid in production and a synthetic "dev-user-…" string under the
    // bypass, mirrored into fabverify_auth purely for continuity. Audited in
    // chunk 1.4: all 22 readers of fabverify_auth read only `.phone`.
    //
    // ⚠️ THIS WRITE IS LOAD-BEARING FOR SIGNUP and must stay BEFORE the lookup
    // and the navigation below: /onboarding/* is guarded at PHONE level
    // (AuthGuard mode="phone" reads `fabverify_auth`, not `fabverify_profile`,
    // because onboarding is what CREATES the profile). A first-time signup that
    // navigated before this line would be bounced straight back to /login.
    localStorage.setItem(
      "fabverify_auth",
      JSON.stringify({
        userId: result.storageUserId,
        phone,
        verified: true,
        verifiedAt: new Date().toISOString(),
        // From the seam's own gate, so this can never disagree with the branch
        // that actually ran.
        devMode: result.isDevBypass,
      })
    );

    try {
      const res = await fetch("/api/dev-auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const { user: dbUser } = await res.json();

      // ORDER MATTERS: postVerifyRoute() reads the fabverify_profile key to
      // tell a returning user from a first-time signup, and applyIdentity()
      // rewrites that key. Resolve the route FIRST, then load the identity,
      // or the returning-user branch silently changes behaviour.
      if (dbUser?.user_type) {
        const next = postVerifyRoute() ?? getLandingRoute(dbUser.user_type);
        applyIdentity(dbUser);
        router.push(next);
        setIsVerifying(false);
        return;
      }

      if (dbUser) {
        const next = postVerifyRoute() ?? "/onboarding/type";
        applyIdentity(dbUser);
        router.push(next);
        setIsVerifying(false);
        return;
      }
    } catch {
      // Lookup failed (e.g. network error) — fall through to new-user path below.
    }

    // Brand-new (or unresolvable) account — reset to a blank identity so no
    // previous occupant of this browser bleeds into onboarding.
    const next = postVerifyRoute() ?? "/onboarding/profile";
    applyIdentity(null);
    router.push(next);
    setIsVerifying(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "") && !isVerifying) {
      void verifyOtp(next.join(""));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (!isOtpComplete || isVerifying) return;
    void verifyOtp(otp.join(""));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy sm:p-6">
      <div className="flex min-h-screen w-full flex-col justify-center rounded-none border-0 bg-card p-10 sm:min-h-0 sm:w-auto sm:max-w-[440px] sm:rounded-2xl sm:border sm:border-border-dark">
        <div className="flex items-center justify-center gap-1 text-lg">
          <span>🧵</span>
          <span className="font-bold text-white">Fab</span>
          <span className="font-bold text-gold">Verify</span>
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-white">
          Create your account
        </h1>
        <p className="mb-8 mt-2 text-center text-sm text-text-secondary">
          Join India&apos;s garment industry platform
        </p>

        {smsUnavailable ? (
          <>
            <p className="text-center text-sm text-text-primary">
              We are setting up SMS verification. Please contact us on WhatsApp at{" "}
              {WHATSAPP_NUMBER_DISPLAY} to get early access.
            </p>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block w-full rounded-lg bg-gold py-3.5 text-center font-bold text-navy transition-colors hover:bg-[#dc9420]"
            >
              Contact us on WhatsApp →
            </a>

            {waitlistJoined ? (
              <p className="mt-6 text-center text-sm text-gold">
                You&apos;re on the list — we&apos;ll notify you as soon as SMS verification is ready.
              </p>
            ) : (
              <>
                <p className="mb-2 mt-6 text-center text-sm text-text-secondary">
                  Or join our waiting list:
                </p>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={waitlistEmail}
                  onChange={(event) => setWaitlistEmail(event.target.value)}
                  className="w-full rounded-lg border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder-text-secondary focus:border-gold"
                />
                {waitlistError && (
                  <p className="mt-2 text-center text-[12px] text-red-400">{waitlistError}</p>
                )}
                <button
                  onClick={() => void joinWaitlist()}
                  disabled={!waitlistEmail.trim() || isJoiningWaitlist}
                  className="mt-3 w-full rounded-lg border border-gold py-3.5 font-bold text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isJoiningWaitlist ? "Joining..." : "Join Waitlist →"}
                </button>
              </>
            )}

            <button
              onClick={() => setSmsUnavailable(false)}
              className="mt-6 block w-full text-center text-sm text-text-secondary hover:underline"
            >
              ← Back
            </button>
          </>
        ) : step === "phone" ? (
          <>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm text-text-primary"
            >
              Mobile Number
            </label>
            <div className="flex items-center rounded-lg border border-border-dark bg-navy px-4 py-3 transition-colors focus-within:border-gold">
              <span className="mr-2 text-text-secondary">+91</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="Enter your mobile number"
                value={phone}
                onChange={(event) => handlePhoneChange(event.target.value)}
                className="flex-1 bg-transparent text-text-primary placeholder-text-secondary outline-none"
              />
            </div>

            {errorMessage && (
              <p className="mt-2 text-center text-[12px] text-red-400">{errorMessage}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={!isPhoneValid || isSendingOtp}
              className="mt-6 w-full rounded-lg bg-gold py-3.5 font-bold text-navy transition-colors hover:bg-[#dc9420] disabled:cursor-not-allowed disabled:bg-gold/40"
            >
              {isSendingOtp ? "Sending..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            {isDev && (
              <p className="mb-4 text-center text-[13px] text-gold">
                Development mode: enter 123456 to continue
              </p>
            )}

            {errorMessage && (
              <p className="mb-2 text-center text-[12px] text-red-400">{errorMessage}</p>
            )}

            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleOtpChange(index, event.target.value)
                  }
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  disabled={isVerifying}
                  className="h-14 w-12 rounded-lg border border-border-dark bg-navy text-center text-2xl font-bold text-text-primary outline-none focus:border-gold disabled:opacity-60"
                />
              ))}
            </div>

            <div className="mt-4 text-center text-sm">
              {countdown > 0 ? (
                <span className="text-text-secondary">
                  Resend OTP in {countdown}s
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={isVerifying}
                  className="font-medium text-gold hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={!isOtpComplete || isVerifying}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 font-bold transition-colors ${
                isVerifying
                  ? "cursor-not-allowed bg-gold/80 text-navy"
                  : isOtpComplete
                    ? "bg-gold text-navy hover:bg-[#dc9420]"
                    : "cursor-not-allowed bg-gray-700 text-gray-400"
              }`}
            >
              {isVerifying ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
