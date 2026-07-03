"use client";

import { useState } from "react";
import ThreePanelLayout from "../components/ThreePanelLayout";

type TabId = "overview" | "season" | "vendors" | "finance";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "season", label: "Season" },
  { id: "vendors", label: "Vendors" },
  { id: "finance", label: "Finance" },
];

const SEASON_OPTIONS = ["Summer 2026", "Monsoon 2025", "Winter 2025"];

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

const SELECT_STYLE = {
  backgroundImage: SELECT_CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "12px",
};

type StyleStatus = "On Track" | "Delayed" | "Over Budget" | "Cancelled";

type StyleRow = {
  id: string;
  name: string;
  category: string;
  vendor: string;
  stage: string;
  status: StyleStatus;
  budgeted: number;
  spent: number;
  started: string;
  delivery: string;
  expectedDelivery?: string;
  delayDays?: number;
};

const STYLES: StyleRow[] = [
  {
    id: "block-print-kurta",
    name: "Block Print Kurta",
    category: "Ethnic Wear",
    vendor: "Jaipur Ethnic Works",
    stage: "Production",
    status: "On Track",
    budgeted: 120000,
    spent: 120000,
    started: "Jun 1",
    delivery: "Jul 15",
  },
  {
    id: "palazzo-set",
    name: "Palazzo Set",
    category: "Ethnic Wear",
    vendor: "Delhi Woven Works",
    stage: "Sampling",
    status: "Delayed",
    budgeted: 80000,
    spent: 85000,
    started: "Jun 5",
    delivery: "Jul 20",
    expectedDelivery: "Jul 15",
    delayDays: 5,
  },
  {
    id: "cotton-tshirt",
    name: "Cotton T-shirt",
    category: "Casual",
    vendor: "Tirupur Knits",
    stage: "QC",
    status: "On Track",
    budgeted: 100000,
    spent: 95000,
    started: "May 28",
    delivery: "Jun 28",
  },
  {
    id: "linen-trouser",
    name: "Linen Trouser",
    category: "Western",
    vendor: "Delhi Woven Works",
    stage: "Raw Material",
    status: "On Track",
    budgeted: 60000,
    spent: 45000,
    started: "Jun 10",
    delivery: "Jul 30",
  },
  {
    id: "chikankari-kurti",
    name: "Chikankari Kurti",
    category: "Ethnic",
    vendor: "Lucknow Chikankari House",
    stage: "Design",
    status: "On Track",
    budgeted: 90000,
    spent: 30000,
    started: "Jun 20",
    delivery: "Aug 5",
  },
  {
    id: "denim-jacket",
    name: "Denim Jacket",
    category: "Western",
    vendor: "Mumbai Denim Studio",
    stage: "Sampling",
    status: "On Track",
    budgeted: 80000,
    spent: 60000,
    started: "Jun 15",
    delivery: "Aug 10",
  },
  {
    id: "kids-kurta-set",
    name: "Kids Kurta Set",
    category: "Kids",
    vendor: "Jaipur Ethnic Works",
    stage: "Production",
    status: "On Track",
    budgeted: 60000,
    spent: 55000,
    started: "Jun 3",
    delivery: "Jul 18",
  },
  {
    id: "silk-blouse",
    name: "Silk Blouse",
    category: "Luxury",
    vendor: "Ahmedabad Silk House",
    stage: "Sourcing",
    status: "Delayed",
    budgeted: 70000,
    spent: 70000,
    started: "Jun 25",
    delivery: "Aug 15",
    expectedDelivery: "Aug 5",
    delayDays: 10,
  },
];

const STAGE_ORDER = [
  "Design",
  "Sourcing",
  "Raw Material",
  "Sampling",
  "Production",
  "QC",
  "Dispatch",
  "Delivered",
];

const STAGE_PILL_STYLES: Record<string, string> = {
  Design: "border-border-dark bg-background text-text-secondary",
  Sourcing: "border-orange-500/40 bg-orange-500/15 text-orange-400",
  "Raw Material": "border-yellow-500/40 bg-yellow-500/15 text-yellow-400",
  Sampling: "border-purple-500/40 bg-purple-500/15 text-purple-400",
  Production: "border-blue-500/40 bg-blue-500/15 text-blue-400",
  QC: "border-teal-500/40 bg-teal-500/15 text-teal-400",
  Dispatch: "border-indigo-500/40 bg-indigo-500/15 text-indigo-400",
  Delivered: "border-green-500/40 bg-green-500/15 text-green-400",
};

