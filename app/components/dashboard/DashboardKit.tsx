"use client";

import type { ReactNode } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Stat cards — "what's true right now" numbers, never links to
// left-nav destinations.
// ─────────────────────────────────────────────────────────────

export function StatCard({
  value,
  label,
  valueClass = "text-white",
}: {
  value: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[10px] border border-border-dark bg-card p-5">
      <p className={`font-display text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>;
}

// ─────────────────────────────────────────────────────────────
// "Needs attention" alert cards, colour-coded by urgency.
// ─────────────────────────────────────────────────────────────

export type AttentionItem = {
  title: string;
  detail: string;
  action: string;
  href: string;
  color: string;
};

export const ALERT_COLOR = {
  urgent: "#f87171",
  amber: "#f59e0b",
  info: "#63B3ED",
  ready: "#4ade80",
};

export function AttentionSection({
  items,
  allClearMessage = "All clear today ✓",
}: {
  items: AttentionItem[];
  allClearMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[8px] border border-green-500/40 bg-green-500/10 p-4">
        <p className="text-sm font-bold text-green-400">✅ {allClearMessage}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-[8px] bg-card p-4"
          style={{ borderLeft: `3px solid ${item.color}` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-text-secondary">{item.detail}</p>
            </div>
            <Link href={item.href} className="shrink-0 text-xs font-semibold text-primary">
              {item.action}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Compact status pills used inside tables.
// ─────────────────────────────────────────────────────────────

export type Status =
  | "On Track"
  | "Delayed"
  | "In Progress"
  | "Ready"
  | "Delivered"
  | "Pending"
  | "In Escrow"
  | "Completed"
  | "Scheduled"
  | "Booked"
  | "Awaiting Response";

const STATUS_STYLES: Record<Status, string> = {
  "On Track": "border-green-500/60 bg-green-500/15 text-green-400",
  Delayed: "border-red-500/60 bg-red-500/15 text-red-400",
  "In Progress": "border-amber-500/60 bg-amber-500/15 text-amber-400",
  Ready: "border-green-500/60 bg-green-500/15 text-green-400",
  Delivered: "border-border-dark bg-background text-text-secondary",
  Pending: "border-amber-500/60 bg-amber-500/15 text-amber-400",
  "In Escrow": "border-[#63B3ED]/60 bg-[#63B3ED]/15 text-[#63B3ED]",
  Completed: "border-border-dark bg-background text-text-secondary",
  Scheduled: "border-[#63B3ED]/60 bg-[#63B3ED]/15 text-[#63B3ED]",
  Booked: "border-amber-500/60 bg-amber-500/15 text-amber-400",
  "Awaiting Response": "border-amber-500/60 bg-amber-500/15 text-amber-400",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`w-fit rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Compact grid tables for "active orders / inspections / etc."
// ─────────────────────────────────────────────────────────────

export function TableShell({
  columns,
  minWidth = 560,
  children,
}: {
  columns: string[];
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
      <div style={{ minWidth }}>
        <div
          className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}
        >
          {columns.map((col) => (
            <span
              key={col}
              className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
            >
              {col}
            </span>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

export function TableRow({
  columns,
  index,
  children,
}: {
  columns: number;
  index: number;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid items-center gap-2 border-b border-border-dark px-4 py-3 last:border-b-0 ${
        index % 2 === 0 ? "bg-card" : "bg-background"
      }`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty states — always encouraging, never a blank box.
// ─────────────────────────────────────────────────────────────

export function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-10 text-center">
      {icon && <div className="text-4xl">{icon}</div>}
      <p className={`text-[13px] italic text-text-secondary ${icon ? "mt-3" : ""}`}>{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Numbered onboarding card for brand-new accounts with nothing
// happening yet.
// ─────────────────────────────────────────────────────────────

export type OnboardingStep = {
  title: string;
  linkLabel?: string;
  href?: string;
};

export function OnboardingCard({
  heading,
  description,
  steps,
  ctaLabel,
  ctaHref,
}: {
  heading: string;
  description: string;
  steps: OnboardingStep[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-[10px] border border-primary bg-card p-6">
      <p className="font-display text-lg font-bold text-white">{heading}</p>
      <p className="mb-4 mt-2 text-[13px] text-text-secondary">{description}</p>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="text-xs text-text-secondary">{step.title}</p>
              {step.href && step.linkLabel && (
                <Link href={step.href} className="text-xs font-medium text-primary">
                  {step.linkLabel} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-navy"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Misc small pieces reused across right panels.
// ─────────────────────────────────────────────────────────────

export function RightDivider() {
  return <div className="my-5 h-px bg-border-dark" />;
}

export function RightHeading({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-white">{children}</p>;
}

export function PriceRow({
  label,
  value,
  valueClass = "text-primary",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-text-secondary">{label}</span>
      <span className={`whitespace-nowrap font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

export function ProgressBar({ percent, color = "#f2ca50" }: { percent: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-border-dark">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }}
      />
    </div>
  );
}

const TIER_ORDER = ["unverified", "bronze", "silver", "gold", "platinum"] as const;

export function VerificationStatusBlock({
  tier,
  basePath,
}: {
  tier: (typeof TIER_ORDER)[number];
  basePath: string;
}) {
  const tierIndex = TIER_ORDER.indexOf(tier);
  const nextTier = TIER_ORDER[tierIndex + 1];
  return (
    <>
      <RightHeading>Verification Status</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="text-sm font-bold capitalize text-primary">{tier}</p>
        <p className="mt-1 text-[11px] text-text-secondary">
          {nextTier
            ? `Complete verification to unlock ${nextTier} tier and more visibility`
            : "You have reached the highest verification tier"}
        </p>
      </div>
      {nextTier && (
        <Link
          href={`${basePath}/verification`}
          className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
        >
          Get {nextTier[0].toUpperCase() + nextTier.slice(1)} Verified
        </Link>
      )}
    </>
  );
}

export function FabScoreBlock({
  fabscore,
  basePath,
  title = "FabScore",
}: {
  fabscore: number;
  basePath: string;
  title?: string;
}) {
  return (
    <>
      <RightHeading>{title}</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3 text-center">
        <p className="font-display text-3xl font-bold text-primary">
          {fabscore > 0 ? fabscore : "—"}
        </p>
        <p className="mt-1 text-[11px] text-text-secondary">
          {fabscore > 0
            ? "Keep completing projects to improve your score"
            : "Complete your first project to unlock your FabScore"}
        </p>
      </div>
      <Link
        href={`${basePath}/credit`}
        className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        View FabScore Details
      </Link>
    </>
  );
}
