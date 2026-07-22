"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { consumePendingChatRedirect } from "../lib/postAuthRedirect";

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
const DEV_OTP_BYPASS = "123456";

// Only allow the dev OTP bypass on localhost — never in production, even if
// NODE_ENV is misconfigured on the deploy.
const isDev =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  // Development mode — no SMS provider (MSG91) is wired up in Supabase yet,
  // so real signInWithOtp() throws "unsupported phone provider". Skip
  // Supabase entirely and just move to the OTP step until MSG91 is connected.
  const sendOtp = async () => {
    setIsSendingOtp(true);
    setErrorMessage("");

    if (!phone || phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit phone number");
      setIsSendingOtp(false);
      return;
    }

    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(RESEND_SECONDS);
    setStep("otp");
    setIsSendingOtp(false);
  };

  const handleSendOtp = () => {
    if (!isPhoneValid || isSendingOtp) return;
    void sendOtp();
  };

  const handleResendOtp = () => {
    if (countdown > 0 || isSendingOtp) return;
    void sendOtp().then(() => otpRefs.current[0]?.focus());
  };

  // Development mode — no SMS provider (MSG91) is wired up yet, so there's
  // no real code to check against. Accept a fixed test code instead of
  // calling Supabase phone auth, and derive a stable per-phone-number id so
  // the same test phone number consistently maps back to the same "user".
  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setErrorMessage("");

    if (!isDev) {
      setErrorMessage("Invalid OTP. Please try again.");
      setIsVerifying(false);
      return;
    }

    if (code !== DEV_OTP_BYPASS) {
      setErrorMessage("Development mode: enter 123456 to continue");
      setIsVerifying(false);
      return;
    }

    const mockUserId = "dev-user-" + phone.replace(/\D/g, "");

    const existingProfile = localStorage.getItem("fabverify_profile");
    const existingAuth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");

    localStorage.setItem(
      "fabverify_auth",
      JSON.stringify({
        userId: mockUserId,
        phone,
        verified: true,
        verifiedAt: new Date().toISOString(),
        devMode: true,
      })
    );

    if (existingAuth.phone === phone && existingProfile) {
      const userType = localStorage.getItem("fabverify_user_type");
      router.push(postVerifyRoute() ?? (userType ? "/dashboard" : "/onboarding/type"));
      setIsVerifying(false);
      return;
    }

    router.push(postVerifyRoute() ?? "/onboarding/profile");
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

        {step === "phone" ? (
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
