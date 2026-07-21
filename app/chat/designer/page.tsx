"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatDesignerPage() {
  const authorized = useChatGuard("designer");
  if (!authorized) return null;
  return <ChatApp role="designer" />;
}
