"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";

const SEASON_OPTIONS = ["Summer 2026", "Monsoon 2025", "Winter 2025"];
const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

type TabId = "overview" | "styles" | "budget" | "timeline" | "vendors";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "styles", label: "Styles" },
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "vendors", label: "Vendors" },
];

type Stage = "Sampling" | "Production" | "QC" | "Dispatch" | "Delivered";
type Status = "On Track" | "Delayed" | "Delivered";

type StyleRow = {
  id: string;
  name: string;
  category: string;
  vendor: string;
  stage: Stage;
  progress: number;
  status: Status;
  due: string;
  budget: number;
  spent: number;
  timelineStart: number;
  timelineWidth: number;
};

const STYLES: StyleRow[] = [
  { id: "block-print-kurta", name: "Block Print Kurta", category: "Ethnic Wear", vendor: "Jaipur Ethnic Works", stage: "Production", progress: 75, status: "On Track", due: "Jul 20", budget: 120000, spent: 24000, timelineStart: 19.7, timelineWidth: 20.5 },
  { id: "palazzo-set", name: "Palazzo Set", category: "Ethnic Wear", vendor: "Delhi Woven Works", stage: "Production", progress: 45, status: "Delayed", due: "Jul 15", budget: 150000, spent: 160000, timelineStart: 15.6, timelineWidth: 20.5 },
  { id: "cotton-tshirt", name: "Cotton T-shirt", category: "Western Wear", vendor: "Tirupur Knits", stage: "QC", progress: 85, status: "On Track", due: "Jul 18", budget: 180000, spent: 81000, timelineStart: 32.0, timelineWidth: 6.5 },
  { id: "silk-blouse", name: "Silk Blouse", category: "Luxury", vendor: "Mumbai Fabric House", stage: "Sampling", progress: 25, status: "On Track", due: "Aug 5", budget: 140000, spent: 21000, timelineStart: 24.6, timelineWidth: 28.7 },
  { id: "linen-trouser", name: "Linen Trouser", category: "Western Wear", vendor: "Ahmedabad Mill", stage: "Production", progress: 60, status: "On Track", due: "Jul 25", budget: 110000, spent: 88000, timelineStart: 22.1, timelineWidth: 22.1 },
  { id: "chikankari-kurti", name: "Chikankari Kurti", category: "Ethnic Wear", vendor: "Lucknow Chikan", stage: "QC", progress: 90, status: "On Track", due: "Jul 17", budget: 130000, spent: 117000, timelineStart: 30.3, timelineWidth: 7.4 },
  { id: "embroidered-dress", name: "Embroidered Dress", category: "Luxury", vendor: "Surat Silk House", stage: "Dispatch", progress: 95, status: "On Track", due: "Jul 16", budget: 160000, spent: 158000, timelineStart: 33.6, timelineWidth: 3.3 },
  { id: "summer-coord-set", name: "Summer Coord Set", category: "Western Wear", vendor: "Bangalore Apparel", stage: "Delivered", progress: 100, status: "Delivered", due: "Jul 10", budget: 250000, spent: 171000, timelineStart: 11.5, timelineWidth: 20.5 },
];

const CATEGORY_OPTIONS = [
  "Ethnic Wear",
  "Western Wear",
  "Knitwear",
  "Kids Wear",
  "Luxury",
  "Denim",
  "Sustainable",
];

const CONNECTED_VENDOR_NAMES = Array.from(new Set(STYLES.map((s) => s.vendor)));

const STATUS_STYLES: Record<Status, string> = {
  "On Track": "border-green-500/60 bg-green-500/15 text-green-400",
  Delayed: "border-red-500/60 bg-red-500/15 text-red-400",
  Delivered: "border-border-dark bg-background text-text-secondary",
};

const STAGE_COLOR: Record<Stage, string> = {
  Sampling: "#60a5fa",
  Production: "#f2ca50",
  QC: "#fb923c",
  Dispatch: "#4ade80",
  Delivered: "#7A8FA8",
};

