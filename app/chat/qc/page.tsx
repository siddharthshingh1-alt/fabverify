"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatQcPage() {
  const authorized = useChatGuard("qc");
  if (!authorized) return null;
  return <ChatApp role="qc" />;
}
