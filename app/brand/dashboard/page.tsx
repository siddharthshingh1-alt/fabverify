"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTypeGuard } from "@/app/hooks/useTypeGuard";
import { useUser } from "@/app/context/UserContext";
import ThreePanelLayout from "@/app/components/ThreePanelLayout";
import TopBar from "@/app/components/TopBar";
import { fabricPrices, makingCharges, trimPrices } from "@/app/data/fabprice";
import {
  StatGrid,
  StatCard,
  AttentionSection,
  ALERT_COLOR,
  StatusPill,
  TableShell,
  TableRow,
  EmptyState,
  OnboardingCard,
  RightHeading,
  RightDivider,
  PriceRow,
  type AttentionItem,
  type Status,
} from "@/app/components/dashboard/DashboardKit";

const RECENT_ORDERS: {
  id: string;
  style: string;
  manufacturer: string;
  stage: string;
  status: Status;
}[] = [
  { id: "ORD-2024-001", style: "Cotton Block Print Kurta", manufacturer: "Jaipur Ethnic Works", stage: "Production", status: "In Progress" },
  { id: "ORD-2024-002", style: "Cotton T-shirt", manufacturer: "Tirupur Knits", stage: "Quality Check", status: "In Progress" },
];

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    title: "Quality Check reached on Cotton T-shirt",
    detail: "Tirupur Knits · 500 pieces",
    action: "View Order →",
    href: "/brand/orders",
    color: ALERT_COLOR.info,
  },
  {
    title: "Payment milestone due on Cotton Block Print Kurta",
    detail: "₹67,200 held in escrow · Jaipur Ethnic Works",
    action: "Review Payment →",
    href: "/brand/orders",
    color: ALERT_COLOR.amber,
  },
  {
    title: "New enquiry response from Lucknow Chikankari House",
    detail: "Quoted for your chikankari sample brief",
    action: "View Enquiry →",
    href: "/brand/enquiries",
    color: ALERT_COLOR.info,
  },
];

const SUGGESTED_MANUFACTURERS = [
  { id: "jaipur-ethnic-works", name: "Jaipur Ethnic Works", city: "Jaipur", rating: "⭐ 4.9", tier: "Gold Verified" },
  { id: "surat-cotton-mills", name: "Surat Cotton Mills", city: "Surat", rating: "⭐ 4.8", tier: "Gold Verified" },
];

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/brand/dashboard" },
  { icon: "📦", label: "Orders", href: "/brand/orders" },
  { icon: "🔍", label: "Discover", href: "/brand/manufacturers" },
  { icon: "👔", label: "Merch", href: "/brand/fabmerch" },
  { icon: "👤", label: "Profile", href: "/brand/profile" },
];

export default function BrandDashboard() {
  const authorized = useTypeGuard("buyer");
  const pathname = usePathname();
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const isNew = user.verificationTier === "unverified";
  const showGetVerified = user.verificationTier !== "platinum";
  const hasOrders = !isNew && RECENT_ORDERS.length > 0;

  const seasonSection = isNew ? (
    <OnboardingCard
      heading={`👋 Welcome ${user.name}`}
      description="Your brand workspace is ready. Here is how to get your first order placed in 3 steps."
      steps={[
        { title: "Find a verified manufacturer", linkLabel: "Browse by category, city, MOQ", href: "/brand/manufacturers" },
        { title: "Send an enquiry or post a sample brief", linkLabel: "Get quotes from multiple manufacturers", href: "/brand/samples" },
        { title: "Place your first order with escrow", linkLabel: "Your payment is protected until delivery", href: "/brand/orders" },
      ]}
    />
  ) : (
    <StatGrid>
      <StatCard value="2" label="Active Orders" />
      <StatCard value="₹1,17,200" label="Pending Payments" valueClass="text-amber-400" />
      <StatCard value="1" label="Samples In Progress" valueClass="text-primary" />
      <StatCard value="92%" label="On-Time Delivery" valueClass="text-green-400" />
    </StatGrid>
  );

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Welcome to your brand workspace"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Your Season at a Glance</h2>
        {seasonSection}

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">What Needs Attention</h2>
          <AttentionSection items={hasOrders ? ATTENTION_ITEMS : []} />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Recent Orders Status</h2>
          {hasOrders ? (
            <TableShell columns={["Style", "Manufacturer", "Stage", "Status"]} minWidth={520}>
              {RECENT_ORDERS.map((row, index) => (
                <TableRow key={row.id} columns={4} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.style}</span>
                  <span className="text-xs text-text-primary">{row.manufacturer}</span>
                  <span className="text-xs text-text-secondary">{row.stage}</span>
                  <StatusPill status={row.status} />
                </TableRow>
              ))}
            </TableShell>
          ) : (
            <EmptyState message="No orders yet. Find a manufacturer to place your first order." />
          )}
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <RightHeading>FabPrice Snapshot</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        <PriceRow label={fabricPrices[0].name} value={fabricPrices[0].prices.medium} valueClass="text-green-400" />
        <PriceRow label={makingCharges[0].name} value={makingCharges[0].prices.medium} valueClass="text-primary" />
        <PriceRow label={trimPrices[0].name} value={trimPrices[0].price} valueClass="text-white" />
      </div>

      <RightDivider />

      <RightHeading>Suggested Manufacturers</RightHeading>
      <div className="mt-3 flex flex-col gap-3">
        {SUGGESTED_MANUFACTURERS.map((manufacturer) => (
          <div key={manufacturer.id} className="rounded-[6px] border border-border-dark bg-background p-2.5">
            <p className="text-xs font-bold text-text-primary">{manufacturer.name}</p>
            <p className="text-[11px] text-text-secondary">
              {manufacturer.city} · {manufacturer.rating} · ✅ {manufacturer.tier}
            </p>
            <Link
              href={`/brand/manufacturers/${manufacturer.id}`}
              className="mt-1 inline-block text-[11px] font-medium text-primary"
            >
              View Profile →
            </Link>
          </div>
        ))}
      </div>

      {showGetVerified && (
        <div className="mt-5 rounded-xl border border-primary bg-primary/10 p-4 text-center">
          <p className="text-xs font-semibold text-text-primary">
            Get Verified to unlock full platform
          </p>
          <Link
            href="/brand/verification"
            className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
          >
            Get Verified →
          </Link>
        </div>
      )}
    </>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
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
          <button type="button" aria-label="Notifications" className="text-lg text-text-primary">
            🔔
          </button>
        </div>

        <div className="flex-1 px-4 py-5">
          <h2 className="text-lg font-bold text-white">
            {greeting}, {user.name} 👋
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome to your brand workspace
          </p>

          <div className="mt-5">{seasonSection}</div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-white">What Needs Attention</h2>
            <AttentionSection items={hasOrders ? ATTENTION_ITEMS : []} />
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
