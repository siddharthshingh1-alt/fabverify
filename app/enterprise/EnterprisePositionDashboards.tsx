"use client";

import Link from "next/link";
import TopBar from "../components/TopBar";

function rupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
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

// ─────────────────────────────────────────────────────────────
// CFO
// ─────────────────────────────────────────────────────────────

const BUDGET_BY_STYLE = [
  { style: "Block Print Kurta", budgeted: 120000, spent: 24000 },
  { style: "Palazzo Set", budgeted: 150000, spent: 160000 },
  { style: "Cotton T-shirt", budgeted: 180000, spent: 81000 },
  { style: "Linen Trouser", budgeted: 110000, spent: 88000 },
  { style: "Chikankari Kurti", budgeted: 130000, spent: 117000 },
];

export function CfoDashboard() {
  const quickActions = (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        Download Invoices
      </button>
      <button type="button" className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary">
        View All Payments
      </button>
      <button type="button" className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary">
        Export Finance Report
      </button>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar title="Finance Overview" subtitle="Payments, budgets and financial health" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value={rupees(1240000)} label="Total Budget" />
          <StatCard value={rupees(820000)} label="Spent" valueClass="text-primary" />
          <StatCard value={rupees(420000)} label="Remaining" valueClass="text-green-400" />
          <StatCard value={rupees(0)} label="Overdue Payments" valueClass="text-green-400" />
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Payment Status</h2>
          <div className="mt-4 flex flex-col gap-2 rounded-[10px] border border-border-dark bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">In Escrow</span>
              <span className="font-bold text-primary">{rupees(240000)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Released this month</span>
              <span className="font-bold text-green-400">{rupees(580000)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Pending approval</span>
              <span className="font-bold text-amber-400">{rupees(84000)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Budget by Style</h2>
          <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
            <div style={{ minWidth: 520 }}>
              <div className="grid grid-cols-4 gap-2 border-b border-border-dark bg-card px-4 py-3">
                {["Style", "Budgeted", "Spent", "Variance"].map((col) => (
                  <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                    {col}
                  </span>
                ))}
              </div>
              {BUDGET_BY_STYLE.map((row, index) => {
                const variance = row.budgeted - row.spent;
                const over = variance < 0;
                return (
                  <div
                    key={row.style}
                    className={`grid grid-cols-4 items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
                      index % 2 === 0 ? "bg-card" : "bg-background"
                    }`}
                  >
                    <span className="text-[13px] font-bold text-white">{row.style}</span>
                    <span className="text-xs text-text-primary">{rupees(row.budgeted)}</span>
                    <span className="text-xs text-text-primary">{rupees(row.spent)}</span>
                    <span className={`text-xs font-semibold ${over ? "text-red-400" : "text-green-400"}`}>
                      {over ? "-" : "+"}
                      {rupees(Math.abs(variance))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8">{quickActions}</div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">Budget Health</p>
      <p className="mt-2 font-display text-[32px] font-bold text-primary">
        84<span className="text-lg text-text-secondary">/100</span>
      </p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
        <p>4 of 5 styles under budget</p>
        <p>1 style over budget (Palazzo Set)</p>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">GST Summary</p>
      <p className="mt-2 text-xs text-text-secondary">Next filing: 20 July</p>
      <p className="mt-1 text-xs text-text-secondary">Liability this month: {rupees(147600)}</p>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Escrow Summary</p>
      <div className="mt-3 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">In Escrow</span>
          <span className="font-semibold text-primary">{rupees(240000)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Released</span>
          <span className="font-semibold text-green-400">{rupees(580000)}</span>
        </div>
      </div>
    </>
  );

  return { centrePanel, rightPanel };
}

// ─────────────────────────────────────────────────────────────
// Head of Operations (also used for "Other")
// ─────────────────────────────────────────────────────────────

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
    <span className={`w-fit rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

const ALL_ORDERS: { style: string; vendor: string; stage: string; due: string; status: Status }[] = [
  { style: "Block Print Kurta", vendor: "Jaipur Ethnic Works", stage: "Sampling", due: "Aug 1", status: "On Track" },
  { style: "Silk Blouse", vendor: "Mumbai Fabric House", stage: "Sampling", due: "Aug 5", status: "On Track" },
  { style: "Palazzo Set", vendor: "Delhi Woven Works", stage: "Production", due: "Jul 20", status: "Delayed" },
  { style: "Cotton T-shirt", vendor: "Surat Fabric Co", stage: "Production", due: "Jul 25", status: "On Track" },
  { style: "Linen Trouser", vendor: "Ahmedabad Mill", stage: "Production", due: "Jul 18", status: "On Track" },
  { style: "Chikankari Kurti", vendor: "Lucknow Chikan", stage: "QC", due: "Jul 16", status: "In Progress" },
  { style: "Embroidered Dress", vendor: "Jaipur Ethnic Works", stage: "Dispatch", due: "Jul 14", status: "Ready" },
  { style: "Summer Coord Set", vendor: "Mumbai Fabric House", stage: "Delivered", due: "Jul 10", status: "Delivered" },
];

export function HeadOfOperationsDashboard() {
  const quickActions = (
    <div className="flex flex-wrap gap-3">
      <Link href="/enterprise/orders" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        View All Orders
      </Link>
      <Link
        href="/enterprise/vendors"
        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
      >
        Vendor Master
      </Link>
      <Link
        href="/fabmerch"
        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
      >
        Book QC Inspector
      </Link>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar title="Operations Overview" subtitle="All orders, vendors and production status" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value="8" label="Active Orders" />
          <StatCard value="1" label="Delayed" valueClass="text-red-400" />
          <StatCard value="2" label="Dispatching this week" valueClass="text-primary" />
          <StatCard value="1" label="Vendor issues" valueClass="text-amber-400" />
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">All Orders</h2>
          <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
            <div style={{ minWidth: 560 }}>
              <div className="grid grid-cols-5 gap-2 border-b border-border-dark bg-card px-4 py-3">
                {["Style", "Vendor", "Stage", "Due", "Status"].map((col) => (
                  <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                    {col}
                  </span>
                ))}
              </div>
              {ALL_ORDERS.map((row, index) => (
                <div
                  key={row.style}
                  className={`grid grid-cols-5 items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
                    index % 2 === 0 ? "bg-card" : "bg-background"
                  }`}
                >
                  <span className="text-[13px] font-bold text-white">{row.style}</span>
                  <span className="text-xs text-text-primary">{row.vendor}</span>
                  <span className="text-xs text-text-secondary">{row.stage}</span>
                  <span className="text-xs text-text-secondary">{row.due}</span>
                  <StatusPill status={row.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Vendor Alerts</h2>
          <div className="mt-4 rounded-[8px] border p-4" style={{ borderColor: "#f59e0b" }}>
            <p className="text-sm font-bold text-text-primary">Delhi Woven Works — underperforming</p>
            <p className="mt-1 text-xs text-text-secondary">
              Palazzo Set delayed 5 days · on-time rate down to 88%
            </p>
            <Link href="/enterprise/vendors" className="mt-2 inline-block text-xs font-semibold text-amber-400">
              View Vendor →
            </Link>
          </div>
        </div>

        <div className="mt-8">{quickActions}</div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">Vendor Performance</p>
      <div className="mt-3 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-primary">Jaipur Ethnic Works</span>
          <span className="text-text-secondary">
            <span className="font-semibold text-primary">9.2</span> · 99%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-primary">Lucknow Chikan</span>
          <span className="text-text-secondary">
            <span className="font-semibold text-primary">8.8</span> · 97%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-primary">Delhi Woven Works</span>
          <span className="text-text-secondary">
            <span className="font-semibold text-primary">7.9</span> · 88%
          </span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">This Week</p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
        <p>2 styles dispatching</p>
        <p>1 vendor needs follow-up</p>
        <p>3 sample approvals pending</p>
      </div>
    </>
  );

  return { centrePanel, rightPanel };
}

// ─────────────────────────────────────────────────────────────
// Head of Merchandising / Buying Head
// ─────────────────────────────────────────────────────────────

const SAMPLE_STATUS = [
  { style: "Block Print Kurta", vendor: "Jaipur Ethnic Works", note: "Sample #2 awaiting your approval", waiting: 2 },
  { style: "Silk Blouse", vendor: "Mumbai Fabric House", note: "Fit sample ready for review", waiting: 1 },
  { style: "Chikankari Kurti", vendor: "Lucknow Chikan", note: "Colour approval needed", waiting: 3 },
];

const PRODUCTION_PROGRESS = [
  { style: "Block Print Kurta", stage: "Sampling", progress: 20 },
  { style: "Silk Blouse", stage: "Sampling", progress: 15 },
  { style: "Palazzo Set", stage: "Production", progress: 60 },
  { style: "Cotton T-shirt", stage: "Production", progress: 45 },
  { style: "Linen Trouser", stage: "Production", progress: 80 },
  { style: "Chikankari Kurti", stage: "QC", progress: 90 },
  { style: "Embroidered Dress", stage: "Dispatch", progress: 100 },
  { style: "Summer Coord Set", stage: "Delivered", progress: 100 },
];

export function MerchandisingDashboard() {
  const quickActions = (
    <div className="flex flex-wrap gap-3">
      <Link href="/samples" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        Post Sample Brief
      </Link>
      <Link
        href="/manufacturers"
        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
      >
        Find Manufacturer
      </Link>
      <Link href="/fabmerch" className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary">
        Book QC Inspector
      </Link>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar title="Merchandising Dashboard" subtitle="Styles, samples and production tracking" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value="8" label="Active Styles" />
          <StatCard value="3" label="Samples Pending" valueClass="text-amber-400" />
          <StatCard value="4" label="In Production" />
          <StatCard value="2" label="Approvals Needed" valueClass="text-primary" />
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Sample Status</h2>
          <div className="mt-4 flex flex-col gap-2">
            {SAMPLE_STATUS.map((sample) => (
              <div key={sample.style} className="rounded-[8px] border border-border-dark bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">{sample.style}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{sample.vendor}</p>
                    <p className="mt-1 text-xs text-text-primary">{sample.note}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-amber-400">
                    Waiting {sample.waiting} day{sample.waiting > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Production Progress</h2>
          <div className="mt-4 flex flex-col gap-3 rounded-[10px] border border-border-dark bg-card p-4">
            {PRODUCTION_PROGRESS.map((item) => (
              <div key={item.style}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-primary">{item.style}</span>
                  <span className="text-text-secondary">
                    {item.stage} · {item.progress}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">{quickActions}</div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">This Week</p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
        <p>3 samples awaiting your approval</p>
        <p>2 styles moving to production</p>
        <p>1 style dispatching Friday</p>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Upcoming Deadlines</p>
      <div className="mt-3 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-primary">Palazzo Set</span>
          <span className="text-red-400">Jul 20</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-primary">Linen Trouser</span>
          <span className="text-text-secondary">Jul 18</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-primary">Chikankari Kurti</span>
          <span className="text-text-secondary">Jul 16</span>
        </div>
      </div>
    </>
  );

  return { centrePanel, rightPanel };
}

// ─────────────────────────────────────────────────────────────
// IT Head
// ─────────────────────────────────────────────────────────────

const ACCESS_LOG = [
  { name: "Siddharth Singh", time: "2 hours ago", device: "Chrome on Windows" },
  { name: "Siddharth Singh", time: "Yesterday", device: "Safari on iPhone" },
  { name: "Rahul Sharma", time: "3 days ago", device: "Chrome on Mac" },
  { name: "Siddharth Singh", time: "5 days ago", device: "Chrome on Windows" },
  { name: "Siddharth Singh", time: "1 week ago", device: "Firefox on Windows" },
];

export function ItHeadDashboard() {
  const quickActions = (
    <div className="flex flex-wrap gap-3">
      <Link href="/enterprise/team" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy">
        Manage Team Access
      </Link>
      <button type="button" className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary">
        Configure ERP
      </button>
      <button type="button" className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary">
        Download Audit Log
      </button>
    </div>
  );

  const centrePanel = (
    <>
      <TopBar title="IT & Integrations" subtitle="Platform settings, team access and integrations" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value="4" label="Team Members" />
          <StatCard value="2" label="Active Sessions" valueClass="text-green-400" />
          <StatCard value="0" label="API Integrations" valueClass="text-amber-400" />
          <StatCard value="2.4 GB" label="Storage Used" />
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Integration Status</h2>
          <div className="mt-4 flex items-center justify-between rounded-[8px] border border-border-dark bg-card p-4">
            <div>
              <p className="text-sm font-bold text-text-primary">ERP</p>
              <p className="mt-0.5 text-xs font-semibold text-amber-400">Not connected</p>
            </div>
            <button type="button" className="text-sm font-semibold text-primary">
              Connect SAP →
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Team Access Log</h2>
          <div className="mt-4 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
            <div style={{ minWidth: 460 }}>
              <div className="grid grid-cols-3 gap-2 border-b border-border-dark bg-card px-4 py-3">
                {["Member", "Time", "Device"].map((col) => (
                  <span key={col} className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                    {col}
                  </span>
                ))}
              </div>
              {ACCESS_LOG.map((entry, index) => (
                <div
                  key={`${entry.name}-${entry.time}`}
                  className={`grid grid-cols-3 items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
                    index % 2 === 0 ? "bg-card" : "bg-background"
                  }`}
                >
                  <span className="text-[13px] font-bold text-white">{entry.name}</span>
                  <span className="text-xs text-text-secondary">{entry.time}</span>
                  <span className="text-xs text-text-secondary">{entry.device}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">Security</h2>
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-green-400">✅ All sessions active</p>
            <p className="text-xs font-semibold text-red-400">🔴 Last security audit: Never</p>
          </div>
        </div>

        <div className="mt-8">{quickActions}</div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-sm font-bold text-white">System Status</p>
      <div className="mt-3 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Platform uptime</span>
          <span className="font-semibold text-green-400">99.98%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Last backup</span>
          <span className="font-semibold text-text-primary">Today, 3:00 AM</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Storage limit</span>
          <span className="font-semibold text-text-primary">10 GB</span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Need Help?</p>
      <p className="mt-2 text-xs text-text-secondary">
        Contact FabVerify technical support for integration setup
      </p>
      <button type="button" className="mt-3 w-full rounded-lg border border-primary py-2.5 text-xs font-semibold text-primary">
        Contact Support →
      </button>
    </>
  );

  return { centrePanel, rightPanel };
}
