"use client";

import Link from "next/link";
import { Fragment, useState } from "react";

const navLinks = [
  { label: "Mill Network", id: "mill-network" },
  { label: "Manufacturers", id: "manufacturers" },
  { label: "Tracking", id: "tracking" },
];

const stats = [
  { value: "200+", label: "Verified Manufacturers" },
  { value: "0", label: "Ghosted Payments" },
  { value: "8", label: "Cities Covered" },
  { value: "1", label: "Platform for Everything" },
];

const howItWorksSteps = [
  {
    emoji: "🔍",
    title: "Find and Verify",
    description:
      "Browse verified manufacturers, fabric mills, and suppliers. Every profile audited by our team.",
  },
  {
    emoji: "📋",
    title: "Place Order Safely",
    description:
      "Order with full escrow protection. Payment only releases when each milestone is verified.",
  },
  {
    emoji: "📸",
    title: "Track in Real Time",
    description:
      "Watch production happen. Geo-tagged photos at every stage. Zero surprises.",
  },
  {
    emoji: "✅",
    title: "Deliver and Pay",
    description:
      "Confirm delivery. Release final payment. Dispute resolution if anything goes wrong.",
  },
];

const userTypes = [
  {
    emoji: "🌱",
    title: "Brand Builder",
    description:
      "For complete beginners launching their first clothing brand. Zero industry knowledge needed.",
  },
  {
    emoji: "⚡",
    title: "Professional Suite",
    description:
      "For merchandisers, buyers, and brands managing their entire supply chain.",
  },
  {
    emoji: "🏭",
    title: "Manufacturer Hub",
    description:
      "For factories, artisans, mills, and suppliers getting verified and finding buyers.",
  },
];

const millNetworkFeatures = [
  {
    emoji: "🏗️",
    title: "Verified Mills",
    description:
      "Every fabric mill physically audited by our field team. GST verified. Production capacity confirmed.",
  },
  {
    emoji: "💰",
    title: "Real-Time Prices",
    description:
      "FabPrice shows current market rates from actual transactions. Know the fair price before you negotiate.",
  },
  {
    emoji: "📦",
    title: "Sample to Bulk",
    description:
      "Post one sample brief. Get swatches from multiple mills simultaneously. Compare and choose.",
  },
];

const manufacturerPreviews = [
  {
    name: "Jaipur Ethnic Works",
    tier: "Gold",
    rating: 4.9,
    city: "Jaipur, Rajasthan",
    tags: ["Ethnic Wear", "Cotton"],
  },
  {
    name: "Tirupur Knits",
    tier: "Silver",
    rating: 4.7,
    city: "Tirupur, Tamil Nadu",
    tags: ["Knitwear", "Casual Wear"],
  },
  {
    name: "Lucknow Chikankari House",
    tier: "Gold",
    rating: 4.9,
    city: "Lucknow, UP",
    tags: ["Chikankari", "Ethnic Wear"],
  },
];

const TRACKING_STEPS = [
  "Order Confirmed",
  "Raw Material",
  "Production",
  "Quality Check",
  "Dispatched",
  "Delivered",
];
const ACTIVE_TRACKING_STEP = "Production";

const trackingFeatures = [
  { emoji: "📸", text: "Geo-tagged photo proof at each milestone" },
  { emoji: "🔒", text: "Escrow releases only when milestone verified" },
  { emoji: "📱", text: "Real-time WhatsApp notifications" },
];

