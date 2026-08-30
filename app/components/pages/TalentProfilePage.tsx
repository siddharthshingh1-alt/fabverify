"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import TopBar from "../TopBar";
import HireModal from "../HireModal";
import type { HireModalProfessional } from "../HireModal";
import { useUser } from "../../context/UserContext";
import type { FabMerchTabId } from "../../config/screens";
import { merchandisers, designers, masters } from "../../data/professionals";
import type { Merchandiser, Designer, Master } from "../../data/professionals";
import { qcInspectors } from "../../data/qcInspectors";
import type { QcInspector } from "../../data/qcInspectors";

type AnyProfessional =
  | (Merchandiser & { type: "merchandiser" })
  | (Designer & { type: "designer" })
  | (Master & { type: "master" })
  | (QcInspector & { type: "qc_inspector" });

const allProfessionals: AnyProfessional[] = [
  ...merchandisers.map((p) => ({ ...p, type: "merchandiser" as const })),
  ...designers.map((p) => ({ ...p, type: "designer" as const })),
  ...masters.map((p) => ({ ...p, type: "master" as const })),
  ...qcInspectors.map((p) => ({ ...p, type: "qc_inspector" as const })),
];

const TYPE_LABELS: Record<AnyProfessional["type"], string> = {
  merchandiser: "Verified Merchandiser",
  designer: "Verified Designer",
  master: "Verified Master",
  qc_inspector: "Verified QC Inspector",
};

const VERIFICATION_TEXT: Record<AnyProfessional["type"], string> = {
  merchandiser: "Interview verified by senior panel",
  designer: "Skill test + portfolio review",
  master: "Physical skill assessment",
  qc_inspector: "Practical defect identification test",
};

const TAB_ID_BY_TYPE: Record<AnyProfessional["type"], FabMerchTabId> = {
  merchandiser: "merchandisers",
  designer: "designers",
  master: "masters",
  qc_inspector: "qc-inspectors",
};

const STAGE_QUESTION_BY_TYPE: Record<AnyProfessional["type"], string> = {
  merchandiser: "Which stage do you need help with?",
  designer: "Which output do you need?",
  master: "Which speciality do you need?",
  qc_inspector: "Which inspection type do you need?",
};

const REVIEWS = [
  {
    text: "Excellent work. Delivered exactly as promised within timeline.",
    stars: 5,
    author: "Brand Client",
    time: "2 months ago",
  },
  {
    text: "Very professional and knowledgeable. Highly recommend for ethnic wear projects.",
    stars: 5,
    author: "D2C Brand",
    time: "3 months ago",
  },
  {
    text: "Good communication throughout the project.",
    stars: 4,
    author: "Small Brand",
    time: "4 months ago",
  },
];

function formatRate(min: number, max: number, unit: string) {
  return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")} ${unit}`;
}

function buildRateRange(professional: AnyProfessional) {
  return professional.type === "qc_inspector"
    ? formatRate(professional.rateMin, professional.rateMax, "per inspection")
    : formatRate(professional.rateMin, professional.rateMax, professional.rateUnit);
}

function buildAbout(professional: AnyProfessional): string {
  switch (professional.type) {
    case "merchandiser":
      return `${professional.name} is a verified FabVerify merchandiser specialising in ${professional.tags.join(", ")}. Based in ${professional.city}, they have completed ${professional.projects} projects with a ${professional.onTime}% on-time delivery rate. Available for ${professional.stages.join(", ")} stages.`;
    case "designer":
      return `${professional.name} is a verified FabTalent designer specialising in ${professional.tags.join(", ")}. Expert in ${professional.software.join(", ")}. Based in ${professional.city} with ${professional.techPacks} tech packs completed at ${professional.accuracy}% accuracy rate.`;
    case "master":
      return `${professional.name} is a verified FabTalent master specialising in ${professional.tags.join(", ")}. Expert in ${professional.speciality.join(", ")}. Based in ${professional.city} with ${professional.samples} samples constructed.`;
    case "qc_inspector":
      return `${professional.name} is a verified FabTalent QC Inspector covering ${professional.citiesCovered.join(", ")}. Expert in ${professional.tags.join(", ")} with ${professional.inspectionsCount} inspections completed at ${professional.accuracy}% report accuracy.`;
  }
}

