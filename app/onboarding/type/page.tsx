"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../../context/UserContext";
import type { UserType } from "../../context/UserContext";

type UserTypeCard = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  tag?: string;
};

const USER_TYPES: UserTypeCard[] = [
  {
    id: "brand-buyer",
    emoji: "🛍️",
    title: "Brand / Buyer",
    description: "I buy garments for my brand or business",
    tag: "Beginner friendly",
  },
  {
    id: "manufacturer",
    emoji: "🏭",
    title: "Manufacturer",
    description: "I make garments in my factory or unit",
  },
  {
    id: "fabric-mill",
    emoji: "🏗️",
    title: "Fabric Mill",
    description: "I produce or sell fabric",
  },
  {
    id: "trim-supplier",
    emoji: "🧷",
    title: "Trim Supplier",
    description: "I supply buttons, zips, thread, labels",
  },
  {
    id: "artisan",
    emoji: "🎨",
    title: "Artisan",
    description: "I do hand craft — embroidery, block print, weaving",
  },
  {
    id: "job-worker",
    emoji: "🔧",
    title: "Job Worker",
    description: "I do specific work — printing, washing, embroidery",
  },
  {
    id: "freelance-designer",
    emoji: "✏️",
    title: "Freelance Designer",
    description: "I create designs, tech packs, flat sketches",
  },
  {
    id: "master",
    emoji: "✂️",
    title: "Master",
    description: "I make samples and do pattern work",
  },
  {
    id: "merchandiser",
    emoji: "👔",
    title: "Merchandiser",
    description: "I manage production between buyer and manufacturer",
  },
  {
    id: "qc-inspector",
    emoji: "🔍",
    title: "QC Inspector",
    description: "I inspect garment quality at factories before dispatch",
    tag: "FabTalent Verified",
  },
  {
    id: "enterprise-brand",
    emoji: "🏢",
    title: "Enterprise Brand",
    description: "Large brand with team, multiple vendors, and seasonal collections",
  },
];

const ROUTE_BY_TYPE: Record<string, string> = {
  "brand-buyer": "/onboarding/brand-builder",
  "enterprise-brand": "/onboarding/position",
  manufacturer: "/onboarding/manufacturer",
  "fabric-mill": "/onboarding/supplier",
  "trim-supplier": "/onboarding/supplier",
  "job-worker": "/onboarding/supplier",
  artisan: "/onboarding/artisan",
  "freelance-designer": "/onboarding/talent",
  master: "/onboarding/talent",
  merchandiser: "/onboarding/talent",
  "qc-inspector": "/onboarding/talent",
};

const STORAGE_TYPE_BY_ID: Record<string, string> = {
  "brand-buyer": "buyer",
  "enterprise-brand": "buyer",
  manufacturer: "manufacturer",
  "fabric-mill": "fabric_mill",
  "trim-supplier": "trim_supplier",
  "job-worker": "job_worker",
  artisan: "artisan",
  "freelance-designer": "designer",
  master: "master",
  merchandiser: "merchandiser",
  "qc-inspector": "qc_inspector",
};

export default function UserTypeSelection() {
  const router = useRouter();
  const { setUser } = useUser();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCard = USER_TYPES.find((card) => card.id === selected);

  const saveUserType = async (type: string) => {
    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) return;

    // Dev-mode auth has no real Supabase session/auth.uid() yet, so this
    // goes through the service-role-backed dev-auth API instead of a
    // direct RLS-protected client call.
    const res = await fetch("/api/dev-auth/save-user-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: auth.phone, userType: type }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
      console.error("User type save error:", error);
    }

    localStorage.setItem("fabverify_user_type", type);
  };

  const handleContinue = async () => {
    if (!selectedCard || isSaving) return;
    const userType = STORAGE_TYPE_BY_ID[selectedCard.id];
    if (userType) {
      setIsSaving(true);
      localStorage.setItem("userType", userType);
      setUser({ userType: userType as UserType });
      await saveUserType(userType);
      setIsSaving(false);
    }
    try {
      // Marks whether /onboarding/position was reached via the Enterprise
      // Brand path — checked by that page to bounce regular Brand/Buyer
      // users (and anyone landing there directly via URL) elsewhere.
      localStorage.setItem(
        "fabverify_onboarding_flow",
        selectedCard.id === "enterprise-brand" ? "enterprise" : "standard"
      );
    } catch {}
    router.push(ROUTE_BY_TYPE[selectedCard.id] ?? "/dashboard");
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
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px" }}>
        <div className="flex items-center gap-1 text-lg">
          <span>🧵</span>
          <span className="font-bold text-white">Fab</span>
          <span className="font-bold text-gold">Verify</span>
        </div>

        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border-dark">
          <div className="h-full w-full bg-gold" />
        </div>
        <p className="mt-2 text-center text-xs text-text-secondary">
          Step 2 of 2 — Choose Your Role
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

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={!selectedCard || isSaving}
            className={`w-full rounded-lg py-3.5 font-bold transition-colors sm:w-[320px] ${
              selectedCard && !isSaving
                ? "cursor-pointer bg-gold text-navy"
                : "cursor-not-allowed bg-border-dark text-text-secondary"
            }`}
          >
            {isSaving ? "Saving..." : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
