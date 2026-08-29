"use client";

import { useEffect, useState } from "react";
import {
  GUARD_SPINNER_AFTER_MS,
  GUARD_STUCK_AFTER_MS,
  recoverToLogin,
} from "../lib/guardRecovery";

/**
 * What a guard renders while it has not yet let the user through.
 *
 * ⚠️ THE FIRST 600ms ARE STILL A BARE `null`, AND THAT IS THE POINT. The old
 * behaviour was correct for the common case — AuthGuard's original comment
 * explains why: never flash protected chrome at someone who is on their way to
 * /login. A normal navigation resolves far inside 600ms, so in practice this
 * renders exactly what it always did and no spinner appears on page changes.
 *
 * What changes is only what happens AFTER that window, where the old code had
 * nothing at all:
 *
 *   0 – 600ms      null          (unchanged fast path, no flash)
 *   600 – 2500ms   spinner       ("Checking your account…")
 *   2500ms+        real error    (with a way out)
 *
 * ⚠️ THIS COMPONENT IS WHY A BLANK SCREEN IS NOW IMPOSSIBLE BY CONSTRUCTION
 * rather than merely unlikely. It is not a diagnosis of any particular bug —
 * it is the floor that makes the next one visible in seconds instead of a
 * session.
 */
export default function GuardFallback({ reason = "guard" }: { reason?: string }) {
  const [phase, setPhase] = useState<"quiet" | "waiting" | "stuck">("quiet");

  useEffect(() => {
    const toSpinner = setTimeout(() => setPhase("waiting"), GUARD_SPINNER_AFTER_MS);
    const toStuck = setTimeout(() => setPhase("stuck"), GUARD_STUCK_AFTER_MS);
    return () => {
      clearTimeout(toSpinner);
      clearTimeout(toStuck);
    };
  }, []);

  if (phase === "quiet") return null;

  if (phase === "waiting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <p className="text-sm text-text-secondary">Checking your account…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-6">
      <div className="w-full max-w-[420px] rounded-2xl border border-border-dark bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-white">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-sm text-text-secondary">
          Your session could not be confirmed. Signing in again will fix it —
          nothing on your account has been lost.
        </p>
        <button
          type="button"
          onClick={() => recoverToLogin(reason)}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-navy"
        >
          Go to login
        </button>
      </div>
    </div>
  );
}
