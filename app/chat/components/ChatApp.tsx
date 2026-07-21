"use client";

import { useUser, type UserType } from "@/app/context/UserContext";
import { getBasePath, getOrdersSlug, getDiscoverySlug } from "@/app/lib/routing";
import { useChatTab } from "../context";
import { getRoleChatData, type ChatRole } from "../data";
import ChatScreen from "./ChatScreen";
import OrdersTab from "./OrdersTab";
import ScanQRTab from "./ScanQRTab";

// Roles with their own "start a new sample/order" flow. Everyone else on
// the supply/talent side responds to orders rather than originating them,
// so "New Order" from the contact sheet falls back to their orders list.
const HAS_SAMPLES: UserType[] = ["buyer", "manufacturer", "fabric_mill", "trim_supplier"];

export default function ChatApp({ role }: { role: ChatRole }) {
  const { activeTab } = useChatTab();
  const { user } = useUser();
  const data = getRoleChatData(role);

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
  return (
    <ChatScreen
      conversations={data.conversations}
      orders={data.orders}
      isManufacturer={user.userType === "manufacturer"}
      ordersBasePath={ordersBasePath}
      profileBasePath={profileBasePath}
      newOrderPath={newOrderPath}
    />
  );
}
