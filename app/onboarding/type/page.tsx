"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { resolveAccount } from "../../lib/accountType";
import { authFetch, readSaveError, NETWORK_ERROR_MESSAGE } from "../../lib/apiClient";

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

// The value persisted to users.user_type. 'enterprise' is a real account
// type, not a marketplace persona — app/lib/accountType.ts resolves it to
// the 'buyer' persona so enterprise accounts keep full marketplace access
// (discovery, sourcing, orders) on top of the /enterprise/* workspace.
// This previously stored "buyer" for enterprise, which meant enterprise
// identity existed only in localStorage and was lost on every re-login.
const STORAGE_TYPE_BY_ID: Record<string, string> = {
  "brand-buyer": "buyer",
  "enterprise-brand": "enterprise",
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
  const [saveError, setSaveError] = useState("");

  const selectedCard = USER_TYPES.find((card) => card.id === selected);

  // Persists users.user_type (the DB truth). Returns null on success, or a
  // message to show the user on failure — the caller must not advance
  // unless this returns null.
  //
  // authFetch attaches proof of identity, which the route verifies before
  // writing. The write itself stays server-side (service role via db.ts)
  // because dev-mode auth has no auth.uid() for RLS.
  const saveUserType = async (type: string): Promise<string | null> => {
    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) return "Your session has expired. Please log in again.";

    try {
      const res = await authFetch("/api/dev-auth/save-user-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: auth.phone, userType: type }),
      });

      if (!res.ok) return await readSaveError(res);
    } catch {
      return NETWORK_ERROR_MESSAGE;
    }

    return null;
  };

  const handleContinue = async () => {
    if (!selectedCard || isSaving) return;
    const accountType = STORAGE_TYPE_BY_ID[selectedCard.id];
    if (!accountType) return;

    setIsSaving(true);
    setSaveError("");

    const error = await saveUserType(accountType);
    if (error) {
      // STOP. Writing the type to localStorage after a failed save is
      // exactly what created accounts that existed only in the browser
      // while the database had no row for them.
      setSaveError(error);
      setIsSaving(false);
      return;
    }

    // Saved to the database — only now mirror it locally and advance.
    // Store the raw account type (the DB truth) and derive the marketplace
    // persona from it, never the other way round.
    localStorage.setItem("userType", accountType);
    localStorage.setItem("fabverify_user_type", accountType);
    setUser(resolveAccount(accountType));

    try {
      // Marks whether /onboarding/position was reached via the Enterprise
      // Brand path — checked by that page to bounce regular Brand/Buyer
      // users (and anyone landing there directly via URL) elsewhere.
      localStorage.setItem(
        "fabverify_onboarding_flow",
        selectedCard.id === "enterprise-brand" ? "enterprise" : "standard"
      );
    } catch {}

    setIsSaving(false);
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

        {saveError && (
          <p className="mx-auto mt-6 max-w-[420px] rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-[13px] text-red-300">
            {saveError}
          </p>
        )}

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
