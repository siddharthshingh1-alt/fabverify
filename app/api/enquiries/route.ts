import { getUserById, sendEnquiry } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Sends an enquiry AS THE CALLER.
//
// sender_id comes from the verified session and senderPhone is no longer read
// from the body at all — the field is absent rather than validated, so there
// is nothing to spoof. This route previously accepted any senderPhone, which
// meant anyone could send an enquiry in another user's name AND seed a
// conversation that appeared, to the recipient, to have been started by them.
export async function POST(request: Request) {
  const { receiverId, subject, message } = await request.json();

  if (!receiverId || !message) {
    return NextResponse.json(
      { error: "receiverId and message are required" },
      { status: 400 }
    );
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    // The recipient is a real other user, so it stays a body parameter — but
    // it must actually exist, or the enquiry and its seeded message would
    // point at nothing.
    const receiver = await getUserById(receiverId);
    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const { enquiry, conversationSeeded } = await sendEnquiry({
      sender_id: caller.user.id,
      receiver_id: receiverId,
      subject: subject ?? "",
      message,
    });

    // conversationSeeded is passed through so the client can tell the user
    // their enquiry was saved but the chat thread was not. The enquiry still
    // succeeded — reporting it is the point, not failing the request.
    return NextResponse.json({ enquiry, conversationSeeded });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