function buildStats(professional: AnyProfessional): { label: string; value: string }[] {
  const rate = buildRateRange(professional);
  switch (professional.type) {
    case "merchandiser":
      return [
        { label: "Experience", value: `${professional.experience} years` },
        { label: "Projects Completed", value: `${professional.projects}` },
        { label: "On-time Delivery", value: `${professional.onTime}%` },
        { label: "Rate", value: rate },
      ];
    case "designer":
      return [
        { label: "Experience", value: `${professional.experience} years` },
        { label: "Tech Packs Completed", value: `${professional.techPacks}` },
        { label: "Accuracy Rate", value: `${professional.accuracy}%` },
        { label: "Rate", value: rate },
      ];
    case "master":
      return [
        { label: "Experience", value: `${professional.experience} years` },
        { label: "Samples Completed", value: `${professional.samples}` },
        { label: "First-Attempt Accuracy", value: `${professional.firstAttempt}%` },
        { label: "Rate", value: rate },
      ];
    case "qc_inspector":
      return [
        { label: "Experience", value: `${professional.experience} years` },
        { label: "Inspections Completed", value: `${professional.inspectionsCount}` },
        { label: "Report Accuracy", value: `${professional.accuracy}%` },
        { label: "Rate", value: rate },
      ];
  }
}

function buildAvailabilityGroups(
  professional: AnyProfessional
): { label: string; pills: string[] }[] {
  switch (professional.type) {
    case "merchandiser":
      return [{ label: "Stages", pills: professional.stages }];
    case "designer":
      return [{ label: "Software", pills: professional.software }];
    case "master":
      return [{ label: "Specialities", pills: professional.speciality }];
    case "qc_inspector":
      return [
        { label: "Inspection Types", pills: professional.inspectionTypes },
        { label: "Cities Covered", pills: professional.citiesCovered },
      ];
  }
}

function buildExtraPills(professional: AnyProfessional): string[] {
  switch (professional.type) {
    case "merchandiser":
      return professional.stages;
    case "designer":
      return professional.software;
    case "master":
      return professional.speciality;
    case "qc_inspector":
      return professional.inspectionTypes;
  }
}

type TabId = "overview" | "portfolio" | "reviews";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "portfolio", label: "Portfolio" },
  { id: "reviews", label: "Reviews" },
];

