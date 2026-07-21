"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatBrandPage() {
  const authorized = useChatGuard("brand");
  if (!authorized) return null;
  return <ChatApp role="brand" />;
}
