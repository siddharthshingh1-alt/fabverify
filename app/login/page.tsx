"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  consumePendingChatRedirect,
  peekPendingChatRedirect,
} from "../lib/postAuthRedirect";
import { supabase } from "../lib/supabase";

const WHATSAPP_NUMBER_DISPLAY = "+91 97739 33279";
const WHATSAPP_LINK = "https://wa.me/919773933279";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;
const DEV_OTP_BYPASS = "123456";

// Real, currently-routable dashboard for each UserContext UserType — see
// app/context/UserContext.tsx. Anything not in this map (or not yet known)
// falls back to the generic adaptive /dashboard.
const DASHBOARD_ROUTE_BY_TYPE: Record<string, string> = {
  buyer: "/brand/dashboard",
  manufacturer: "/manufacturer/dashboard",
  fabric_mill: "/mill/dashboard",
  trim_supplier: "/supplier/dashboard",
  artisan: "/artisan/dashboard",
  job_worker: "/jobworker/dashboard",
  designer: "/talent/designer/dashboard",
  master: "/talent/master/dashboard",
  merchandiser: "/talent/merchandiser/dashboard",
  qc_inspector: "/talent/qc/dashboard",
};

// Only allow the dev OTP bypass on localhost — never in production.
const isDev =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export default function LogIn() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [chatRedirectPending, setChatRedirectPending] = useState(false);
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Only skip login for a visitor who has OUR OWN app session (both
  // fabverify_auth AND a resolved user_type) — checking only for a
  // Supabase session isn't enough. With phone confirmations off in
  // Supabase, signInWithOtp() creates a session immediately, before the
  // OTP is ever verified, so a session can exist for a visitor we've never
  // actually authenticated. If our own localStorage data isn't there,
  // treat any such Supabase session as stray and clear it, then send them
  // back to whatever they were trying to reach (e.g. bounced here by
  // ChatAuthGuard) or their dashboard, same as a fresh login would.
  useEffect(() => {
    async function checkAuth() {
      const auth = localStorage.getItem("fabverify_auth");
      const userType = localStorage.getItem("fabverify_user_type");

      if (auth && userType) {
        router.replace(
          consumePendingChatRedirect() ?? DASHBOARD_ROUTE_BY_TYPE[userType] ?? "/dashboard"
        );
        return;
      }

      await supabase.auth.signOut();
      setChatRedirectPending(!!peekPendingChatRedirect());
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

  // Dev mode (localhost only) — no SMS provider is wired up in Supabase yet,
  // so real signInWithOtp() throws "unsupported phone provider". Skip
  // Supabase entirely and just move to the OTP step, where 123456 is
  // accepted. In production there is no bypass, so we attempt a real send —
  // it will fail until an SMS provider is configured, and that failure
  // shows a WhatsApp/waitlist fallback instead of a dead-end OTP screen.
  const sendOtp = async () => {
    setIsSendingOtp(true);
    setErrorMessage("");
    setSmsUnavailable(false);

    // Strip spaces, dashes, and any non-digit characters, then take the
    // last 10 digits — Twilio rejects anything that isn't clean E.164.
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const formattedPhone = "+91" + cleanPhone;

    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      setIsSendingOtp(false);
      return;
    }

    if (!["6", "7", "8", "9"].includes(cleanPhone[0])) {
      setErrorMessage("Please enter a valid Indian mobile number");
      setIsSendingOtp(false);
      return;
    }

    if (!isDev) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: { channel: "sms" },
        });
        if (error) {
          console.error("OTP error:", error.message, error);

          // Only fall back to WhatsApp/waitlist when the SMS provider
          // itself isn't set up — a transient/network error should let
          // the user retry instead of getting routed to a dead end.
          const message = error.message.toLowerCase();
          if (
            message.includes("not configured") ||
            message.includes("provider") ||
            message.includes("sms")
          ) {
            setSmsUnavailable(true);
          } else {
            setErrorMessage(error.message);
          }
          setIsSendingOtp(false);
          return;
        }
      } catch {
        setErrorMessage("Something went wrong. Please try again.");
        setIsSendingOtp(false);
        return;
      }
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

  // Dev mode (localhost only) — accept a fixed test code and derive a
  // stable per-phone-number id, since there's no real Supabase session to
  // pull an id from. In production, verify the real code Twilio sent via
  // Supabase phone auth and use the real auth user id. Either way, look the
  // phone number up in the database (not just localStorage) so a returning
  // user on a fresh browser/device still lands on their real dashboard
  // instead of /onboarding/profile.
  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setErrorMessage("");

    let userId: string;

    if (isDev) {
      if (code !== DEV_OTP_BYPASS) {
        setErrorMessage("Development mode: enter 123456 to continue");
        setIsVerifying(false);
        return;
      }
      userId = "dev-user-" + phone.replace(/\D/g, "");
    } else {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const formattedPhone = "+91" + cleanPhone;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: "sms",
      });

      if (error || !data.user) {
        setErrorMessage("Invalid OTP. Please try again.");
        setIsVerifying(false);
        return;
      }
      userId = data.user.id;
    }

    localStorage.setItem(
      "fabverify_auth",
      JSON.stringify({
        userId,
        phone,
        verified: true,
        verifiedAt: new Date().toISOString(),
        devMode: isDev,
      })
    );

    try {
      const res = await fetch("/api/dev-auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const { user: dbUser } = await res.json();

      if (dbUser && dbUser.user_type) {
        localStorage.setItem(
          "fabverify_profile",
          JSON.stringify({
            name: dbUser.name,
            email: dbUser.email,
            city: dbUser.city,
            state: dbUser.state,
          })
        );
        localStorage.setItem("fabverify_user_type", dbUser.user_type);

        router.push(
          consumePendingChatRedirect() ??
            DASHBOARD_ROUTE_BY_TYPE[dbUser.user_type] ??
            "/dashboard"
        );
        setIsVerifying(false);
        return;
      }

      if (dbUser && !dbUser.user_type) {
        localStorage.setItem(
          "fabverify_profile",
          JSON.stringify({
            name: dbUser.name,
            email: dbUser.email,
            city: dbUser.city,
          })
        );
        router.push(consumePendingChatRedirect() ?? "/onboarding/type");
        setIsVerifying(false);
        return;
      }
    } catch {
      // Lookup failed (e.g. network error) — fall through to new-user path below.
    }

    router.push("/onboarding/profile");
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
          Welcome back
        </h1>
        <p className="mb-8 mt-2 text-center text-sm text-text-secondary">
          Log in to your FabVerify account
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

            {chatRedirectPending && (
              <p className="mt-2 text-center text-[12px] italic text-gray-400">
                Sign in to access your FabVerify messages
              </p>
            )}

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
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-gold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
