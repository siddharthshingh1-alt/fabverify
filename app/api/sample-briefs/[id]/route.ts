import { getSampleBriefById, updateSampleBriefStatus } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// The only status a NON-OWNER may set. A manufacturer responding to a brief
// flips this flag (see SamplesPage respondToBrief), so owner-only would break
// responding entirely — but allowing any status would let a stranger close or
// cancel someone else's brief.
const RESPONDER_ALLOWED_STATUS = "responses_received";

// Readable by any VERIFIED user, with no ownership restriction: a
// manufacturer must be able to read a brief in order to respond to it.
// Deliberately not fully open — the open marketplace LIST stays public for
// browsing, but full brief detail requires an account.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    const brief = await getSampleBriefById(id);

    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json({ brief });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// ASYMMETRIC OWNERSHIP — the owner and a responder can do different things:
//   owner (buyer_id === caller)  → may set ANY status
//   any other verified user      → may set ONLY "responses_received"
//
// This route previously had no authentication whatsoever: anyone who knew a
// brief id could set any status on it, including closing another buyer's
// brief.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    // Load first, so the ownership decision is made against real data rather
    // than anything the caller asserts.
    const brief = await getSampleBriefById(id);

    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    const isOwner = brief.buyer_id === caller.user.id;

    if (!isOwner && status !== RESPONDER_ALLOWED_STATUS) {
      return NextResponse.json(
        { error: "Not authorised to set this status on another user's brief" },
        { status: 403 }
      );
    }

    await updateSampleBriefStatus(id, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
