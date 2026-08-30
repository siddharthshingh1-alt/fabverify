"use client";

import Link from "next/link";
import { useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";

const SEASON_OPTIONS = ["Summer 2026", "Monsoon 2025", "Winter 2025"];

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

const SELECT_STYLE = {
  backgroundImage: SELECT_CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "12px",
};

type TabId = "overview" | "vendors" | "finance" | "season";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "vendors", label: "Vendors" },
  { id: "finance", label: "Finance" },
  { id: "season", label: "Season" },
];

type Status = "On Track" | "Delayed" | "In Progress" | "Ready" | "Delivered";

const STATUS_STYLES: Record<Status, string> = {
  "On Track": "border-green-500/60 bg-green-500/15 text-green-400",
  Delayed: "border-red-500/60 bg-red-500/15 text-red-400",
  "In Progress": "border-amber-500/60 bg-amber-500/15 text-amber-400",
  Ready: "border-green-500/60 bg-green-500/15 text-green-400",
  Delivered: "border-border-dark bg-background text-text-secondary",
};

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`w-fit rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

const STAGE_ORDER = ["Sampling", "Production", "QC", "Dispatch", "Delivered"];

const STAGE_BAR_COLOR: Record<string, string> = {
  Sampling: "#c084fc",
  Production: "#60a5fa",
  QC: "#2dd4bf",
  Dispatch: "#818cf8",
  Delivered: "#4ade80",
};

const STAGE_PILL_STYLES: Record<string, string> = {
  Sampling: "border-purple-500/40 bg-purple-500/15 text-purple-400",
  Production: "border-blue-500/40 bg-blue-500/15 text-blue-400",
  QC: "border-teal-500/40 bg-teal-500/15 text-teal-400",
  Dispatch: "border-indigo-500/40 bg-indigo-500/15 text-indigo-400",
  Delivered: "border-green-500/40 bg-green-500/15 text-green-400",
};

type StyleRow = {
  id: string;
  name: string;
  vendor: string;
  stage: string;
  progress: number;
  budget: number;
  spent: number;
  status: Status;
  category: string;
  due: string;
};

const STYLES: StyleRow[] = [
  { id: "block-print-kurta", name: "Block Print Kurta", vendor: "Jaipur Ethnic Works", stage: "Sampling", progress: 20, budget: 120000, spent: 24000, status: "On Track", category: "Ethnic Wear", due: "Aug 1" },
  { id: "silk-blouse", name: "Silk Blouse", vendor: "Mumbai Fabric House", stage: "Sampling", progress: 15, budget: 140000, spent: 21000, status: "On Track", category: "Luxury", due: "Aug 5" },
  { id: "palazzo-set", name: "Palazzo Set", vendor: "Delhi Woven Works", stage: "Production", progress: 60, budget: 150000, spent: 160000, status: "Delayed", category: "Ethnic Wear", due: "Jul 20" },
  { id: "cotton-tshirt", name: "Cotton T-shirt", vendor: "Surat Fabric Co", stage: "Production", progress: 45, budget: 180000, spent: 81000, status: "On Track", category: "Casual", due: "Jul 25" },
  { id: "linen-trouser", name: "Linen Trouser", vendor: "Ahmedabad Mill", stage: "Production", progress: 80, budget: 110000, spent: 88000, status: "On Track", category: "Western", due: "Jul 18" },
  { id: "chikankari-kurti", name: "Chikankari Kurti", vendor: "Lucknow Chikan", stage: "QC", progress: 90, budget: 130000, spent: 117000, status: "On Track", category: "Ethnic Wear", due: "Jul 16" },
  { id: "embroidered-dress", name: "Embroidered Dress", vendor: "Jaipur Ethnic Works", stage: "Dispatch", progress: 100, budget: 160000, spent: 158000, status: "Ready", category: "Ethnic Wear", due: "Jul 14" },
  { id: "summer-coord-set", name: "Summer Coord Set", vendor: "Mumbai Fabric House", stage: "Delivered", progress: 100, budget: 250000, spent: 171000, status: "Delivered", category: "Casual", due: "Jul 10" },
];

const TOTAL_BUDGET = STYLES.reduce((sum, style) => sum + style.budget, 0);
const TOTAL_SPENT = STYLES.reduce((sum, style) => sum + style.spent, 0);
const TOTAL_REMAINING = TOTAL_BUDGET - TOTAL_SPENT;
const PROJECTED_OVERSPEND = STYLES.reduce(
  (sum, style) => sum + Math.max(0, style.spent - style.budget),
  0
);
const BUDGET_USED_PERCENT = Math.round((TOTAL_SPENT / TOTAL_BUDGET) * 100);
const ON_TRACK_COUNT = STYLES.filter((s) => s.status === "On Track").length;
const DELAYED_COUNT = STYLES.filter((s) => s.status === "Delayed").length;

type VendorRow = {
  id: string;
  name: string;
  orders: number;
  onTime: number;
  quality: number;
  fabScore: number;
  status: "Excellent" | "Good" | "Needs attention" | "Poor";
};

const VENDORS: VendorRow[] = [
  { id: "jaipur-ethnic-works", name: "Jaipur Ethnic Works", orders: 12, onTime: 99, quality: 5, fabScore: 9.2, status: "Excellent" },
  { id: "lucknow-chikan", name: "Lucknow Chikan", orders: 4, onTime: 97, quality: 5, fabScore: 8.8, status: "Excellent" },
  { id: "mumbai-fabric-house", name: "Mumbai Fabric House", orders: 6, onTime: 95, quality: 4, fabScore: 8.5, status: "Good" },
  { id: "delhi-woven-works", name: "Delhi Woven Works", orders: 8, onTime: 88, quality: 4, fabScore: 7.9, status: "Needs attention" },
  { id: "ahmedabad-mill", name: "Ahmedabad Mill", orders: 5, onTime: 93, quality: 4, fabScore: 8.3, status: "Good" },
  { id: "surat-fabric-co", name: "Surat Fabric Co", orders: 9, onTime: 82, quality: 3, fabScore: 7.2, status: "Poor" },
];

const VENDOR_STATUS_STYLES: Record<VendorRow["status"], { icon: string; className: string }> = {
  Excellent: { icon: "✅", className: "text-green-400" },
  Good: { icon: "✅", className: "text-green-400" },
  "Needs attention": { icon: "⚠️", className: "text-amber-400" },
  Poor: { icon: "🔴", className: "text-red-400" },
};

const CATEGORY_BREAKDOWN = Array.from(
  STYLES.reduce((map, style) => {
    map.set(style.category, (map.get(style.category) ?? 0) + 1);
    return map;
  }, new Map<string, number>())
).map(([label, count]) => ({ label, count }));

const HEALTH_ROWS = [
  { dot: "🟢", label: "Timeline: 75% on track" },
  { dot: "🟡", label: "Budget: 66% used" },
  { dot: "🟢", label: "Quality: No disputes" },
  { dot: "🟡", label: "Vendors: 1 underperforming" },
];

type Alert = { title: string; detail: string; action: string; color: string; href: string };

const ALERTS: Alert[] = [
  {
    title: "Palazzo Set — 5 days delayed",
    detail: "Expected Jul 15, now Jul 20 · Delhi Woven Works",
    action: "Contact Vendor →",
    color: "#f87171",
    href: "/enterprise/orders",
  },
  {
    title: "Block Print Kurta budget exceeded",
    detail: "₹85,000 spent vs ₹80,000 budget · ₹5,000 over",
    action: "View Details →",
    color: "#f59e0b",
    href: "/enterprise/orders",
  },
  {
    title: "2 sample approvals pending",
    detail: "Waiting your sign-off for 3 days · Jaipur Ethnic Works",
    action: "Review Now →",
    color: "#63B3ED",
    href: "/enterprise/orders",
  },
];

function rupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

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
    <div className="w-full rounded-full bg-border-dark" style={{ height: `${height}px` }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }}
      />
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

const TIMELINE_NAME_COL = 140;
const TIMELINE_LEFT_OFFSET = TIMELINE_NAME_COL + 12;
const TIMELINE_DATE_COL = 64;
const TIMELINE_RIGHT_OFFSET = 8 + TIMELINE_DATE_COL;
const TIMELINE_TODAY_LEFT = `calc(${TIMELINE_LEFT_OFFSET}px + (100% - ${
  TIMELINE_LEFT_OFFSET + TIMELINE_RIGHT_OFFSET
}px) * 0.45)`;

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
  const barColor = isDelayed ? "#f87171" : STAGE_BAR_COLOR[style.stage] ?? "#7A8FA8";
  const showLabelInside = width >= 18;
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

  return (
    <div
      className="group relative flex items-center"
      style={{ height: 40, padding: "10px 12px", backgroundColor: index % 2 === 0 ? "#0D1B33" : "#07122a" }}
    >
      <span
        className="shrink-0 truncate pr-3 text-xs text-white"
        style={{ width: TIMELINE_NAME_COL }}
        title={style.name}
      >
        {style.name}
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
            <span className="relative truncate text-[10px] font-bold text-white">{style.stage}</span>
          )}
          <span className="relative ml-auto shrink-0 text-[10px] font-bold text-white">
            {style.progress}%
          </span>
        </div>

        <div
          className="hidden group-hover:block"
          style={{
            position: "absolute",
            zIndex: 9999,
            width: "230px",
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
          <p className="text-[14px] font-bold text-white">{style.name}</p>
          <p className="mt-1.5 text-[12px] text-text-secondary">
            Stage: <span className="text-text-primary">{style.stage}</span>
          </p>
          <p className="text-[12px] text-text-secondary">
            Vendor: <span className="text-text-primary">{style.vendor}</span>
          </p>
          <p className="text-[12px] text-text-secondary">
            Due: <span className="text-text-primary">{style.due}</span>
          </p>
          <p className="text-[12px] font-bold text-primary">Progress: {style.progress}%</p>
          {isDelayed && (
            <p className="mt-1.5 text-[11px] font-semibold text-red-400">⚠️ DELAYED</p>
          )}
        </div>
      </div>

      <span
        className="ml-2 shrink-0 text-right text-[10px]"
        style={{ width: TIMELINE_DATE_COL, color: isDelayed ? "#f87171" : "#7A8FA8" }}
      >
        {style.due}
        {isDelayed && " ⚠️"}
      </span>
    </div>
  );
}

function OverviewTab() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[10px] border border-border-dark bg-card p-4">
          <p className="font-display text-2xl font-bold text-white">{STYLES.length}</p>
          <p className="mt-1 text-xs text-text-secondary">Total Styles</p>
        </div>
        <div className="rounded-[10px] border border-border-dark bg-card p-4">
          <p className="font-display text-2xl font-bold text-green-400">{ON_TRACK_COUNT}</p>
          <p className="mt-1 text-xs text-text-secondary">On Time</p>
        </div>
        <div className="rounded-[10px] border border-border-dark bg-card p-4">
          <p className="font-display text-2xl font-bold text-red-400">{DELAYED_COUNT}</p>
          <p className="mt-1 text-xs text-text-secondary">Delayed</p>
        </div>
        <div className="rounded-[10px] border border-border-dark bg-card p-4">
          <p className="font-display text-2xl font-bold text-amber-400">{BUDGET_USED_PERCENT}%</p>
          <p className="mt-1 text-xs text-text-secondary">Budget Used</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-base font-bold text-white">Style Progress</h2>
        <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
          <div style={{ minWidth: 760 }}>
            <div
              className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
              style={{ gridTemplateColumns: "1.4fr 1.3fr 1fr 1fr 1fr 1fr" }}
            >
              {["Style", "Vendor", "Stage", "Budget", "Spent", "Status"].map((col) => (
                <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                  {col}
                </span>
              ))}
            </div>
            {STYLES.map((style, index) => (
              <div
                key={style.id}
                className={`grid items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
                  index % 2 === 0 ? "bg-card" : "bg-background"
                }`}
                style={{ gridTemplateColumns: "1.4fr 1.3fr 1fr 1fr 1fr 1fr" }}
              >
                <span className="text-[13px] font-bold text-white">{style.name}</span>
                <span className="text-xs text-text-primary">{style.vendor}</span>
                <StagePill stage={style.stage} />
                <span className="text-xs text-text-secondary">{rupees(style.budget)}</span>
                <span
                  className={`text-xs ${style.spent > style.budget ? "font-semibold text-red-400" : "text-text-secondary"}`}
                >
                  {rupees(style.spent)}
                </span>
                <StatusPill status={style.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function VendorsTab() {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
      <div style={{ minWidth: 680 }}>
        <div
          className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
          style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr 1.3fr" }}
        >
          {["Vendor", "Orders", "On-Time %", "Quality", "FabScore", "Status"].map((col) => (
            <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              {col}
            </span>
          ))}
        </div>
        {VENDORS.map((vendor, index) => {
          const statusConfig = VENDOR_STATUS_STYLES[vendor.status];
          return (
            <div
              key={vendor.id}
              className={`grid items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
                index % 2 === 0 ? "bg-card" : "bg-background"
              }`}
              style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr 1.3fr" }}
            >
              <span className="text-[13px] font-bold text-white">{vendor.name}</span>
              <span className="text-xs text-text-primary">{vendor.orders}</span>
              <span className="text-xs text-text-primary">{vendor.onTime}%</span>
              <span className="text-xs text-primary">{"⭐".repeat(vendor.quality)}</span>
              <span className="text-xs font-semibold text-primary">{vendor.fabScore}</span>
              <span className={`text-xs font-semibold ${statusConfig.className}`}>
                {statusConfig.icon} {vendor.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceTab() {
  return (
    <>
      <div className="rounded-[10px] border border-border-dark bg-card p-6">
        <h2 className="text-base font-bold text-white">Budget Overview</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="font-display text-xl font-bold text-white">{rupees(TOTAL_BUDGET)}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Total Budget</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-primary">{rupees(TOTAL_SPENT)}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Spent</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-green-400">{rupees(TOTAL_REMAINING)}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Remaining</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-red-400">{rupees(PROJECTED_OVERSPEND)}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Projected Overspend</p>
          </div>
        </div>
        <div className="mt-5">
          <ProgressBar percent={BUDGET_USED_PERCENT} height={10} />
          <p className="mt-1.5 text-[11px] text-text-secondary">{BUDGET_USED_PERCENT}% of season budget used</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-white">Cost by Style</h2>
        <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
          <div style={{ minWidth: 620 }}>
            <div
              className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
              style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.2fr" }}
            >
              {["Style", "Budgeted", "Spent", "Remaining", "Status"].map((col) => (
                <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                  {col}
                </span>
              ))}
            </div>
            {STYLES.map((style, index) => {
              const over = style.spent > style.budget;
              const remaining = style.budget - style.spent;
              return (
                <div
                  key={style.id}
                  className="border-b border-border-dark px-4 py-3 last:border-b-0"
                  style={{ backgroundColor: over ? "rgba(248,113,113,0.06)" : index % 2 === 0 ? "#0D1B33" : "#07122a" }}
                >
                  <div className="grid items-center gap-2" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.2fr" }}>
                    <span className="text-[13px] font-bold text-white">{style.name}</span>
                    <span className="text-xs text-text-primary">{rupees(style.budget)}</span>
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
                    <ProgressBar percent={(style.spent / style.budget) * 100} color={over ? "#f87171" : "#f2ca50"} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-white">Escrow Summary</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[10px] border border-border-dark bg-card p-4">
            <p className="font-display text-xl font-bold text-primary">₹3,40,000</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">In Escrow</p>
          </div>
          <div className="rounded-[10px] border border-border-dark bg-card p-4">
            <p className="font-display text-xl font-bold text-green-400">₹4,80,000</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Released to Vendors</p>
          </div>
          <div className="rounded-[10px] border border-border-dark bg-card p-4">
            <p className="font-display text-xl font-bold text-text-primary">₹2,20,000</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Pending Release</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SeasonTab() {
  return (
    <>
      <div className="rounded-[10px] border border-border-dark bg-card p-4">
        <div className="relative">
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-10 border-l-2 border-dashed"
            style={{ left: TIMELINE_TODAY_LEFT, borderColor: "#f2ca50" }}
          >
            <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-primary">
              Today
            </span>
          </div>

          <div className="flex" style={{ paddingLeft: TIMELINE_LEFT_OFFSET, paddingRight: TIMELINE_RIGHT_OFFSET }}>
            {STAGE_ORDER.map((stage) => (
              <span key={stage} className="flex-1 text-center text-[11px] font-semibold text-text-secondary">
                {stage}
              </span>
            ))}
          </div>

          <div className="mt-2 flex flex-col" style={{ overflow: "visible" }}>
            {STYLES.map((style, index) => (
              <TimelineRow key={style.id} style={style} index={index} totalRows={STYLES.length} />
            ))}
          </div>
        </div>
      </div>

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
    </>
  );
}

export default function EnterpriseAnalytics() {
  const authorized = useEnterpriseAccess();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [season, setSeason] = useState(SEASON_OPTIONS[0]);

  if (!authorized) return null;

  const seasonDropdown = (
    <select
      value={season}
      onChange={(event) => setSeason(event.target.value)}
      className="appearance-none rounded-[6px] border border-primary bg-transparent py-1.5 pl-3 pr-7 text-xs font-semibold text-primary outline-none"
      style={SELECT_STYLE}
    >
      {SEASON_OPTIONS.map((option) => (
        <option key={option} className="bg-card text-text-primary">
          {option}
        </option>
      ))}
    </select>
  );

  const tabsBar = (
    <div className="flex gap-6 border-b border-border-dark">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === tab.id ? "border-b-2 border-primary text-white" : "text-text-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const tabContent =
    activeTab === "overview" ? (
      <OverviewTab />
    ) : activeTab === "vendors" ? (
      <VendorsTab />
    ) : activeTab === "finance" ? (
      <FinanceTab />
    ) : (
      <SeasonTab />
    );

  const centrePanel = (
    <>
      <TopBar
        title="Business Analytics"
        subtitle="Season performance across all vendors and styles"
        rightContent={seasonDropdown}
      />

      <div className="px-6 py-6">
        {tabsBar}
        <div className="mt-6">{tabContent}</div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">Season Health</p>
      <p className="mt-2 font-display text-[32px] font-bold text-primary">
        72<span className="text-lg text-text-secondary">/100</span>
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {HEALTH_ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{row.dot}</span>
            <span>{row.label}</span>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">⚠ Alerts</p>
      <div className="mt-3 flex flex-col gap-3">
        {ALERTS.map((alert) => (
          <div key={alert.title} className="rounded-[8px] border p-3" style={{ borderColor: alert.color }}>
            <p className="text-xs font-bold text-text-primary">{alert.title}</p>
            <p className="mt-1 text-[11px] text-text-secondary">{alert.detail}</p>
            <Link
              href={alert.href}
              className="mt-2 inline-block text-[11px] font-semibold"
              style={{ color: alert.color }}
            >
              {alert.action}
            </Link>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <div className="flex flex-col gap-2">
        <button type="button" className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-navy">
          📊 Export Season Report
        </button>
        <button
          type="button"
          className="w-full rounded-lg border border-primary py-2.5 text-xs font-semibold text-primary"
        >
          📱 Alert All Vendors
        </button>
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        left={<EnterpriseLeftPanel />}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col pb-4 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
        </div>

        <div className="flex-1 px-4 py-5">
          <h1 className="font-display text-lg font-bold text-white">Business Analytics</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Season performance across all vendors and styles
          </p>
          <div className="mt-3">{seasonDropdown}</div>

          <div className="mt-4">{tabsBar}</div>
          <div className="mt-6">{tabContent}</div>

          <div className="mt-8 rounded-xl border border-border-dark bg-card p-4">{rightPanel}</div>
        </div>
      </div>
    </>
  );
}
