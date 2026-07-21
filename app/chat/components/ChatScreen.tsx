"use client";

import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { useChatTab } from "../context";
import type { Conversation, OrderCard } from "../types";

export default function ChatScreen({
  conversations,
  orders,
  isManufacturer,
  ordersBasePath,
  profileBasePath,
  newOrderPath,
}: {
  conversations: Conversation[];
  orders: OrderCard[];
  isManufacturer: boolean;
  ordersBasePath: string;
  profileBasePath: string;
  newOrderPath: string;
}) {
  const { openConversationId, openConversation, clearOpenConversation } = useChatTab();
  const selected = conversations.find((c) => c.id === openConversationId) ?? null;

  if (selected) {
    return (
      <ChatWindow
        key={selected.id}
        conversation={selected}
        onBack={clearOpenConversation}
        canMarkProductionUpdate={isManufacturer && Boolean(selected.orderId)}
        orders={orders}
        ordersBasePath={ordersBasePath}
        profileBasePath={profileBasePath}
        newOrderPath={newOrderPath}
      />
    );
  }

  return <ChatList conversations={conversations} onSelect={openConversation} />;
}
