"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/app/lib/apiClient";
import { signOut as providerSignOut } from "@/app/lib/authProvider";
import { MIN_PASSWORD_LENGTH } from "@/app/lib/passwordPolicy";
import { getLandingRoute } from "@/app/lib/routing";
import {
  clearPasswordGate,
  markHasPassword,
} from "@/app/lib/passwordGate";

/**
 * THE MANDATORY SET-PASSWORD SCREEN. Chunk 2.6b (M10).
 *
 * Every account must hold a password ([I27]). Accounts that predate M10 have
 * none, so they authenticate by OTP — which is never gated — and land here
 * before they can reach the app.
 *
 * ⚠️ THIS SCREEN LIVES UNDER /onboarding, AND THAT IS THE LOOP DEFENCE, NOT A
 * FILING CHOICE. `app/onboarding/layout.tsx` wraps this tree in
 * `AuthGuard mode="phone"`, and the password condition is evaluated ONLY in
 * `"profile"` mode. So the screen the guard redirects TO cannot itself be
 * redirected away by that same guard — the exemption is structural rather
 * than a path list someone has to remember to maintain. Moving this page
 * outside /onboarding would create an infinite redirect.
 *
 * ⚠️ IT IS A PRODUCT REQUIREMENT, NOT A SECURITY BOUNDARY. A client-side
 * route guard can be bypassed with devtools; nothing is protected by it, and
 * the real boundary is still server-side authorisation on every API route.
 * Building it server-side would mean maintaining an exemption list (this
 * page, logout, the password endpoint…) and getting that list wrong locks
 * every user out of everything. Same doctrine as AuthGuard itself.
 *
 * ── ⚠️ THE USER MUST NEVER BE TRAPPED ────────────────────────────────────
 * Mandatory + broken = stranded, so every failure below returns an editable,
 * submittable form:
 *   · policy rejection   → the server's message, retry
 *   · network failure    → retry
 *   · 503 outage         → retry (and the guard does NOT redirect on unknown)
 *   · 401 session gone   → back to /login, which is recoverable by OTP
 *   · already-set        → treated as DONE, never as an error (see below)
 * Log out is always available.
 */
