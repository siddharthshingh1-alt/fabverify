"use client";

import { useEffect, useState } from "react";
import { useUser, type UserType } from "@/app/context/UserContext";
import { getBasePath, getOrdersSlug, getDiscoverySlug } from "@/app/lib/routing";
import { mapConversationRowToConversation } from "@/app/lib/mapMessage";
import type { ConversationRow } from "@/app/lib/mapMessage";
import { useChatTab } from "../context";
import { getRoleChatData, type ChatRole } from "../data";
import type { Conversation } from "../types";
import ChatScreen from "./ChatScreen";
import OrdersTab from "./OrdersTab";
import ScanQRTab from "./ScanQRTab";

// Roles with their own "start a new sample/order" flow. Everyone else on
// the supply/talent side responds to orders rather than originating them,
// so "New Order" from the contact sheet falls back to their orders list.
const HAS_SAMPLES: UserType[] = ["buyer", "manufacturer", "fabric_mill", "trim_supplier"];

const CONVERSATIONS_POLL_MS = 10000;

export default function ChatApp({ role }: { role: ChatRole }) {
  const { activeTab } = useChatTab();
  const { user } = useUser();
  // Orders tab / Scan QR tab stay on the per-role demo data — there's no
  // real backing for those yet; only conversations are real.
  const data = getRoleChatData(role);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadConversations() {
      const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
      if (!auth.phone) {
        if (!cancelled) setConversationsLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/conversations?phone=${encodeURIComponent(auth.phone)}`);
        const { conversations: rows } = (await res.json()) as { conversations: ConversationRow[] };
        if (!cancelled) setConversations((rows ?? []).map(mapConversationRowToConversation));
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        if (!cancelled) setConversationsLoading(false);
      }
    }
    loadConversations();
    const interval = setInterval(loadConversations, CONVERSATIONS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const basePath = getBasePath(user.userType);
  const ordersBasePath = role === "enterprise" ? "/enterprise/orders" : `${basePath}/${getOrdersSlug(user.userType)}`;
  const profileBasePath = `${basePath}/${getDiscoverySlug(user.userType)}`;
  const newOrderPath = HAS_SAMPLES.includes(user.userType) ? `${basePath}/samples` : ordersBasePath;

  if (activeTab === "orders") {
    return <OrdersTab orders={data.orders} ordersBasePath={ordersBasePath} />;
  }
  if (activeTab === "scan") {
    return <ScanQRTab role={role} orders={data.orders} />;
  }
  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-text-secondary">
        Loading messages...
      </div>
    );
  }
  return (
    <ChatScreen
      conversations={conversations}
      orders={data.orders}
      isManufacturer={user.userType === "manufacturer"}
      ordersBasePath={ordersBasePath}
      profileBasePath={profileBasePath}
      newOrderPath={newOrderPath}
    />
  );
}