const footerColumns = [
  {
    heading: "Platform",
    links: [
      { label: "Mill Network", id: "mill-network" },
      { label: "Manufacturers", id: "manufacturers" },
      { label: "Tracking", id: "tracking" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
];

function scrollToSection(id: string) {
  return (event: React.MouseEvent) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[rgba(212,175,55,0.2)] bg-[#0D1B33]">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-1 font-display text-lg font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={`#${link.id}`}
                onClick={scrollToSection(link.id)}
                className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-white/5"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:brightness-110"
            >
              Get Started
            </Link>
          </div>

          <button
            className="text-on-surface md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="flex flex-col gap-3 border-t border-[rgba(212,175,55,0.2)] bg-[#0D1B33] px-4 py-4 md:hidden">
            <Link
              href="/login"
              className="w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-on-surface transition-colors hover:bg-white/5"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-on-primary transition-colors hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      <main
        className="hide-scrollbar"
        style={{
          height: "100vh",
          backgroundColor: "#07122a",
          overflowY: "auto",
        }}
      >
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />

          <div className="relative">
            <h1 className="max-w-3xl font-display text-[32px] font-extrabold leading-tight text-white sm:text-[56px]">
              From design idea to finished garment
              <br />
              <span className="block text-[28px] tracking-tight text-primary sm:text-[48px]">
                One platform. Zero chaos.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-[600px] text-lg text-on-surface-variant">
              The operating system of India&apos;s garment industry. For
              first-time brand founders and industry giants alike.
            </p>

            <div className="mt-8 flex w-full max-w-md flex-col gap-4 sm:mx-auto sm:w-auto sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:brightness-110"
              >
                Start for free
              </Link>
              <button
                onClick={scrollToSection("how-it-works")}
                className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                See how it works
              </button>
            </div>

            <div className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="border border-[rgba(212,175,55,0.15)] bg-[rgba(21,31,55,0.8)] px-4 py-6 backdrop-blur-md"
                >
                  <div className="font-display text-2xl font-bold text-primary sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-on-surface-variant sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-20">
          <h2 className="text-center font-display text-2xl font-bold text-white sm:text-[32px]">
            How FabVerify Works
          </h2>

          <div className="mx-auto mt-12 flex max-w-6xl flex-col items-stretch gap-6 md:flex-row md:items-center">
            {howItWorksSteps.map((step, index) => (
              <Fragment key={step.title}>
                <div className="flex-1 rounded-xl border border-[rgba(212,175,55,0.15)] bg-surface-container p-6 text-center">
                  <div className="text-4xl">{step.emoji}</div>
                  <h3 className="mt-4 font-display text-lg font-bold text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {step.description}
                  </p>
                </div>
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden shrink-0 text-2xl text-primary md:block">
                    →
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </section>

        <section className="px-4 py-20">
          <h2 className="text-center font-display text-2xl font-bold text-white sm:text-3xl">
            Built for every player in garment
          </h2>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
            {userTypes.map((type) => (
              <div
                key={type.title}
                className="border-l-2 border-primary bg-surface-container p-6"
              >
                <div className="text-4xl">{type.emoji}</div>
                <h3 className="mt-4 font-display text-xl font-bold text-primary">
                  {type.title}
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="mill-network" className="bg-card px-5 py-[60px]">
          <h2 className="text-center font-display text-2xl font-bold text-white sm:text-[32px]">
            India&apos;s Verified Fabric Mill Network
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-on-surface-variant">
            Source from 847 verified fabric mills across Surat, Ahmedabad,
            Kolkata, and Delhi
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {millNetworkFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[rgba(212,175,55,0.15)] bg-surface-container p-6 text-center"
              >
                <div className="text-4xl">{feature.emoji}</div>
                <h3 className="mt-4 font-display text-lg font-bold text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="manufacturers" className="bg-background px-5 py-[60px]">
          <h2 className="text-center font-display text-2xl font-bold text-white sm:text-[32px]">
            Find Verified Manufacturers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-on-surface-variant">
            200+ verified manufacturers across India. Every one physically
            inspected. Zero fake listings.
          </p>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
            {manufacturerPreviews.map((manufacturer) => (
              <div
                key={manufacturer.name}
                className="rounded-xl border border-[rgba(212,175,55,0.15)] bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary bg-navy text-lg">
                    🏭
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-white">
                      {manufacturer.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {manufacturer.city}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {manufacturer.tier} Verified
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    ⭐ {manufacturer.rating}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {manufacturer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[rgba(212,175,55,0.15)] bg-background px-2 py-[3px] text-[10px] text-on-surface-variant"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/manufacturers"
              className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary transition-colors hover:brightness-110"
            >
              Browse All Manufacturers →
            </Link>
          </div>
        </section>

        <section id="tracking" className="bg-card px-5 py-[60px]">
          <h2 className="text-center font-display text-2xl font-bold text-white sm:text-[32px]">
            Real-Time Order Tracking
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-on-surface-variant">
            Know exactly where your order is at every moment. Geo-tagged
            photo proof. Escrow protection at every milestone.
          </p>

          <div className="mx-auto mt-12 flex max-w-4xl items-start">
            {TRACKING_STEPS.map((step, index) => (
              <div
                key={step}
                className="flex flex-1 flex-col items-center last:flex-none"
              >
                <div className="flex w-full items-center">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                    {step === ACTIVE_TRACKING_STEP && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
                    )}
                    <span className="relative text-sm font-bold text-on-primary">
                      {index + 1}
                    </span>
                  </div>
                  {index < TRACKING_STEPS.length - 1 && (
                    <div className="h-0.5 flex-1 bg-primary" />
                  )}
                </div>
                <p className="mt-3 max-w-[90px] text-center text-xs text-on-surface-variant">
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {trackingFeatures.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 rounded-lg border border-[rgba(212,175,55,0.15)] bg-surface-container p-4"
              >
                <span className="text-2xl">{feature.emoji}</span>
                <span className="text-sm text-on-surface-variant">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        <footer className="bg-surface-container-lowest">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.heading}>
                  <h4 className="font-display text-sm font-bold text-white">
                    {column.heading}
                  </h4>
                  <ul className="mt-4 flex flex-col gap-2">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={"id" in link ? `#${link.id}` : link.href}
                          onClick={"id" in link ? scrollToSection(link.id) : undefined}
                          className="text-sm text-on-surface-variant transition-colors hover:text-primary"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-12 border-t border-[rgba(212,175,55,0.15)] pt-6 text-center text-xs text-on-surface-variant">
              FabVerify © 2026 — The Operating System of India&apos;s Garment
              Industry
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