const STAGE_BAR_COLOR: Record<string, string> = {
  Design: "#7A8FA8",
  Sourcing: "#fb923c",
  "Raw Material": "#facc15",
  Sampling: "#c084fc",
  Production: "#60a5fa",
  QC: "#2dd4bf",
  Dispatch: "#818cf8",
  Delivered: "#4ade80",
};

const STAGE_PROGRESS: Record<string, number> = {
  Design: 10,
  Sourcing: 25,
  "Raw Material": 38,
  Sampling: 50,
  Production: 65,
  QC: 80,
  Dispatch: 92,
  Delivered: 100,
};

const TIMELINE_LEGEND = [
  { emoji: "⬜", label: "Design" },
  { emoji: "🟠", label: "Sourcing" },
  { emoji: "🟡", label: "Raw Material" },
  { emoji: "🟣", label: "Sampling" },
  { emoji: "🔵", label: "Production" },
  { emoji: "🔵", label: "QC" },
  { emoji: "🟢", label: "Delivered" },
  { emoji: "🔴", label: "Delayed" },
];

const TIMELINE_NAME_COL = 140;
const TIMELINE_LEFT_OFFSET = TIMELINE_NAME_COL + 12;
const TIMELINE_DATE_COL = 64;
const TIMELINE_BADGE_COL = 70;
const TIMELINE_RIGHT_OFFSET = 8 + TIMELINE_DATE_COL + 8 + TIMELINE_BADGE_COL;
const TIMELINE_TODAY_LEFT = `calc(${TIMELINE_LEFT_OFFSET}px + (100% - ${
  TIMELINE_LEFT_OFFSET + TIMELINE_RIGHT_OFFSET
}px) * 0.45)`;

const STATUS_STYLES: Record<StyleStatus, { icon: string; className: string }> = {
  "On Track": { icon: "✅", className: "text-green-400" },
  Delayed: { icon: "⚠️", className: "text-amber-400" },
  "Over Budget": { icon: "🔴", className: "text-red-400" },
  Cancelled: { icon: "❌", className: "text-red-400" },
};

const CATEGORY_BREAKDOWN = [
  { label: "Ethnic Wear", count: 4 },
  { label: "Western Wear", count: 2 },
  { label: "Casual", count: 1 },
  { label: "Luxury", count: 1 },
];

const SEASON_STATS = {
  totalStyles: 8,
  onTrack: 6,
  delayed: 2,
  launchDate: "August 20, 2026",
  totalBudget: 1240000,
  spent: 820000,
  spentPercent: 66,
  remaining: 420000,
  projectedOverspend: 25000,
  onTimeRate: 87,
  onTimeLastSeason: 82,
  disputes: 0,
};

type VendorStatus = "Excellent" | "Good" | "Needs attention" | "Poor";

type VendorRow = {
  id: string;
  name: string;
  activeStyles: number;
  onTime: number;
  avgDelay: number;
  quality: number;
  fabScore: number;
  status: VendorStatus;
};

const VENDORS: VendorRow[] = [
  {
    id: "jaipur-ethnic-works",
    name: "Jaipur Ethnic Works",
    activeStyles: 2,
    onTime: 100,
    avgDelay: 0,
    quality: 5,
    fabScore: 9.9,
    status: "Excellent",
  },
  {
    id: "tirupur-knits",
    name: "Tirupur Knits",
    activeStyles: 1,
    onTime: 100,
    avgDelay: 0,
    quality: 5,
    fabScore: 9.7,
    status: "Excellent",
  },
  {
    id: "delhi-woven-works",
    name: "Delhi Woven Works",
    activeStyles: 2,
    onTime: 50,
    avgDelay: 5,
    quality: 4,
    fabScore: 9.4,
    status: "Needs attention",
  },
  {
    id: "lucknow-chikankari-house",
    name: "Lucknow Chikankari House",
    activeStyles: 1,
    onTime: 100,
    avgDelay: 0,
    quality: 5,
    fabScore: 9.8,
    status: "Excellent",
  },
  {
    id: "mumbai-denim-studio",
    name: "Mumbai Denim Studio",
    activeStyles: 1,
    onTime: 100,
    avgDelay: 0,
    quality: 4,
    fabScore: 9.5,
    status: "Good",
  },
  {
    id: "ahmedabad-silk-house",
    name: "Ahmedabad Silk House",
    activeStyles: 1,
    onTime: 0,
    avgDelay: 12,
    quality: 3,
    fabScore: 8.2,
    status: "Poor",
  },
];

