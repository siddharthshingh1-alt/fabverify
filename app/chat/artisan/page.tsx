"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatArtisanPage() {
  const authorized = useChatGuard("artisan");
  if (!authorized) return null;
  return <ChatApp role="artisan" />;
}
