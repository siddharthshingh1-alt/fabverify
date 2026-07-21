"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatMasterPage() {
  const authorized = useChatGuard("master");
  if (!authorized) return null;
  return <ChatApp role="master" />;
}
