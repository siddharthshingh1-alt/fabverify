"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import { qcInspectors } from "../../data/qcInspectors";
import type { OrderRow } from "../../lib/mapOrder";
import { authFetch } from "../../lib/apiClient";

type MilestoneStatus = "complete" | "active" | "pending";

type MilestoneDetail = {
  name: string;
  status: MilestoneStatus;
  date?: string;
  lines: { text: string; thumbnail?: boolean }[];
};

type PaymentRow = {
  name: string;
  percent: number;
  amount: number;
  status: string;
};

type ProductionPhoto = { caption: string };

type ChatMessage = { from: "manufacturer" | "you"; text: string };

type OrderDetailData = {
  id: string;
  manufacturer: string;
  manufacturerRating: string;
  manufacturerTier: string;
  factoryCity: string;
  product: string;
  fabricInfo: string;
  orderDate: string;
  expectedDelivery: string;
  statusLine: string;
  status: string;
  milestones: MilestoneDetail[];
  paymentRows: PaymentRow[];
  totalValue: number;
  productionPhotos: ProductionPhoto[];
  initialMessages: ChatMessage[];
  shippingAddress: string;
  courier: string;
  trackingNumber: string;
  currentMilestoneName: string;
  currentMilestoneWindow: string;
  currentProgressLine: string;
  latestUpdateLine: string;
};

const ORDER_DETAILS: Record<string, OrderDetailData> = {
  "ORD-2024-001": {
    id: "ORD-2024-001",
    manufacturer: "Jaipur Ethnic Works",
    manufacturerRating: "⭐ 4.9 • 287 orders",
    manufacturerTier: "Gold Verified",
    factoryCity: "Jaipur",
    product: "Cotton Block Print Kurta — 200 pieces",
    fabricInfo: "Fabric: Cotton Block Print",
    orderDate: "15 June 2026",
    expectedDelivery: "15 July 2026",
    statusLine: "Days remaining: 18 days",
    status: "In Production",
    milestones: [
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
    ],
    paymentRows: [
      { name: "Order Confirmed", percent: 20, amount: 16800, status: "Released" },
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
    ],
    totalValue: 84000,
    productionPhotos: [
      { caption: "Photo 1 — Jun 20, 2026 — Cutting started" },
      { caption: "Photo 2 — Jun 22, 2026 — Stitching in progress" },
    ],
    initialMessages: [
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
    ],
    shippingAddress: "Flat 4B, Green Park Extension, New Delhi, 110016",
    courier: "Delhivery (will be assigned on dispatch)",
    trackingNumber: "Not yet assigned",
    currentMilestoneName: "Production In Progress",
    currentMilestoneWindow: "Started June 20 • Estimated completion June 30",
    currentProgressLine: "52% complete — 105 of 200 pieces done",
    latestUpdateLine: "Jun 22, 2026 — Stitching in progress",
  },
  "ORD-2024-002": {
    id: "ORD-2024-002",
    manufacturer: "Tirupur Knits",
    manufacturerRating: "⭐ 4.7 • 334 orders",
    manufacturerTier: "Silver Verified",
    factoryCity: "Tirupur",
    product: "Cotton T-shirt — 500 pieces",
    fabricInfo: "Fabric: Cotton Jersey",
    orderDate: "1 June 2026",
    expectedDelivery: "25 June 2026",
    statusLine: "Next: Quality Check approval, then dispatch",
    status: "Quality Check",
    milestones: [
      {
        name: "Order Confirmed",
        status: "complete",
        date: "Jun 1, 2026",
        lines: [
          { text: "20% advance payment (₹25,000) released to manufacturer" },
        ],
      },
      {
        name: "Raw Material Procured",
        status: "complete",
        date: "Jun 5, 2026",
        lines: [
          {
            text: "Fabric sourced: 550 metres cotton jersey from in-house mill",
          },
          { text: "Photo proof: 1 image uploaded", thumbnail: true },
        ],
      },
      {
        name: "Production In Progress",
        status: "complete",
        date: "Completed Jun 18, 2026",
        lines: [
          { text: "500 pieces cut, stitched, and finished" },
          { text: "Latest photo: uploaded Jun 18", thumbnail: true },
          { text: "30% payment (₹37,500) released on completion" },
        ],
      },
      {
        name: "Quality Check",
        status: "active",
        date: "Started Jun 19",
        lines: [
          { text: "FabVerify QC team is inspecting all 500 pieces" },
          { text: "Estimated completion: Jun 24" },
          { text: "20% payment (₹25,000) will release on QC approval" },
        ],
      },
      {
        name: "Dispatch",
        status: "pending",
        lines: [
          { text: "20% payment (₹25,000) releases on dispatch confirmation" },
        ],
      },
      {
        name: "Delivery Confirmation",
        status: "pending",
        lines: [
          { text: "Remaining 10% (₹12,500) releases when you confirm delivery" },
        ],
      },
    ],
    paymentRows: [
      { name: "Order Confirmed", percent: 20, amount: 25000, status: "Released" },
      {
        name: "Production Completion",
        percent: 30,
        amount: 37500,
        status: "Released",
      },
      { name: "Quality Check", percent: 20, amount: 25000, status: "Pending" },
      { name: "Dispatch", percent: 20, amount: 25000, status: "Pending" },
      {
        name: "Delivery Confirmation",
        percent: 10,
        amount: 12500,
        status: "Pending",
      },
    ],
    totalValue: 125000,
    productionPhotos: [
      { caption: "Photo 1 — Jun 3, 2026 — Fabric received" },
      { caption: "Photo 2 — Jun 10, 2026 — Cutting in progress" },
      { caption: "Photo 3 — Jun 15, 2026 — Stitching completed" },
      { caption: "Photo 4 — Jun 19, 2026 — QC inspection begins" },
    ],
    initialMessages: [
      {
        from: "manufacturer",
        text: "Production is complete. All 500 pieces are with our QC team now.",
      },
      {
        from: "you",
        text: "Great, please double-check stitching on the collar seams.",
      },
      {
        from: "manufacturer",
        text: "Noted, we are inspecting collar seams on every piece.",
      },
    ],
    shippingAddress: "Flat 4B, Green Park Extension, New Delhi, 110016",
    courier: "Delhivery (will be assigned on dispatch)",
    trackingNumber: "Not yet assigned",
    currentMilestoneName: "Quality Check",
    currentMilestoneWindow: "Started June 19 • Estimated completion June 24",
    currentProgressLine: "64% complete — 320 of 500 pieces inspected",
    latestUpdateLine: "Jun 19, 2026 — QC inspection begins",
  },
};

function formatDetailDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DETAIL_MILESTONE_STATUS: Record<string, MilestoneStatus> = {
  completed: "complete",
  active: "active",
  pending: "pending",
};

const DETAIL_STATUS_LABEL: Record<string, string> = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
};

// Maps a real order (fetched from /api/orders/[id]) into the same shape the
// hardcoded demo orders use, so the whole tab/render tree below works
// unchanged. Real orders don't have chat, production photos, tracker sub-updates,
// or shipping/courier tracking yet, so those sections render empty rather
// than being ripped out — an honest "not built yet" rather than a fabricated one.
function mapOrderRowToDetail(row: OrderRow): OrderDetailData {
  const milestones = (row.milestones ?? [])
    .slice()
    .sort((a, b) => a.milestone_number - b.milestone_number);
  const currentMilestone = milestones.find((m) => m.status === "active") ?? milestones[0];

  return {
    id: row.order_number,
    manufacturer: row.manufacturer?.name ?? "Unknown manufacturer",
    manufacturerRating: "New on FabVerify",
    manufacturerTier: "",
    factoryCity: row.manufacturer?.city ?? "",
    product: row.style_name,
    fabricInfo: `Qty: ${row.quantity.toLocaleString("en-IN")} pieces`,
    orderDate: formatDetailDate(row.created_at?.slice(0, 10)),
    expectedDelivery: formatDetailDate(row.delivery_date),
    statusLine: DETAIL_STATUS_LABEL[row.status] ?? row.status,
    status: DETAIL_STATUS_LABEL[row.status] ?? row.status,
    milestones: milestones.map((m) => ({
      name: m.milestone_name,
      status: DETAIL_MILESTONE_STATUS[m.status] ?? "pending",
      date: m.completed_at ? formatDetailDate(m.completed_at.slice(0, 10)) : undefined,
      lines: [],
    })),
    paymentRows: milestones.map((m) => ({
      name: m.milestone_name,
      percent: m.payment_percentage,
      amount: Math.round((row.total_value * m.payment_percentage) / 100),
      status: m.status === "completed" ? "Released" : "Pending",
    })),
    totalValue: row.total_value,
    productionPhotos: [],
    initialMessages: [],
    shippingAddress: "",
    courier: "",
    trackingNumber: "Not yet assigned",
    currentMilestoneName: currentMilestone?.milestone_name ?? "",
    currentMilestoneWindow: "",
    currentProgressLine: "",
    latestUpdateLine: "",
  };
}

