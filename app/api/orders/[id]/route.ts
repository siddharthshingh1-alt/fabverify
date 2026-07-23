import { getOrderById, updateMilestoneStatus, updateOrderStatus } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status, milestoneId, milestoneStatus } = await request.json();

  try {
    if (status) {
      await updateOrderStatus(id, status);
    }

    if (milestoneId && milestoneStatus) {
      await updateMilestoneStatus(milestoneId, milestoneStatus);
    }
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
