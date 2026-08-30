"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";
import {
  CfoDashboard,
  HeadOfOperationsDashboard,
  MerchandisingDashboard,
  ItHeadDashboard,
} from "../EnterprisePositionDashboards";
import type { EnterprisePosition } from "../../context/UserContext";

const SEASON_OPTIONS = ["Summer 2026", "Monsoon 2025", "Winter 2025"];

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

const STAT_CARDS = [
  { value: "8", valueClass: "text-white", label: "Active Styles", note: "↑ 2 added this week", noteClass: "text-green-400" },
  { value: "3", valueClass: "text-red-400", label: "Delayed Styles", note: "⚠ Need attention", noteClass: "text-red-400" },
  { value: "₹8,20,000", valueClass: "text-primary", label: "Spent this season", note: "66% of budget", noteClass: "text-text-secondary" },
  { value: "12", valueClass: "text-white", label: "Active Vendors", note: "2 pending verification", noteClass: "text-amber-400" },
];

type Alert = {
  title: string;
  detail: string;
  action: string;
  color: string;
  href: string;
};

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

type OrderRow = {
  style: string;
  vendor: string;
  progress: number;
  stage: string;
  status: "On Track" | "Delayed";
};

const ORDERS: OrderRow[] = [
  { style: "Palazzo Set", vendor: "Delhi Woven Works", progress: 45, stage: "Production", status: "Delayed" },
  { style: "Block Print Kurta", vendor: "Jaipur Ethnic Works", progress: 20, stage: "Sampling", status: "On Track" },
  { style: "Cotton T-shirt", vendor: "Surat Fabric Co", progress: 45, stage: "Production", status: "On Track" },
];

const HEALTH_ROWS = [
  { dot: "🟢", label: "Timeline: 75% on track" },
  { dot: "🟡", label: "Budget: 66% used" },
  { dot: "🟢", label: "Quality: No disputes" },
  { dot: "🟡", label: "Vendors: 1 underperforming" },
];

function useEnterpriseGreeting() {
  const [companyName, setCompanyName] = useState("Your Company");
  const [greeting, setGreeting] = useState("Good morning");
  const [dateLabel, setDateLabel] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setGreeting(
      hour >= 5 && hour < 12
        ? "Good morning"
        : hour >= 12 && hour < 17
          ? "Good afternoon"
          : hour >= 17 && hour < 21
            ? "Good evening"
            : "Good night"
    );
    setDateLabel(
      new Date()
        .toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .replace(",", "")
    );
    try {
      const stored = localStorage.getItem("fabverify_enterprise");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.companyName) setCompanyName(parsed.companyName);
      }
    } catch {}
  }, []);

  return { companyName, greeting, dateLabel, mounted };
}

function useEnterprisePosition() {
  const [position, setPosition] = useState<EnterprisePosition | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fabverify_enterprise_position");
      if (stored) setPosition(stored as EnterprisePosition);
    } catch {}
  }, []);

  return position;
}

function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_CARDS.map((card) => (
        <div key={card.label} className="rounded-[8px] border border-border-dark bg-card p-4">
          <p className={`font-display text-[28px] font-bold ${card.valueClass}`}>{card.value}</p>
          <p className="mt-1 text-xs text-text-secondary">{card.label}</p>
          <p className={`mt-2 text-[11px] ${card.noteClass}`}>{card.note}</p>
        </div>
      ))}
    </div>
  );
}