const VENDOR_STATUS_STYLES: Record<VendorStatus, { icon: string; className: string }> = {
  Excellent: { icon: "✅", className: "text-green-400" },
  Good: { icon: "✅", className: "text-green-400" },
  "Needs attention": { icon: "⚠️", className: "text-amber-400" },
  Poor: { icon: "🔴", className: "text-red-400" },
};

type Payment = {
  vendor: string;
  style: string;
  amount: number;
  date: string;
  status: "Released" | "Pending";
};

const RECENT_PAYMENTS: Payment[] = [
  { vendor: "Jaipur Ethnic Works", style: "Block Print Kurta", amount: 96000, date: "Jun 20", status: "Released" },
  { vendor: "Tirupur Knits", style: "Cotton T-shirt", amount: 76000, date: "Jun 18", status: "Released" },
  { vendor: "Delhi Woven Works", style: "Palazzo Set", amount: 68000, date: "Jun 15", status: "Released" },
  { vendor: "Jaipur Ethnic Works", style: "Kids Kurta Set", amount: 44000, date: "Jun 12", status: "Pending" },
  { vendor: "Mumbai Denim Studio", style: "Denim Jacket", amount: 48000, date: "Jun 10", status: "Pending" },
];

const HEALTH_INDICATORS = [
  { dot: "🟢", label: "Timeline: 75% on track" },
  { dot: "🟡", label: "Budget: 66% used, slight overspend" },
  { dot: "🟢", label: "Quality: No disputes" },
  { dot: "🟡", label: "Vendors: 1 vendor underperforming" },
];

function rupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

const STYLE_GRID_COLS = "1.5fr 1fr 1.4fr 1fr 1fr 1.3fr 0.9fr 0.6fr";
const VENDOR_GRID_COLS = "1.6fr 1fr 0.8fr 0.9fr 1.1fr 0.8fr 1.3fr";
const COST_GRID_COLS = "1.6fr 1fr 1fr 1fr 1.2fr";
const PAYMENT_GRID_COLS = "1.6fr 1.6fr 1fr 0.8fr 1fr";

