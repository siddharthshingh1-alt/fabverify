"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatManufacturerPage() {
  const authorized = useChatGuard("manufacturer");
  if (!authorized) return null;
  return <ChatApp role="manufacturer" />;
}