export default function TalentProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const professional = allProfessionals.find((p) => p.id === id);
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [hireTarget, setHireTarget] = useState<HireModalProfessional | null>(
    null
  );

  const openHireModal = () => {
    if (!professional) return;
    setHireTarget({
      name: professional.name,
      rateRange: buildRateRange(professional),
      extraPills: buildExtraPills(professional),
      stageQuestion: STAGE_QUESTION_BY_TYPE[professional.type],
      tabId: TAB_ID_BY_TYPE[professional.type],
    });
  };

  const content = !professional ? (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">👤</div>
      <p className="mt-4 text-base font-bold text-white">
        Professional not found
      </p>
      <p className="mt-2 text-[13px] text-text-secondary">
        This FabTalent profile doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/fabmerch"
        className="mt-5 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
      >
        ← Back to FabMerch
      </Link>
    </div>
  ) : (
    <div className="px-6 py-6">
      <Link
        href="/fabmerch"
        className="text-xs font-medium text-text-secondary hover:text-primary"
      >
        ← Back to FabMerch
      </Link>

      <div className="mt-4 rounded-xl border border-border-dark bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-3xl">
              👤
            </div>
            <div>
              <h1 className="font-display text-[22px] font-bold text-white">
                {professional.name}
              </h1>
              <span className="mt-1 inline-block rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {TYPE_LABELS[professional.type]}
              </span>
              <p className="mt-1 text-[13px] text-text-secondary">
                {professional.city}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-display text-[28px] font-bold text-primary">
              ⭐ {professional.fabscore}
            </p>
            <p className="text-[11px] text-text-secondary">FabTalent Score</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border-dark pt-5 sm:grid-cols-4">
          {buildStats(professional).map((stat) => (
            <div key={stat.label}>
              <p className="text-[11px] text-text-secondary">{stat.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-6 border-b border-border-dark">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-white"
                : "text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-xl border border-border-dark bg-card p-5">
            <h2 className="text-sm font-bold text-white">About</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {buildAbout(professional)}
            </p>
          </div>

          <div className="rounded-xl border border-border-dark bg-card p-5">
            <h2 className="text-sm font-bold text-white">Availability</h2>
            <div className="mt-3 flex flex-col gap-4">
              {buildAvailabilityGroups(professional).map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.pills.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "portfolio" && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-16 text-center">
          <div className="text-5xl">📁</div>
          <p className="mt-4 max-w-[380px] text-[13px] text-text-secondary">
            Portfolio samples will appear here once the professional uploads
            them
          </p>
          <p className="mt-2 max-w-[380px] text-[13px] text-text-secondary">
            This professional has been verified through FabVerify&apos;s
            skill assessment
          </p>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="mt-6 flex flex-col gap-3">
          {REVIEWS.map((review) => (
            <div
              key={review.text}
              className="rounded-xl border border-border-dark bg-card p-5"
            >
              <p className="text-sm text-text-primary">{review.text}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
                <span className="text-primary">
                  {"⭐".repeat(review.stars)}
                </span>
                <span>— {review.author}</span>
                <span>• {review.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const centrePanel = professional ? (
    <>
      <TopBar
        title={professional.name}
        subtitle={TYPE_LABELS[professional.type]}
      />
      {content}
    </>
  ) : (
    <>
      <TopBar title="FabTalent Profile" />
      {content}
    </>
  );

  const rightPanel = !professional ? null : (
    <>
      <p className="text-base font-bold text-white">
        Hire {professional.name}
      </p>
      <p className="mt-2 text-sm font-bold text-primary">
        {buildRateRange(professional)}
      </p>
      <button
        type="button"
        onClick={openHireModal}
        className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-bold text-navy"
      >
        Hire Now →
      </button>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Quick Stats
      </p>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">FabScore</span>
          <span className="font-bold text-primary">
            {professional.fabscore}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Projects Completed</span>
          <span className="font-bold text-white">
            {professional.type === "merchandiser"
              ? professional.projects
              : professional.type === "designer"
                ? professional.techPacks
                : professional.type === "master"
                  ? professional.samples
                  : professional.inspectionsCount}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Response Time</span>
          <span className="font-semibold text-white">
            Usually within 2 hours
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">Availability</span>
          <span className="flex items-center gap-1.5 font-semibold text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Available now
          </span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Verification Status
      </p>
      <p className="mt-2 text-sm font-semibold text-primary">
        ✅ FabTalent Verified
      </p>
      <p className="mt-1 text-[12px] text-text-secondary">
        {VERIFICATION_TEXT[professional.type]}
      </p>
      <p className="mt-3 text-[11px] text-text-secondary">
        Last verified: January 2026
      </p>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-border-dark bg-card px-4">
          <Link
            href="/fabmerch"
            className="text-sm font-medium text-text-secondary"
          >
            ← Back to FabMerch
          </Link>
        </div>
        <div className="flex-1">{content}</div>
      </div>

      <HireModal
        professional={hireTarget}
        viewerUserType={user.userType}
        onClose={() => setHireTarget(null)}
        onViewHires={() => router.push("/fabmerch")}
      />
    </>
  );
}
