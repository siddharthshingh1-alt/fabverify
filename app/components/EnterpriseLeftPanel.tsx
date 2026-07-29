"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUser, type EnterprisePosition } from "../context/UserContext";

type NavItem = { icon: string; label: string; href: string };

const FULL_NAV: NavItem[] = [
  { icon: "🏠", label: "Home", href: "/enterprise/dashboard" },
  { icon: "📦", label: "All Orders", href: "/enterprise/orders" },
  { icon: "👥", label: "My Team", href: "/enterprise/team" },
  { icon: "🏭", label: "Vendor Master", href: "/enterprise/vendors" },
  { icon: "📊", label: "Analytics", href: "/enterprise/analytics" },
  { icon: "📋", label: "Season Plan", href: "/enterprise/season" },
];

const CFO_NAV: NavItem[] = [
  { icon: "🏠", label: "Home", href: "/enterprise/dashboard" },
  { icon: "💳", label: "Payments", href: "/enterprise/dashboard" },
  { icon: "💰", label: "Budget", href: "/enterprise/analytics" },
  { icon: "📊", label: "Analytics", href: "/enterprise/analytics" },
  { icon: "⚙", label: "Settings", href: "/profile" },
];

const IT_HEAD_NAV: NavItem[] = [
  { icon: "🏠", label: "Home", href: "/enterprise/dashboard" },
  { icon: "👥", label: "My Team", href: "/enterprise/team" },
  { icon: "📊", label: "Analytics", href: "/enterprise/analytics" },
  { icon: "⚙", label: "Settings", href: "/profile" },
  { icon: "🔌", label: "Integrations", href: "/enterprise/dashboard" },
];

const MERCHANDISING_NAV: NavItem[] = [
  { icon: "🏠", label: "Home", href: "/enterprise/dashboard" },
  { icon: "📦", label: "All Orders", href: "/enterprise/orders" },
  { icon: "🏭", label: "Vendor Master", href: "/enterprise/vendors" },
  { icon: "📊", label: "Analytics", href: "/enterprise/analytics" },
  { icon: "📋", label: "Season Plan", href: "/enterprise/season" },
];

const NAV_BY_POSITION: Record<EnterprisePosition, NavItem[]> = {
  md_ceo: FULL_NAV,
  head_operations: FULL_NAV,
  cfo: CFO_NAV,
  it_head: IT_HEAD_NAV,
  head_merchandising: MERCHANDISING_NAV,
  buying_head: MERCHANDISING_NAV,
  other: FULL_NAV,
};

const ROLE_LABELS: Record<EnterprisePosition, string> = {
  md_ceo: "MD / CEO",
  cfo: "Chief Finance Officer",
  head_operations: "Head of Operations",
  head_merchandising: "Head of Merchandising",
  buying_head: "Buying Head",
  it_head: "IT Head",
  other: "Team Member",
};

const TOOLS_ITEMS = [
  { icon: "💬", label: "Enquiries", href: "/enterprise/enquiries" },
  { icon: "💰", label: "FabPrice", href: "/fabprice" },
  { icon: "✅", label: "Verification", href: "/verification" },
];

