"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { EnterprisePosition } from "../context/UserContext";

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
  const [companyName, setCompanyName] = useState("Your Company");
  const [position, setPosition] = useState<EnterprisePosition | null>(null);
  const [greeting, setGreeting] = useState("Good morning");
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
          <Link
            href="/enterprise/dashboard"
            className="mt-1.5 inline-block text-xs font-semibold text-primary"
          >
            Upgrade plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
