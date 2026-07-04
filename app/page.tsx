"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Mill Network", href: "#" },
  { label: "Manufacturers", href: "#" },
  { label: "Tracking", href: "#" },
];

const stats = [
  { value: "200+", label: "Verified Manufacturers" },
  { value: "0", label: "Ghosted Payments" },
  { value: "8", label: "Cities Covered" },
  { value: "1", label: "Platform for Everything" },
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

const footerColumns = [
  {
    heading: "Platform",
    links: [
      { label: "Mill Network", href: "#" },
      { label: "Manufacturers", href: "#" },
      { label: "Tracking", href: "#" },
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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
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
                href={link.href}
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

      <main className="flex-1">
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
              <button className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
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
      </main>

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
                        href={link.href}
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
    </div>
  );
}
