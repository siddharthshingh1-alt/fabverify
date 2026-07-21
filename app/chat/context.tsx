"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ChatTab = "chats" | "orders" | "scan";

type ChatTabContextValue = {
  activeTab: ChatTab;
  setActiveTab: (tab: ChatTab) => void;
  openConversationId: string | null;
  openConversation: (id: string) => void;
  clearOpenConversation: () => void;
};

const ChatTabContext = createContext<ChatTabContextValue | null>(null);

export function ChatTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ChatTab>("chats");
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);

  const openConversation = (id: string) => {
    setOpenConversationId(id);
    setActiveTab("chats");
  };

  const clearOpenConversation = () => setOpenConversationId(null);

  return (
    <ChatTabContext.Provider
      value={{ activeTab, setActiveTab, openConversationId, openConversation, clearOpenConversation }}
    >
      {children}
    </ChatTabContext.Provider>
  );
}

export function useChatTab() {
  const ctx = useContext(ChatTabContext);
  if (!ctx) throw new Error("useChatTab must be used within ChatTabProvider");
  return ctx;
}
