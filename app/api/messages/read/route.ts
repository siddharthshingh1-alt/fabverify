import { getUserByPhoneOrThrow, markMessagesRead } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Marks messages sent TO THE CALLER by senderPhone as read.
//
// The receiver is the verified session, never a phone from the body — that
// field is gone. Previously anyone could mark anyone else's messages read,
// clearing another user's unread badges and hiding that they had never
// actually seen a message.
export async function POST(request: Request) {
  const { senderPhone } = await request.json();

  if (!senderPhone) {
    return NextResponse.json({ error: "senderPhone is required" }, { status: 400 });
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    const sender = await getUserByPhoneOrThrow(senderPhone);
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    // markMessagesRead(receiverId, senderId) — receiver is always the caller,
    // so this can only ever affect the caller's own inbox.
    await markMessagesRead(caller.user.id, sender.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