const TOTAL_BUDGET = STYLES.reduce((sum, s) => sum + s.budget, 0);
const TOTAL_SPENT = STYLES.reduce((sum, s) => sum + s.spent, 0);
const TOTAL_REMAINING = TOTAL_BUDGET - TOTAL_SPENT;
const PROJECTED_OVERSPEND = 25000;
const BUDGET_USED_PERCENT = Math.round((TOTAL_SPENT / TOTAL_BUDGET) * 100);

const TIMELINE_MONTHS = ["June", "July", "August", "September"];
const TODAY_PERCENT = 37.7;

type VendorPerformance = {
  id: string;
  name: string;
  styles: number;
  onTime: number;
  quality: number;
  fabScore: number;
  paymentTerms: string;
  status: "Excellent" | "Good" | "Needs Attention";
  capacityBooked: number;
};

const VENDOR_PERFORMANCE: VendorPerformance[] = [
  { id: "jaipur-ethnic-works", name: "Jaipur Ethnic Works", styles: 1, onTime: 99, quality: 4.8, fabScore: 9.2, paymentTerms: "Net 30", status: "Excellent", capacityBooked: 85 },
  { id: "delhi-woven-works", name: "Delhi Woven Works", styles: 1, onTime: 88, quality: 3.9, fabScore: 7.9, paymentTerms: "Net 15", status: "Needs Attention", capacityBooked: 70 },
  { id: "mumbai-fabric-house", name: "Mumbai Fabric House", styles: 1, onTime: 95, quality: 4.5, fabScore: 8.5, paymentTerms: "Net 30", status: "Good", capacityBooked: 60 },
  { id: "lucknow-chikan", name: "Lucknow Chikan", styles: 1, onTime: 97, quality: 4.7, fabScore: 8.8, paymentTerms: "Net 45", status: "Excellent", capacityBooked: 90 },
  { id: "ahmedabad-mill", name: "Ahmedabad Mill", styles: 1, onTime: 93, quality: 4.2, fabScore: 8.3, paymentTerms: "Net 30", status: "Good", capacityBooked: 75 },
  { id: "tirupur-knits", name: "Tirupur Knits", styles: 1, onTime: 90, quality: 4.0, fabScore: 8.0, paymentTerms: "Net 15", status: "Good", capacityBooked: 65 },
];

const VENDOR_STATUS_STYLES: Record<VendorPerformance["status"], string> = {
  Excellent: "border-green-500/60 bg-green-500/15 text-green-400",
  Good: "border-green-500/60 bg-green-500/15 text-green-400",
  "Needs Attention": "border-amber-500/60 bg-amber-500/15 text-amber-400",
};

