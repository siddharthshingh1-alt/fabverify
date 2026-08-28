import {
  getLatestVerificationApplication,
  getVerificationStatus,
  submitVerificationApplication,
  updateUserVerificationStatus,
  updateVerificationApplicationStatus,
  updateVerificationTier,
} from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Both handlers below had NO authentication of any kind. Reachable
// unauthenticated, against ANY phone number: grant Bronze to a stranger's
// account (M7 makes Bronze the minimum to transact), write an application
// with an arbitrary tier string and arbitrary documents JSON, and read back
// any account's verification state including that documents payload.
// Self-granting Silver/Gold was NOT reachable — the auto-approve branch is
// hardcoded to bronze — which is why this is a tier-grant and disclosure
// hole rather than a full privilege escalation.

/**
 * THE OWNERSHIP GATE. Named and single-expression deliberately: the admin
 * verification panel (Launch-Ready item 5) needs the OPPOSITE rule — an
 * admin acting on someone ELSE's account — and that is one `||` here rather
 * than an unpicking of two inlined comparisons at three call sites.
 *
 * ⚠️ normalisePhone on BOTH sides, never one. The two identity stores hold
 * different formats — `users.phone` is bare 10-digit, the provider's is
 * `91`+10 — the trap that would have made chunk 1.3's backfill a silent
 * no-op. Compared raw, every user 403s on their own account.
 *
 * Typed structurally rather than against a UserRow so adding an admin
 * column widens it without touching the signature.
 */
function mayActOnAccount(caller: { phone: string }, targetPhone: string): boolean {
  return normalisePhone(caller.phone) === normalisePhone(targetPhone);
}

// M8 locks the tiers: Bronze (instant), Silver, Gold. The value was
// previously written to verification_applications.tier unvalidated, so any
// string a caller sent was persisted — item 5's admin panel reads this
// column to decide what it is approving, so it has to be trustworthy.
const VERIFICATION_TIERS = ["bronze", "silver", "gold"] as const;

function isVerificationTier(value: unknown): value is (typeof VERIFICATION_TIERS)[number] {
  return (
    typeof value === "string" &&
    (VERIFICATION_TIERS as readonly string[]).includes(value)
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  if (!mayActOnAccount(caller.user, phone)) {
    return NextResponse.json(
      { error: "Not authorised for this account" },
      { status: 403 }
    );
  }

  // The old getUserByPhone lookup is gone — getVerifiedUser already resolved
  // the row, so it was a second round trip for an answer we hold. Its 404
  // "User not found" goes with it: an authenticated caller has a users row by
  // construction, so that branch is unreachable for the owner.
  try {
    const status = await getVerificationStatus(caller.user.id);
    const latestApplication = await getLatestVerificationApplication(caller.user.id);

    return NextResponse.json({
      verification: {
        userId: caller.user.id,
        currentTier: status?.verification_tier || "none",
        status: status?.verification_status || "unverified",
        bronzeVerifiedAt: status?.bronze_verified_at ?? null,
        silverVerifiedAt: status?.silver_verified_at ?? null,
        goldVerifiedAt: status?.gold_verified_at ?? null,
        latestApplication,
      },
    });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const { phone, tier, documents, videoCallDate, videoCallTime } = await request.json();

  if (!phone || !tier) {
    return NextResponse.json(
      { error: "phone and tier are required" },
      { status: 400 }
    );
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  if (!mayActOnAccount(caller.user, phone)) {
    return NextResponse.json(
      { error: "Not authorised for this account" },
      { status: 403 }
    );
  }

  // Semantic validation AFTER the auth gate, so an unauthenticated caller
  // learns nothing about which tiers exist. Presence-checking above stays
  // first, matching the house pattern in profile-data.
  if (!isVerificationTier(tier)) {
    return NextResponse.json(
      { error: "Unknown verification tier" },
      { status: 400 }
    );
  }

  try {
    const application = await submitVerificationApplication(
      caller.user.id,
      tier,
      documents || {},
      videoCallDate && videoCallTime
        ? new Date(`${videoCallDate} ${videoCallTime}`).toISOString()
        : null
    );

    await updateUserVerificationStatus(caller.user.id, "application_submitted");

    // Bronze is free and instant — everything above goes to review. In
    // production this would be an admin action, not an auto-approve.
    // ⚠️ Locked by M8; leave it. Silver/Gold sitting at
    // "application_submitted" forever is what item 5's panel completes.
    let autoApproved = false;
    if (tier === "bronze") {
      await updateVerificationApplicationStatus(application.id, "approved");
      await updateVerificationTier(caller.user.id, "bronze");
      autoApproved = true;
    }

    return NextResponse.json({ success: true, application, autoApproved });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
