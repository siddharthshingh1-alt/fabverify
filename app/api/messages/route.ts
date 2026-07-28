import { getMessagesForUser, getUserByPhoneOrThrow, sendMessage } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Reads the CALLER'S OWN messages.
//
// No row-level party check is needed here, unlike orders/[id]: getMessagesForUser
// filters on `sender_id = userId OR receiver_id = userId`, so once userId comes
// from the verified session a non-participant's messages are unreachable by
// construction. The route previously took that userId from a phone in the query
// string, which meant naming someone else's number returned their inbox.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const otherPhone = searchParams.get("otherPhone");
  const orderId = searchParams.get("orderId");

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
    // The counterparty is a legitimate other person — it narrows the thread,
    // it does not widen access. An unknown otherPhone simply leaves the
    // filter off, matching the previous behaviour.
    let otherUserId: string | undefined;
    if (otherPhone) {
      const other = await getUserByPhoneOrThrow(otherPhone);
      if (other) otherUserId = other.id;
    }

    const messages = await getMessagesForUser({
      userId: caller.user.id,
      otherUserId,
      orderId: orderId ?? undefined,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// Sends a message AS THE CALLER. sender_id comes from the verified session and
// senderPhone is no longer read from the body at all — the field is absent
// rather than validated, so there is nothing to spoof. This route previously
// accepted any senderPhone, which meant anyone could post a message that
// appeared, to the recipient, to come from any user on the platform.
export async function POST(request: Request) {
  const { receiverPhone, orderId, content, messageType, mediaUrl, isVerifiedUpdate } =
    await request.json();

  if (!receiverPhone || !content) {
    return NextResponse.json(
      { error: "receiverPhone and content are required" },
      { status: 400 }
    );
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    const receiver = await getUserByPhoneOrThrow(receiverPhone);
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    // Deliberately NOT gating on "may you message this person". First contact
    // is a real flow — enquiries seed the initial chat message — so requiring
    // a pre-existing relationship would break it. Sender identity was the
    // hole; that is what this closes.
    const message = await sendMessage({
      sender_id: caller.user.id,
      receiver_id: receiver.id,
      order_id: orderId || null,
      content,
      message_type: messageType || "text",
      media_url: mediaUrl || null,
      is_verified_update: isVerifiedUpdate || false,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
