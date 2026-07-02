"use client";

import Link from "next/link";
import { use, useState } from "react";

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

type MilestoneStatus = "complete" | "active" | "pending";

type MilestoneDetail = {
  name: string;
  status: MilestoneStatus;
  date?: string;
  lines: { text: string; thumbnail?: boolean }[];
};

const MILESTONES: MilestoneDetail[] = [
  {
    name: "Order Confirmed",
    status: "complete",
    date: "Jun 15, 2026",
    lines: [
      { text: "20% advance payment (₹16,800) released to manufacturer" },
    ],
  },
  {
    name: "Raw Material Procured",
    status: "complete",
    date: "Jun 18, 2026",
    lines: [
      {
        text: "Fabric sourced: 220 metres cotton lawn from Surat Cotton Mills",
      },
      { text: "Photo proof: 1 image uploaded", thumbnail: true },
    ],
  },
  {
    name: "Production In Progress",
    status: "active",
    date: "Started Jun 20",
    lines: [
      { text: "Estimated completion: Jun 30" },
      { text: "Progress: 65 pieces cut, 40 pieces stitched (52% complete)" },
      { text: "Latest photo: uploaded Jun 22", thumbnail: true },
      { text: "30% payment (₹25,200) will release on completion" },
    ],
  },
  {
    name: "Quality Check",
    status: "pending",
    lines: [
      { text: "FabVerify QC team will inspect before dispatch" },
      { text: "20% payment (₹16,800) releases on QC approval" },
    ],
  },
  {
    name: "Dispatch",
    status: "pending",
    lines: [
      { text: "20% payment (₹16,800) releases on dispatch confirmation" },
    ],
  },
  {
    name: "Delivery Confirmation",
    status: "pending",
    lines: [
      { text: "Remaining 10% (₹8,400) releases when you confirm delivery" },
    ],
  },
];

const PAYMENT_ROWS = [
  {
    name: "Order Confirmed",
    percent: 20,
    amount: 16800,
    status: "Released",
  },
  {
    name: "Production Completion",
    percent: 30,
    amount: 25200,
    status: "Pending",
  },
  { name: "Quality Check", percent: 20, amount: 16800, status: "Pending" },
  { name: "Dispatch", percent: 20, amount: 16800, status: "Pending" },
  {
    name: "Delivery Confirmation",
    percent: 10,
    amount: 8400,
    status: "Pending",
  },
];

const PRODUCTION_PHOTOS = [
  { caption: "Photo 1 — Jun 20, 2026 — Cutting started" },
  { caption: "Photo 2 — Jun 22, 2026 — Stitching in progress" },
];

type ChatMessage = { from: "manufacturer" | "you"; text: string };

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    from: "manufacturer",
    text: "We have started cutting as per your approved design. Photos attached.",
  },
  {
    from: "you",
    text: "Looks good! Please ensure the block print alignment matches the sample.",
  },
  {
    from: "manufacturer",
    text: "Understood. We will ensure print alignment is consistent.",
  },
];

function MilestoneCircle({ status }: { status: MilestoneStatus }) {
  if (status === "complete") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9999px] bg-primary text-sm font-bold text-navy">
        ✓
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="relative flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-[9999px] bg-primary/20">
        <div className="h-5 w-5 animate-spin rounded-[9999px] border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 shrink-0 rounded-[9999px] border-2 border-border-dark" />
  );
}