function ProgressBar({
  percent,
  color = "#f2ca50",
  height = 6,
}: {
  percent: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className="w-full rounded-full bg-border-dark"
      style={{ height: `${height}px` }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

function TimelineRow({
  style,
  index,
  totalRows,
}: {
  style: StyleRow;
  index: number;
  totalRows: number;
}) {
  const stageIndex = STAGE_ORDER.indexOf(style.stage);
  const left = (stageIndex / STAGE_ORDER.length) * 100;
  const width = Math.min(100 / STAGE_ORDER.length + 10, 100 - left);
  const isDelayed = style.status === "Delayed";
  const isOverBudget = style.spent > style.budgeted;
  const statusDot = isDelayed ? "🟡" : isOverBudget ? "🔴" : "🟢";
  const progress = STAGE_PROGRESS[style.stage] ?? 0;
  const isDelivered = style.stage === "Delivered";
  const barColor = isDelayed ? "#f87171" : STAGE_BAR_COLOR[style.stage] ?? "#7A8FA8";
  const showLabelInside = width >= 14;

  const isBottomHalf = index >= totalRows / 2;
  const anchorRight = left + width > 85;
  const anchorLeft = left < 15;

  const tooltipVertical: React.CSSProperties = isBottomHalf
    ? { bottom: "100%", top: "auto", marginBottom: 8 }
    : { top: "100%", bottom: "auto", marginTop: 8 };

  const tooltipHorizontal: React.CSSProperties = anchorRight
    ? { right: `${100 - (left + width)}%`, left: "auto" }
    : anchorLeft
      ? { left: `${left}%`, right: "auto" }
      : { left: `${left + width / 2}%`, right: "auto", transform: "translateX(-50%)" };

  const arrowHorizontal: React.CSSProperties = anchorRight
    ? { right: "20px" }
    : anchorLeft
      ? { left: "20px" }
      : { left: "50%", marginLeft: "-4px" };

  return (
    <div
      className="group relative flex items-center"
      style={{
        height: 40,
        padding: "10px 12px",
        backgroundColor: index % 2 === 0 ? "#0D1B33" : "#07122a",
      }}
    >
      <span
        className="shrink-0 truncate pr-3 text-xs text-white"
        style={{ width: TIMELINE_NAME_COL }}
        title={style.name}
      >
        {statusDot} {style.name}
      </span>

      <div className="relative h-6 min-w-0 flex-1 rounded-[4px] bg-background">
        <div
          className="absolute top-0 flex h-full items-center justify-between gap-1 overflow-hidden rounded-[4px] px-1.5"
          style={{ left: `${left}%`, width: `${width}%`, backgroundColor: barColor }}
        >
          {isDelayed && (
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 3px, transparent 3px, transparent 7px)",
              }}
            />
          )}
          {showLabelInside && (
            <span className="relative truncate text-[10px] font-bold text-white">
              {style.stage}
            </span>
          )}
          <span className="relative ml-auto shrink-0 text-[10px] font-bold text-white">
            {isDelivered ? "✓" : `${progress}%`}
          </span>
          <span
            className="absolute h-1 w-1 rounded-full bg-white/80"
            style={{ left: "18%", bottom: "2px", transform: "translateX(-50%)" }}
          />
          <span
            className="absolute h-1 w-1 rounded-full bg-white/80"
            style={{ left: "82%", bottom: "2px", transform: "translateX(-50%)" }}
          />
        </div>

        <div
          className="hidden group-hover:block"
          style={{
            position: "absolute",
            zIndex: 9999,
            width: "240px",
            backgroundColor: "#0D1B33",
            border: "1px solid #f2ca50",
            borderRadius: "8px",
            padding: "12px",
            pointerEvents: "none",
            textAlign: "left",
            ...tooltipVertical,
            ...tooltipHorizontal,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "8px",
              height: "8px",
              backgroundColor: "#0D1B33",
              borderRight: "1px solid #f2ca50",
              borderBottom: "1px solid #f2ca50",
              transform: isBottomHalf ? "rotate(225deg)" : "rotate(45deg)",
              ...(isBottomHalf ? { bottom: "-4px" } : { top: "-4px" }),
              ...arrowHorizontal,
            }}
          />
          <p className="text-[14px] font-bold text-white">{style.name}</p>
          <p className="mt-1.5 text-[12px] text-text-secondary">
            Current stage: <span className="text-text-primary">{style.stage}</span>
          </p>
          <p className="text-[12px] text-text-secondary">
            Started: <span className="text-text-primary">{style.started}</span>
          </p>
          <p className="text-[12px] text-text-secondary">
            Expected completion:{" "}
            <span className="text-text-primary">
              {style.expectedDelivery ?? style.delivery}
            </span>
          </p>
          <p className="text-[12px] text-text-secondary">
            Vendor: <span className="text-text-primary">{style.vendor}</span>
          </p>
          <p className="text-[12px] font-bold text-primary">
            Progress: {progress}%
          </p>
          {isDelayed && (
            <p className="mt-1.5 text-[11px] font-semibold text-red-400">
              ⚠️ DELAYED — {style.delayDays ?? 0} days behind
            </p>
          )}
        </div>
      </div>

      <span
        className="ml-2 shrink-0 text-right text-[10px]"
        style={{ width: TIMELINE_DATE_COL, color: style.expectedDelivery ? "#f87171" : "#7A8FA8" }}
      >
        {style.delivery}
        {style.expectedDelivery && " ⚠️"}
      </span>

      <span className="ml-2 shrink-0 text-center" style={{ width: TIMELINE_BADGE_COL }}>
        {isDelayed && (
          <span className="inline-block rounded-[20px] border border-red-500/60 bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400">
            DELAYED
          </span>
        )}
      </span>
    </div>
  );
}

function StagePill({ stage }: { stage: string }) {
  return (
    <span
      className={`inline-block w-fit rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${
        STAGE_PILL_STYLES[stage] ?? "border-border-dark bg-background text-text-secondary"
      }`}
    >
      {stage}
    </span>
  );
}

