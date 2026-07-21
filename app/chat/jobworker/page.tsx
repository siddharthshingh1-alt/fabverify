"use client";

import { useChatGuard } from "../useChatGuard";
import ChatApp from "../components/ChatApp";

export default function ChatJobworkerPage() {
  const authorized = useChatGuard("jobworker");
  if (!authorized) return null;
  return <ChatApp role="jobworker" />;
}
