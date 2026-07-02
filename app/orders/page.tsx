"use client";

import Link from "next/link";
import { useState } from "react";

const WORKSPACE_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard", active: false },
  { icon: "📦", label: "My Orders", href: "/orders", active: true },
  { icon: "🧵", label: "Find Manufacturers", href: "/manufacturers", active: false },
  { icon: "👔", label: "FabMerch", href: "/fabmerch", active: false },
  { icon: "💳", label: "FabScore & Credit", href: "/credit", active: false },
];

const TOOLS_NAV = [
  { icon: "📋", label: "Sample Briefs", href: "/samples", active: false },
  { icon: "💰", label: "FabPrice", href: "/fabprice", active: false },
  { icon: "📊", label: "Analytics", href: "/analytics", active: false },
];

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", active: false },
  { icon: "📦", label: "Orders", active: true },
  { icon: "🔍", label: "Discover", active: false },
  { icon: "👔", label: "Merch", active: false },
  { icon: "👤", label: "Profile", active: false },
];

type MilestoneStatus = "complete" | "active" | "pending";

type Milestone = {
  name: string;
  status: MilestoneStatus;
  date?: string;
};

type StatusColor = "gold" | "blue" | "green";

type Order = {
  id: string;
  manufacturer: string;
  status: string;
  statusColor: StatusColor;
  product: string;
  orderedDate: string;
  expectedDate: string;
  milestones: Milestone[];
  orderValue: number;
  releasedAmount: number;
  releasedPercent: number;
  escrowAmount: number;
  escrowPercent: number;
  photosCount: number;
  messagesCount: number;
  rating?: number;
};

const ACTIVE_ORDERS: Order[] = [
  {
    id: "ORD-2024-001",
    manufacturer: "Jaipur Ethnic Works",
    status: "In Production",
    statusColor: "gold",
    product: "Cotton Block Print Kurta — 200 pieces",
    orderedDate: "15 June 2026",
    expectedDate: "15 July 2026",
    milestones: [
      { name: "Order Confirmed", status: "complete", date: "Jun 15" },
      { name: "Raw Material", status: "complete", date: "Jun 18" },
      { name: "Production", status: "active" },
      { name: "Quality Check", status: "pending" },
      { name: "Dispatched", status: "pending" },
      { name: "Delivered", status: "pending" },
    ],
    orderValue: 84000,
    releasedAmount: 16800,
    releasedPercent: 20,
    escrowAmount: 67200,
    escrowPercent: 80,
    photosCount: 2,
    messagesCount: 3,
  },
  {
    id: "ORD-2024-002",
    manufacturer: "Tirupur Knits",
    status: "Quality Check",
    statusColor: "blue",
    product: "Cotton T-shirt — 500 pieces",
    orderedDate: "1 June 2026",
    expectedDate: "25 June 2026",
    milestones: [
      { name: "Order Confirmed", status: "complete", date: "Jun 1" },
      { name: "Raw Material", status: "complete", date: "Jun 5" },
      { name: "Production", status: "complete", date: "Jun 18" },
      { name: "Quality Check", status: "active" },
      { name: "Dispatched", status: "pending" },
      { name: "Delivered", status: "pending" },
    ],
    orderValue: 125000,
    releasedAmount: 75000,
    releasedPercent: 60,
    escrowAmount: 50000,
    escrowPercent: 40,
    photosCount: 4,
    messagesCount: 5,
  },
];

const COMPLETED_ORDERS: Order[] = [
  {
    id: "ORD-2024-000",
    manufacturer: "Lucknow Chikankari House",
    status: "Delivered",
    statusColor: "green",
    product: "Chikankari Kurta Set — 100 pieces",
    orderedDate: "1 May 2026",
    expectedDate: "1 June 2026",
    milestones: [
      { name: "Order Confirmed", status: "complete", date: "May 1" },
      { name: "Raw Material", status: "complete", date: "May 5" },
      { name: "Production", status: "complete", date: "May 20" },
      { name: "Quality Check", status: "complete", date: "May 26" },
      { name: "Dispatched", status: "complete", date: "May 28" },
      { name: "Delivered", status: "complete", date: "Jun 1" },
    ],
    orderValue: 62000,
    releasedAmount: 62000,
    releasedPercent: 100,
    escrowAmount: 0,
    escrowPercent: 0,
    photosCount: 6,
    messagesCount: 8,
    rating: 5,
  },
];

