import {
  getLatestVerificationApplication,
  getUserByPhone,
  getVerificationStatus,
  submitVerificationApplication,
  updateUserVerificationStatus,
  updateVerificationApplicationStatus,
  updateVerificationTier,
} from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only — resolves real users.id from phone server-side, since the
// dev-mode "userId" kept in localStorage is a synthetic dev-user-<phone>
// string, not the actual UUID verification_applications.user_id needs.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const status = await getVerificationStatus(user.id);
  const latestApplication = await getLatestVerificationApplication(user.id);

  return NextResponse.json({
    verification: {
      userId: user.id,
      currentTier: status?.verification_tier || "none",
      status: status?.verification_status || "unverified",
      bronzeVerifiedAt: status?.bronze_verified_at ?? null,
      silverVerifiedAt: status?.silver_verified_at ?? null,
      goldVerifiedAt: status?.gold_verified_at ?? null,
      latestApplication,
    },
  });
}

export async function POST(request: Request) {
  const { phone, tier, documents, videoCallDate, videoCallTime } = await request.json();

  if (!phone || !tier) {
    return NextResponse.json(
      { error: "phone and tier are required" },
      { status: 400 }
    );
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const videoCallScheduled =
    videoCallDate && videoCallTime
      ? new Date(`${videoCallDate} ${videoCallTime}`).toISOString()
      : null;

  try {
    const application = await submitVerificationApplication(
      user.id,
      tier,
      documents || {},
      videoCallScheduled
    );

    await updateUserVerificationStatus(user.id, "application_submitted");

    // Bronze is free and instant — everything above goes to review. In
    // production this would be an admin action, not an auto-approve.
    let autoApproved = false;
    if (tier === "bronze") {
      await updateVerificationApplicationStatus(application.id, "approved");
      await updateVerificationTier(user.id, "bronze");
      autoApproved = true;
    }

    return NextResponse.json({ success: true, application, autoApproved });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
