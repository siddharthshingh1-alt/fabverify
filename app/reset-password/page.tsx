"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sendOtp as providerSendOtp, storeLocalSessionToken } from "../lib/authProvider";
import { markHasPassword } from "../lib/passwordGate";
import { consumePendingChatRedirect } from "../lib/postAuthRedirect";
import { looksLikeProviderProblem } from "../lib/providerFallback";
import { OTP_RESEND_SECONDS } from "../lib/otpPolicy";
import { useUser } from "../context/UserContext";
import { getLandingRoute } from "../lib/routing";

/**
 * FORGOT PASSWORD — chunk 2.8b.
 *
 * ⚠️ THIS PAGE IS PUBLIC AND UNAUTHENTICATED BY DEFINITION. Everything that
 * decides anything lives behind /api/auth/password-reset; this file collects
 * three inputs and renders what the server says. It must never branch on
 * account existence, because it is never told about it — every failure comes
 * back as the same opaque message ([I28]).
 *
 * ⚠️ THE OTP SEND GOES THROUGH THE SEAM with purpose "reset", which is what
 * makes it server-side, throttled and enumeration-uniform (2.6c). Do NOT call
 * the provider from here; that is the exact regression 2.6c existed to fix.
 */

type Stage = "phone" | "code";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { applyIdentity } = useUser();

  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS);
  const codeRef = useRef<HTMLInputElement>(null);

  const digits = phone.replace(/\D/g, "").slice(-10);
  const isPhoneValid = /^[6-9]\d{9}$/.test(digits);

  // Resend countdown, mirroring login's. The number comes from the shared
  // policy so the client can never offer a resend the server will refuse (D6).
  useEffect(() => {
    if (stage !== "code" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  const requestCode = async () => {
    if (!isPhoneValid || busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    const result = await providerSendOtp(digits, "reset");

    if (!result.ok) {
      // ⚠️ THE SAME THREE-BRANCH SHAPE LOGIN USES, and for the same reason: a
      // provider outage must not be shown as "wrong number", and a THROTTLE
      // must not be shown as a provider outage — a throttled user needs "wait
      // and retry", not the WhatsApp/waitlist dead end. 2.6c asserts the
      // throttle message cannot trip looksLikeProviderProblem.
      // `unknown` carries no message — narrow before reading one, or the
      // fallback branch reads undefined and shows a blank error.
      const message = "message" in result ? result.message : "";
      setError(
        result.reason === "provider_unavailable" || looksLikeProviderProblem(message)
          ? "We could not send a code right now. Please try again shortly."
          : message || "We could not send a code. Please try again."
      );
      setBusy(false);
      return;
    }

    // ⚠️ ALWAYS THE SAME MESSAGE, whether or not the number has an account.
    // The server already refuses to distinguish them; saying "no account
    // found" here would hand back the answer it withheld.
    setNotice("If that number has an account, a code is on its way.");
    setStage("code");
    setCountdown(OTP_RESEND_SECONDS);
    setBusy(false);
    setTimeout(() => codeRef.current?.focus(), 0);
  };

  const submitReset = async () => {
    if (busy) return;
    setBusy(true);
    setError("");

    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: digits, code, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(
        response.status >= 500
          ? "Service temporarily unavailable. Please try again."
          : body?.error ?? "That code is not valid. Request a new one."
      );
      setBusy(false);
      return;
    }

    const { token, user } = await response.json();

    // ⚠️ THE SAME ORDER LOGIN USES, AND THE ORDER IS LOAD-BEARING. The token is
    // stored BEFORE any navigation (apiClient reads it to build the
    // Authorization header, so navigating first races the first authenticated
    // request and 401s it intermittently), and fabverify_auth is written BEFORE
    // router.push or AuthGuard bounces the user straight back to /login.
    storeLocalSessionToken(token);
    markHasPassword(true);

    localStorage.setItem(
      "fabverify_auth",
      JSON.stringify({
        userId: user.id,
        phone: digits,
        verified: true,
        verifiedAt: new Date().toISOString(),
        // A reset is a real credential change on every host, never the A10 bypass.
        devMode: false,
      })
    );

    setPassword("");
    setCode("");
    applyIdentity(user);
    router.push(consumePendingChatRedirect() ?? getLandingRoute(user.user_type));
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e8e2d9] p-8">
        <h1 className="text-2xl font-semibold text-[#2d2a26]">Reset your password</h1>

        {stage === "phone" ? (
          <>
            <p className="mt-2 text-sm text-[#6b6459]">
              Enter your registered mobile number and we&apos;ll send you a code.
            </p>

            <label className="block mt-6 text-sm font-medium text-[#2d2a26]" htmlFor="phone">
              Mobile number
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-3 py-2 rounded-lg bg-[#f5f1ea] text-[#6b6459] text-sm">+91</span>
              <input
                id="phone"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="flex-1 px-3 py-2 rounded-lg border border-[#e8e2d9] focus:outline-none focus:ring-2 focus:ring-[#c4a582]"
              />
            </div>

            <button
              onClick={requestCode}
              disabled={!isPhoneValid || busy}
              className="mt-6 w-full py-2.5 rounded-lg bg-[#2d2a26] text-white font-medium disabled:opacity-40"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          </>
        ) : (
          <>
            {notice && <p className="mt-2 text-sm text-[#6b6459]">{notice}</p>}

            <label className="block mt-6 text-sm font-medium text-[#2d2a26]" htmlFor="code">
              6-digit code
            </label>
            <input
              id="code"
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-[#e8e2d9] tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-[#c4a582]"
            />

            <label className="block mt-5 text-sm font-medium text-[#2d2a26]" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 12 characters"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-[#e8e2d9] focus:outline-none focus:ring-2 focus:ring-[#c4a582]"
            />

            <button
              onClick={submitReset}
              disabled={busy || code.length !== 6 || password.length === 0}
              className="mt-6 w-full py-2.5 rounded-lg bg-[#2d2a26] text-white font-medium disabled:opacity-40"
            >
              {busy ? "Resetting…" : "Set new password"}
            </button>

            <button
              onClick={requestCode}
              disabled={countdown > 0 || busy}
              className="mt-3 w-full py-2 text-sm text-[#6b6459] disabled:opacity-40"
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
            </button>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#a13d2d]">
            {error}
          </p>
        )}

        {/*
          ⚠️ HONEST COPY, PER THE 2.8a NOTE. A reset bumps token_epoch, which
          evicts OUR session tokens only — a stolen SUPABASE session survives
          it, and every OTP login still mints one. Do not write "this signs you
          out everywhere"; the code does not deliver it.
        */}
        <p className="mt-6 text-xs text-[#8a8279]">
          Resetting your password signs out your other FabVerify sessions.
        </p>

        <Link href="/login" className="mt-4 block text-sm text-[#6b6459] underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