const DEADLINES = [
  { date: "Jul 16", style: "Embroidered Dress", action: "Dispatch today" },
  { date: "Jul 17", style: "Chikankari Kurti", action: "QC approval" },
  { date: "Jul 18", style: "Cotton T-shirt", action: "Final inspection" },
  { date: "Jul 20", style: "Palazzo Set", action: "Production deadline" },
  { date: "Jul 25", style: "Linen Trouser", action: "Dispatch target" },
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

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`w-fit rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

const OVERVIEW_COLUMNS = ["Style", "Category", "Vendor", "Stage", "Progress", "Status", "Due Date"];
const OVERVIEW_GRID = "1.4fr 1fr 1.3fr 1fr 1.2fr 1fr 0.8fr";

function OverviewTab() {
  return (
    <>
      <div className="mb-4 rounded-[10px] border border-border-dark bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold text-white">Summer 2026</p>
            <p className="mt-1 text-xs text-text-secondary">June 2026 — September 2026</p>
            <p className="mt-1 text-xs text-text-secondary">8 styles · 12 vendors · 3 months</p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-bold text-primary">
              72<span className="text-xl font-semibold text-text-secondary">/100</span>
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Season Score</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: "8", valueClass: "text-white", label: "Total Styles" },
          { value: "5", valueClass: "text-green-400", label: "On Track" },
          { value: "1", valueClass: "text-red-400", label: "Delayed" },
          { value: "66%", valueClass: "text-amber-400", label: "Budget Used" },
        ].map((card) => (
          <div key={card.label} className="rounded-[10px] border border-border-dark bg-card p-4">
            <p className={`font-display text-2xl font-bold ${card.valueClass}`}>{card.value}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">{card.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-bold text-white">Style Progress</h2>
      <div className="mt-3 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
        <div style={{ minWidth: 760 }}>
          <div
            className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
            style={{ gridTemplateColumns: OVERVIEW_GRID }}
          >
            {OVERVIEW_COLUMNS.map((col) => (
              <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                {col}
              </span>
            ))}
          </div>
          {STYLES.map((style, index) => (
            <div
              key={style.id}
              className="grid items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0"
              style={{ gridTemplateColumns: OVERVIEW_GRID, backgroundColor: index % 2 === 0 ? "#0D1B33" : "#07122a" }}
            >
              <span className="text-[13px] font-bold text-white">{style.name}</span>
              <span className="text-xs text-text-secondary">{style.category}</span>
              <span className="text-xs text-text-secondary">{style.vendor}</span>
              <span className="text-xs text-text-primary">{style.stage}</span>
              <div>
                <ProgressBar percent={style.progress} color={style.status === "Delayed" ? "#f87171" : "#f2ca50"} />
                <span className="mt-1 block text-[10px] text-text-secondary">{style.progress}%</span>
              </div>
              <StatusPill status={style.status} />
              <span className="text-xs text-text-secondary">{style.due}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function StyleCard({ style }: { style: StyleRow }) {
  return (
    <div className="rounded-[10px] border border-border-dark bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-white">{style.name}</p>
        <StatusPill status={style.status} />
      </div>
      <span className="mt-1.5 inline-block rounded-[20px] bg-background px-2.5 py-1 text-[10px] text-text-secondary">
        {style.category}
      </span>

      <div className="mt-3 flex flex-col gap-1.5 border-t border-border-dark pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Vendor</span>
          <span className="text-text-secondary">{style.vendor}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Target cost</span>
          <span className="font-semibold text-primary">{rupees(style.budget)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Actual cost</span>
          <span className="font-semibold text-white">{rupees(style.spent)}</span>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar percent={style.progress} height={4} />
        <p className="mt-1 text-[11px] text-text-secondary">{style.stage}</p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-dark pt-3">
        <span className="text-[11px] text-text-secondary">Due {style.due}</span>
        <Link href="/enterprise/orders" className="text-[11px] font-semibold text-primary">
          View Details →
        </Link>
      </div>
    </div>
  );
}

function StylesTab({ onAddStyle }: { onAddStyle: () => void }) {
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onAddStyle}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
        >
          + Add Style
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STYLES.map((style) => (
          <StyleCard key={style.id} style={style} />
        ))}
      </div>
    </>
  );
}

const BUDGET_COLUMNS = ["Style", "Budgeted", "Spent", "Remaining", "Variance", "Status"];
const BUDGET_GRID = "1.4fr 1fr 1fr 1fr 1fr 1.3fr";

function BudgetTab() {
  return (
    <>
      <div className="rounded-[10px] border border-border-dark bg-card p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-bold text-white">{rupees(TOTAL_BUDGET)}</p>
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
            <p className="text-sm font-bold text-red-400">{rupees(PROJECTED_OVERSPEND)}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">Projected Over</p>
          </div>
        </div>
        <div className="mt-5">
          <ProgressBar percent={BUDGET_USED_PERCENT} height={10} />
          <p className="mt-1.5 text-[11px] text-text-secondary">{BUDGET_USED_PERCENT}% of season budget used</p>
        </div>
      </div>

      <h2 className="mt-6 text-sm font-bold text-white">Cost by Style</h2>
      <div className="mt-3 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
        <div style={{ minWidth: 680 }}>
          <div
            className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
            style={{ gridTemplateColumns: BUDGET_GRID }}
          >
            {BUDGET_COLUMNS.map((col) => (
              <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                {col}
              </span>
            ))}
          </div>
          {STYLES.map((style, index) => {
            const remaining = style.budget - style.spent;
            const variance = style.spent - style.budget;
            const ratio = style.spent / style.budget;
            const over = ratio > 1;
            const approaching = !over && ratio >= 0.9;
            const colorClass = over ? "text-red-400" : approaching ? "text-amber-400" : "text-green-400";
            const label = over ? "Over Budget" : approaching ? "Approaching Limit" : "On Track";
            return (
              <div
                key={style.id}
                className="grid items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0"
                style={{ gridTemplateColumns: BUDGET_GRID, backgroundColor: index % 2 === 0 ? "#0D1B33" : "#07122a" }}
              >
                <span className="text-[13px] font-bold text-white">{style.name}</span>
                <span className="text-xs text-text-primary">{rupees(style.budget)}</span>
                <span className="text-xs text-text-primary">{rupees(style.spent)}</span>
                <span className="text-xs text-text-secondary">
                  {remaining < 0 ? `-${rupees(Math.abs(remaining))}` : rupees(remaining)}
                </span>
                <span className={`text-xs font-semibold ${colorClass}`}>
                  {variance > 0 ? `+${rupees(variance)}` : rupees(variance)}
                </span>
                <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-[10px] border border-amber-500/40 bg-amber-500/10 p-4">
        <p className="text-sm font-bold text-amber-400">⚠ Budget Alerts</p>
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-text-secondary">Palazzo Set — ₹5,000 over budget</p>
          <p className="text-xs text-text-secondary">Silk Blouse — approaching limit</p>
        </div>
      </div>
    </>
  );
}

function TimelineTab() {
  return (
    <div className="rounded-[10px] border border-border-dark bg-card p-4">
      <div className="relative">
        <div
          className="pointer-events-none absolute bottom-0 top-0 z-10 border-l-2 border-dashed"
          style={{ left: `${TODAY_PERCENT}%`, borderColor: "#f87171" }}
        >
          <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-red-400">
            Today
          </span>
        </div>

        <div className="flex">
          {TIMELINE_MONTHS.map((month) => (
            <span key={month} className="flex-1 text-center text-[11px] font-semibold text-text-secondary">
              {month}
            </span>
          ))}
        </div>

        <div className="mt-2 flex flex-col">
          {STYLES.map((style, index) => (
            <div
              key={style.id}
              className="flex items-center"
              style={{ height: 40, padding: "10px 12px", backgroundColor: index % 2 === 0 ? "#0D1B33" : "#07122a" }}
            >
              <span className="w-32 shrink-0 truncate pr-3 text-xs text-white" title={style.name}>
                {style.name}
              </span>
              <div className="relative h-6 min-w-0 flex-1 rounded-[4px] bg-background">
                <div
                  className="absolute top-0 flex h-full items-center overflow-hidden rounded-[4px] px-1.5"
                  style={{
                    left: `${style.timelineStart}%`,
                    width: `${style.timelineWidth}%`,
                    backgroundColor: STAGE_COLOR[style.stage],
                  }}
                >
                  <span className="truncate text-[10px] font-bold text-navy">{style.stage}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-4 border-t border-border-dark pt-4">
        {(Object.keys(STAGE_COLOR) as Stage[]).map((stage) => (
          <div key={stage} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[stage] }} />
            <span className="text-[11px] text-text-secondary">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const VENDOR_COLUMNS = ["Vendor", "Styles", "On-Time", "Quality", "FabScore", "Payment Terms", "Status"];
const VENDOR_GRID = "1.4fr 0.7fr 0.8fr 0.8fr 0.8fr 1fr 1.1fr";

function VendorsTab() {
  return (
    <>
      <h2 className="text-base font-bold text-white">Vendor Performance</h2>
      <div className="mt-3 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
        <div style={{ minWidth: 720 }}>
          <div
            className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
            style={{ gridTemplateColumns: VENDOR_GRID }}
          >
            {VENDOR_COLUMNS.map((col) => (
              <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                {col}
              </span>
            ))}
          </div>
          {VENDOR_PERFORMANCE.map((vendor, index) => (
            <div
              key={vendor.id}
              className="grid items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0"
              style={{ gridTemplateColumns: VENDOR_GRID, backgroundColor: index % 2 === 0 ? "#0D1B33" : "#07122a" }}
            >
              <span className="text-[13px] font-bold text-white">{vendor.name}</span>
              <span className="text-xs text-text-secondary">{vendor.styles}</span>
              <span className="text-xs text-text-primary">{vendor.onTime}%</span>
              <span className="text-xs text-text-primary">{vendor.quality.toFixed(1)}/5</span>
              <span className="text-xs font-semibold text-primary">{vendor.fabScore.toFixed(1)}</span>
              <span className="text-xs text-text-secondary">{vendor.paymentTerms}</span>
              <span
                className={`w-fit rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${VENDOR_STATUS_STYLES[vendor.status]}`}
              >
                {vendor.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-6 text-sm font-bold text-white">Capacity Overview</h2>
      <div className="mt-3 flex flex-col gap-3 rounded-[10px] border border-border-dark bg-card p-4">
        {VENDOR_PERFORMANCE.map((vendor) => (
          <div key={vendor.id} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-xs text-text-primary">{vendor.name}</span>
            <div className="flex-1">
              <ProgressBar percent={vendor.capacityBooked} />
            </div>
            <span className="w-20 shrink-0 text-right text-[11px] text-text-secondary">
              {vendor.capacityBooked}% booked
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function AddStyleModal({ onClose }: { onClose: () => void }) {
  const [styleName, setStyleName] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [targetCost, setTargetCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const isValid =
    styleName.trim() !== "" &&
    category !== "" &&
    vendor !== "" &&
    targetCost !== "" &&
    quantity !== "" &&
    deliveryDate !== "";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="hide-scrollbar relative w-full max-w-[480px] rounded-xl border border-border-dark bg-card p-7"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="text-5xl">✅</div>
            <p className="mt-4 text-lg font-bold text-white">Style Added!</p>
            <p className="mt-2 text-sm text-text-secondary">
              {styleName} has been added to this season&apos;s plan with {vendor}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-navy"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">Add Style</h2>

            <div className="mt-5">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">Style name</label>
              <input
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="e.g. Floral Maxi Dress"
                className="w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none focus:border-primary"
              >
                <option value="" className="bg-card text-text-secondary">Select category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-card text-text-primary">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">Assign vendor</label>
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none focus:border-primary"
              >
                <option value="" className="bg-card text-text-secondary">Select vendor</option>
                {CONNECTED_VENDOR_NAMES.map((name) => (
                  <option key={name} value={name} className="bg-card text-text-primary">
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-text-primary">Target cost/piece (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={targetCost}
                  onChange={(e) => setTargetCost(e.target.value)}
                  placeholder="850"
                  className="w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-text-primary">Estimated quantity</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">Target delivery date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional details..."
                className="w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border-dark py-2.5 text-sm font-semibold text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isValid}
                onClick={() => isValid && setSubmitted(true)}
                className={`flex-[2] rounded-lg py-2.5 text-sm font-bold transition-colors ${
                  isValid ? "cursor-pointer bg-primary text-navy" : "cursor-not-allowed bg-border-dark text-text-secondary"
                }`}
              >
                Add Style →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SeasonPlan() {
  const authorized = useEnterpriseAccess();
  const [mounted, setMounted] = useState(false);
  const [season, setSeason] = useState(SEASON_OPTIONS[0]);
  const [seasonOptions, setSeasonOptions] = useState(SEASON_OPTIONS);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showAddStyleModal, setShowAddStyleModal] = useState(false);
  const [seasonNotes, setSeasonNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("fabverify_season_notes");
      if (stored) setSeasonNotes(stored);
    } catch {}
  }, []);

  if (!authorized) return null;

  const saveNotes = () => {
    try {
      localStorage.setItem("fabverify_season_notes", seasonNotes);
    } catch {}
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const addNewSeason = () => {
    const label = `New Season ${seasonOptions.length + 1}`;
    setSeasonOptions((current) => [label, ...current]);
    setSeason(label);
  };

  const headerRight = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={addNewSeason}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
      >
        + New Season
      </button>
      <select
        value={season}
        onChange={(e) => setSeason(e.target.value)}
        className="appearance-none rounded-[6px] border border-primary bg-transparent py-1.5 pl-3 pr-7 text-xs font-semibold text-primary outline-none"
        style={{
          backgroundImage: SELECT_CHEVRON,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          backgroundSize: "12px",
        }}
      >
        {seasonOptions.map((option) => (
          <option key={option} className="bg-card text-text-primary">
            {option}
          </option>
        ))}
      </select>
    </div>
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
    ) : activeTab === "styles" ? (
      <StylesTab onAddStyle={() => setShowAddStyleModal(true)} />
    ) : activeTab === "budget" ? (
      <BudgetTab />
    ) : activeTab === "timeline" ? (
      <TimelineTab />
    ) : (
      <VendorsTab />
    );

  const centreContent = (
    <>
      {tabsBar}
      <div className="mt-6">{tabContent}</div>
    </>
  );

  const centrePanel = (
    <>
      <TopBar
        title="Season Plan"
        subtitle="Plan your collection from trend to delivery"
        rightContent={headerRight}
      />
      <div className="px-6 py-6">{centreContent}</div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">Season Actions</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href="/analytics"
          className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-bold text-navy"
        >
          📊 Export Season Report
        </Link>
        <Link
          href="/enterprise/vendors"
          className="block rounded-lg border border-border-dark px-4 py-2.5 text-center text-sm font-semibold text-text-secondary"
        >
          📧 Alert All Vendors
        </Link>
        <Link
          href="/enterprise/orders"
          className="block rounded-lg border border-border-dark px-4 py-2.5 text-center text-sm font-semibold text-text-secondary"
        >
          📋 View All Approvals
        </Link>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Quick Add</p>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("styles");
            setShowAddStyleModal(true);
          }}
          className="text-left text-xs font-semibold text-primary"
        >
          + Add Style
        </button>
        <Link href="/enterprise/vendors" className="text-xs font-semibold text-primary">
          + Add Vendor
        </Link>
        <button
          type="button"
          onClick={() => setActiveTab("budget")}
          className="text-left text-xs font-semibold text-primary"
        >
          + Add Budget
        </button>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-white">This Week</p>
      <div className="mt-3 flex flex-col gap-3">
        {DEADLINES.map((item) => (
          <div key={item.style} className="text-xs">
            <p>
              <span className="font-bold text-primary">{item.date}</span>{" "}
              <span className="font-semibold text-white">{item.style}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary">{item.action}</p>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-white">Season Notes</p>
      <textarea
        value={seasonNotes}
        onChange={(e) => setSeasonNotes(e.target.value)}
        rows={4}
        placeholder="Jot down notes for this season..."
        className="mt-2 w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-xs text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
      />
      <button
        type="button"
        onClick={saveNotes}
        className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-navy"
      >
        {notesSaved ? "Saved ✓" : "Save Note"}
      </button>
    </>
  );

  return (
    <>
      <ThreePanelLayout
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

        {centrePanel}

        <div className="border-t border-border-dark p-5">{rightPanel}</div>
      </div>

      {mounted &&
        showAddStyleModal &&
        createPortal(<AddStyleModal onClose={() => setShowAddStyleModal(false)} />, document.body)}
    </>
  );
}
