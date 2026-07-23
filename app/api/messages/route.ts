import { getMessagesForUser, getUserByPhone, sendMessage } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only — resolves real users.id from phone server-side, since the
// dev-mode "userId" kept in localStorage is a synthetic dev-user-<phone>
// string, not the actual UUID messages.sender_id/receiver_id needs.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const otherPhone = searchParams.get("otherPhone");
  const orderId = searchParams.get("orderId");

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let otherUserId: string | undefined;
  if (otherPhone) {
    const other = await getUserByPhone(otherPhone);
    if (other) otherUserId = other.id;
  }

  const messages = await getMessagesForUser({
    userId: user.id,
    otherUserId,
    orderId: orderId ?? undefined,
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const {
    senderPhone,
    receiverPhone,
    orderId,
    content,
    messageType,
    mediaUrl,
    isVerifiedUpdate,
  } = await request.json();

  if (!senderPhone || !receiverPhone || !content) {
    return NextResponse.json(
      { error: "senderPhone, receiverPhone and content are required" },
      { status: 400 }
    );
  }

  const sender = await getUserByPhone(senderPhone);
  if (!sender) {
    return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  }

  const receiver = await getUserByPhone(receiverPhone);
  if (!receiver) {
    return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
  }

  try {
    const message = await sendMessage({
      sender_id: sender.id,
      receiver_id: receiver.id,
      order_id: orderId || null,
      content,
      message_type: messageType || "text",
      media_url: mediaUrl || null,
      is_verified_update: isVerifiedUpdate || false,
    });
    return NextResponse.json({ success: true, message });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
