"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatEnterprisePage() {
  const authorized = useChatGuard("enterprise");
  if (!authorized) return null;
  return <ChatApp role="enterprise" />;
}
