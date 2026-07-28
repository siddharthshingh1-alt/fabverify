import {
  createSampleBrief,
  getSampleBriefs,
  getSampleBriefsByBuyer,
} from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { isEnterpriseAccount } from "@/app/lib/accountType";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// TWO MODES, deliberately different in what they require:
//
//   role=buyer  → "my own briefs". Personal data, so it needs a verified
//                 caller and an ownership check.
//   no role     → the open marketplace listing manufacturers browse to find
//                 work. This stays PUBLIC. Requiring auth here would break
//                 discovery for logged-out visitors, the same reasoning that
//                 keeps /api/manufacturers open.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const role = searchParams.get("role");
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  if (role === "buyer" && phone) {
    const caller = await getVerifiedUser(request);
    if (!caller.ok) return authErrorResponse(caller);

    if (normalisePhone(caller.user.phone) !== normalisePhone(phone)) {
      return NextResponse.json(
        { error: "Not authorised for this account" },
        { status: 403 }
      );
    }

    try {
      // Scoped to the verified id, never a phone from the query string.
      const briefs = await getSampleBriefsByBuyer(caller.user.id);
      return NextResponse.json({ briefs });
    } catch (error) {
      return dbErrorResponse(error);
    }
  }

  try {
    const briefs = await getSampleBriefs({ category, status });
    return NextResponse.json({ briefs });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// Posts a sample brief AS THE CALLER. buyer_id comes from the verified
// session; buyerPhone is no longer read from the body.
export async function POST(request: Request) {
  const {
    title,
    category,
    description,
    quantity,
    budgetMin,
    budgetMax,
    targetDelivery,
    requirements,
  } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  // Same gate as placing an order: buyers and enterprise accounts post
  // briefs; manufacturers, mills, artisans and freelancers RESPOND to them.
  // Enterprise is included because its marketplace access is additive
  // (DECISIONS I3). Named explicitly rather than via resolveAccount, which
  // falls back to the buyer persona for unknown values — an authorisation
  // gate must not inherit a permissive default.
  const callerType = caller.user.user_type;
  const mayPostBriefs = callerType === "buyer" || isEnterpriseAccount(callerType);

  if (!mayPostBriefs) {
    return NextResponse.json(
      { error: "This account type cannot post sample briefs" },
      { status: 403 }
    );
  }

  // targetDelivery / requirements have no dedicated columns yet — fold them
  // into description rather than silently dropping them.
  const extraNotes = [
    targetDelivery ? `Target delivery: ${targetDelivery}` : null,
    requirements ? `Requirements: ${requirements}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const fullDescription = [description, extraNotes].filter(Boolean).join("\n\n");

  try {
    const brief = await createSampleBrief({
      buyer_id: caller.user.id,
      title,
      category,
      description: fullDescription,
      quantity: Number(quantity) || 0,
      budget_min: Number(budgetMin) || 0,
      budget_max: Number(budgetMax) || 0,
    });

    return NextResponse.json({ success: true, brief });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
