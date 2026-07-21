"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatMerchandiserPage() {
  const authorized = useChatGuard("merchandiser");
  if (!authorized) return null;
  return <ChatApp role="merchandiser" />;
}
