"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatMillPage() {
  const authorized = useChatGuard("mill");
  if (!authorized) return null;
  return <ChatApp role="mill" />;
}
