import { getUserByPhone, sendEnquiry } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only — resolves the sender's real users.id from phone
// server-side, since the dev-mode "userId" kept in localStorage is a
// synthetic dev-user-<phone> string, not the actual UUID enquiries.sender_id
// needs to reference.
export async function POST(request: Request) {
  const { senderPhone, receiverId, subject, message } = await request.json();

  if (!senderPhone || !receiverId || !message) {
    return NextResponse.json(
      { error: "senderPhone, receiverId and message are required" },
      { status: 400 }
    );
  }

  const sender = await getUserByPhone(senderPhone);
  if (!sender) {
    return NextResponse.json(
      { error: "No user found for this phone number" },
      { status: 404 }
    );
  }

  try {
    const enquiry = await sendEnquiry({
      sender_id: sender.id,
      receiver_id: receiverId,
      subject: subject ?? "",
      message,
    });
    return NextResponse.json({ enquiry });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
