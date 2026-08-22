"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { storeLocalSessionToken } from "../lib/authProvider";
import { authFetch } from "../lib/apiClient";
import { markHasPassword } from "../lib/passwordGate";
import {
  consumePendingChatRedirect,
  peekPendingChatRedirect,
} from "../lib/postAuthRedirect";
// Auth goes through the SEAM, not Supabase directly (DECISIONS X5). Aliased
// because this file already has local handlers called sendOtp / verifyOtp —
// an unaliased import would be a duplicate declaration.
import {
  isDevBypassHost,
  sendOtp as providerSendOtp,
  signOut as providerSignOut,
  verifyOtp as providerVerifyOtp,
} from "../lib/authProvider";
// BACKUP fallback detection — see the note at its call site in sendOtp().
// Extracted to a shared file in chunk 1.7 so signup uses the SAME definition
// rather than a copy; it deliberately lives outside the seam, since it is
// insurance against the seam's own heuristic changing.
import { looksLikeProviderProblem } from "../lib/providerFallback";
// The resend countdown, shared with the server-side OTP throttle so the two
// cannot disagree — see the note at RESEND_SECONDS below.
import { OTP_RESEND_SECONDS } from "../lib/otpPolicy";
import { useUser } from "../context/UserContext";
import { getLandingRoute } from "../lib/routing";

const WHATSAPP_NUMBER_DISPLAY = "+91 97739 33279";
const WHATSAPP_LINK = "https://wa.me/919773933279";

const OTP_LENGTH = 6;
// ⚠️ RESEND_SECONDS is no longer defined here. It was a local `= 45` in BOTH
// this file and its counterpart, and chunk 2.6c gave the server a matching
// cooldown — so the two must agree or the UI enables "Resend OTP" at 45s and
// the server answers 429, a login screen that looks broken. One definition
// now, in the policy module (decision D6, 2026-08-22).
const RESEND_SECONDS = OTP_RESEND_SECONDS;
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

