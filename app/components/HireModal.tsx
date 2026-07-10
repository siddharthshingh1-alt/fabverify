"use client";

import { useEffect, useState } from "react";
import type { FabMerchTabId } from "../config/screens";
import type { UserType } from "../context/UserContext";
import { getVisibleQcPills } from "../lib/qcRelevance";

export type HireModalProfessional = {
  name: string;
  rateRange: string;
  extraPills: string[];
  stageQuestion: string;
  tabId: FabMerchTabId;
};

// Keyed by the caller on the professional's identity so that switching to a
// different professional remounts this component (fresh form state) instead
// of needing an effect to imperatively reset fields.
function HireModalContent({
  professional,
  viewerUserType,
  onClose,
}: {
  professional: HireModalProfessional;
  viewerUserType: UserType;
  onClose: () => void;
}) {
  const visiblePills =
    professional.tabId === "qc-inspectors"
      ? getVisibleQcPills(professional.extraPills, viewerUserType)
      : professional.extraPills;

  const [selectedStage, setSelectedStage] = useState(visiblePills[0] ?? "");
  const [requirementText, setRequirementText] = useState("");
  const [timelineDate, setTimelineDate] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] rounded-xl border border-border-dark bg-card p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white">
          Hire {professional.name}
        </h2>

        <div className="mt-5">
          <p className="text-sm font-medium text-text-primary">
            {professional.stageQuestion}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {visiblePills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setSelectedStage(pill)}
                className={`rounded-[20px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedStage === pill
                    ? "border-primary bg-primary text-navy"
                    : "border-border-dark bg-background text-text-secondary"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-text-primary">
            Describe your requirement:
          </p>
          <textarea
            value={requirementText}
            onChange={(event) => setRequirementText(event.target.value)}
            placeholder="Tell them what you need..."
            rows={4}
            className="mt-2 w-full rounded-[6px] border border-border-dark bg-background p-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
          />
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-text-primary">
            When do you need this by?
          </p>
          <input
            type="date"
            value={timelineDate}
            onChange={(event) => setTimelineDate(event.target.value)}
            className="mt-2 w-full rounded-[6px] border border-border-dark bg-background p-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="mt-5 rounded-[6px] border border-border-dark bg-background p-3">
          <p className="text-sm font-bold text-primary">
            {professional.rateRange}
          </p>
          <p className="mt-1 text-[12px] text-text-secondary">
            Your payment will be held in escrow until work is approved
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-dark px-4 py-2 text-sm font-semibold text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
          >
            Send Hire Request →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HireModal({
  professional,
  viewerUserType,
  onClose,
}: {
  professional: HireModalProfessional | null;
  viewerUserType: UserType;
  onClose: () => void;
}) {
  if (!professional) return null;

  return (
    <HireModalContent
      key={`${professional.tabId}-${professional.name}`}
      professional={professional}
      viewerUserType={viewerUserType}
      onClose={onClose}
    />
  );
}
