import { createOrder, getOrdersByUser, getUserByPhone } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only — resolves real users.id from phone server-side, since the
// dev-mode "userId" kept in localStorage is a synthetic dev-user-<phone>
// string, not the actual UUID orders.buyer_id/manufacturer_id needs.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const role = searchParams.get("role") === "manufacturer" ? "manufacturer" : "buyer";

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const orders = await getOrdersByUser(user.id, role);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const {
    buyerPhone,
    manufacturerPhone,
    styleName,
    quantity,
    pricePerPiece,
    deliveryDate,
    milestoneSchedule,
  } = await request.json();

  if (!buyerPhone || !manufacturerPhone || !styleName || !quantity || !pricePerPiece) {
    return NextResponse.json(
      {
        error:
          "buyerPhone, manufacturerPhone, styleName, quantity and pricePerPiece are required",
      },
      { status: 400 }
    );
  }

  const buyer = await getUserByPhone(buyerPhone);
  if (!buyer) {
    return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
  }

  const manufacturer = await getUserByPhone(manufacturerPhone);
  if (!manufacturer) {
    return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
  }

  try {
    const order = await createOrder({
      buyer_id: buyer.id,
      manufacturer_id: manufacturer.id,
      style_name: styleName,
      quantity: Number(quantity),
      price_per_piece: Number(pricePerPiece),
      total_value: Number(quantity) * Number(pricePerPiece),
      delivery_date: deliveryDate,
      milestones: milestoneSchedule,
    });
    return NextResponse.json({ success: true, order, orderNumber: order.order_number });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