function AlertsSection() {
  return (
    <div className="mt-8">
      <h2 className="font-display text-base font-bold text-white">⚠ Needs Your Attention Today</h2>
      <p className="mt-1 text-[13px] text-text-secondary">3 items need a decision</p>

      <div className="mt-4 flex flex-col gap-2">
        {ALERTS.map((alert) => (
          <div
            key={alert.title}
            className="rounded-[8px] bg-card p-4"
            style={{ borderLeft: `3px solid ${alert.color}` }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{alert.title}</p>
                <p className="mt-1 text-xs text-text-secondary">{alert.detail}</p>
              </div>
              <Link href={alert.href} className="shrink-0 text-xs font-semibold text-primary">
                {alert.action}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveOrdersSection() {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Active Orders</h2>
        <Link href="/enterprise/orders" className="text-xs font-semibold text-primary">
          View all →
        </Link>
      </div>

      <div className="mt-3">
        {ORDERS.map((order) => (
          <div
            key={order.style}
            className="flex flex-col gap-2 border-b border-border-dark py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="sm:w-40 sm:shrink-0">
              <p className="text-[13px] font-bold text-white">{order.style}</p>
              <p className="text-[11px] text-text-secondary">{order.vendor}</p>
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
                <div className="h-full rounded-full bg-primary" style={{ width: `${order.progress}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                {order.stage} · {order.progress}%
              </p>
            </div>
            <span
              className={`w-fit shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${
                order.status === "On Track"
                  ? "border-green-500/60 bg-green-500/15 text-green-400"
                  : "border-red-500/60 bg-red-500/15 text-red-400"
              }`}
            >
              {order.status}
            </span>
          </div>
        ))}
        <Link href="/enterprise/orders" className="mt-3 inline-block text-xs font-semibold text-primary">
          View all 8 orders →
        </Link>
      </div>
    </div>
  );
}

function RightPanelContent() {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">Your Team</p>
        <Link href="/enterprise/team" className="text-xs font-semibold text-primary">
          Add member +
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-navy">
          Y
        </div>
        <div>
          <p className="text-[13px] font-bold text-text-primary">You (MD)</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] text-text-secondary">Online</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[13px] italic text-text-secondary">Add your first team member</p>
      <Link href="/enterprise/team" className="mt-1 inline-block text-xs font-semibold text-primary">
        → Go to Team Management
      </Link>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Season Health</p>
      <p className="mt-2 font-display text-[36px] font-bold text-primary">
        72<span className="text-xl text-text-secondary">/100</span>
      </p>
      <p className="text-[11px] text-text-secondary">Season score</p>
      <div className="mt-3 flex flex-col gap-2">
        {HEALTH_ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{row.dot}</span>
            <span>{row.label}</span>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Quick Actions</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href="/enterprise/team"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          + Add Team Member
        </Link>
        <Link
          href="/enterprise/vendors"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          + Connect Vendor
        </Link>
        <Link
          href="/analytics"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          📊 View Season Report
        </Link>
        <Link
          href="/profile"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          ⚙ Settings
        </Link>
      </div>
    </>
  );
}

export default function EnterpriseDashboard() {
  const authorized = useEnterpriseAccess();
  const { companyName, greeting, dateLabel, mounted } = useEnterpriseGreeting();
  const [season, setSeason] = useState(SEASON_OPTIONS[0]);
  const enterprisePosition = useEnterprisePosition();

  if (!authorized) return null;

  const seasonDropdown = (
    <select
      value={season}
      onChange={(event) => setSeason(event.target.value)}
      className="appearance-none rounded-[6px] border border-primary bg-transparent py-1.5 pl-3 pr-7 text-xs font-semibold text-primary outline-none"
      style={{
        backgroundImage: SELECT_CHEVRON,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        backgroundSize: "12px",
      }}
    >
      {SEASON_OPTIONS.map((option) => (
        <option key={option} className="bg-card text-text-primary">
          {option}
        </option>
      ))}
    </select>
  );

  const mdCeoCentrePanel = (
    <>
      <TopBar
        title={`${mounted ? greeting : "Good morning"}, ${mounted ? companyName : "Your Company"} 👋`}
        subtitle={`Enterprise workspace · ${dateLabel}`}
        rightContent={seasonDropdown}
      />

      <div className="px-6 py-6">
        <StatCards />
        <AlertsSection />
        <ActiveOrdersSection />
      </div>
    </>
  );

  let centrePanel = mdCeoCentrePanel;
  let rightPanel = <RightPanelContent />;

  if (enterprisePosition === "cfo") {
    ({ centrePanel, rightPanel } = CfoDashboard());
  } else if (enterprisePosition === "head_operations" || enterprisePosition === "other") {
    ({ centrePanel, rightPanel } = HeadOfOperationsDashboard());
  } else if (enterprisePosition === "head_merchandising" || enterprisePosition === "buying_head") {
    ({ centrePanel, rightPanel } = MerchandisingDashboard());
  } else if (enterprisePosition === "it_head") {
    ({ centrePanel, rightPanel } = ItHeadDashboard());
  }
  // md_ceo (or no position saved yet) keeps the default MD/CEO dashboard above.

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
          <span className="rounded-[20px] border border-primary bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {mounted ? companyName : "Your Company"}
          </span>
        </div>

        <div className="flex-1">
          {centrePanel}
          <div className="px-4 pb-5">
            <div className="mt-4 rounded-xl border border-border-dark bg-card p-4">{rightPanel}</div>
          </div>
        </div>
      </div>
    </>
  );
}