function MilestoneCircle({ status }: { status: MilestoneStatus }) {
  if (status === "complete") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9999px] bg-primary text-base font-bold text-navy">
        ✓
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[9999px] bg-primary/20">
        <div className="h-6 w-6 animate-spin rounded-[9999px] border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return (
    <div className="h-10 w-10 shrink-0 rounded-[9999px] border-2 border-border-dark" />
  );
}

const TABS: { id: "overview" | "tracker"; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tracker", label: "Live Tracker" },
];

export default function OrderDetail() {
  const params = useParams();
  const orderId = params.id as string;
  const staticOrder = ORDER_DETAILS[orderId];
  const [fetchedOrder, setFetchedOrder] = useState<OrderDetailData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(!staticOrder);

  useEffect(() => {
    if (staticOrder) {
      setLoadingOrder(false);
      return;
    }
    let cancelled = false;
    setLoadingOrder(true);
    authFetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { order: OrderRow } | null) => {
        if (cancelled) return;
        setFetchedOrder(data?.order ? mapOrderRowToDetail(data.order) : null);
      })
      .catch((error) => {
        console.error("Failed to load order:", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, staticOrder]);

  const order = staticOrder ?? fetchedOrder ?? undefined;

  const nearbyQcInspectors = order
    ? qcInspectors.filter((inspector) =>
        inspector.citiesCovered.includes(order.factoryCity)
      )
    : [];

  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [messages, setMessages] = useState<ChatMessage[]>(
    order?.initialMessages ?? []
  );
  const [draftMessage, setDraftMessage] = useState("");

  const [showQcModal, setShowQcModal] = useState(false);
  const [qcInspectionType, setQcInspectionType] = useState("Pre-production");
  const [qcFactoryAddress, setQcFactoryAddress] = useState("");
  const [qcDate, setQcDate] = useState("");
  const [qcPieces, setQcPieces] = useState("");
  const [qcRequirements, setQcRequirements] = useState("");
  const [qcBookedInspector, setQcBookedInspector] = useState<string | null>(null);

  useEffect(() => {
    if (showQcModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showQcModal]);

  const openQcModal = () => {
    setQcInspectionType("Pre-production");
    setQcFactoryAddress("");
    setQcDate("");
    setQcPieces("");
    setQcRequirements("");
    setQcBookedInspector(null);
    setShowQcModal(true);
  };

  const closeQcModal = () => setShowQcModal(false);

  useEffect(() => {
    setMessages(order?.initialMessages ?? []);
    setDraftMessage("");
  }, [orderId]);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "overview");
  }, [orderId, searchParams]);

  const handleSend = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { from: "you", text: trimmed }]);
    setDraftMessage("");
  };

  const tabsBar = (
    <div className="flex gap-6 border-b border-border-dark">
      {TABS.map((tab) => (
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

  const centerContent = loadingOrder ? (
    <div className="flex items-center justify-center px-6 py-16 text-sm text-text-secondary">
      Loading order...
    </div>
  ) : !order ? (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">📦</div>
      <p className="mt-4 text-base font-bold text-white">
        Order {orderId} not found
      </p>
      <p className="mt-2 text-[13px] text-text-secondary">
        This order doesn&apos;t exist or may have been removed.
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
      {tabsBar}

      {activeTab === "tracker" ? (
        <div className="mt-6 flex flex-col gap-6">
          <div className="rounded-xl border border-border-dark border-l-[3px] border-l-primary bg-card p-5">
            <p className="text-[18px] font-bold text-primary">
              Currently: {order.currentMilestoneName}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {order.currentMilestoneWindow}
            </p>
            <p className="mt-2 text-sm text-white">
              {order.currentProgressLine}
            </p>
          </div>

          <div className="rounded-xl border border-border-dark bg-card p-5">
            <h2 className="text-base font-bold text-white">Order Timeline</h2>
            <div className="mt-5 flex flex-col gap-5">
              {order.milestones.map((milestone, index) => {
                const isActive = milestone.status === "active";
                return (
                  <div key={milestone.name} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <MilestoneCircle status={milestone.status} />
                      {index < order.milestones.length - 1 && (
                        <div
                          className={`mt-1 w-0.5 flex-1 ${
                            milestone.status === "complete"
                              ? "bg-primary"
                              : "border-l-2 border-dashed border-border-dark"
                          }`}
                        />
                      )}
                    </div>
                    <div
                      className={`flex-1 pb-2 ${
                        isActive
                          ? "rounded-[10px] border border-primary bg-primary/10 p-5"
                          : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`font-bold ${
                            isActive
                              ? "text-base text-primary"
                              : "text-sm text-text-primary"
                          }`}
                        >
                          {milestone.name}
                        </p>
                        {milestone.date && (
                          <p className="text-xs text-text-secondary">
                            {milestone.date}
                          </p>
                        )}
                        {milestone.status === "pending" && (
                          <p className="text-xs text-text-secondary">
                            Pending
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
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
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border-dark bg-card p-5">
            <h2 className="text-base font-bold text-white">
              Latest Production Photo
            </h2>
            <div className="mt-4 flex aspect-video w-full items-center justify-center rounded-[8px] border border-border-dark bg-navy text-6xl text-text-secondary">
              📷
            </div>
            <p className="mt-3 text-sm text-text-primary">
              Latest update: {order.latestUpdateLine}
            </p>
            <p className="mt-1 text-xs font-semibold text-primary">
              Verified by FabVerify field system ✓
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <div className="rounded-xl border border-border-dark bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-primary">
                {order.id}
              </span>
              <span className="text-[15px] font-bold text-white">
                {order.manufacturer}
              </span>
              <span className="rounded-[20px] border border-primary bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                {order.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-text-primary">{order.product}</p>
            <p className="mt-1 text-xs text-text-secondary">
              {order.fabricInfo} • Order date: {order.orderDate} • Expected
              delivery: {order.expectedDelivery}
            </p>
            <p className="mt-3 text-sm font-bold text-primary">
              {order.statusLine}
            </p>
          </div>

          <div className="rounded-xl border border-border-dark bg-card p-5">
            <h2 className="text-base font-bold text-white">
              Escrow Breakdown
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {order.paymentRows.map((row) => (
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
              <span className="text-primary">
                ₹{order.totalValue.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-3 text-xs text-text-secondary">
              All payments protected by FabVerify Escrow
            </p>
          </div>

          <div className="rounded-xl border border-border-dark bg-card p-5">
            <h2 className="text-base font-bold text-white">
              Production Proof Photos
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2">
              {order.productionPhotos.map((photo) => (
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

          <div className="rounded-xl border border-border-dark bg-card p-5">
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
        </div>
      )}
    </>
  );

  const centrePanel = (
    <>
      <div
        className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-border-dark px-6"
        style={{ backgroundColor: "#07122a" }}
      >
        <Link
          href="/orders"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          ← Back to Orders
        </Link>
      </div>

      <div className="px-6 py-6">{centerContent}</div>
    </>
  );

  const rightPanel = order && (
    <>
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
          🏭
        </div>
        <p className="mt-2 text-sm font-bold text-white">
          {order.manufacturer}
        </p>
        <p className="text-xs text-text-secondary">
          {order.manufacturerRating}
        </p>
        <span className="mt-2 inline-block rounded-[20px] border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {order.manufacturerTier}
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
          onClick={openQcModal}
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
          {order.shippingAddress}
        </p>
        <p>
          <span className="text-text-primary">Courier:</span>{" "}
          {order.courier}
        </p>
        <p>
          <span className="text-text-primary">Tracking number:</span>{" "}
          {order.trackingNumber}
        </p>
      </div>
    </>
  );

  const qcModal = showQcModal && order && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={closeQcModal}
    >
      <div
        className="hide-scrollbar relative w-full max-w-[560px] rounded-xl border border-border-dark bg-card p-8"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeQcModal}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        {qcBookedInspector ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="text-5xl">✅</div>
            <p className="mt-4 text-lg font-bold text-white">
              Inspector booked. They will confirm within 2 hours.
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              You will receive {qcBookedInspector}&apos;s contact details on
              WhatsApp.
            </p>
            <button
              type="button"
              onClick={closeQcModal}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-navy"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white">
              Book QC Inspector
            </h2>
            <p className="mt-2 text-[13px] text-text-secondary">
              A verified FabVerify QC Inspector will visit the factory and
              provide a detailed inspection report before dispatch.
            </p>

            <div className="mt-5">
              <p className="text-sm font-medium text-text-primary">
                Inspection type
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Pre-production", "In-line", "Pre-dispatch"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setQcInspectionType(type)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      qcInspectionType === type
                        ? "border-primary bg-primary text-navy"
                        : "border-border-dark bg-background text-text-secondary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Factory city
                </label>
                <input
                  type="text"
                  value={order.factoryCity}
                  disabled
                  className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-secondary outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Factory address
                </label>
                <input
                  type="text"
                  value={qcFactoryAddress}
                  onChange={(event) => setQcFactoryAddress(event.target.value)}
                  placeholder="Unit address"
                  className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Preferred date
                </label>
                <input
                  type="date"
                  value={qcDate}
                  onChange={(event) => setQcDate(event.target.value)}
                  className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Number of pieces to inspect
                </label>
                <input
                  type="number"
                  min={0}
                  value={qcPieces}
                  onChange={(event) => setQcPieces(event.target.value)}
                  placeholder="e.g. 200"
                  className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Special requirements (optional)
              </label>
              <textarea
                value={qcRequirements}
                onChange={(event) => setQcRequirements(event.target.value)}
                rows={3}
                className="w-full rounded-[6px] border border-border-dark bg-background p-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
              />
            </div>

            <p className="mb-3 mt-6 text-sm font-medium text-text-primary">
              {nearbyQcInspectors.length > 0
                ? `Available inspectors near ${order.factoryCity}`
                : `No inspectors currently cover ${order.factoryCity} — showing other available inspectors`}
            </p>
            <div className="flex flex-col gap-3">
              {(nearbyQcInspectors.length > 0
                ? nearbyQcInspectors
                : qcInspectors.slice(0, 2)
              ).map((inspector) => (
                <div
                  key={inspector.id}
                  className="rounded-[10px] border border-border-dark bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {inspector.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {inspector.city} • ⭐ {inspector.fabscore}
                      </p>
                    </div>
                    <p className="text-right text-xs font-semibold text-primary">
                      ₹{inspector.rateMin.toLocaleString("en-IN")}–₹
                      {inspector.rateMax.toLocaleString("en-IN")}
                      <br />
                      <span className="font-normal text-text-secondary">
                        {inspector.availability}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQcBookedInspector(inspector.name)}
                    className="mt-3 w-full rounded-lg border border-primary py-2 text-xs font-semibold text-primary"
                  >
                    Book This Inspector
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setQcBookedInspector("your assigned inspector")}
              className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-bold text-navy"
            >
              Auto-assign nearest available →
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
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

      {qcModal}
    </>
  );
}