export default function LogIn() {
  const router = useRouter();
  const { applyIdentity } = useUser();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  // Chunk 2.6a. Never persisted, never logged, cleared on navigation away.
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
        router.replace(consumePendingChatRedirect() ?? getLandingRoute(userType));
        return;
      }

      await providerSignOut();
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
      // FALLBACK DECISION — deliberately belt-and-suspenders (2026-07-30).
      //
      // PRIMARY: the seam's structured `provider_unavailable`.
      // BACKUP:  re-check the message text here as well.
      //
      // ⚠️ HONEST NOTE: the backup is currently UNREACHABLE. The seam derives
      // `provider_unavailable` using the identical three-substring test on the
      // identical string, so any message that would match here has already
      // been classified upstream. It is kept on purpose as insurance against
      // the seam's heuristic being narrowed later, and can be deleted once the
      // structured signal has been proven in production over time. Do not read
      // its presence as evidence that the structured signal is insufficient.
      //
      // Why this branch matters: with Twilio on a trial that only delivers to
      // verified caller IDs, this is the path most real users would hit. It
      // must show WhatsApp/waitlist rather than a dead-end OTP screen.
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

  /**
   * Ask the server whether this freshly-authenticated account still needs a
   * password, and return where to send them. `null` means "carry on normally".
   *
   * ⚠️ IT NEVER THROWS AND NEVER BLOCKS THE LOGIN. Every failure — network,
   * 503, 401, malformed body — returns null, i.e. route normally. A mandatory
   * gate that can refuse to let someone finish logging in is the trap this
   * whole design exists to avoid, and enforcement does not depend on this
   * function anyway: AuthGuard re-checks on every app entry.
   */
  const passwordGateDestination = async (): Promise<string | null> => {
    try {
      const res = await authFetch("/api/account/password-status");
      if (!res.ok) return null;
      const { hasPassword } = await res.json();
      markHasPassword(hasPassword);
      return hasPassword ? null : "/onboarding/password";
    } catch {
      return null;
    }
  };

  /**
   * PASSWORD LOGIN (chunk 2.6a) — the primary path.
   *
   * ⚠️ IT REUSES verifyOtp's SUCCESS TAIL EXACTLY. Everything after "the
   * credential checked out" — the localStorage mirror, applyIdentity, the
   * routing decision — is the same code path OTP already uses and that chunk
   * 1.6 proved in production. Writing a second, parallel landing sequence is
   * how two logins drift into behaving differently, which is precisely the
   * class of bug that produced the enterprise-identity and content-bleeding
   * problems this project has already paid for.
   *
   * ⚠️ ONE GENERIC ERROR FOR EVERY FAILURE. The route answers 401 with an
   * identical body for wrong password, unknown phone, and
   * account-with-no-password. This handler must not add a distinction the
   * server refused to make — no "no account found", no "you have no password
   * set, use OTP". The only enriched case is a LOCKED account, which the
   * server returns solely to a caller who supplied the CORRECT password
   * ([I24]) and therefore cannot be provoked by a prober.
   */
  const passwordLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage("");

    let response: Response;
    try {
      response = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
    } catch {
      // Network failure is NOT a credential failure — never tell someone with
      // a good password that it is wrong (Issue E, at the UI layer).
      setErrorMessage("Could not reach FabVerify. Check your connection and try again.");
      setIsLoggingIn(false);
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      // 503 keeps its own message for the same Issue E reason.
      setErrorMessage(
        response.status === 503
          ? "Service temporarily unavailable. Please try again."
          : body?.error ?? "Invalid phone number or password."
      );
      setIsLoggingIn(false);
      return;
    }

    const { token, user } = await response.json();

    // ⚠️ STORED BEFORE ANY NAVIGATION. apiClient reads this to build the
    // Authorization header; navigating first would race the first authenticated
    // request against the token being written and 401 it intermittently — the
    // kind of failure that reproduces once in ten tries and looks like a fluke.
    storeLocalSessionToken(token);
    // No status round trip needed: authenticating WITH a password proves one
    // exists. Saves a call on the primary login path.
    markHasPassword(true);

    // Same mirror OTP writes. `devMode: false` — a password login is a real
    // credential check on every host, so it is never the A10 bypass.
    localStorage.setItem(
      "fabverify_auth",
      JSON.stringify({
        userId: user.id,
        phone,
        verified: true,
        verifiedAt: new Date().toISOString(),
        devMode: false,
      })
    );

    setPassword("");
    applyIdentity(user);
    router.push(consumePendingChatRedirect() ?? getLandingRoute(user.user_type));
    setIsLoggingIn(false);
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
  // auth user id). Either way, the phone is then looked up in the DATABASE —
  // not just localStorage — so a returning user on a fresh browser/device
  // still lands on their real dashboard rather than /onboarding/profile.
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
    const userId = result.storageUserId;

    localStorage.setItem(
      "fabverify_auth",
      JSON.stringify({
        userId,
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

      // applyIdentity() makes the signed-in account live in React context
      // immediately AND rewrites the localStorage mirrors, clearing any
      // previous account's leftovers. Writing localStorage alone is not
      // enough: UserProvider mounts once in the root layout, so its
      // hydration never re-runs on a client-side navigation and the stale
      // identity would decide routing and guards until a hard refresh.
      if (dbUser && dbUser.user_type) {
        applyIdentity(dbUser);

        // ⚠️ THE GATE IS CHECKED HERE ONLY TO AVOID A FLASH, NOT TO ENFORCE.
        // AuthGuard enforces it on every app entry regardless; without this
        // pre-check the user would see their dashboard for an instant before
        // being bounced. If this call fails for any reason we fall through to
        // normal routing and the guard catches it a moment later — so a flaky
        // network degrades to a flash, never to a bypass and never to a
        // blocked login.
        const destination = await passwordGateDestination();
        if (destination) {
          router.push(destination);
          setIsVerifying(false);
          return;
        }

        router.push(
          consumePendingChatRedirect() ?? getLandingRoute(dbUser.user_type)
        );
        setIsVerifying(false);
        return;
      }

      if (dbUser && !dbUser.user_type) {
        // Known account, onboarding unfinished — load what we know and let
        // /onboarding/type set the account type.
        applyIdentity(dbUser);
        router.push(consumePendingChatRedirect() ?? "/onboarding/type");
        setIsVerifying(false);
        return;
      }
    } catch {
      // Lookup failed (e.g. network error) — fall through to new-user path below.
    }

    // Brand-new (or unresolvable) account — reset to a blank identity so no
    // previous occupant of this browser bleeds into onboarding.
    applyIdentity(null);
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

            {/*
              PASSWORD IS THE PRIMARY CREDENTIAL (chunk 2.6a). OTP moves to the
              fallback link below.

              ⚠️ THE FIELD IS ALWAYS RENDERED, never revealed after a check on
              the phone number. Showing it only for registered numbers — or
              only once a lookup says a password exists — would turn the FORM
              ITSELF into the enumeration oracle that every layer beneath it is
              built to close. It costs nothing to render for a number that has
              no account: submitting simply produces the same generic failure
              as a wrong password.
            */}
            <label htmlFor="password" className="mb-2 mt-4 block text-sm text-text-primary">
              Password
            </label>
            <div className="flex items-center rounded-lg border border-border-dark bg-navy px-4 py-3 transition-colors focus-within:border-gold">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && isPhoneValid && password) {
                    void passwordLogin();
                  }
                }}
                disabled={isLoggingIn}
                className="flex-1 bg-transparent text-text-primary placeholder-text-secondary outline-none disabled:opacity-60"
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
              onClick={() => void passwordLogin()}
              disabled={!isPhoneValid || !password || isLoggingIn}
              className="mt-6 w-full rounded-lg bg-gold py-3.5 font-bold text-navy transition-colors hover:bg-[#dc9420] disabled:cursor-not-allowed disabled:bg-gold/40"
            >
              {isLoggingIn ? "Logging in..." : "Log in"}
            </button>

            {/*
              ⚠️ THE FALLBACK MUST STAY VISIBLE AND UNCONDITIONAL. Every
              account that predates M10 has no password, and the ONLY way in
              for them is this link. Hiding it behind "forgot password?", or
              showing it only when a lookup says the account has no credential,
              would both lock out existing users and re-open enumeration.
            */}
            <button
              onClick={handleSendOtp}
              disabled={!isPhoneValid || isSendingOtp}
              className="mt-4 block w-full text-center text-sm text-text-secondary underline transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSendingOtp ? "Sending..." : "Log in with OTP instead"}
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
