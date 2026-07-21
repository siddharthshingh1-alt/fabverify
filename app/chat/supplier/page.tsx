"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatSupplierPage() {
  const authorized = useChatGuard("supplier");
  if (!authorized) return null;
  return <ChatApp role="supplier" />;
}
