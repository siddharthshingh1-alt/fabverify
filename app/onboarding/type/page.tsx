"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserTypeCard = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  tag?: string;
  route: string;
};

const USER_TYPES: UserTypeCard[] = [
  {
    id: "brand-buyer",
    emoji: "🛍️",
    title: "Brand / Buyer",
    description: "I buy garments for my brand or business",
    tag: "Beginner friendly",
    route: "/onboarding/brand-builder",
  },
  {
    id: "manufacturer",
    emoji: "🏭",
    title: "Manufacturer",
    description: "I make garments in my factory or unit",
    route: "/onboarding/manufacturer",
  },
  {
    id: "fabric-mill",
    emoji: "🏗️",
    title: "Fabric Mill",
    description: "I produce or sell fabric",
    route: "/onboarding/supplier",
  },
  {
    id: "trim-supplier",
    emoji: "🧷",
    title: "Trim Supplier",
    description: "I supply buttons, zips, thread, labels",
    route: "/onboarding/supplier",
  },
  {
    id: "artisan",
    emoji: "🎨",
    title: "Artisan",
    description: "I do hand craft — embroidery, block print, weaving",
    route: "/onboarding/artisan",
  },
  {
    id: "job-worker",
    emoji: "🔧",
    title: "Job Worker",
    description: "I do specific work — printing, washing, embroidery",
    route: "/onboarding/supplier",
  },
  {
    id: "freelance-designer",
    emoji: "✏️",
    title: "Freelance Designer",
    description: "I create designs, tech packs, flat sketches",
    route: "/onboarding/talent",
  },
  {
    id: "master",
    emoji: "✂️",
    title: "Master",
    description: "I make samples and do pattern work",
    route: "/onboarding/talent",
  },
  {
    id: "merchandiser",
    emoji: "👔",
    title: "Merchandiser",
    description: "I manage production between buyer and manufacturer",
    route: "/onboarding/talent",
  },
];

export default function UserTypeSelection() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedCard = USER_TYPES.find((card) => card.id === selected);

  const handleContinue = () => {
    if (!selectedCard) return;
    localStorage.setItem("fabverify_user_type", selectedCard.id);
    router.push(selectedCard.route);
  };

  return (
    <div className="min-h-screen bg-navy pb-28 md:pb-10">
      <div className="mx-auto max-w-[800px] px-5 py-10">
        <div className="flex items-center gap-1 text-lg">
          <span>🧵</span>
          <span className="font-bold text-white">Fab</span>
          <span className="font-bold text-gold">Verify</span>
        </div>

        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border-dark">
          <div className="h-full w-1/4 bg-gold" />
        </div>
        <p className="mt-2 text-center text-xs text-text-secondary">
          Step 1 of 4 — Choose your role
        </p>

        <h1 className="mt-8 text-center text-[28px] font-bold text-text-primary">
          What best describes you?
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          You can always add more roles later
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {USER_TYPES.map((card) => {
            const isSelected = selected === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelected(card.id)}
                className={`relative rounded-xl border p-5 text-left transition-colors ${
                  isSelected
                    ? "border-gold bg-gold/10"
                    : "border-border-dark hover:border-gold/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 font-bold text-gold">
                    ✓
                  </span>
                )}
                <div className="text-2xl">{card.emoji}</div>
                <h3 className="mt-2 text-sm font-bold text-text-primary">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  {card.description}
                </p>
                {card.tag && (
                  <span className="mt-2 inline-block rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
                    {card.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Starting your first clothing brand and not sure?{" "}
          <button
            type="button"
            onClick={() => setSelected("brand-buyer")}
            className="font-medium text-gold"
          >
            Select Brand / Buyer ↑
          </button>
        </p>

        <div className="mt-8 hidden md:flex md:justify-center">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedCard}
            className={`w-[320px] rounded-lg py-3.5 font-bold transition-colors ${
              selectedCard
                ? "cursor-pointer bg-gold text-navy"
                : "cursor-not-allowed bg-border-dark text-text-secondary"
            }`}
          >
            Continue →
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border-dark bg-navy p-4 md:hidden">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedCard}
          className={`w-full rounded-lg py-3.5 font-bold transition-colors ${
            selectedCard
              ? "cursor-pointer bg-gold text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