export default function SetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  /**
   * ⚠️ RE-CHECK ON MOUNT, AND IT CLOSES A REAL TRAP.
   *
   * If a previous attempt's WRITE SUCCEEDED but its RESPONSE WAS LOST (a
   * dropped connection at exactly the wrong moment), the credential now
   * exists — and `setPassword` requires the current password once one does.
   * The user would be asked, on a screen they cannot leave, for a password
   * they do not believe they ever set. Re-reading the real state on arrival
   * means a refresh always escapes that, and the submit handler below treats
   * `reverification-required` the same way for the same reason.
   */
  useEffect(() => {
    let cancelled = false;

    async function confirmStillNeeded() {
      try {
        const res = await authFetch("/api/account/password-status");
        if (!res.ok) {
          // 503 or 401 — do NOT guess. Show the form; submitting will surface
          // the real error, and the guard will not bounce on unknown state.
          if (!cancelled) setChecking(false);
          return;
        }
        const { hasPassword } = await res.json();
        if (hasPassword) {
          markHasPassword(true);
          leaveForApp();
          return;
        }
      } catch {
        /* fall through to showing the form */
      }
      if (!cancelled) setChecking(false);
    }

    void confirmStillNeeded();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ⚠️ A FULL PAGE LOAD, NOT router.push() — AND THIS IS THE ANTI-LOOP FIX.
   *
   * `UserProvider` mounts once in the root layout, so its hydration never
   * re-runs on a client-side navigation (documented at login/page.tsx). A
   * soft push would land on a guarded route whose in-memory state still says
   * "no password", bounce back here, which would forward again — an infinite
   * ping-pong. A hard navigation re-hydrates everything from the server, so
   * the state that decides routing is guaranteed fresh. It costs one page
   * load, once in an account's lifetime.
   */
  function leaveForApp() {
    const userType = localStorage.getItem("fabverify_user_type");
    window.location.href = userType ? getLandingRoute(userType) : "/onboarding/type";
  }

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    password.length >= MIN_PASSWORD_LENGTH && password === confirm && !isSaving;

  const save = async () => {
    setIsSaving(true);
    setError("");

    let res: Response;
    try {
      res = await authFetch("/api/account/password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
    } catch {
      setError("Could not reach FabVerify. Check your connection and try again.");
      setIsSaving(false);
      return;
    }

    if (res.ok) {
      markHasPassword(true);
      leaveForApp();
      return;
    }

    const body = await res.json().catch(() => ({}));

    // ⚠️ ON THIS SCREEN, "enter your current password" CAN ONLY MEAN THE WRITE
    // ALREADY LANDED — the user arrived here precisely because they had no
    // credential. So it is success reported late, not a failure. Treating it
    // as an error would strand them on a mandatory screen.
    if (body?.reason === "reverification-required") {
      markHasPassword(true);
      leaveForApp();
      return;
    }

    if (res.status === 401) {
      setError("Your session expired. Please log in again.");
      setIsSaving(false);
      setTimeout(() => router.push("/login"), 1200);
      return;
    }

    setError(
      res.status === 503
        ? "Service temporarily unavailable. Please try again."
        : body?.message ?? body?.error ?? "Could not set your password. Please try again."
    );
    setIsSaving(false);
  };

  const logOut = async () => {
    await providerSignOut();
    localStorage.removeItem("fabverify_auth");
    // Through the module, not a second inlined removeItem. This screen was the
    // ONLY place the key was ever cleared, and it did so by hand while
    // clearPasswordGate() sat unused -- which is exactly how the main sign-out
    // path came to miss it entirely.
    clearPasswordGate();
    window.location.href = "/login";
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <p className="text-sm text-text-secondary">Checking your account…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy sm:p-6">
      <div className="flex min-h-screen w-full flex-col justify-center rounded-none border-0 bg-card p-10 sm:min-h-0 sm:w-auto sm:max-w-[440px] sm:rounded-2xl sm:border sm:border-border-dark">
        <div className="flex items-center justify-center gap-1 text-lg">
          <span>🧵</span>
          <span className="font-bold text-white">Fab</span>
          <span className="font-bold text-gold">Verify</span>
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-white">
          Set your password
        </h1>
        <p className="mb-8 mt-2 text-center text-sm text-text-secondary">
          FabVerify now uses a password to log in. Set one to continue — you can
          still use OTP any time.
        </p>

        <label htmlFor="new-password" className="mb-2 block text-sm text-text-primary">
          New password
        </label>
        <div className="flex items-center rounded-lg border border-border-dark bg-navy px-4 py-3 transition-colors focus-within:border-gold">
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSaving}
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary outline-none disabled:opacity-60"
          />
        </div>

        <label htmlFor="confirm-password" className="mb-2 mt-4 block text-sm text-text-primary">
          Confirm password
        </label>
        <div className="flex items-center rounded-lg border border-border-dark bg-navy px-4 py-3 transition-colors focus-within:border-gold">
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter it again"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSubmit) void save();
            }}
            disabled={isSaving}
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary outline-none disabled:opacity-60"
          />
        </div>

        {/*
          ⚠️ REQUIREMENTS SHOWN UP FRONT, not only after a rejection.
          passwordPolicy.ts is browser-safe by construction for exactly this —
          a mandatory screen that only reveals its rules by refusing you is how
          a user ends up unable to satisfy it. The server always revalidates;
          this is UX, never the boundary.
        */}
        <p className="mt-3 text-[12px] text-text-secondary">
          At least {MIN_PASSWORD_LENGTH} characters. A short phrase you will
          remember beats a short jumble you will not.
        </p>

        {tooShort && (
          <p className="mt-2 text-[12px] text-red-400">
            Too short — {MIN_PASSWORD_LENGTH} characters minimum.
          </p>
        )}
        {mismatch && (
          <p className="mt-2 text-[12px] text-red-400">Both passwords must match.</p>
        )}
        {error && <p className="mt-2 text-center text-[12px] text-red-400">{error}</p>}

        <button
          onClick={() => void save()}
          disabled={!canSubmit}
          className="mt-6 w-full rounded-lg bg-gold py-3.5 font-bold text-navy transition-colors hover:bg-[#dc9420] disabled:cursor-not-allowed disabled:bg-gold/40"
        >
          {isSaving ? "Saving..." : "Set password and continue"}
        </button>

        {/*
          ⚠️ ALWAYS PRESENT. Without an exit, a user whose password keeps
          failing policy — or who opened the wrong account — has no way out of
          a screen they cannot skip. OTP still works next time, so logging out
          is always recoverable.
        */}
        <button
          onClick={() => void logOut()}
          className="mt-4 block w-full text-center text-sm text-text-secondary underline transition-colors hover:text-gold"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