export default function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draftMessage, setDraftMessage] = useState("");

  const isKnownOrder = id === "ORD-2024-001";

  const handleSend = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { from: "you", text: trimmed }]);
    setDraftMessage("");
  };

  const centerContent = !isKnownOrder ? (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">📦</div>
      <p className="mt-4 text-base font-bold text-white">
        Order {id} not found
      </p>
      <p className="mt-2 text-[13px] text-text-secondary">
        This is a demo build — full detail is only available for
        ORD-2024-001.
      </p>
      <Link
        href="/orders"
        className="mt-5 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
      >
        ← Back to Orders
      </Link>
    </div>
  ) : (
    <>
      <div className="rounded-xl border border-border-dark bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-primary">
            ORD-2024-001
          </span>
          <span className="text-[15px] font-bold text-white">
            Jaipur Ethnic Works
          </span>
          <span className="rounded-[20px] border border-primary bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            In Production
          </span>
        </div>
        <p className="mt-3 text-sm text-text-primary">
          Cotton Block Print Kurta — 200 pieces
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Fabric: Cotton Block Print • Order date: 15 June 2026 • Expected
          delivery: 15 July 2026
        </p>
        <p className="mt-3 text-sm font-bold text-primary">
          Days remaining: 18 days
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-border-dark bg-card p-5">
        <h2 className="text-base font-bold text-white">Order Timeline</h2>
        <div className="mt-5 flex flex-col gap-6">
          {MILESTONES.map((milestone, index) => (
            <div key={milestone.name} className="flex gap-4">
              <div className="flex flex-col items-center">
                <MilestoneCircle status={milestone.status} />
                {index < MILESTONES.length - 1 && (
                  <div
                    className={`mt-1 w-0.5 flex-1 ${
                      milestone.status === "complete"
                        ? "bg-primary"
                        : "border-l-2 border-dashed border-border-dark"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-text-primary">
                    {milestone.name}
                  </p>
                  {milestone.date && (
                    <p className="text-xs text-text-secondary">
                      {milestone.date}
                    </p>
                  )}
                  {milestone.status === "pending" && (
                    <p className="text-xs text-text-secondary">Pending</p>
                  )}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {milestone.lines.map((line) => (
                    <div
                      key={line.text}
                      className="flex items-center gap-2 text-xs text-text-secondary"
                    >
                      <span>{line.text}</span>
                      {line.thumbnail && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-border-dark bg-navy text-sm">
                          📷
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border-dark bg-card p-5">
        <h2 className="text-base font-bold text-white">Escrow Breakdown</h2>
        <div className="mt-4 flex flex-col gap-2">
          {PAYMENT_ROWS.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-text-primary">{row.name}</span>
              <span className="text-text-secondary">{row.percent}%</span>
              <span className="font-semibold text-primary">
                ₹{row.amount.toLocaleString("en-IN")}
              </span>
              <span
                className={`rounded-[20px] border px-2 py-0.5 text-[10px] font-semibold ${
                  row.status === "Released"
                    ? "border-green-500/60 bg-green-500/15 text-green-400"
                    : "border-border-dark bg-navy text-text-secondary"
                }`}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border-dark pt-3 text-sm font-bold">
          <span className="text-text-primary">Total</span>
          <span className="text-primary">₹84,000</span>
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          All payments protected by FabVerify Escrow
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-border-dark bg-card p-5">
        <h2 className="text-base font-bold text-white">
          Production Proof Photos
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2">
          {PRODUCTION_PHOTOS.map((photo) => (
            <div key={photo.caption}>
              <div className="flex aspect-video items-center justify-center rounded-[8px] border border-border-dark bg-navy text-3xl text-text-secondary">
                📷
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                {photo.caption}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-text-secondary">
          Upload verified by: FabVerify field system
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-border-dark bg-card p-5">
        <h2 className="text-base font-bold text-white">Order Messages</h2>
        <div className="mt-4 flex flex-col gap-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.from === "you" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-[10px] px-4 py-2.5 text-sm ${
                  message.from === "you"
                    ? "bg-primary text-navy"
                    : "border border-border-dark bg-navy text-text-primary"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSend();
            }}
            placeholder="Type a message..."
            className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-navy"
          >
            Send
          </button>
        </div>
      </div>
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
          <div className="flex h-16 shrink-0 items-center border-b border-border-dark px-6">
            <Link
              href="/orders"
              className="text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              ← Back to Orders
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {centerContent}
          </div>
        </main>

        <aside className="scrollbar-hide flex h-screen w-[280px] shrink-0 flex-col overflow-y-auto border-l border-border-dark bg-card p-5">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
              🏭
            </div>
            <p className="mt-2 text-sm font-bold text-white">
              Jaipur Ethnic Works
            </p>
            <p className="text-xs text-text-secondary">⭐ 4.9 • 287 orders</p>
            <span className="mt-2 inline-block rounded-[20px] border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Gold Verified
            </span>
            <Link
              href="/manufacturers"
              className="mt-2 block text-xs font-medium text-primary"
            >
              View Full Profile →
            </Link>
          </div>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-base font-bold text-white">Actions</p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary"
            >
              📸 Request Production Update
            </button>
            <button
              type="button"
              className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary"
            >
              🔍 Request QC Inspection
            </button>
            <button
              type="button"
              className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary"
            >
              💬 Message Manufacturer
            </button>
            <button
              type="button"
              className="rounded-lg border border-red-500/60 px-3 py-2 text-xs font-semibold text-red-400"
            >
              ⚠️ Raise Dispute
            </button>
          </div>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-base font-bold text-white">Delivery Info</p>
          <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
            <p>
              <span className="text-text-primary">Shipping address:</span>{" "}
              Flat 4B, Green Park Extension, New Delhi, 110016
            </p>
            <p>
              <span className="text-text-primary">Courier:</span> Delhivery
              (will be assigned on dispatch)
            </p>
            <p>
              <span className="text-text-primary">Tracking number:</span> Not
              yet assigned
            </p>
          </div>
        </aside>
      </div>

      <div className="flex min-h-screen flex-col md:hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-border-dark bg-card px-4">
          <Link
            href="/orders"
            className="text-sm font-medium text-text-secondary"
          >
            ← Back to Orders
          </Link>
        </div>
        <div className="flex-1 px-4 py-5">{centerContent}</div>
      </div>
    </>
  );
}
