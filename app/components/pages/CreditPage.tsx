"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import TopBar from "../TopBar";
import { useUser } from "../../context/UserContext";
import type { UserType } from "../../context/UserContext";

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "🔍", label: "Discover", href: "/manufacturers" },
  { icon: "👔", label: "Merch", href: "/fabmerch" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

type TabId = "fabscore" | "products";

const TABS: { id: TabId; label: string }[] = [
  { id: "fabscore", label: "My FabScore" },
  { id: "products", label: "Credit Products" },
];

const TIERS = [
  { name: "Bronze", limit: "Cash only" },
  { name: "Silver", limit: "₹2L / 30 days" },
  { name: "Gold", limit: "₹10L / 60 days" },
  { name: "Platinum", limit: "₹50L+ / 90 days" },
];

const CURRENT_TIER_INDEX = 0;

const STAT_CARDS = [
  { label: "Credit Limit", value: "₹0", note: "Unlock with Silver tier" },
  { label: "Orders Completed", value: "0", note: "Place first order to start" },
  { label: "Repayment Rate", value: "—", note: "No credit history yet" },
];

const FACTORS = [
  {
    icon: "💳",
    label: "Payment History",
    weight: "35%",
    progress: 0,
    description: "No payment history yet",
  },
  {
    icon: "✅",
    label: "Order Completion Rate",
    weight: "25%",
    progress: 0,
    description: "Complete orders on time to improve this",
  },
  {
    icon: "🤝",
    label: "Dispute Rate",
    weight: "15%",
    progress: 100,
    description: "No disputes — excellent!",
  },
  {
    icon: "📊",
    label: "Platform Activity",
    weight: "10%",
    progress: 20,
    description: "Active on platform",
  },
  {
    icon: "🏅",
    label: "Verification Level",
    weight: "10%",
    progress: 33,
    description: "Bronze verified — upgrade to improve",
  },
  {
    icon: "🔗",
    label: "Network Strength",
    weight: "5%",
    progress: 0,
    description: "Build connections to improve",
  },
];

const IMPROVE_ITEMS = [
  {
    icon: "✅",
    title: "Complete verification",
    description: "Get Silver verified to unlock credit access",
    linkLabel: "Get Verified →",
    href: "/verification",
  },
  {
    icon: "📦",
    title: "Place your first order",
    description: "Every completed order improves your score",
    linkLabel: "Find Manufacturers →",
    href: "/manufacturers",
  },
  {
    icon: "💳",
    title: "Pay on time",
    description: "On-time payments are the biggest factor",
    linkLabel: null,
    href: null,
  },
  {
    icon: "🤝",
    title: "Build your network",
    description: "Connect with verified vendors and buyers",
    linkLabel: null,
    href: null,
  },
];

const MATERIAL_LIMITS = [
  { tier: "Bronze", limit: "₹0 — Not available" },
  { tier: "Silver", limit: "Up to ₹50,000 per order" },
  { tier: "Gold", limit: "Up to ₹2,00,000 per order" },
  { tier: "Platinum", limit: "Up to ₹10,00,000 per order" },
];

type ComparisonRow = {
  label: string;
  traditional: string;
  fabscore: string;
  icons?: boolean;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Based on", traditional: "Bank history", fabscore: "Trade behaviour" },
  { label: "New businesses", traditional: "Rejected", fabscore: "Welcomed", icons: true },
  { label: "Assessment time", traditional: "2-4 weeks", fabscore: "Instant" },
  { label: "Collateral", traditional: "Required", fabscore: "Not required", icons: true },
  { label: "Updates", traditional: "Yearly", fabscore: "After every order" },
];

type CreditProductId = "fabfloat" | "fabpaylater" | "fabmaterial";

const PRODUCT_VISIBILITY: Partial<Record<UserType, CreditProductId[]>> = {
  buyer: ["fabpaylater"],
  manufacturer: ["fabfloat", "fabmaterial"],
  fabric_mill: ["fabmaterial"],
  trim_supplier: ["fabmaterial"],
  artisan: [],
  job_worker: [],
};

const FAB_MATERIAL_COPY: Partial<Record<UserType, { audience: string; description: string }>> = {
  manufacturer: {
    audience: "For Manufacturers",
    description:
      "Source fabric and trims on credit from verified suppliers. Auto-paid from your order escrow on completion.",
  },
  fabric_mill: {
    audience: "For Suppliers",
    description:
      "Get working capital for raw materials on credit so you can fulfill fabric orders. Auto-paid from your order escrow on completion.",
  },
  trim_supplier: {
    audience: "For Suppliers",
    description:
      "Get working capital for raw materials on credit so you can fulfill trim orders. Auto-paid from your order escrow on completion.",
  },
};

const UNLOCK_ITEM_LABELS: Record<CreditProductId, string> = {
  fabfloat: "FabFloat — Get paid instantly",
  fabpaylater: "FabPay Later — Buy now pay later",
  fabmaterial: "FabMaterial — Material on credit",
};

const TIPS = [
  "Complete your first order to start building your FabScore",
  "Always pay on time — payment history is 35% of your score",
  "Higher verification tier = higher credit limit",
];

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SCORE_PROGRESS = 0;

function ScoreRing({ label, message }: { label: string; message: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#1C3050" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#f2ca50"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - SCORE_PROGRESS)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-4xl font-bold text-primary">—</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-text-secondary">{label}</p>
      <p className="mt-4 max-w-[140px] text-center text-xs text-text-secondary">
        {message}
      </p>
    </div>
  );
}

function TierProgress() {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {TIERS.map((tier, index) => (
          <div key={tier.name} className="flex flex-1 items-center last:flex-none">
            <div
              className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                index === CURRENT_TIER_INDEX
                  ? "border-primary bg-primary"
                  : "border-border-dark bg-transparent"
              }`}
            />
            {index < TIERS.length - 1 && (
              <div
                className={`h-[2px] flex-1 ${
                  index < CURRENT_TIER_INDEX ? "bg-primary" : "bg-border-dark"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex">
        {TIERS.map((tier, index) => (
          <div key={tier.name} className="flex-1 text-center">
            <p
              className={`text-xs font-semibold ${
                index === CURRENT_TIER_INDEX ? "text-primary" : "text-text-secondary"
              }`}
            >
              {tier.name}
            </p>
            <p className="mt-0.5 text-[10px] text-text-secondary">{tier.limit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SilverGateStatus() {
  return (
    <div className="mt-5 rounded-lg border border-border-dark bg-background p-4">
      <p className="text-sm font-semibold text-white">Available from Silver tier</p>
      <p className="mt-1.5 text-xs text-text-secondary">
        Your current tier: <span className="font-semibold text-[#CD7F32]">Bronze</span>
      </p>
      <p className="mt-0.5 text-xs text-text-secondary">Upgrade needed: Silver verification</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[#CD7F32]">🥉 Bronze</span>
        <div className="h-1.5 flex-1 rounded-full bg-border-dark">
          <div className="h-full w-[15%] rounded-full bg-primary" />
        </div>
        <span className="text-[11px] font-semibold text-text-secondary">🥈 Silver</span>
      </div>
      <Link
        href="/verification"
        className="mt-4 block w-full rounded-lg border border-primary py-2.5 text-center text-sm font-semibold text-primary"
      >
        Get Silver Verified →
      </Link>
    </div>
  );
}

function FabScoreTab() {
  return (
    <>
      <div className="rounded-xl border border-border-dark bg-card p-7">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col items-center justify-center">
            <ScoreRing
              label="FabScore"
              message="Complete your first order to unlock your FabScore"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-5">
            <span className="rounded-full border border-[#CD7F32] bg-[rgba(205,127,50,0.15)] px-5 py-2 font-display text-base font-bold text-[#CD7F32]">
              🥉 Bronze
            </span>
            <TierProgress />
          </div>

          <div className="flex flex-col gap-3">
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-border-dark bg-background p-3.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  {card.label}
                </p>
                <p className="mt-1 font-display text-[22px] font-bold text-primary">
                  {card.value}
                </p>
                <p className="mt-0.5 text-[11px] text-text-secondary">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-5">
        <h2 className="text-base font-bold text-white">How Your FabScore is Calculated</h2>
        <div className="mt-5 flex flex-col gap-5">
          {FACTORS.map((factor) => (
            <div key={factor.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <span>{factor.icon}</span>
                  {factor.label}
                </span>
                <span className="shrink-0 rounded-full border border-border-dark bg-background px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                  {factor.weight} weightage
                </span>
              </div>
              <div className="mt-2 h-[6px] w-full rounded-full bg-border-dark">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${factor.progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-text-secondary">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border-dark bg-card p-5" style={{ borderLeft: "3px solid #f2ca50" }}>
        <h2 className="text-[15px] font-bold text-white">💡 How to Improve Your FabScore</h2>
        <div className="mt-4 flex flex-col gap-4">
          {IMPROVE_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-lg">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="mt-1 inline-block text-xs font-semibold text-primary"
                  >
                    {item.linkLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-base font-bold text-white">Credit History</h2>
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
          <div className="text-5xl">📋</div>
          <p className="mt-4 text-[15px] text-text-primary">No credit history yet</p>
          <p className="mt-1 max-w-[320px] text-[13px] text-text-secondary">
            Your credit usage and repayments will appear here once you start using FabVerify
            credit products
          </p>
        </div>
      </div>
    </>
  );
}

function ProductCard({
  icon,
  name,
  audience,
  description,
  steps,
  children,
}: {
  icon: string;
  name: string;
  audience: string;
  description: string;
  steps: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-dark bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-white">
          {icon} {name}
        </h3>
        <span className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-text-secondary">
          {audience}
        </span>
      </div>

      <p className="mt-3 text-sm text-text-secondary">{description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <span key={step} className="flex items-center gap-2">
            <span className="rounded-full border border-border-dark bg-background px-3 py-1.5 text-xs text-text-secondary">
              {step}
            </span>
            {index < steps.length - 1 && (
              <span className="text-text-secondary">→</span>
            )}
          </span>
        ))}
      </div>

      {children}

      <SilverGateStatus />
    </div>
  );
}

function NoCreditProductsYet() {
  return (
    <div className="rounded-xl border border-border-dark bg-card p-8 text-center">
      <div className="text-4xl">🔒</div>
      <p className="mt-3 text-base font-bold text-white">
        Build your FabScore to unlock credit
      </p>
      <p className="mx-auto mt-2 max-w-[380px] text-[13px] text-text-secondary">
        Credit products unlock once you reach Silver verification tier.
      </p>
      <Link
        href="/verification"
        className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-navy"
      >
        Get Silver Verified →
      </Link>
    </div>
  );
}

function CreditProductsTab() {
  const { user } = useUser();
  const visibleProducts = PRODUCT_VISIBILITY[user.userType] ?? [];
  const showFabFloat = visibleProducts.includes("fabfloat");
  const showFabPayLater = visibleProducts.includes("fabpaylater");
  const showFabMaterial = visibleProducts.includes("fabmaterial");
  const fabMaterialCopy = FAB_MATERIAL_COPY[user.userType] ?? FAB_MATERIAL_COPY.manufacturer!;

  if (visibleProducts.length === 0) {
    return <NoCreditProductsYet />;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {showFabFloat && (
          <ProductCard
            icon="⚡"
            name="FabFloat"
            audience="For Manufacturers"
            description="Get paid immediately when your order is confirmed. No more waiting 30-60 days for payment."
            steps={["Order confirmed", "NBFC pays you instantly", "Buyer pays NBFC on due date"]}
          >
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  You earn
                </p>
                <p className="mt-1 text-sm font-bold text-primary">
                  ₹0 interest cost to you
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  Buyer pays
                </p>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Split interest — approx ₹500 on ₹1L order
                </p>
              </div>
            </div>
          </ProductCard>
        )}

        {showFabPayLater && (
          <ProductCard
            icon="🕐"
            name="FabPay Later"
            audience="For Buyers"
            description="Buy now, pay in 30, 60, or 90 days. Manufacturer gets paid immediately. You get the breathing room you need."
            steps={["Buyer places order", "Manufacturer paid NOW by NBFC", "Buyer pays NBFC in 30/60/90 days"]}
          >
            <div className="mt-4 flex gap-2">
              {["30 days", "60 days", "90 days"].map((option) => (
                <span
                  key={option}
                  className="rounded-full border border-border-dark bg-background px-4 py-1.5 text-xs font-medium text-text-secondary opacity-60"
                >
                  {option}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-text-secondary">
              ~₹500 buyer + ₹500 manufacturer on ₹1L order. Split 50/50.
            </p>
          </ProductCard>
        )}

        {showFabMaterial && (
          <ProductCard
            icon="🧵"
            name="FabMaterial"
            audience={fabMaterialCopy.audience}
            description={fabMaterialCopy.description}
            steps={["Get material on credit", "Complete order", "Escrow auto-pays supplier", "You keep the margin"]}
          >
            <div className="mt-4 flex flex-col gap-2">
              {MATERIAL_LIMITS.map((row) => (
                <div
                  key={row.tier}
                  className="flex items-center justify-between rounded-lg border border-border-dark bg-background px-3.5 py-2.5"
                >
                  <span className="text-xs font-semibold text-text-primary">{row.tier}</span>
                  <span className="text-xs text-text-secondary">{row.limit}</span>
                </div>
              ))}
            </div>
          </ProductCard>
        )}
      </div>

      <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-5">
        <h2 className="text-base font-bold text-white">FabScore vs Traditional Credit</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-dark">
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary" />
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  Traditional Bank / NBFC
                </th>
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  FabVerify FabScore
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border-dark/60">
                  <td className="py-2.5 pr-3 text-xs text-text-secondary">{row.label}</td>
                  <td className="py-2.5 pr-3 text-xs">
                    <span className={row.icons ? "text-red-400" : "text-text-secondary"}>
                      {row.icons ? `❌ ${row.traditional}` : row.traditional}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs">
                    <span className={row.icons ? "text-emerald-400" : "text-primary"}>
                      {row.icons ? `✓ ${row.fabscore}` : row.fabscore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function RightPanel() {
  const { user } = useUser();
  const unlockItems = [
    ...(PRODUCT_VISIBILITY[user.userType] ?? []).map((id) => UNLOCK_ITEM_LABELS[id]),
    "₹2L Credit limit",
  ];

  return (
    <>
      <p className="text-sm font-bold text-white">Your Credit Status</p>
      <div className="mt-4 flex flex-col items-center text-center">
        <span className="rounded-full border border-[#CD7F32] bg-[rgba(205,127,50,0.15)] px-4 py-1.5 text-sm font-bold text-[#CD7F32]">
          🥉 Bronze
        </span>
        <p className="mt-2 text-[11px] text-text-secondary">Current Tier</p>
      </div>

      <div className="mt-5">
        <p className="text-xs text-text-secondary">Progress to Silver</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-border-dark">
          <div className="h-full w-[15%] rounded-full bg-primary" />
        </div>
        <p className="mt-1.5 text-[11px] text-text-secondary">1 order needed to unlock Silver</p>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Unlock at Silver</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {unlockItems.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-text-secondary opacity-60">
            <span>🔓</span>
            {item}
          </div>
        ))}
      </div>
      <Link
        href="/verification"
        className="mt-4 block w-full rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        Get Silver Verified →
      </Link>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Credit Tips</p>
      <div className="mt-3 flex flex-col gap-3">
        {TIPS.map((tip) => (
          <p key={tip} className="text-xs text-text-secondary">
            💡 {tip}
          </p>
        ))}
      </div>
    </>
  );
}

function CreditAndScorePage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>("fabscore");

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

  const centrePanel = (
    <>
      <TopBar
        title="FabScore & Credit"
        subtitle="Your garment industry credit identity"
      />

      <div className="px-6 py-6">
        {tabsBar}
        <div className="mt-6">
          {activeTab === "fabscore" ? <FabScoreTab /> : <CreditProductsTab />}
        </div>
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        centre={centrePanel}
        right={
          <div style={{ padding: "20px" }}>
            <RightPanel />
          </div>
        }
      />

      <div
        className="flex flex-col pb-20 md:hidden"
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
          <h1 className="font-display text-lg font-bold text-white">FabScore & Credit</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Your garment industry credit identity
          </p>

          <div className="mt-5">{tabsBar}</div>
          <div className="mt-6">
            {activeTab === "fabscore" ? <FabScoreTab /> : <CreditProductsTab />}
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-border-dark bg-card">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-primary"
                  : "text-text-secondary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// FabTalent score page (designer, master, merchandiser, qc_inspector)
// ─────────────────────────────────────────────────────────────

type TalentType = "designer" | "master" | "merchandiser" | "qc_inspector";

const TALENT_SUBTITLES: Record<TalentType, string> = {
  designer: "Your designer reputation and ranking",
  master: "Your master reputation and ranking",
  merchandiser: "Your merchandiser reputation",
  qc_inspector: "Your QC inspector reputation",
};

const TALENT_SEARCH_LABEL: Record<TalentType, string> = {
  designer: "designer",
  master: "master",
  merchandiser: "merchandiser",
  qc_inspector: "QC inspector",
};

const TALENT_FACTORS = [
  {
    icon: "✅",
    label: "Project Completion Rate",
    weight: "40%",
    progress: 0,
    description: "Complete projects on time to improve",
  },
  {
    icon: "⭐",
    label: "Client Ratings",
    weight: "30%",
    progress: 0,
    description: "5-star ratings from clients",
  },
  {
    icon: "⏱️",
    label: "Response Time",
    weight: "10%",
    progress: 0,
    description: "Respond to hire requests within 2 hours",
  },
  {
    icon: "📊",
    label: "Platform Activity",
    weight: "10%",
    progress: 20,
    description: "Stay active and update your profile",
  },
  {
    icon: "🏅",
    label: "Verification Level",
    weight: "10%",
    progress: 33,
    description: "Silver verified = higher ranking",
  },
];

const TALENT_IMPROVE_ITEMS = [
  {
    icon: "✅",
    title: "Complete FabTalent verification",
    description: "Get your Silver verified badge",
    linkLabel: "Get Verified →",
    href: "/verification",
  },
  {
    icon: "📋",
    title: "Complete your first project",
    description: "Every completed project builds your score",
    linkLabel: "Browse Requests →",
    href: "/samples",
  },
  {
    icon: "⚡",
    title: "Respond quickly to requests",
    description: "Fast response = more hire requests",
    linkLabel: null,
    href: null,
  },
  {
    icon: "⭐",
    title: "Get 5-star ratings",
    description: "Deliver quality work consistently",
    linkLabel: null,
    href: null,
  },
  {
    icon: "🔄",
    title: "Keep profile updated",
    description: "Add new portfolio samples regularly",
    linkLabel: null,
    href: null,
  },
];

const TALENT_EARNINGS_STATS = [
  { label: "Total Earned", value: "₹0" },
  { label: "This Month", value: "₹0" },
  { label: "In Escrow", value: "₹0" },
  { label: "Completed Projects", value: "0" },
];

function TalentRightPanel() {
  return (
    <>
      <p className="text-sm font-bold text-white">Your Status</p>
      <div className="mt-4 flex flex-col items-center text-center">
        <span className="rounded-full border border-[#CD7F32] bg-[rgba(205,127,50,0.15)] px-4 py-1.5 text-sm font-bold text-[#CD7F32]">
          🥉 Bronze
        </span>
        <p className="mt-2 text-[11px] text-text-secondary">Current Tier</p>
      </div>

      <div className="mt-5">
        <p className="text-xs text-text-secondary">Progress to Silver</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-border-dark">
          <div className="h-full w-[15%] rounded-full bg-primary" />
        </div>
        <p className="mt-1.5 text-[11px] text-text-secondary">
          Complete your first project to unlock Silver
        </p>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Tips to Rank Higher</p>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-xs text-text-secondary">💡 Respond to hire requests within 2 hours</p>
        <p className="text-xs text-text-secondary">💡 Keep your portfolio and rates up to date</p>
        <p className="text-xs text-text-secondary">💡 Deliver 5-star work to boost your ranking</p>
      </div>
    </>
  );
}

function TalentScorePage() {
  const { user } = useUser();
  const talentType = user.userType as TalentType;
  const searchLabel = TALENT_SEARCH_LABEL[talentType];

  const centrePanel = (
    <>
      <TopBar title="FabTalent Score" subtitle={TALENT_SUBTITLES[talentType]} />

      <div className="px-6 py-6">
        <div className="rounded-xl border border-border-dark bg-card p-7">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col items-center justify-center">
              <ScoreRing
                label="FabTalent Score"
                message="Complete your first project to unlock your FabTalent Score"
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <span className="rounded-full border border-[#CD7F32] bg-[rgba(205,127,50,0.15)] px-5 py-2 font-display text-base font-bold text-[#CD7F32]">
                🥉 Bronze
              </span>
              <p className="max-w-[260px] text-sm text-text-secondary">
                Your ranking in {searchLabel} search
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-5">
          <h2 className="text-base font-bold text-white">
            How Your FabTalent Score is Calculated
          </h2>
          <div className="mt-5 flex flex-col gap-5">
            {TALENT_FACTORS.map((factor) => (
              <div key={factor.label}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <span>{factor.icon}</span>
                    {factor.label}
                  </span>
                  <span className="shrink-0 rounded-full border border-border-dark bg-background px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                    {factor.weight} weightage
                  </span>
                </div>
                <div className="mt-2 h-[6px] w-full rounded-full bg-border-dark">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${factor.progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-text-secondary">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-4 rounded-lg border border-border-dark bg-card p-5"
          style={{ borderLeft: "3px solid #f2ca50" }}
        >
          <h2 className="text-[15px] font-bold text-white">
            💡 How to Improve Your FabTalent Score
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {TALENT_IMPROVE_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="mt-1 inline-block text-xs font-semibold text-primary"
                    >
                      {item.linkLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-5">
          <h2 className="text-base font-bold text-white">Your Ranking</h2>
          <p className="mt-2 text-sm text-text-secondary">
            You appear in {searchLabel} search results
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Complete Silver verification to rank higher
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "Verification tier", value: "Bronze" },
              { label: "FabTalent Score", value: "—" },
              { label: "Response time", value: "—" },
            ].map((item) => (
              <span
                key={item.label}
                className="rounded-full border border-border-dark bg-background px-3 py-1.5 text-xs text-text-secondary"
              >
                {item.label}: <span className="font-semibold text-text-primary">{item.value}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-5">
          <h2 className="text-base font-bold text-white">Earnings</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TALENT_EARNINGS_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border-dark bg-background p-3.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-[20px] font-bold text-primary">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-text-secondary">
            Your earnings will appear here once you complete your first project
          </p>
        </div>

        <div className="mt-4">
          <h2 className="text-base font-bold text-white">Payment Protection</h2>
          <div className="mt-4 rounded-xl border border-border-dark bg-card p-5">
            <p className="text-sm text-text-secondary">
              All your projects are protected by FabVerify escrow. Payment is held safely
              and released when you complete the work.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <ThreePanelLayout
      mobile={false}
      centre={centrePanel}
      right={
        <div style={{ padding: "20px" }}>
          <TalentRightPanel />
        </div>
      }
    />
  );
}

export default function CreditPage() {
  const { isTalent, mounted } = useUser();

  if (mounted && isTalent) return <TalentScorePage />;
  return <CreditAndScorePage />;
}