export default function EnterpriseLeftPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const [companyName, setCompanyName] = useState("Your Company");
  const [position, setPosition] = useState<EnterprisePosition | null>(null);
  const [greeting, setGreeting] = useState("Good morning");
  const [mounted, setMounted] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
    try {
      const stored = localStorage.getItem("fabverify_enterprise");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.companyName) setCompanyName(parsed.companyName);
      }
      const storedPosition = localStorage.getItem("fabverify_enterprise_position");
      if (storedPosition && storedPosition in ROLE_LABELS) {
        setPosition(storedPosition as EnterprisePosition);
      }
    } catch {}
  }, []);

  const navItems = position ? NAV_BY_POSITION[position] : FULL_NAV;
  const roleLabel = position ? ROLE_LABELS[position] : null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string) =>
    `flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors ${
      isActive(href)
        ? "border-primary bg-primary/10 font-semibold text-primary"
        : "border-transparent text-text-secondary hover:text-text-primary"
    }`;

  return (
    <>
    <div className="flex h-full flex-col p-5">
      <div className="mb-6 flex items-center gap-1 font-display text-lg font-bold">
        <span>🧵</span>
        <span className="text-white">Fab</span>
        <span className="text-primary">Verify</span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background font-display text-sm font-bold text-primary">
          {mounted ? companyName.charAt(0).toUpperCase() : "C"}
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-text-primary">
            {mounted ? greeting : "Good morning"} 👋
          </p>
          <span className="inline-block rounded-[20px] border border-primary bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {mounted ? companyName : "Your Company"}
          </span>
          {mounted && roleLabel && (
            <p className="mt-1 text-[11px] text-text-secondary">{roleLabel}</p>
          )}
        </div>
      </div>

      <p className="mb-1.5 text-[10px] font-bold tracking-widest text-text-secondary">
        WORKSPACE
      </p>
      <div className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className={navLinkClass(item.href)}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <p className="mb-1.5 mt-5 text-[10px] font-bold tracking-widest text-text-secondary">
        TOOLS
      </p>
      <div className="flex flex-col gap-0.5">
        {TOOLS_ITEMS.map((item) => (
          <Link key={item.label} href={item.href} className={navLinkClass(item.href)}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <div className="rounded-lg border border-border-dark bg-background p-3.5">
          <span className="inline-block rounded-[20px] bg-primary px-2.5 py-0.5 text-[10px] font-bold text-navy">
            ENTERPRISE PLAN
          </span>
          <p className="mt-2 text-sm font-semibold text-text-primary">
            Foundational Plan
          </p>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="mt-1.5 inline-block text-xs font-semibold text-primary"
          >
            Upgrade plan →
          </button>
        </div>

        {/* Enterprise runs its own shell, so it needs the sign-out too —
            otherwise enterprise accounts remain the one user type with no
            way to log out. Same shared helper as LeftPanel and FabChat. */}
        <button
          type="button"
          onClick={async () => {
            if (signingOut) return;
            setSigningOut(true);
            await signOut();
            router.push("/login");
          }}
          disabled={signingOut}
          className="mt-3 w-full rounded-lg border border-border-dark py-2 text-xs font-semibold text-red-400 disabled:opacity-60"
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>

    {mounted && showUpgradeModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUpgradeModal(false);
          }}
        >
          <div
            className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-xl border border-border-dark bg-card p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 text-lg leading-none text-text-secondary hover:text-text-primary"
            >
              ✕
            </button>

            <p className="font-display text-xl font-bold text-white">
              Upgrade Your Plan
            </p>
            <p className="mb-5 text-[13px] text-text-secondary">
              Unlock more features as you grow
            </p>

            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-primary bg-background p-4">
                <span className="inline-block rounded-[20px] bg-primary px-2.5 py-0.5 text-[10px] font-bold text-navy">
                  Current Plan
                </span>
                <p className="mt-2 text-base font-bold text-white">Foundational</p>
                <p className="mt-0.5 text-lg font-bold text-primary">
                  ₹2L / month
                </p>
                <div className="mt-3 flex flex-col gap-1">
                  {[
                    "Up to 50 styles per season",
                    "Up to 50 vendors",
                    "1,000 AI calls per month",
                  ].map((line) => (
                    <p key={line} className="text-xs text-text-secondary">
                      • {line}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-xs italic text-text-secondary">
                  Your current plan
                </p>
              </div>

              <div className="rounded-lg border border-border-dark bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-white">Growth</p>
                  <span className="inline-block rounded-[20px] bg-primary px-2.5 py-0.5 text-[10px] font-bold text-navy">
                    Recommended ⭐
                  </span>
                </div>
                <p className="mt-0.5 text-lg font-bold text-primary">
                  ₹4L / month
                </p>
                <div className="mt-3 flex flex-col gap-1">
                  {[
                    "Up to 200 styles per season",
                    "Up to 200 vendors",
                    "5,000 AI calls per month",
                    "ERP integration — 1 system",
                    "FabFloor + FabPLM included",
                  ].map((line) => (
                    <p key={line} className="text-xs text-text-secondary">
                      • {line}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-navy"
                >
                  Upgrade to Growth →
                </button>
              </div>

              <div className="rounded-lg border border-border-dark bg-card p-4">
                <p className="text-base font-bold text-white">Enterprise</p>
                <p className="mt-0.5 text-lg font-bold text-primary">
                  ₹8L / month
                </p>
                <div className="mt-3 flex flex-col gap-1">
                  {[
                    "Unlimited styles and vendors",
                    "Unlimited AI calls",
                    "Unlimited ERP integrations",
                    "Dedicated account manager",
                    "99.9% SLA guarantee",
                  ].map((line) => (
                    <p key={line} className="text-xs text-text-secondary">
                      • {line}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg border border-primary py-2.5 text-sm font-bold text-primary"
                >
                  Upgrade to Enterprise →
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-lg border-l-4 border-primary bg-background p-3">
              <p className="text-xs text-text-secondary">
                Tier upgrades are pre-agreed in your contract. You will receive
                30 days advance notice before any upgrade activates.
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[13px] text-text-secondary">
                Talk to us about upgrading
              </p>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-[13px] font-semibold text-primary"
              >
                WhatsApp: +91 98765 43210
              </a>
              <a
                href="mailto:enterprise@fabverify.com"
                className="mt-1 block text-[13px] font-semibold text-primary"
              >
                Or email: enterprise@fabverify.com
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              className="mt-5 w-full rounded-lg border border-border-dark py-2.5 text-sm font-semibold text-text-secondary"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
