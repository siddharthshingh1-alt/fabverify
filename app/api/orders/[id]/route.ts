import { getOrderById, updateMilestoneStatus, updateOrderStatus } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

type OrderRow = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

// Is this caller a party to this specific order? Ownership here is row-level
// — not "are you this phone number" but "are you one of the two sides of
// this deal". Both handlers below had NO authentication of any kind: anyone
// who knew (or guessed) an order UUID could read its commercial terms, and
// PATCH could change its status outright.
function isPartyToOrder(order: OrderRow, userId: string): boolean {
  return order.buyer_id === userId || order.manufacturer_id === userId;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isPartyToOrder(order, caller.user.id)) {
      return NextResponse.json(
        { error: "Not authorised for this order" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// NOTE ON SCOPE: this enforces that the caller is a party to the order. It
// does NOT yet enforce WHICH party may make WHICH transition — as it stands
// a buyer can advance a milestone and a manufacturer can cancel. That state
// machine is a domain decision tangled up with escrow release (DECISIONS
// M2) and is tracked separately in TASKS.md; it was deliberately not
// guessed inside an auth conversion.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status, milestoneId, milestoneStatus } = await request.json();

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    // Load first so the party check runs against real data rather than
    // whatever the caller asserts about themselves.
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isPartyToOrder(order, caller.user.id)) {
      return NextResponse.json(
        { error: "Not authorised for this order" },
        { status: 403 }
      );
    }

    if (status) {
      await updateOrderStatus(id, status);
    }

    if (milestoneId && milestoneStatus) {
      // Scoped to THIS order. Being a party to one order must not grant the
      // ability to advance a milestone on another, and the milestone id
      // alone carries no proof of which order it belongs to.
      const updated = await updateMilestoneStatus(milestoneId, milestoneStatus, id);

      if (!updated) {
        return NextResponse.json(
          { error: "Milestone not found on this order" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