function StatusText({ status }: { status: StyleStatus }) {
  const config = STATUS_STYLES[status];
  return (
    <span className={`text-xs font-semibold ${config.className}`}>
      {config.icon} {status}
    </span>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedSeason, setSelectedSeason] = useState(SEASON_OPTIONS[0]);

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

  const alertBanner = activeTab === "overview" && (
    <div
      className="rounded-[8px] p-3.5"
      style={{
        backgroundColor: "rgba(248,113,113,0.1)",
        borderLeft: "3px solid #f87171",
      }}
    >
      <p className="text-sm font-bold text-[#f87171]">
        ⚠️ 2 alerts need your attention
      </p>
      <p className="mt-1 text-[13px] text-text-secondary">
        Style 04 is 5 days behind schedule • Vendor B cost is 18% over budget
      </p>
    </div>
  );

  const overviewStatCards = (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-[10px] border border-border-dark bg-card p-4">
        <p className="font-display text-2xl font-bold text-primary">
          {SEASON_STATS.totalStyles}
        </p>
        <p className="text-xs font-semibold text-text-primary">Active Styles</p>
        <p className="mt-0.5 text-[11px] text-text-secondary">This season</p>
        <p className="mt-2 text-[11px]">
          <span className="text-green-400">{SEASON_STATS.onTrack} on track ✓</span>{" "}
          <span className="text-red-400">{SEASON_STATS.delayed} delayed ⚠️</span>
        </p>
      </div>

      <div className="rounded-[10px] border border-border-dark bg-card p-4">
        <p className="font-display text-2xl font-bold text-primary">
          {rupees(SEASON_STATS.totalBudget)}
        </p>
        <p className="text-xs font-semibold text-text-primary">
          Total Season Budget
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary">
          Approved budget
        </p>
        <p className="mt-2 text-[11px] text-text-secondary">
          {rupees(SEASON_STATS.spent)} spent ({SEASON_STATS.spentPercent}%)
        </p>
        <div className="mt-2">
          <ProgressBar percent={SEASON_STATS.spentPercent} />
        </div>
      </div>

      <div className="rounded-[10px] border border-border-dark bg-card p-4">
        <p className="font-display text-2xl font-bold text-primary">
          {SEASON_STATS.onTimeRate}%
        </p>
        <p className="text-xs font-semibold text-text-primary">
          On-Time Delivery Rate
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary">
          Across all vendors
        </p>
        <p className="mt-2 text-[11px] text-green-400">
          ↑ Up from {SEASON_STATS.onTimeLastSeason}% last season
        </p>
      </div>

      <div className="rounded-[10px] border border-border-dark bg-card p-4">
        <p className="font-display text-2xl font-bold text-primary">
          {SEASON_STATS.disputes}
        </p>
        <p className="text-xs font-semibold text-text-primary">
          Open Disputes
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary">
          Active disputes
        </p>
        <p className="mt-2 text-[11px] text-green-400">All clear ✓</p>
      </div>
    </div>
  );

  const stylesTracker = (
    <div className="mt-6">
      <h2 className="text-base font-bold text-white">
        Style Progress — Summer 2026
      </h2>
      <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
        <div style={{ minWidth: 920 }}>
          <div
            className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
            style={{ gridTemplateColumns: STYLE_GRID_COLS }}
          >
            {["Style Name", "Category", "Vendor", "Stage", "Status", "Budget", "Delivery", "Action"].map(
              (col) => (
                <span
                  key={col}
                  className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
                >
                  {col}
                </span>
              )
            )}
          </div>

          {STYLES.map((style, index) => {
            const over = style.spent > style.budgeted;
            return (
              <div
                key={style.id}
                className={`grid items-center gap-2 border-b border-border-dark px-4 py-3 ${
                  index % 2 === 0 ? "bg-card" : "bg-background"
                }`}
                style={{ gridTemplateColumns: STYLE_GRID_COLS }}
              >
                <span className="text-[13px] font-bold text-white">
                  {style.name}
                </span>
                <span>
                  <span className="inline-block rounded-[20px] border border-border-dark bg-background px-2.5 py-1 text-[10px] text-text-secondary">
                    {style.category}
                  </span>
                </span>
                <span className="text-xs text-text-primary">{style.vendor}</span>
                <span>
                  <StagePill stage={style.stage} />
                </span>
                <StatusText status={style.status} />
                <span className={`text-xs ${over ? "text-red-400" : "text-text-secondary"}`}>
                  {rupees(style.spent)} / {rupees(style.budgeted)}
                  {over && " — OVER"}
                </span>
                <span className={`text-xs ${style.expectedDelivery ? "text-red-400" : "text-white"}`}>
                  {style.delivery}
                  {style.expectedDelivery && " ⚠️"}
                </span>
                <span>
                  <button type="button" className="text-xs font-semibold text-primary">
                    View
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const overviewTab = (
    <>
      {alertBanner && <div className="mb-4">{alertBanner}</div>}
      {overviewStatCards}
      {stylesTracker}
    </>
  );

  const seasonOverviewCard = (
    <div className="rounded-[10px] border border-border-dark bg-card p-5">
      <h2 className="text-base font-bold text-white">
        Summer 2026 Season Summary
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Total styles</span>
            <span className="font-semibold text-text-primary">
              {SEASON_STATS.totalStyles}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">On track</span>
            <span className="font-semibold text-green-400">
              {SEASON_STATS.onTrack}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Delayed</span>
            <span className="font-semibold text-amber-400">
              {SEASON_STATS.delayed}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Season launch date</span>
            <span className="font-semibold text-text-primary">
              {SEASON_STATS.launchDate}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Total budget</span>
            <span className="font-semibold text-primary">
              {rupees(SEASON_STATS.totalBudget)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Spent so far</span>
            <span className="font-semibold text-primary">
              {rupees(SEASON_STATS.spent)} ({SEASON_STATS.spentPercent}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Remaining</span>
            <span className="font-semibold text-green-400">
              {rupees(SEASON_STATS.remaining)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Projected overspend</span>
            <span className="font-semibold text-amber-400">
              {rupees(SEASON_STATS.projectedOverspend)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const timelineView = (
    <div className="mt-6">
      <h2 className="text-sm font-bold text-white">Season Timeline</h2>

      <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-border-dark pb-3">
          <span className="text-[11px] text-text-secondary">Stage colours:</span>
          {TIMELINE_LEGEND.map((item) => (
            <span
              key={item.label}
              className="rounded-[20px] border border-border-dark bg-background px-2 py-0.5 text-[10px] text-text-secondary"
            >
              {item.emoji} {item.label}
            </span>
          ))}
        </div>

        <div className="relative mt-4">
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-10 border-l-2 border-dashed"
            style={{ left: TIMELINE_TODAY_LEFT, borderColor: "#f2ca50" }}
          >
            <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-primary">
              Today
            </span>
          </div>

          <div
            className="flex"
            style={{ paddingLeft: TIMELINE_LEFT_OFFSET, paddingRight: TIMELINE_RIGHT_OFFSET }}
          >
            {["Jun", "Jul", "Aug"].map((month) => (
              <span
                key={month}
                className="flex-1 text-center text-[11px] font-semibold text-text-secondary"
              >
                {month}
              </span>
            ))}
          </div>

          <div className="mt-2 flex flex-col" style={{ overflow: "visible" }}>
            {STYLES.map((style, index) => (
              <TimelineRow
                key={style.id}
                style={style}
                index={index}
                totalRows={STYLES.length}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const categoryBreakdown = (
    <div className="mt-6">
      <h2 className="text-sm font-bold text-white">Styles by Category</h2>
      <div className="mt-4 flex flex-col gap-3 rounded-[10px] border border-border-dark bg-card p-4">
        {CATEGORY_BREAKDOWN.map((category) => {
          const maxCount = Math.max(...CATEGORY_BREAKDOWN.map((c) => c.count));
          const percent = (category.count / maxCount) * 100;
          return (
            <div key={category.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-primary">{category.label}</span>
                <span className="text-text-secondary">
                  {category.count} style{category.count > 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-1.5">
                <ProgressBar percent={percent} height={8} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const seasonTab = (
    <>
      {seasonOverviewCard}
      {timelineView}
      {categoryBreakdown}
    </>
  );

  const vendorsTab = (
    <>
      <h2 className="text-base font-bold text-white">
        Vendor Scorecard — Summer 2026
      </h2>
      <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
        <div style={{ minWidth: 820 }}>
          <div
            className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
            style={{ gridTemplateColumns: VENDOR_GRID_COLS }}
          >
            {["Vendor", "Active Styles", "On Time", "Avg Delay", "Quality Score", "FabScore", "Status"].map(
              (col) => (
                <span
                  key={col}
                  className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
                >
                  {col}
                </span>
              )
            )}
          </div>

          {VENDORS.map((vendor, index) => {
            const statusConfig = VENDOR_STATUS_STYLES[vendor.status];
            return (
              <div
                key={vendor.id}
                className={`grid items-center gap-2 border-b border-border-dark px-4 py-3 ${
                  index % 2 === 0 ? "bg-card" : "bg-background"
                }`}
                style={{ gridTemplateColumns: VENDOR_GRID_COLS }}
              >
                <span className="text-[13px] font-bold text-white">{vendor.name}</span>
                <span className="text-xs text-text-primary">
                  {vendor.activeStyles} style{vendor.activeStyles > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-text-primary">{vendor.onTime}%</span>
                <span className="text-xs text-text-primary">{vendor.avgDelay} days</span>
                <span className="text-xs text-primary">
                  {"⭐".repeat(vendor.quality)}
                </span>
                <span className="text-xs font-semibold text-primary">{vendor.fabScore}</span>
                <span className={`text-xs font-semibold ${statusConfig.className}`}>
                  {statusConfig.icon} {vendor.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="mt-4 rounded-[8px] p-3.5"
        style={{
          backgroundColor: "rgba(248,113,113,0.08)",
          borderLeft: "2px solid #f87171",
        }}
      >
        <p className="text-xs text-[#f87171]">
          💡 Ahmedabad Silk House has delayed delivery by 12 days on average
          this season. Consider alternative verified suppliers for Silk
          Blouse if delays continue.
        </p>
      </div>
    </>
  );

  const budgetOverviewCard = (
    <div className="rounded-[10px] border border-border-dark bg-card p-6">
      <h2 className="text-base font-bold text-white">
        Season Finance Overview
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="font-display text-xl font-bold text-white">
            {rupees(SEASON_STATS.totalBudget)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-secondary">Total Budget</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-primary">
            {rupees(SEASON_STATS.spent)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-secondary">Spent</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-green-400">
            {rupees(SEASON_STATS.remaining)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-secondary">Remaining</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-red-400">
            {rupees(SEASON_STATS.projectedOverspend)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            Projected Over
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ProgressBar percent={SEASON_STATS.spentPercent} height={12} />
        <p className="mt-1.5 text-[11px] text-text-secondary">
          {SEASON_STATS.spentPercent}% of season budget used
        </p>
      </div>
    </div>
  );

  const costBreakdownTable = (
    <div className="mt-6">
      <h2 className="text-sm font-bold text-white">Cost by Style</h2>
      <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
        <div style={{ minWidth: 640 }}>
          <div
            className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
            style={{ gridTemplateColumns: COST_GRID_COLS }}
          >
            {["Style", "Budgeted", "Spent", "Remaining", "Status"].map((col) => (
              <span
                key={col}
                className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
              >
                {col}
              </span>
            ))}
          </div>

          {STYLES.map((style, index) => {
            const over = style.spent > style.budgeted;
            const remaining = style.budgeted - style.spent;
            const percent = (style.spent / style.budgeted) * 100;
            return (
              <div
                key={style.id}
                className="border-b border-border-dark px-4 py-3"
                style={{
                  backgroundColor: over
                    ? "rgba(248,113,113,0.06)"
                    : index % 2 === 0
                      ? "#0D1B33"
                      : "#07122a",
                }}
              >
                <div
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: COST_GRID_COLS }}
                >
                  <span className="text-[13px] font-bold text-white">
                    {style.name}
                  </span>
                  <span className="text-xs text-text-primary">
                    {rupees(style.budgeted)}
                  </span>
                  <span className={`text-xs font-semibold ${over ? "text-red-400" : "text-primary"}`}>
                    {rupees(style.spent)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {remaining < 0 ? `-${rupees(Math.abs(remaining))}` : rupees(remaining)}
                  </span>
                  <span className={`text-xs font-semibold ${over ? "text-red-400" : "text-green-400"}`}>
                    {over ? "🔴 Over Budget" : "✅ On Track"}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar percent={percent} color={over ? "#f87171" : "#f2ca50"} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const paymentStatusSection = (
    <div className="mt-6">
      <h2 className="text-sm font-bold text-white">Escrow &amp; Payments</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-border-dark bg-card p-4">
          <p className="font-display text-xl font-bold text-primary">₹3,40,000</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">In Escrow</p>
        </div>
        <div className="rounded-[10px] border border-border-dark bg-card p-4">
          <p className="font-display text-xl font-bold text-green-400">₹4,80,000</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            Released to Vendors
          </p>
        </div>
        <div className="rounded-[10px] border border-border-dark bg-card p-4">
          <p className="font-display text-xl font-bold text-text-primary">₹2,20,000</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            Pending Release
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
        <div style={{ minWidth: 560 }}>
          <div
            className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
            style={{ gridTemplateColumns: PAYMENT_GRID_COLS }}
          >
            {["Vendor", "Style", "Amount", "Date", "Status"].map((col) => (
              <span
                key={col}
                className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
              >
                {col}
              </span>
            ))}
          </div>
          {RECENT_PAYMENTS.map((payment, index) => (
            <div
              key={`${payment.vendor}-${payment.style}`}
              className={`grid items-center gap-2 border-b border-border-dark px-4 py-3 ${
                index % 2 === 0 ? "bg-card" : "bg-background"
              }`}
              style={{ gridTemplateColumns: PAYMENT_GRID_COLS }}
            >
              <span className="text-xs text-text-primary">{payment.vendor}</span>
              <span className="text-xs text-text-secondary">{payment.style}</span>
              <span className="text-xs font-semibold text-primary">
                {rupees(payment.amount)}
              </span>
              <span className="text-xs text-text-secondary">{payment.date}</span>
              <span
                className={`text-xs font-semibold ${
                  payment.status === "Released" ? "text-green-400" : "text-text-secondary"
                }`}
              >
                {payment.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const financeTab = (
    <>
      {budgetOverviewCard}
      {costBreakdownTable}
      {paymentStatusSection}
    </>
  );

  const rightPanel = (
    <>
      <p className="text-base font-bold text-white">Season Health</p>
      <p className="mt-3 font-display text-[28px] font-bold text-primary">
        72<span className="text-lg text-text-secondary">/100</span>
      </p>
      <p className="text-[11px] text-text-secondary">Season score</p>

      <div className="mt-4 flex flex-col gap-2">
        {HEALTH_INDICATORS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{item.dot}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">⚠️ Alerts</p>
      <div className="mt-3 flex flex-col gap-3">
        <div
          className="rounded-[8px] border p-3"
          style={{ borderColor: "#f87171" }}
        >
          <p className="text-xs font-bold text-text-primary">
            Palazzo Set — 5 days delayed
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            Expected Jul 15, now Jul 20
          </p>
          <p className="text-[11px] text-text-secondary">Delhi Woven Works</p>
          <button type="button" className="mt-2 text-[11px] font-semibold text-[#f87171]">
            Contact Vendor →
          </button>
        </div>

        <div
          className="rounded-[8px] border p-3"
          style={{ borderColor: "#f59e0b" }}
        >
          <p className="text-xs font-bold text-text-primary">
            Palazzo Set budget exceeded
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            ₹85,000 spent vs ₹80,000 budget
          </p>
          <p className="text-[11px] text-text-secondary">₹5,000 over budget</p>
          <button type="button" className="mt-2 text-[11px] font-semibold text-amber-400">
            View Details →
          </button>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Actions</p>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          className="w-full rounded-lg border border-primary py-2.5 text-xs font-semibold text-primary"
        >
          📊 Export Season Report
        </button>
        <button
          type="button"
          className="w-full rounded-lg border border-primary py-2.5 text-xs font-semibold text-primary"
        >
          📱 Alert All Vendors
        </button>
        <button
          type="button"
          className="w-full rounded-lg border border-primary py-2.5 text-xs font-semibold text-primary"
        >
          📋 View All Approvals
        </button>
      </div>
    </>
  );

  const tabContent =
    activeTab === "overview"
      ? overviewTab
      : activeTab === "season"
        ? seasonTab
        : activeTab === "vendors"
          ? vendorsTab
          : financeTab;

  const centrePanel = (
    <>
      <div
        className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border-dark px-6 py-4"
        style={{ backgroundColor: "#07122a" }}
      >
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            Analytics
          </h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Real-time visibility over your entire garment business
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="text-lg text-text-primary"
          >
            🔔
          </button>
          <select
            value={selectedSeason}
            onChange={(event) => setSelectedSeason(event.target.value)}
            className="appearance-none rounded-[6px] border border-primary bg-transparent py-1.5 pl-3 pr-7 text-xs font-semibold text-primary outline-none"
            style={SELECT_STYLE}
          >
            {SEASON_OPTIONS.map((season) => (
              <option key={season} className="bg-card text-text-primary">
                {season}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-6 py-6">
        {tabsBar}
        <div className="mt-6">{tabContent}</div>
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
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
          <h1 className="font-display text-lg font-bold text-white">
            Analytics
          </h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Real-time visibility over your entire garment business
          </p>

          <select
            value={selectedSeason}
            onChange={(event) => setSelectedSeason(event.target.value)}
            className="mt-3 w-full appearance-none rounded-[6px] border border-primary bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-primary outline-none"
            style={SELECT_STYLE}
          >
            {SEASON_OPTIONS.map((season) => (
              <option key={season} className="bg-card text-text-primary">
                {season}
              </option>
            ))}
          </select>

          <div className="mt-4">{tabsBar}</div>
          <div className="mt-6">{tabContent}</div>
        </div>
      </div>
    </>
  );
}
