"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import type { EnterprisePosition } from "../../context/UserContext";
import { consumePendingChatRedirect } from "../../lib/postAuthRedirect";

const ROLES = [
  "MD / CEO",
  "Head of Operations",
  "Head of Merchandising",
  "Buying Head",
  "CFO",
  "IT Head",
  "Other",
];

const ROLE_TO_POSITION: Record<string, EnterprisePosition> = {
  "MD / CEO": "md_ceo",
  "Head of Operations": "head_operations",
  "Head of Merchandising": "head_merchandising",
  "Buying Head": "buying_head",
  CFO: "cfo",
  "IT Head": "it_head",
  Other: "other",
};

const STYLES_PER_SEASON = ["Under 20", "20 to 100", "100 to 300", "300 plus"];
const VENDOR_COUNTS = ["Under 10", "10 to 50", "50 to 200", "200 plus"];
const ERP_OPTIONS = [
  "None",
  "SAP",
  "Microsoft Dynamics",
  "Oracle",
  "Tally",
  "Busy",
  "Other",
];
const HEARD_ABOUT = ["Fabindia", "LinkedIn", "WhatsApp", "Referred by vendor", "Other"];

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

function PillGroup({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-[20px] border px-4 py-2 text-xs font-semibold transition-colors ${
              isSelected
                ? "border-primary bg-primary text-navy"
                : "border-border-dark bg-background text-text-secondary hover:border-primary/50"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function EnterpriseOnboarding() {
  const router = useRouter();
  const { setUser } = useUser();
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [stylesPerSeason, setStylesPerSeason] = useState<string | null>(null);
  const [vendorCount, setVendorCount] = useState<string | null>(null);
  const [erp, setErp] = useState("");
  const [source, setSource] = useState<string | null>(null);

  const isValid = companyName.trim() !== "";

  const handleSubmit = () => {
    if (!isValid) return;
    const position = role ? ROLE_TO_POSITION[role] : undefined;
    try {
      localStorage.setItem(
        "fabverify_enterprise",
        JSON.stringify({
          companyName: companyName.trim(),
          role,
          stylesPerSeason,
          vendorCount,
          erp,
          source,
        })
      );
      if (position) {
        localStorage.setItem("fabverify_enterprise_position", position);
      }
    } catch {}
    if (position) {
      setUser({ enterprisePosition: position });
    }
    router.push(consumePendingChatRedirect() ?? "/enterprise/dashboard");
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
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>
        <div className="flex items-center justify-center gap-1 font-display text-lg font-bold">
          <span>🧵</span>
          <span className="text-white">Fab</span>
          <span className="text-primary">Verify</span>
        </div>

        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border-dark">
          <div className="h-full w-full bg-primary" />
        </div>
        <p className="mt-2 text-center text-xs text-text-secondary">Step 3 of 3</p>

        <h1 className="mt-6 text-center font-display text-2xl font-bold text-white">
          Set up your enterprise workspace
        </h1>
        <p className="mt-1 text-center text-sm text-text-secondary">
          Takes 2 minutes. Add your team after.
        </p>

        <div className="mt-8 rounded-xl border border-border-dark bg-card p-8">
          <div className="mb-6">
            <label className="mb-2 block text-[13px] text-text-secondary">
              Company name
            </label>
            <input
              type="text"
              placeholder="e.g. Raymond Limited"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[13px] text-text-secondary">
              Your role
            </label>
            <PillGroup options={ROLES} selected={role} onSelect={setRole} />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[13px] text-text-secondary">
              How many active styles per season?
            </label>
            <PillGroup
              options={STYLES_PER_SEASON}
              selected={stylesPerSeason}
              onSelect={setStylesPerSeason}
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[13px] text-text-secondary">
              How many vendors do you work with?
            </label>
            <PillGroup
              options={VENDOR_COUNTS}
              selected={vendorCount}
              onSelect={setVendorCount}
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[13px] text-text-secondary">
              Which ERP do you use?
            </label>
            <select
              value={erp}
              onChange={(event) => setErp(event.target.value)}
              className="w-full appearance-none rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
              style={{
                backgroundImage: SELECT_CHEVRON,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                backgroundSize: "12px",
              }}
            >
              <option value="" className="bg-card text-text-secondary">
                Select ERP
              </option>
              {ERP_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-card text-text-primary">
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="mb-2 block text-[13px] text-text-secondary">
              How did you hear about us?
            </label>
            <PillGroup options={HEARD_ABOUT} selected={source} onSelect={setSource} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className={`mt-6 w-full rounded-lg py-3.5 font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Set up my workspace →
        </button>
        <p className="mt-3 text-center text-xs text-text-secondary">
          You can add your team members immediately after this step
        </p>
      </div>
    </div>
  );
}
