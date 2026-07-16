"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThreePanelLayout from "../components/ThreePanelLayout";
import TopBar from "../components/TopBar";
import { useUser } from "../context/UserContext";
import screenConfig from "../config/screens";
import { getActiveHiresCount } from "../data/hires";
import {
  MdCeoDashboard,
  HeadOfOperationsDashboard,
  MerchandiserDashboard,
  DesignerDashboard,
  AccountsDashboard,
} from "./PositionDashboards";

const TODAY_STATS = [
  { label: "Active Orders", value: 0 },
  { label: "Pending Approvals", value: 0 },
  { label: "Unread Messages", value: 0 },
];

const PRICE_ROWS = [
  { item: "Cotton Lawn (80 GSM)", price: "₹95–₹140/m" },
  { item: "Kurta Making Charge", price: "₹280–₹420/pc" },
  { item: "Chikankari Embroidery", price: "₹85–₹140/pc" },
];

const SUGGESTED_MANUFACTURERS = [
  {
    id: "jaipur-ethnic-works",
    name: "Jaipur Ethnic Works",
    tag: "Ethnic Wear • Gold Verified",
    rating: "⭐ 4.8",
  },
  {
    id: "surat-cotton-mills",
    name: "Surat Cotton Mills",
    tag: "Cotton Fabric • Silver Verified",
    rating: "⭐ 4.6",
  },
];

const TIER_ORDER = ["unverified", "bronze", "silver", "gold", "platinum"] as const;

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "🔍", label: "Discover", href: "/manufacturers" },
  { icon: "👔", label: "Merch", href: "/fabmerch" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

export default function Dashboard() {
  const { user, greeting } = useUser();
  const config = screenConfig.dashboard[user.userType];
  const pathname = usePathname();

  if (user.userType === "buyer" && user.position && user.position !== "solo_founder") {
    switch (user.position) {
      case "md_ceo":
        return <MdCeoDashboard />;
      case "head_operations":
        return <HeadOfOperationsDashboard />;
      case "merchandiser":
        return <MerchandiserDashboard />;
      case "designer":
        return <DesignerDashboard />;
      case "accounts":
        return <AccountsDashboard />;
    }
  }

  const tierIndex = TIER_ORDER.indexOf(user.verificationTier);
  const nextTier = TIER_ORDER[tierIndex + 1];

  const activeHiresCount = getActiveHiresCount();
  const resolveQuickAction = (action: (typeof config.quickActions)[number]) => {
    if (action.href !== "/fabmerch") return action;
    return activeHiresCount > 0
      ? { ...action, title: `My Hires (${activeHiresCount} active)` }
      : { ...action, title: "Hire Merchandiser →" };
  };

  const centrePanel = (
    <>
      <TopBar title={config.title} />

      <div className="px-6 py-6">
        <div className="border-l-[3px] border-primary bg-card p-5">
          <h2 className="text-lg font-bold text-white">
            {greeting}, {user.name}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {config.welcomeMessage}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-white">
            What do you want to do today?
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {config.quickActions.map((rawAction) => {
              const action = resolveQuickAction(rawAction);
              return (
                <Link
                  key={rawAction.title}
                  href={action.href}
                  className="block rounded-xl border border-border-dark bg-card p-4 transition-colors hover:border-primary"
                >
                  <div className="text-2xl">{action.icon}</div>
                  <h3 className="mt-2 text-sm font-bold text-text-primary">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-xs text-text-secondary">
                    {action.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-base font-bold text-white">
            Recent Activity
          </h2>
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
            <div className="text-5xl">📭</div>
            <p className="mt-4 text-[15px] text-text-primary">
              {config.emptyActivity}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const rightPanel =
    config.rightPanel === "verification_status" ? (
      <>
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Verification Status
        </p>
        <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
          <p className="text-sm font-bold capitalize text-primary">
            {user.verificationTier}
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            {nextTier
              ? `Complete verification to unlock ${nextTier} tier and more visibility`
              : "You have reached the highest verification tier"}
          </p>
        </div>
        {nextTier && (
          <Link
            href="/verification"
            className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
          >
            Get {nextTier[0].toUpperCase() + nextTier.slice(1)} Verified
          </Link>
        )}

        <div className="my-5 h-px bg-border-dark" />

        <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Market Prices
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {PRICE_ROWS.map((row) => (
            <div
              key={row.item}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-text-secondary">{row.item}</span>
              <span className="whitespace-nowrap font-semibold text-primary">
                {row.price}
              </span>
            </div>
          ))}
        </div>
      </>
    ) : config.rightPanel === "fabscore" ? (
      <>
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          FabScore
        </p>
        <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3 text-center">
          <p className="font-display text-3xl font-bold text-primary">
            {user.fabscore > 0 ? user.fabscore : "—"}
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            {user.fabscore > 0
              ? "Keep completing projects to improve your score"
              : "Complete your first project to unlock your FabScore"}
          </p>
        </div>
        <Link
          href="/credit"
          className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
        >
          View FabScore Details
        </Link>

        <div className="my-5 h-px bg-border-dark" />

        <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Verification
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-text-secondary capitalize">
            {user.verificationTier}
          </span>
          <Link href="/verification" className="text-xs font-medium text-primary">
            Upgrade
          </Link>
        </div>
      </>
    ) : (
      <>
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Today
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {TODAY_STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-text-secondary">{stat.label}</span>
              <span className="font-bold text-primary">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="my-5 h-px bg-border-dark" />

        <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Market Prices
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {PRICE_ROWS.map((row) => (
            <div
              key={row.item}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-text-secondary">{row.item}</span>
              <span className="whitespace-nowrap font-semibold text-primary">
                {row.price}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-text-secondary">
          Updated daily from verified transactions
        </p>

        <div className="my-5 h-px bg-border-dark" />

        <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Suggested For You
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {SUGGESTED_MANUFACTURERS.map((manufacturer) => (
            <div
              key={manufacturer.name}
              className="rounded-[6px] border border-border-dark bg-background p-2.5"
            >
              <div className="text-xl">🏭</div>
              <p className="mt-1 text-xs font-bold text-text-primary">
                {manufacturer.name}
              </p>
              <p className="text-[11px] text-text-secondary">
                {manufacturer.tag}
              </p>
              <p className="mt-0.5 text-[11px] text-primary">
                {manufacturer.rating}
              </p>
              <Link
                href={`/manufacturers/${manufacturer.id}`}
                className="mt-1 inline-block text-[11px] font-medium text-primary"
              >
                View Profile
              </Link>
            </div>
          ))}
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
          <h2 className="text-lg font-bold text-white">
            {greeting}, {user.name}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {config.welcomeMessage}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {config.quickActions.map((rawAction) => {
              const action = resolveQuickAction(rawAction);
              return (
                <Link
                  key={rawAction.title}
                  href={action.href}
                  className="block rounded-xl border-l-2 border-primary bg-card p-4"
                >
                  <p className="text-sm font-bold text-text-primary">
                    {action.icon} {action.title}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {action.desc}
                  </p>
                </Link>
              );
            })}
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
