"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function LogIn() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
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

  const handleSendOtp = () => {
    if (!isPhoneValid) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(RESEND_SECONDS);
    setStep("otp");
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(RESEND_SECONDS);
    otpRefs.current[0]?.focus();
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
      setIsVerifying(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
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
    setIsVerifying(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
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

            <button
              onClick={handleSendOtp}
              disabled={!isPhoneValid}
              className="mt-6 w-full rounded-lg bg-gold py-3.5 font-bold text-navy transition-colors hover:bg-[#dc9420] disabled:cursor-not-allowed disabled:bg-gold/40"
            >
              Send OTP
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-center text-sm text-text-secondary">
              We sent a code to +91{phone}
            </p>

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
