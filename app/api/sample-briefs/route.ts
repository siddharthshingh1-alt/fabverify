import {
  createSampleBrief,
  getSampleBriefs,
  getSampleBriefsByBuyer,
  getUserByPhone,
} from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only — resolves real users.id from phone server-side, since the
// dev-mode "userId" kept in localStorage is a synthetic dev-user-<phone>
// string, not the actual UUID sample_briefs.buyer_id needs.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const role = searchParams.get("role");
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  if (role === "buyer" && phone) {
    const user = await getUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ briefs: [] });
    }
    const briefs = await getSampleBriefsByBuyer(user.id);
    return NextResponse.json({ briefs });
  }

  const briefs = await getSampleBriefs({ category, status });
  return NextResponse.json({ briefs });
}

export async function POST(request: Request) {
  const {
    buyerPhone,
    title,
    category,
    description,
    quantity,
    budgetMin,
    budgetMax,
    targetDelivery,
    requirements,
  } = await request.json();

  if (!buyerPhone || !title) {
    return NextResponse.json(
      { error: "buyerPhone and title are required" },
      { status: 400 }
    );
  }

  const buyer = await getUserByPhone(buyerPhone);
  if (!buyer) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      buyer_id: buyer.id,
      title,
      category,
      description: fullDescription,
      quantity: Number(quantity) || 0,
      budget_min: Number(budgetMin) || 0,
      budget_max: Number(budgetMax) || 0,
    });
    return NextResponse.json({ success: true, brief });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
