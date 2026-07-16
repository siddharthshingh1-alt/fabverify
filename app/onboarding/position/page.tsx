"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import type { Position } from "../../context/UserContext";

type RoleCard = {
  id: Position;
  emoji: string;
  title: string;
  description: string;
};

const ROLE_CARDS: RoleCard[] = [
  {
    id: "solo_founder",
    emoji: "🚀",
    title: "Solo Founder / D2C Brand",
    description: "I do everything myself",
  },
  {
    id: "md_ceo",
    emoji: "👑",
    title: "MD / CEO",
    description: "I want the big picture only",
  },
  {
    id: "head_operations",
    emoji: "🏭",
    title: "Head of Operations",
    description: "I oversee orders and vendors",
  },
  {
    id: "merchandiser",
    emoji: "📋",
    title: "Merchandiser",
    description: "I manage orders and briefs",
  },
  {
    id: "designer",
    emoji: "✏️",
    title: "Designer",
    description: "I handle design and tech packs",
  },
  {
    id: "accounts",
    emoji: "💰",
    title: "Accounts / Finance",
    description: "I manage payments and budget",
  },
];

export default function PositionSelection() {
  const router = useRouter();
  const { setUser } = useUser();
  const [selected, setSelected] = useState<Position | null>(null);
  const [allowed, setAllowed] = useState(false);

  // This screen only makes sense for the Enterprise Brand signup path. A
  // regular Brand/Buyer (or anyone landing here directly via URL) gets
  // bounced straight to the brand builder wizard instead.
  useEffect(() => {
    let flow: string | null = null;
    try {
      flow = localStorage.getItem("fabverify_onboarding_flow");
    } catch {}
    if (flow !== "enterprise") {
      router.replace("/onboarding/brand-builder");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) return null;

  const handleContinue = () => {
    if (!selected) return;
    try {
      localStorage.setItem("fabverify_position", selected);
    } catch {}
    setUser({ position: selected });
    router.push("/onboarding/enterprise");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#07122a",
        backgroundImage:
          "linear-gradient(to right, rgba(212,175,55,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,175,55,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        overflowY: "auto",
        paddingBottom: "60px",
      }}
    >
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "40px 20px" }}>
        <div className="flex items-center justify-center gap-1 font-display text-lg font-bold">
          <span>🧵</span>
          <span className="text-white">Fab</span>
          <span className="text-primary">Verify</span>
        </div>

        <h1 className="mt-6 text-center font-display text-[22px] font-bold text-white">
          What is your role in the company?
        </h1>
        <p className="mt-1 text-center text-sm text-text-secondary">
          We will customise your dashboard for your specific responsibilities
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ROLE_CARDS.map((card) => {
            const isSelected = selected === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelected(card.id)}
                className={`relative rounded-xl border p-5 text-center transition-colors ${
                  isSelected
                    ? "border-2 border-primary bg-primary/[0.08]"
                    : "border-border-dark bg-card hover:border-primary"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-3 top-3 font-bold text-primary">✓</span>
                )}
                <div className="text-3xl">{card.emoji}</div>
                <p className="mt-2 text-sm font-bold text-white">{card.title}</p>
                <p className="mt-1 text-xs italic text-text-secondary">{card.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full rounded-lg py-3.5 font-bold transition-colors sm:w-[320px] ${
              selected
                ? "cursor-pointer bg-primary text-navy"
                : "cursor-not-allowed bg-border-dark text-text-secondary"
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
