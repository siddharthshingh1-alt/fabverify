import { createOrder, getOrdersByUser, getUserByPhoneOrThrow } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { isEnterpriseAccount } from "@/app/lib/accountType";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Lists the CALLER'S OWN orders. The buyer_id/manufacturer_id filter is
// applied to the verified session's users.id, so the result set is scoped by
// construction — this route previously accepted any phone in the query
// string and returned that account's entire order book, including style
// names, quantities, prices and total values.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const role = searchParams.get("role") === "manufacturer" ? "manufacturer" : "buyer";

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  if (normalisePhone(caller.user.phone) !== normalisePhone(phone)) {
    return NextResponse.json(
      { error: "Not authorised for this account" },
      { status: 403 }
    );
  }

  try {
    // The verified id, never a phone from the query string.
    const orders = await getOrdersByUser(caller.user.id, role);
    return NextResponse.json({ orders });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// Places an order. buyer_id is FORCED to the logged-in user — the single
// most important line in this file. The route used to take buyerPhone from
// the body and look it up, which meant anyone could create an order in
// someone else's name, committing them to a purchase they never made.
export async function POST(request: Request) {
  const {
    manufacturerPhone,
    styleName,
    quantity,
    pricePerPiece,
    deliveryDate,
    milestoneSchedule,
  } = await request.json();

  if (!manufacturerPhone || !styleName || !quantity || !pricePerPiece) {
    return NextResponse.json(
      {
        error:
          "manufacturerPhone, styleName, quantity and pricePerPiece are required",
      },
      { status: 400 }
    );
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  // Buying is allowed for a plain buyer AND for an enterprise account:
  // enterprise access is ADDITIVE, not exclusive (DECISIONS I3) — a large
  // brand buys from the same vendors as everyone else.
  //
  // Deliberately NOT written as resolveAccount(...).userType === 'buyer'.
  // resolveAccount falls back to the buyer persona for unknown or missing
  // values, so an account with a null user_type would silently inherit
  // permission to buy. An authorisation gate must not lean on a permissive
  // default; both accepted values are named explicitly.
  const callerType = caller.user.user_type;
  const mayPlaceOrders = callerType === "buyer" || isEnterpriseAccount(callerType);

  if (!mayPlaceOrders) {
    return NextResponse.json(
      { error: "This account type cannot place orders" },
      { status: 403 }
    );
  }

  try {
    // Lightweight counterparty validation: enough to stop orphan orders
    // pointing at a non-existent or wrong-type account, and no more.
    // getUserByPhoneOrThrow (not getUserByPhone) so an unreachable database
    // surfaces as 503 rather than a misleading "Manufacturer not found".
    const manufacturer = await getUserByPhoneOrThrow(manufacturerPhone);

    if (!manufacturer) {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
    }

    if (manufacturer.user_type !== "manufacturer") {
      return NextResponse.json(
        { error: "That account is not a manufacturer" },
        { status: 400 }
      );
    }

    const order = await createOrder({
      buyer_id: caller.user.id,
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
    return dbErrorResponse(error);
  }
}
