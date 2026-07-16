"use client";

import Link from "next/link";
import ThreePanelLayout from "../components/ThreePanelLayout";
import TopBar from "../components/TopBar";
import { useUser } from "../context/UserContext";
import { getActiveHiresCount } from "../data/hires";

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

function StatCard({
  value,
  label,
  valueClass = "text-white",
}: {
  value: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[8px] border border-border-dark bg-card p-4">
      <p className={`font-display text-[26px] font-bold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}

function rupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

// ─────────────────────────────────────────────────────────────
// MD / CEO
// ─────────────────────────────────────────────────────────────

type Alert = { title: string; detail: string; action: string; href: string; color: string };

const MD_ALERTS: Alert[] = [
  {
    title: "Palazzo Set delayed 5 days",
    detail: "Delhi Woven Works · Expected Jul 15",
    action: "Contact Vendor →",
    href: "/orders",
    color: "#f87171",
  },
  {
    title: "Budget exceeded on Block Print Kurta by ₹5,000",
    detail: "₹85,000 spent vs ₹80,000 budget",
    action: "View Details →",
    href: "/enterprise/analytics",
    color: "#f59e0b",
  },
  {
    title: "2 sample approvals waiting for 3 days",
    detail: "Jaipur Ethnic Works",
    action: "Review Now →",
    href: "/orders",
    color: "#63B3ED",
  },
];

const SEASON_TABLE = [
  { name: "Block Print Kurta", vendor: "Jaipur Ethnic Works", stage: "Production", status: "On Track" as Status, due: "Jul 15" },
  { name: "Palazzo Set", vendor: "Delhi Woven Works", stage: "Production", status: "Delayed" as Status, due: "Jul 20" },
  { name: "Cotton T-shirt", vendor: "Surat Fabric Co", stage: "QC", status: "On Track" as Status, due: "Jul 25" },
  { name: "Linen Trouser", vendor: "Ahmedabad Mill", stage: "Production", status: "On Track" as Status, due: "Jul 18" },
  { name: "Chikankari Kurti", vendor: "Lucknow Chikan", stage: "Sampling", status: "On Track" as Status, due: "Aug 5" },
];

const SEASON_HEALTH_ROWS = [
  { dot: "🟢", label: "Timeline: 75% on track" },
  { dot: "🟡", label: "Budget: 66% used" },
  { dot: "🟢", label: "Quality: No disputes" },
  { dot: "🟡", label: "Vendors: 1 underperforming" },
];

export function MdCeoDashboard() {
  const { user, greeting } = useUser();
  const activeHiresCount = getActiveHiresCount();

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is what needs your attention today"
      />

      <div className="px-6 py-6">
        <h2 className="font-display text-lg font-bold text-primary">⚠ Needs Your Attention</h2>

        {MD_ALERTS.length === 0 ? (
          <div className="mt-4 rounded-[8px] border border-green-500/40 bg-green-500/10 p-4">
            <p className="text-sm font-bold text-green-400">
              ✅ All clear today. Everything is on track.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {MD_ALERTS.map((alert) => (
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
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value="72/100" label="Season Health" valueClass="text-primary" />
          <StatCard value="87%" label="On-Time Delivery" />
          <StatCard value="66%" label="Budget Used" valueClass="text-amber-400" />
          <StatCard value="12" label="Active Vendors" />
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Season Overview</h2>
          <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
            <div style={{ minWidth: 560 }}>
              <div className="grid grid-cols-5 gap-2 border-b border-border-dark bg-card px-4 py-3">
                {["Style", "Vendor", "Stage", "Status", "Due Date"].map((col) => (
                  <span
                    key={col}
                    className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
                  >
                    {col}
                  </span>
                ))}
              </div>
              {SEASON_TABLE.map((row, index) => (
                <div
                  key={row.name}
                  className={`grid grid-cols-5 items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
                    index % 2 === 0 ? "bg-card" : "bg-background"
                  }`}
                >
                  <span className="text-[13px] font-bold text-white">{row.name}</span>
                  <span className="text-xs text-text-primary">{row.vendor}</span>
                  <span className="text-xs text-text-secondary">{row.stage}</span>
                  <StatusPill status={row.status} />
                  <span className="text-xs text-text-secondary">{row.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/enterprise/analytics"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-navy"
          >
            📊 Full Season Report
          </Link>
          <Link
            href="/enterprise/team"
            className="rounded-lg border border-primary px-5 py-2.5 text-sm font-bold text-primary"
          >
            👥 View Team Activity
          </Link>
          <Link
            href="/fabmerch"
            className="rounded-lg border border-primary px-5 py-2.5 text-sm font-bold text-primary"
          >
            {activeHiresCount > 0
              ? `👔 My Hires (${activeHiresCount} active)`
              : "Hire Merchandiser →"}
          </Link>
        </div>
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
        {SEASON_HEALTH_ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{row.dot}</span>
            <span>{row.label}</span>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">This Week</p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
        <p>2 samples awaiting your sign-off</p>
        <p>1 style dispatching Friday</p>
        <p>1 vendor payment due Thursday</p>
      </div>
    </>
  );

  return (
    <ThreePanelLayout centre={centrePanel} right={<div style={{ padding: "20px" }}>{rightPanel}</div>} />
  );
}

// ─────────────────────────────────────────────────────────────
// Head of Operations
// ─────────────────────────────────────────────────────────────

const ALL_ORDERS = [
  { name: "Block Print Kurta", vendor: "Jaipur Ethnic Works", stage: "Sampling", status: "On Track" as Status },
  { name: "Silk Blouse", vendor: "Mumbai Fabric House", stage: "Sampling", status: "On Track" as Status },
  { name: "Palazzo Set", vendor: "Delhi Woven Works", stage: "Production", status: "Delayed" as Status },
  { name: "Cotton T-shirt", vendor: "Surat Fabric Co", stage: "Production", status: "On Track" as Status },
  { name: "Linen Trouser", vendor: "Ahmedabad Mill", stage: "Production", status: "On Track" as Status },
  { name: "Chikankari Kurti", vendor: "Lucknow Chikan", stage: "QC", status: "In Progress" as Status },
  { name: "Embroidered Dress", vendor: "Jaipur Ethnic Works", stage: "Dispatch", status: "Ready" as Status },
  { name: "Summer Coord Set", vendor: "Mumbai Fabric House", stage: "Delivered", status: "Delivered" as Status },
];

const VENDOR_SCORES = [
  { name: "Jaipur Ethnic Works", score: 9.2, onTime: "99%" },
  { name: "Lucknow Chikan", score: 8.8, onTime: "97%" },
  { name: "Mumbai Fabric House", score: 8.5, onTime: "95%" },
  { name: "Delhi Woven Works", score: 7.9, onTime: "88%" },
  { name: "Surat Fabric Co", score: 7.2, onTime: "82%" },
];

export function HeadOfOperationsDashboard() {
  const centrePanel = (
    <>
      <TopBar title="Operations Overview" subtitle="Orders, vendors, and delivery status" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value="8" label="Active Orders" />
          <StatCard value="1" label="Delayed" valueClass="text-red-400" />
          <StatCard value="3" label="This Week Dispatches" valueClass="text-primary" />
          <StatCard value="2" label="Vendor Issues" valueClass="text-amber-400" />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">All Orders</h2>
            <Link href="/orders" className="text-xs font-semibold text-primary">
              View All Orders →
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
            <div style={{ minWidth: 520 }}>
              <div className="grid grid-cols-4 gap-2 border-b border-border-dark bg-card px-4 py-3">
                {["Style", "Vendor", "Stage", "Status"].map((col) => (
                  <span
                    key={col}
                    className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
                  >
                    {col}
                  </span>
                ))}
              </div>
              {ALL_ORDERS.map((row, index) => (
                <div
                  key={row.name}
                  className={`grid grid-cols-4 items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
                    index % 2 === 0 ? "bg-card" : "bg-background"
                  }`}
                >
                  <span className="text-[13px] font-bold text-white">{row.name}</span>
                  <span className="text-xs text-text-primary">{row.vendor}</span>
                  <span className="text-xs text-text-secondary">{row.stage}</span>
                  <StatusPill status={row.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">Vendor Performance</p>
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

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Quick Actions</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href="/orders"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          📦 All Orders
        </Link>
        <Link
          href="/enterprise/vendors"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          🏭 Vendor Master
        </Link>
      </div>
    </>
  );

  return (
    <ThreePanelLayout centre={centrePanel} right={<div style={{ padding: "20px" }}>{rightPanel}</div>} />
  );
}

// ─────────────────────────────────────────────────────────────
// Merchandiser
// ─────────────────────────────────────────────────────────────

const MY_BRIEFS = [
  { title: "Block Print Kurta — Sample Request", detail: "3 vendors responded", status: "Awaiting Review" },
  { title: "Linen Trouser — Fabric Sourcing", detail: "2 vendors responded", status: "Awaiting Review" },
];

const MY_ORDERS = [
  { name: "Palazzo Set", vendor: "Delhi Woven Works", stage: "Production", status: "Delayed" as Status },
  { name: "Cotton T-shirt", vendor: "Surat Fabric Co", stage: "Production", status: "On Track" as Status },
  { name: "Chikankari Kurti", vendor: "Lucknow Chikan", stage: "QC", status: "In Progress" as Status },
];

const TA_ALERTS = [
  { style: "Palazzo Set", milestone: "Raw material dispatch", due: "Due tomorrow" },
  { style: "Cotton T-shirt", milestone: "QC sign-off", due: "Due Friday" },
  { style: "Chikankari Kurti", milestone: "Sample approval", due: "Due Monday" },
];

export function MerchandiserDashboard() {
  const quickActions = (
    <div className="flex gap-3">
      <Link href="/samples" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        + Post Sample Brief
      </Link>
      <Link
        href="/manufacturers"
        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
      >
        Find Manufacturer
      </Link>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar
        title="My Active Briefs & Orders"
        subtitle="Everything you're managing right now"
        rightContent={quickActions}
      />

      <div className="px-6 py-6">
        <h2 className="text-base font-bold text-white">My Active Briefs</h2>
        <div className="mt-4 flex flex-col gap-2">
          {MY_BRIEFS.map((brief) => (
            <div key={brief.title} className="rounded-[8px] border border-border-dark bg-card p-4">
              <p className="text-sm font-bold text-white">{brief.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-text-secondary">{brief.detail}</p>
                <span className="text-[11px] font-semibold text-amber-400">{brief.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">My Orders</h2>
            <Link href="/orders" className="text-xs font-semibold text-primary">
              View all →
            </Link>
          </div>
          <div className="mt-4 flex flex-col">
            {MY_ORDERS.map((order) => (
              <div
                key={order.name}
                className="flex items-center justify-between border-b border-border-dark py-3 last:border-b-0"
              >
                <div>
                  <p className="text-[13px] font-bold text-white">{order.name}</p>
                  <p className="text-[11px] text-text-secondary">
                    {order.vendor} · {order.stage}
                  </p>
                </div>
                <StatusPill status={order.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">T&amp;A Alerts</p>
      <p className="mt-1 text-[11px] text-text-secondary">Milestones due this week</p>
      <div className="mt-3 flex flex-col gap-3">
        {TA_ALERTS.map((alert) => (
          <div key={alert.milestone} className="rounded-[8px] border border-border-dark bg-background p-3">
            <p className="text-xs font-bold text-text-primary">{alert.style}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">{alert.milestone}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-amber-400">{alert.due}</p>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <ThreePanelLayout centre={centrePanel} right={<div style={{ padding: "20px" }}>{rightPanel}</div>} />
  );
}

// ─────────────────────────────────────────────────────────────
// Designer
// ─────────────────────────────────────────────────────────────

const PENDING_APPROVALS = [
  { style: "Palazzo Set", note: "Tech pack v2 awaiting merchandiser feedback", daysWaiting: 2 },
  { style: "Silk Blouse", note: "Fit sample photos awaiting sign-off", daysWaiting: 1 },
];

const ACTIVE_STYLES = [
  { name: "Block Print Kurta", stage: "Sampling", due: "Aug 1" },
  { name: "Silk Blouse", stage: "Sampling", due: "Aug 5" },
  { name: "Linen Trouser", stage: "Production", due: "Jul 18" },
];

export function DesignerDashboard() {
  const quickActions = (
    <div className="flex gap-3">
      <Link href="/samples" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        + Upload Tech Pack
      </Link>
      <Link
        href="/orders"
        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
      >
        View Sample Feedback
      </Link>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar
        title="Design &amp; Development"
        subtitle="Your styles, tech packs, and approvals"
        rightContent={quickActions}
      />

      <div className="px-6 py-6">
        <h2 className="text-base font-bold text-white">Pending Approvals</h2>
        <div className="mt-4 flex flex-col gap-2">
          {PENDING_APPROVALS.map((item) => (
            <div key={item.style} className="rounded-[8px] border border-border-dark bg-card p-4">
              <p className="text-sm font-bold text-white">{item.style}</p>
              <p className="mt-1 text-xs text-text-secondary">{item.note}</p>
              <p className="mt-1 text-[11px] font-semibold text-amber-400">
                Waiting {item.daysWaiting} day{item.daysWaiting > 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Active Styles in Development</h2>
          <div className="mt-4 flex flex-col">
            {ACTIVE_STYLES.map((style) => (
              <div
                key={style.name}
                className="flex items-center justify-between border-b border-border-dark py-3 last:border-b-0"
              >
                <p className="text-[13px] font-bold text-white">{style.name}</p>
                <span className="text-xs text-text-secondary">{style.stage}</span>
                <span className="text-xs text-text-secondary">Due {style.due}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">This Week</p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
        <p>3 styles in active development</p>
        <p>2 tech packs pending feedback</p>
        <p>1 fit sample review scheduled</p>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Shortcuts</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link
          href="/manufacturers"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          🔍 Find Manufacturers
        </Link>
        <Link
          href="/fabmerch"
          className="w-full rounded-lg border border-primary py-2.5 text-center text-xs font-semibold text-primary"
        >
          🎨 FabMerch
        </Link>
      </div>
    </>
  );

  return (
    <ThreePanelLayout centre={centrePanel} right={<div style={{ padding: "20px" }}>{rightPanel}</div>} />
  );
}

// ─────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────

const RECENT_TRANSACTIONS = [
  { vendor: "Jaipur Ethnic Works", style: "Block Print Kurta", amount: 96000, date: "Jul 10", status: "Released" as const },
  { vendor: "Delhi Woven Works", style: "Palazzo Set", amount: 68000, date: "Jul 8", status: "Released" as const },
  { vendor: "Surat Fabric Co", style: "Cotton T-shirt", amount: 76000, date: "Jul 5", status: "Released" as const },
  { vendor: "Lucknow Chikan", style: "Chikankari Kurti", amount: 44000, date: "Jul 2", status: "Pending" as const },
  { vendor: "Mumbai Fabric House", style: "Silk Blouse", amount: 48000, date: "Jun 28", status: "Pending" as const },
];

const BUDGET_VS_ACTUAL = [
  { style: "Block Print Kurta", budgeted: 120000, spent: 120000 },
  { style: "Palazzo Set", budgeted: 80000, spent: 85000 },
  { style: "Cotton T-shirt", budgeted: 100000, spent: 95000 },
  { style: "Linen Trouser", budgeted: 60000, spent: 45000 },
];

export function AccountsDashboard() {
  const quickActions = (
    <div className="flex gap-3">
      <Link href="/orders" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        View Pending Payments
      </Link>
      <Link
        href="/analytics"
        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
      >
        Download Invoices
      </Link>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar
        title="Payments &amp; Finance"
        subtitle="Escrow, budgets, and transaction history"
        rightContent={quickActions}
      />

      <div className="px-6 py-6">
        <h2 className="text-base font-bold text-white">Payment Summary</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard value={rupees(340000)} label="Escrow Held" valueClass="text-primary" />
          <StatCard value={rupees(96000)} label="Due This Week" />
          <StatCard value={rupees(0)} label="Overdue" valueClass="text-green-400" />
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Budget vs Actual</h2>
          <div className="mt-4 flex flex-col gap-4 rounded-[10px] border border-border-dark bg-card p-4">
            {BUDGET_VS_ACTUAL.map((item) => {
              const over = item.spent > item.budgeted;
              const percent = Math.min(100, (item.spent / item.budgeted) * 100);
              return (
                <div key={item.style}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-primary">{item.style}</span>
                    <span className={over ? "font-semibold text-red-400" : "text-text-secondary"}>
                      {rupees(item.spent)} / {rupees(item.budgeted)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: over ? "#f87171" : "#f2ca50" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">Recent Transactions</p>
      <div className="mt-3 flex flex-col gap-3">
        {RECENT_TRANSACTIONS.map((tx) => (
          <div key={`${tx.vendor}-${tx.style}`} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">{tx.vendor}</span>
              <span
                className={tx.status === "Released" ? "text-green-400" : "text-text-secondary"}
              >
                {tx.status}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-text-secondary">
              <span>{tx.style}</span>
              <span className="font-semibold text-primary">{rupees(tx.amount)}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-text-secondary">{tx.date}</p>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <ThreePanelLayout centre={centrePanel} right={<div style={{ padding: "20px" }}>{rightPanel}</div>} />
  );
}