const STATUS_PILL_STYLES: Record<StatusColor, string> = {
  gold: "border-primary bg-primary/15 text-primary",
  blue: "border-secondary bg-secondary/15 text-secondary",
  green: "border-green-500/60 bg-green-500/15 text-green-400",
};

function MilestoneCircle({ status }: { status: MilestoneStatus }) {
  if (status === "complete") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9999px] bg-primary text-xs font-bold text-navy">
        ✓
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="relative flex h-7 w-7 shrink-0 animate-pulse items-center justify-center rounded-[9999px] bg-primary/20">
        <div className="h-4 w-4 animate-spin rounded-[9999px] border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return (
    <div className="h-7 w-7 shrink-0 rounded-[9999px] border-2 border-border-dark" />
  );
}

function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="mt-4 flex items-start">
      {milestones.map((milestone, index) => (
        <div key={milestone.name} className="flex flex-1 items-start last:flex-none">
          <div className="flex flex-col items-center">
            <MilestoneCircle status={milestone.status} />
            <p className="mt-2 w-16 text-center text-[10px] text-text-primary">
              {milestone.name}
            </p>
            {milestone.status === "complete" && milestone.date && (
              <p className="text-[10px] text-text-secondary">
                {milestone.date}
              </p>
            )}
            {milestone.status === "active" && (
              <p className="text-[10px] font-semibold text-primary">
                In Progress
              </p>
            )}
          </div>
          {index < milestones.length - 1 && (
            <div
              className={`mt-3.5 h-0.5 flex-1 ${
                milestone.status === "complete"
                  ? "bg-primary"
                  : "border-t-2 border-dashed border-border-dark"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function OrderCard({
  order,
  isCompleted = false,
}: {
  order: Order;
  isCompleted?: boolean;
}) {
  const [showPhotos, setShowPhotos] = useState(false);

  return (
    <div className="mb-4 rounded-[10px] border border-border-dark bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-primary">{order.id}</span>
        <span className="text-[15px] font-bold text-white">
          {order.manufacturer}
        </span>
        <span
          className={`rounded-[20px] border px-3 py-1 text-xs font-semibold ${STATUS_PILL_STYLES[order.statusColor]}`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-sm text-text-primary">{order.product}</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          Ordered: {order.orderedDate} • Expected delivery: {order.expectedDate}
        </p>
      </div>

      <MilestoneTimeline milestones={order.milestones} />

      <div className="mt-4 flex flex-col gap-2 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-text-primary">
          Order Value: ₹{order.orderValue.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-text-secondary">Escrow Protected 🔒</p>
        <p className="text-[11px] text-text-secondary">
          Released: ₹{order.releasedAmount.toLocaleString("en-IN")} (
          {order.releasedPercent}%) • In Escrow: ₹
          {order.escrowAmount.toLocaleString("en-IN")} ({order.escrowPercent}%)
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setShowPhotos((current) => !current)}
          className="text-left text-xs text-text-secondary"
        >
          📸 {order.photosCount} production photos uploaded
        </button>
        <Link
          href={`/orders/${order.id}`}
          className="text-xs font-medium text-primary"
        >
          💬 {order.messagesCount} messages
        </Link>
        <div className="flex flex-wrap gap-2">
          {isCompleted && (
            <button
              type="button"
              className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
            >
              Leave Review
            </button>
          )}
          <Link
            href={`/orders/${order.id}`}
            className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
          >
            View Details
          </Link>
          {!isCompleted && (
            <Link
              href={`/orders/${order.id}`}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-navy"
            >
              Track Order
            </Link>
          )}
        </div>
      </div>

      {showPhotos && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border-dark pt-3 sm:grid-cols-4">
          {Array.from({ length: order.photosCount }).map((_, index) => (
            <div
              key={index}
              className="flex aspect-square items-center justify-center rounded-[6px] border border-border-dark bg-navy text-xl text-text-secondary"
            >
              📷
            </div>
          ))}
        </div>
      )}

      {isCompleted && order.rating && (
        <p className="mt-3 text-sm text-text-secondary">
          You rated: {"⭐".repeat(order.rating)}
        </p>
      )}
    </div>
  );
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "cancelled"
  >("active");

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "active", label: "Active Orders" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const tabsBar = (
    <div className="flex gap-6 border-b border-border-dark">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-primary text-white"
              : "text-text-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const tabContent =
    activeTab === "active" ? (
      <div className="mt-6">
        {ACTIVE_ORDERS.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    ) : activeTab === "completed" ? (
      <div className="mt-6">
        {COMPLETED_ORDERS.map((order) => (
          <OrderCard key={order.id} order={order} isCompleted />
        ))}
      </div>
    ) : (
      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-16 text-center">
        <div className="text-5xl">🚫</div>
        <p className="mt-4 text-base font-bold text-white">
          No cancelled orders
        </p>
        <p className="mt-2 text-[13px] text-text-secondary">
          All your orders are active or completed
        </p>
      </div>
    );

  const orderSummaryPanel = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Order Summary
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Active</span>
          <span className="font-bold text-primary">
            {ACTIVE_ORDERS.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Completed</span>
          <span className="font-bold text-primary">
            {COMPLETED_ORDERS.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Cancelled</span>
          <span className="font-bold text-primary">0</span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Escrow Protected
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        🔒 All payments are held in escrow and released to manufacturers only
        as each milestone is verified — you confirm delivery before the final
        release.
      </p>
    </>
  );

  return (
    <>
      <div className="hidden h-screen overflow-hidden md:flex">
        <aside className="flex h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-border-dark bg-card">
          <div className="p-5">
            <div className="flex items-center gap-1 font-display text-lg font-bold">
              <span>🧵</span>
              <span className="text-white">Fab</span>
              <span className="text-primary">Verify</span>
            </div>

            <p className="mt-5 text-sm text-white">
              Good morning, Siddharth 👋
            </p>
            <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              Brand Builder
            </span>
          </div>

          <div className="mt-4">
            <p className="px-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              Workspace
            </p>
            <nav className="mt-2 flex flex-col">
              {WORKSPACE_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 border-l-2 px-5 py-2.5 text-left text-sm font-medium transition-colors ${
                    item.active
                      ? "border-primary bg-primary/[0.08] text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            <p className="px-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              Tools
            </p>
            <nav className="mt-2 flex flex-col">
              {TOOLS_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 border-l-2 border-transparent px-5 py-2.5 text-left text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-border-dark p-5">
            <p className="text-xs text-text-secondary">Your FabScore</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">
              —
            </p>
            <p className="mt-1 text-[11px] text-text-secondary">
              Complete verification to unlock
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-navy"
            >
              Get Verified
            </button>
          </div>
        </aside>

        <main className="flex h-screen flex-1 flex-col overflow-hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-dark px-6">
            <h1 className="font-display text-xl font-bold text-white">
              My Orders
            </h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Notifications"
                className="text-lg text-text-primary"
              >
                🔔
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
              >
                Create New Order
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {tabsBar}
            {tabContent}
          </div>
        </main>

        <aside className="scrollbar-hide flex h-screen w-[280px] shrink-0 flex-col overflow-y-auto border-l border-border-dark bg-card p-5">
          {orderSummaryPanel}
        </aside>
      </div>

      <div className="flex min-h-screen flex-col pb-20 md:hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="text-lg text-text-primary"
          >
            🔔
          </button>
        </div>

        <div className="flex-1 px-4 py-5">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-bold text-white">
              My Orders
            </h1>
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-navy"
            >
              Create New Order
            </button>
          </div>

          <div className="mt-4">{tabsBar}</div>
          {tabContent}
        </div>

        <nav className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-border-dark bg-card">
          {BOTTOM_NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                item.active ? "text-primary" : "text-text-secondary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
