"use client";

import { useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";

const SEASON_OPTIONS = ["Summer 2026", "Monsoon 2025", "Winter 2025"];

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

const SELECT_CLASS =
  "appearance-none rounded-lg border border-border-dark bg-card px-3 py-2 text-[13px] text-text-secondary outline-none focus:border-primary";

const SELECT_STYLE = {
  backgroundImage: SELECT_CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "12px",
};

type StageId = "Sampling" | "Production" | "QC" | "Dispatch" | "Delivered";
type StyleStatus = "On Track" | "Delayed" | "In Progress" | "Ready" | "Delivered";

type StyleCard = {
  id: string;
  name: string;
  vendor: string;
  stage: StageId;
  progress: number;
  due: string;
  status: StyleStatus;
};

const STYLES: StyleCard[] = [
  { id: "block-print-kurta", name: "Block Print Kurta", vendor: "Jaipur Ethnic Works", stage: "Sampling", progress: 20, due: "Due Aug 1", status: "On Track" },
  { id: "silk-blouse", name: "Silk Blouse", vendor: "Mumbai Fabric House", stage: "Sampling", progress: 15, due: "Due Aug 5", status: "On Track" },
  { id: "palazzo-set", name: "Palazzo Set", vendor: "Delhi Woven Works", stage: "Production", progress: 60, due: "Due Jul 20", status: "Delayed" },
  { id: "cotton-tshirt", name: "Cotton T-shirt", vendor: "Surat Fabric Co", stage: "Production", progress: 45, due: "Due Jul 25", status: "On Track" },
  { id: "linen-trouser", name: "Linen Trouser", vendor: "Ahmedabad Mill", stage: "Production", progress: 80, due: "Due Jul 18", status: "On Track" },
  { id: "chikankari-kurti", name: "Chikankari Kurti", vendor: "Lucknow Chikan", stage: "QC", progress: 90, due: "Due Jul 16", status: "In Progress" },
  { id: "embroidered-dress", name: "Embroidered Dress", vendor: "Jaipur Ethnic Works", stage: "Dispatch", progress: 100, due: "Due Jul 14", status: "Ready" },
  { id: "summer-coord-set", name: "Summer Coord Set", vendor: "Mumbai Fabric House", stage: "Delivered", progress: 100, due: "Delivered Jul 10", status: "Delivered" },
];

const STAGES: { id: StageId; label: string }[] = [
  { id: "Sampling", label: "SAMPLING" },
  { id: "Production", label: "PRODUCTION" },
  { id: "QC", label: "QC" },
  { id: "Dispatch", label: "DISPATCH" },
  { id: "Delivered", label: "DELIVERED" },
];

const STATUS_STYLES: Record<StyleStatus, string> = {
  "On Track": "border-green-500/60 bg-green-500/15 text-green-400",
  Delayed: "border-red-500/60 bg-red-500/15 text-red-400",
  "In Progress": "border-amber-500/60 bg-amber-500/15 text-amber-400",
  Ready: "border-green-500/60 bg-green-500/15 text-green-400",
  Delivered: "border-border-dark bg-background text-text-secondary",
};

const DELAY_RISK = [
  { name: "Palazzo Set", color: "text-red-400", note: "5 days delayed" },
  { name: "Embroidered Dress", color: "text-amber-400", note: "at risk" },
];

const VENDOR_SCORES = [
  { name: "Jaipur Ethnic", score: 9.2, onTime: "99%" },
  { name: "Lucknow Chikan", score: 8.8, onTime: "97%" },
  { name: "Mumbai Fabric", score: 8.5, onTime: "95%" },
  { name: "Delhi Woven", score: 7.9, onTime: "88%" },
  { name: "Surat Fabric", score: 7.2, onTime: "82%" },
];

function StyleCardView({ style }: { style: StyleCard }) {
  return (
    <div className="mb-2 rounded-[8px] bg-card p-3" style={{ backgroundColor: "#101f3d" }}>
      <p className="text-[13px] font-bold text-white">{style.name}</p>
      <p className="text-[11px] text-text-secondary">{style.vendor}</p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border-dark">
        <div className="h-full rounded-full bg-primary" style={{ width: `${style.progress}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-text-secondary">{style.due}</span>
        <span
          className={`shrink-0 rounded-[20px] border px-2 py-0.5 text-[9px] font-semibold ${STATUS_STYLES[style.status]}`}
        >
          {style.status}
        </span>
      </div>
    </div>
  );
}

function KanbanBoard() {
  return (
    <div className="mt-4 flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
      {STAGES.map((stage) => {
        const cards = STYLES.filter((style) => style.stage === stage.id);
        return (
          <div key={stage.id} className="shrink-0 rounded-[10px] bg-background p-2" style={{ minWidth: 220 }}>
            <div className="flex items-center gap-2 px-1 py-2">
              <span className="text-[11px] font-bold tracking-wide text-primary">{stage.label}</span>
              <span className="rounded-[20px] bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {cards.length}
              </span>
            </div>
            {cards.map((style) => (
              <StyleCardView key={style.id} style={style} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ListView() {
  return (
    <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
      <div style={{ minWidth: 700 }}>
        <div className="grid grid-cols-6 gap-2 border-b border-border-dark bg-card px-4 py-3">
          {["Style", "Vendor", "Stage", "Progress", "Due", "Status"].map((col) => (
            <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              {col}
            </span>
          ))}
        </div>
        {STYLES.map((style, index) => (
          <div
            key={style.id}
            className={`grid grid-cols-6 items-center gap-2 border-b border-border-dark px-4 py-3 ${
              index % 2 === 0 ? "bg-card" : "bg-background"
            }`}
          >
            <span className="text-[13px] font-bold text-white">{style.name}</span>
            <span className="text-xs text-text-primary">{style.vendor}</span>
            <span className="text-xs text-text-secondary">{style.stage}</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
              <div className="h-full rounded-full bg-primary" style={{ width: `${style.progress}%` }} />
            </div>
            <span className="text-xs text-text-secondary">{style.due}</span>
            <span
              className={`w-fit rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[style.status]}`}
            >
              {style.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeasonSummaryPanel() {
  return (
    <>
      <p className="font-display text-base font-bold text-primary">Summer 2026</p>
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Total styles</span>
          <span className="font-bold text-text-primary">8</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">On track</span>
          <span className="font-bold text-green-400">5</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Delayed</span>
          <span className="font-bold text-red-400">1</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">At risk</span>
          <span className="font-bold text-amber-400">2</span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Budget Overview</p>
      <div className="mt-3 flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Total budget</span>
          <span className="font-semibold text-text-primary">₹12,40,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Spent</span>
          <span className="font-semibold text-primary">₹8,20,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Remaining</span>
          <span className="font-semibold text-text-secondary">₹4,20,000</span>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border-dark">
        <div className="h-full rounded-full bg-primary" style={{ width: "66%" }} />
      </div>
      <p className="mt-1.5 text-[11px] text-text-secondary">66% of budget used</p>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-amber-400">⚠ Delay risk</p>
      <div className="mt-3 flex flex-col gap-2">
        {DELAY_RISK.map((item) => (
          <div key={item.name} className="text-xs">
            <span className={`font-semibold ${item.color}`}>{item.name}</span>{" "}
            <span className="text-text-secondary">— {item.note}</span>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-white">Vendor scores</p>
      <div className="mt-3 flex flex-col gap-2">
        {VENDOR_SCORES.map((vendor) => (
          <div key={vendor.name} className="flex items-center justify-between text-xs">
            <span className="text-text-primary">{vendor.name}</span>
            <span className="text-text-secondary">
              <span className="font-semibold text-primary">{vendor.score}</span> · {vendor.onTime}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function BulkOrderKanban() {
  const authorized = useEnterpriseAccess();
  const [season, setSeason] = useState(SEASON_OPTIONS[0]);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  if (!authorized) return null;

  const headerRight = (
    <div className="flex items-center gap-3">
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
      <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        + New Order
      </button>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar title="All Orders" subtitle="Summer 2026 · 8 active styles" rightContent={headerRight} />

      <div className="px-6 py-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search styles..."
            className="min-w-[200px] flex-1 rounded-lg border border-border-dark bg-card px-3.5 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          {["All Vendors", "All Stages", "All Status"].map((label) => (
            <select key={label} defaultValue={label} className={SELECT_CLASS} style={SELECT_STYLE}>
              <option className="bg-card text-text-primary">{label}</option>
            </select>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              view === "kanban" ? "bg-primary text-navy" : "border border-border-dark text-text-secondary"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              view === "list" ? "bg-primary text-navy" : "border border-border-dark text-text-secondary"
            }`}
          >
            List
          </button>
        </div>

        {view === "kanban" ? <KanbanBoard /> : <ListView />}
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        left={<EnterpriseLeftPanel />}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}><SeasonSummaryPanel /></div>}
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
          <h1 className="font-display text-lg font-bold text-white">All Orders</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">Summer 2026 · 8 active styles</p>
          <div className="mt-3">{headerRight}</div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                view === "kanban" ? "bg-primary text-navy" : "border border-border-dark text-text-secondary"
              }`}
            >
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                view === "list" ? "bg-primary text-navy" : "border border-border-dark text-text-secondary"
              }`}
            >
              List
            </button>
          </div>

          {view === "kanban" ? <KanbanBoard /> : <ListView />}

          <div className="mt-8 rounded-xl border border-border-dark bg-card p-4">
            <SeasonSummaryPanel />
          </div>
        </div>
      </div>
    </>
  );
}
