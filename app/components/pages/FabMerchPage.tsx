"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import TopBar from "../TopBar";
import {
  merchandisers as MERCHANDISER_DATA,
  designers as DESIGNER_DATA,
  masters as MASTER_DATA,
} from "../../data/professionals";
import { qcInspectors as QC_INSPECTOR_DATA } from "../../data/qcInspectors";
import { useUser } from "../../context/UserContext";
import screenConfig from "../../config/screens";
import type { FabMerchTabId } from "../../config/screens";
import { getVisibleQcPills, qcInspectorMatchesViewer } from "../../lib/qcRelevance";
import HireModal from "../HireModal";
import type { HireModalProfessional } from "../HireModal";
import { HIRES, getActiveHires, getCompletedHiresCount, getTotalSpent } from "../../data/hires";
import type { Hire, HireStatus } from "../../data/hires";

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "🔍", label: "Discover", href: "/manufacturers" },
  { icon: "👔", label: "Merch", href: "/fabmerch" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

const CATEGORY_PILLS = [
  "All",
  "Ethnic Wear",
  "Western Wear",
  "Knitwear",
  "Luxury",
  "Denim",
  "Kids Wear",
  "Sustainable",
];

const PROFESSIONAL_TYPE_OPTIONS = ["Merchandiser", "Designer", "Master"];

const REQUIREMENT_CATEGORIES = [
  "Ethnic Wear",
  "Western Wear",
  "Knitwear",
  "Kids Wear",
  "Luxury",
  "Denim",
  "Sustainable",
  "Other",
];

type TabId = FabMerchTabId;

type Professional = {
  id: string;
  name: string;
  city: string;
  fabScore: number;
  tags: string[];
  years: number;
  countLabel: string;
  qualityLabel: string;
  extraPills: string[];
  rateRange: string;
  citiesCovered?: string[];
};

const ALL_STAGES = [
  "Design",
  "Sourcing",
  "Sampling",
  "Production",
  "QC",
  "Dispatch",
];

function formatRate(rateMin: number, rateMax: number, rateUnit: string) {
  return `₹${rateMin.toLocaleString("en-IN")} – ₹${rateMax.toLocaleString("en-IN")} ${rateUnit}`;
}

const MERCHANDISERS: Professional[] = MERCHANDISER_DATA.map((person) => ({
  id: person.id,
  name: person.name,
  city: person.city,
  fabScore: person.fabscore,
  tags: person.tags,
  years: person.experience,
  countLabel: `${person.projects} projects`,
  qualityLabel: `${person.onTime}% on time`,
  extraPills: person.stages,
  rateRange: formatRate(person.rateMin, person.rateMax, person.rateUnit),
}));

const DESIGNERS: Professional[] = DESIGNER_DATA.map((person) => ({
  id: person.id,
  name: person.name,
  city: person.city,
  fabScore: person.fabscore,
  tags: person.tags,
  years: person.experience,
  countLabel: `${person.techPacks} tech packs`,
  qualityLabel: `${person.accuracy}% accuracy`,
  extraPills: person.software,
  rateRange: formatRate(person.rateMin, person.rateMax, person.rateUnit),
}));

const MASTERS: Professional[] = MASTER_DATA.map((person) => ({
  id: person.id,
  name: person.name,
  city: person.city,
  fabScore: person.fabscore,
  tags: person.tags,
  years: person.experience,
  countLabel: `${person.samples} samples`,
  qualityLabel: `${person.firstAttempt}% first attempt`,
  extraPills: person.speciality,
  rateRange: formatRate(person.rateMin, person.rateMax, person.rateUnit),
}));

const QC_INSPECTORS: Professional[] = QC_INSPECTOR_DATA.map((person) => ({
  id: person.id,
  name: person.name,
  city: person.city,
  fabScore: person.fabscore,
  tags: person.tags,
  years: person.experience,
  countLabel: `${person.inspectionsCount} inspections`,
  qualityLabel: `${person.accuracy}% report accuracy`,
  extraPills: person.inspectionTypes,
  citiesCovered: person.citiesCovered,
  rateRange: formatRate(person.rateMin, person.rateMax, "per inspection"),
}));

const TABS: {
  id: TabId;
  label: string;
  singular: string;
  extraLabel: string;
  data: Professional[];
  stageQuestion: string;
}[] = [
  {
    id: "merchandisers",
    label: "Merchandisers",
    singular: "merchandiser",
    extraLabel: "Available for:",
    data: MERCHANDISERS,
    stageQuestion: "Which stage do you need help with?",
  },
  {
    id: "designers",
    label: "Designers",
    singular: "designer",
    extraLabel: "Software:",
    data: DESIGNERS,
    stageQuestion: "Which output do you need?",
  },
  {
    id: "masters",
    label: "Masters",
    singular: "master",
    extraLabel: "Speciality:",
    data: MASTERS,
    stageQuestion: "Which speciality do you need?",
  },
  {
    id: "qc-inspectors",
    label: "QC Inspectors",
    singular: "QC inspector",
    extraLabel: "Types:",
    data: QC_INSPECTORS,
    stageQuestion: "Which inspection type do you need?",
  },
];

const ALL_CITIES = Array.from(
  new Set(
    [...MERCHANDISERS, ...DESIGNERS, ...MASTERS, ...QC_INSPECTORS].map(
      (person) => person.city
    )
  )
);

const EXPERIENCE_OPTIONS = [
  "Any Experience",
  "0–5 years",
  "6–10 years",
  "11+ years",
];

const SORT_OPTIONS = ["Top Rated", "Most Experienced", "Most Projects"];

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

const SELECT_STYLE = {
  backgroundImage: SELECT_CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "12px",
};

const SELECT_CLASSNAME =
  "appearance-none rounded-[6px] border border-border-dark bg-card py-2 pl-3 pr-8 text-xs text-text-primary outline-none transition-colors focus:border-primary";

function matchesExperience(years: number, selected: string) {
  if (selected === "0–5 years") return years <= 5;
  if (selected === "6–10 years") return years >= 6 && years <= 10;
  if (selected === "11+ years") return years >= 11;
  return true;
}

function projectsValue(countLabel: string) {
  return parseInt(countLabel, 10) || 0;
}

function ProfessionalCard({
  professional,
  tab,
  onHire,
}: {
  professional: Professional;
  tab: (typeof TABS)[number];
  onHire: (professional: Professional, tab: (typeof TABS)[number]) => void;
}) {
  const { user } = useUser();
  const qcPills =
    tab.id === "qc-inspectors"
      ? getVisibleQcPills(professional.extraPills, user.userType)
      : professional.extraPills;

  return (
    <div className="rounded-[10px] border border-border-dark bg-card p-4 transition-colors hover:border-primary/50">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xl">
          👤
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-white">
            {professional.name}
          </p>
          <p className="text-xs text-text-secondary">{professional.city}</p>
          <span className="mt-1 inline-block rounded-[20px] border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Verified {tab.singular.charAt(0).toUpperCase() + tab.singular.slice(1)}
          </span>
        </div>
        <span className="shrink-0 text-sm font-bold text-primary">
          ⭐ {professional.fabScore}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {professional.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-[20px] border border-border-dark bg-background px-2 py-[3px] text-[10px] text-text-secondary"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-dark pt-3 text-[12px] text-text-primary">
        <span>⏳ {professional.years} years</span>
        <span>📦 {professional.countLabel}</span>
        <span>✅ {professional.qualityLabel}</span>
      </div>

      {tab.id === "qc-inspectors" ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-border-dark pt-3">
          <div>
            <p className="text-[11px] text-text-secondary">Inspects:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(professional.citiesCovered ?? []).map((city) => (
                <span
                  key={city}
                  className="rounded-[20px] border border-border-dark bg-background px-2 py-[3px] text-[10px] text-text-secondary"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Types:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {qcPills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-[20px] border border-primary bg-primary/10 px-2 py-[3px] text-[10px] text-primary"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 border-t border-border-dark pt-3">
          <p className="text-[11px] text-text-secondary">{tab.extraLabel}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tab.id === "merchandisers"
              ? ALL_STAGES.map((stage) => {
                  const covered = professional.extraPills.includes(stage);
                  return (
                    <span
                      key={stage}
                      className={`rounded-[20px] border px-2 py-[3px] text-[10px] ${
                        covered
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border-dark text-text-secondary"
                      }`}
                    >
                      {stage}
                    </span>
                  );
                })
              : professional.extraPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-[20px] border border-primary bg-primary/10 px-2 py-[3px] text-[10px] text-primary"
                  >
                    {pill}
                  </span>
                ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-primary">
          {professional.rateRange}
        </p>
        <div className="flex gap-2">
          <Link
            href={`/fabmerch/${professional.id}`}
            className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => onHire(professional, tab)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-navy"
          >
            Hire Now
          </button>
        </div>
      </div>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  unverified: "#7A8FA8",
  bronze: "#CD7F32",
  silver: "#94a3b8",
  gold: "#f2ca50",
  platinum: "#e2e8f0",
};

const HIRE_STATUS_LABELS: Record<HireStatus, string> = {
  active: "Active",
  completed: "Completed ✓",
  pending_start: "Pending Start",
};

const HIRE_STATUS_STYLES: Record<HireStatus, string> = {
  active: "border-green-500/60 bg-green-500/15 text-green-400",
  completed: "border-border-dark bg-background text-text-secondary",
  pending_start: "border-amber-500/60 bg-amber-500/15 text-amber-400",
};

function HireCard({ hire }: { hire: Hire }) {
  const progressPct = Math.round(
    (hire.milestonesComplete / hire.milestonesTotal) * 100
  );
  const milestoneSuffix = hire.milestoneNote
    ? ` — ${hire.milestoneNote}`
    : hire.status === "completed"
      ? " complete"
      : "";

  return (
    <div className="mb-3 rounded-[10px] border border-border-dark bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-navy">
            {hire.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{hire.name}</p>
            <span className="mt-1 inline-block rounded-[20px] border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {hire.role}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${HIRE_STATUS_STYLES[hire.status]}`}
        >
          {HIRE_STATUS_LABELS[hire.status]}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[13px] font-bold text-white">{hire.styleName}</p>
        <p className="mt-1 text-xs text-text-secondary">
          Managing: {hire.managingLabel}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">{hire.linkedLabel}</p>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-text-secondary">
          {hire.milestonesComplete} of {hire.milestonesTotal} milestones
          {milestoneSuffix}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-dark pt-3">
        <div>
          <p className="text-[11px] text-text-secondary">Agreed rate</p>
          <p className="mt-0.5 text-xs font-bold text-white">{hire.rateLabel}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-secondary">Paid so far</p>
          <p className="mt-0.5 text-xs font-bold text-green-400">
            ₹{hire.paid.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-secondary">Remaining</p>
          <p className="mt-0.5 text-xs font-bold text-amber-400">
            ₹{hire.due.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div
        className={`mt-3 flex flex-col gap-2 border-t border-border-dark pt-3 sm:flex-row sm:items-center ${
          hire.bottomLeftLabel ? "sm:justify-between" : "sm:justify-end"
        }`}
      >
        {hire.bottomLeftLabel && (
          <p className="text-[11px] text-text-secondary">{hire.bottomLeftLabel}</p>
        )}
        <div className="flex gap-3">
          {hire.bottomRightAction === "download" ? (
            <button type="button" className="text-xs font-semibold text-primary">
              Download Tech Pack →
            </button>
          ) : (
            <>
              <button
                type="button"
                className="text-xs font-semibold text-text-secondary"
              >
                Message →
              </button>
              <button type="button" className="text-xs font-semibold text-primary">
                View Work →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MyHiresEmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-16 text-center">
      <div className="text-5xl">👔</div>
      <p className="mt-4 text-base font-bold text-white">No active hires yet</p>
      <p className="mt-2 max-w-sm text-[13px] text-text-secondary">
        Hire a verified professional to manage your orders, create tech
        packs, or inspect your production.
      </p>
    </div>
  );
}

function HireSummaryPanel({
  onPostRequirement,
  onBrowseProfessionals,
}: {
  onPostRequirement: () => void;
  onBrowseProfessionals: () => void;
}) {
  const activeHires = getActiveHires();
  const completedCount = getCompletedHiresCount();
  const totalSpent = getTotalSpent();

  return (
    <>
      <p className="text-sm font-bold text-white">Hire Summary</p>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Active hires</span>
          <span className="font-bold text-green-400">{activeHires.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Completed</span>
          <span className="font-bold text-text-secondary">{completedCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Total spent</span>
          <span className="font-bold text-primary">
            ₹{totalSpent.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {activeHires.length > 0 && (
        <>
          <div className="my-5 h-px bg-border-dark" />
          <p className="text-sm font-bold text-white">Active Professionals</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {activeHires.map((hire) => (
              <div key={hire.id} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-navy">
                  {hire.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-text-primary">
                    {hire.name}
                  </p>
                  <p className="text-[11px] text-text-secondary">{hire.role}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="my-5 h-px bg-border-dark" />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onPostRequirement}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-bold text-navy"
        >
          Post a Requirement →
        </button>
        <button
          type="button"
          onClick={onBrowseProfessionals}
          className="w-full rounded-lg border border-primary px-4 py-2.5 text-center text-sm font-semibold text-primary"
        >
          Browse Professionals →
        </button>
      </div>
    </>
  );
}

function TalentFabMerchProfile() {
  const { user, userLabel } = useUser();
  const profileConfig = screenConfig.profile[user.userType];

  const centrePanel = (
    <>
      <TopBar
        title="My FabTalent Profile"
        subtitle="Manage your listing, availability, and hire requests"
      />

      <div className="px-6 py-6">
        <div className="rounded-xl border border-border-dark bg-card p-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] border-2 border-primary text-2xl"
              style={{ backgroundColor: "#07122a" }}
            >
              {profileConfig.emoji}
            </div>
            <div>
              <p className="text-lg font-bold text-white">{user.name}</p>
              <p className="text-[13px] font-semibold text-primary">
                {userLabel}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border-dark pt-5 sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-text-secondary">Verification</p>
              <span
                className="mt-1 inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={{
                  borderColor: TIER_COLORS[user.verificationTier],
                  color: TIER_COLORS[user.verificationTier],
                  backgroundColor: `${TIER_COLORS[user.verificationTier]}1f`,
                }}
              >
                {user.verificationTier}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-text-secondary">FabScore</p>
              <p className="mt-1 text-lg font-bold text-primary">
                {user.fabscore > 0 ? user.fabscore : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-secondary">
                Completed Projects
              </p>
              <p className="mt-1 text-lg font-bold text-primary">0</p>
            </div>
            <div>
              <p className="text-[11px] text-text-secondary">Rating</p>
              <p className="mt-1 text-lg font-bold text-text-secondary">—</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/profile"
              className="flex-1 rounded-lg bg-primary py-3 text-center text-sm font-bold text-navy"
            >
              Edit My Profile →
            </Link>
            <Link
              href="/enquiries"
              className="flex-1 rounded-lg border border-primary py-3 text-center text-sm font-bold text-primary"
            >
              View Hire Requests →
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-base font-bold text-white">Get More Hire Requests</p>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-text-secondary">
        <li>💡 Complete verification to appear higher in search results</li>
        <li>💡 Keep your portfolio and rates up to date</li>
        <li>💡 Respond to hire requests within 4 hours</li>
      </ul>
    </>
  );

  return (
    <ThreePanelLayout
      mobile={false}
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}

export default function FabMerch() {
  const { user, isTalent } = useUser();
  const pathname = usePathname();
  const fabMerchConfig = screenConfig.fabmerch[user.userType];
  const visibleTabList = TABS.filter((tab) =>
    fabMerchConfig.visibleTabs.includes(tab.id)
  );
  const showMyHiresTab = fabMerchConfig.visibleTabs.includes("my-hires");
  const tabBarItems: { id: TabId; label: string }[] = [
    ...(showMyHiresTab ? [{ id: "my-hires" as TabId, label: "My Hires" }] : []),
    ...visibleTabList.map((tab) => ({ id: tab.id, label: tab.label })),
  ];

  const [activeTab, setActiveTab] = useState<TabId>("merchandisers");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedExperience, setSelectedExperience] =
    useState("Any Experience");
  const [sortBy, setSortBy] = useState("Top Rated");

  const [hireTarget, setHireTarget] = useState<HireModalProfessional | null>(
    null
  );

  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [reqProfessionalType, setReqProfessionalType] =
    useState("Merchandiser");
  const [reqStages, setReqStages] = useState<string[]>([]);
  const [reqDescription, setReqDescription] = useState("");
  const [reqStartDate, setReqStartDate] = useState("");
  const [reqEndDate, setReqEndDate] = useState("");
  const [reqBudgetMin, setReqBudgetMin] = useState("");
  const [reqBudgetMax, setReqBudgetMax] = useState("");
  const [reqCategory, setReqCategory] = useState("Ethnic Wear");
  const [reqSubmitted, setReqSubmitted] = useState(false);

  useEffect(() => {
    if (showRequirementModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showRequirementModal]);

  useEffect(() => {
    setActiveTab(fabMerchConfig.visibleTabs[0] ?? "merchandisers");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.userType]);

  if (fabMerchConfig.showTalentProfile) {
    return <TalentFabMerchProfile />;
  }

  const showMyHires = activeTab === "my-hires";
  const currentTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  const filteredProfessionals = currentTab.data
    .filter((professional) => {
      const query = searchText.trim().toLowerCase();
      const matchesSearch =
        !query ||
        professional.name.toLowerCase().includes(query) ||
        professional.city.toLowerCase().includes(query) ||
        professional.tags.some((tag) => tag.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === "All" ||
        professional.tags.includes(selectedCategory);

      const matchesCity =
        selectedCity === "All Cities" || professional.city === selectedCity;

      const matchesQcRelevance =
        currentTab.id !== "qc-inspectors" ||
        qcInspectorMatchesViewer(professional.extraPills, user.userType);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCity &&
        matchesExperience(professional.years, selectedExperience) &&
        matchesQcRelevance
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Most Experienced":
          return b.years - a.years;
        case "Most Projects":
          return projectsValue(b.countLabel) - projectsValue(a.countLabel);
        case "Top Rated":
        default:
          return b.fabScore - a.fabScore;
      }
    });

  const handleHire = (
    professional: Professional,
    tab: (typeof TABS)[number]
  ) => {
    setHireTarget({
      name: professional.name,
      rateRange: professional.rateRange,
      extraPills: professional.extraPills,
      stageQuestion: tab.stageQuestion,
      tabId: tab.id,
    });
  };

  const handleViewHires = () => {
    setHireTarget(null);
    setActiveTab("my-hires");
  };

  const toggleReqStage = (stage: string) => {
    setReqStages((current) =>
      current.includes(stage)
        ? current.filter((item) => item !== stage)
        : [...current, stage]
    );
  };

  const openRequirementModal = () => {
    setReqProfessionalType("Merchandiser");
    setReqStages([]);
    setReqDescription("");
    setReqStartDate("");
    setReqEndDate("");
    setReqBudgetMin("");
    setReqBudgetMax("");
    setReqCategory("Ethnic Wear");
    setReqSubmitted(false);
    setShowRequirementModal(true);
  };

  const closeRequirementModal = () => {
    setShowRequirementModal(false);
  };

  const handlePostRequirement = () => {
    setReqSubmitted(true);
  };

  const tabsBar = tabBarItems.length > 1 && (
    <div className="flex gap-6 border-b border-border-dark">
      {tabBarItems.map((tab) => (
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
  );

  const filterBar = (
    <>
      <div className="relative mt-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          🔍
        </span>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by name, specialisation, city..."
          className="w-full rounded-[6px] border border-border-dark bg-card py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
        />
      </div>

      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_PILLS.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => setSelectedCategory(pill)}
            className={`shrink-0 rounded-[20px] border px-4 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === pill
                ? "border-primary bg-primary text-navy"
                : "border-border-dark bg-card text-text-secondary"
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={selectedCity}
          onChange={(event) => setSelectedCity(event.target.value)}
          className={SELECT_CLASSNAME}
          style={SELECT_STYLE}
        >
          <option>All Cities</option>
          {ALL_CITIES.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        <select
          value={selectedExperience}
          onChange={(event) => setSelectedExperience(event.target.value)}
          className={SELECT_CLASSNAME}
          style={SELECT_STYLE}
        >
          {EXPERIENCE_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className={SELECT_CLASSNAME}
          style={SELECT_STYLE}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-[13px] text-text-secondary">
        Showing {filteredProfessionals.length} verified {currentTab.label.toLowerCase()}
      </p>
    </>
  );

  const browseRightPanel = (
    <>
      <p className="text-base font-bold text-white">How FabTalent Works</p>
      <div className="mt-4 flex flex-col gap-4">
        {[
          {
            icon: "🔍",
            title: "Browse verified professionals",
            desc: "All tested and interview-verified",
          },
          {
            icon: "📋",
            title: "Post your requirement",
            desc: "Describe what stage you need help with",
          },
          {
            icon: "🤝",
            title: "Hire with one click",
            desc: "Payment protected through escrow",
          },
          {
            icon: "✅",
            title: "Work inside FabVerify",
            desc: "All approvals and communication recorded",
          },
        ].map((step, index) => (
          <div key={step.title} className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[9999px] border border-border-dark text-[11px] font-bold text-text-secondary">
              {index + 1}
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">
                {step.icon} {step.title}
              </p>
              <p className="mt-0.5 text-[11px] text-text-secondary">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Why FabTalent?</p>
      <div className="mt-3 flex flex-col gap-2">
        {[
          "Every professional is verified through skill test or interview",
          "Pay per stage — no long term commitment",
          "All work recorded — institutional knowledge stays with your brand",
        ].map((point) => (
          <div key={point} className="flex items-start gap-2 text-xs text-text-secondary">
            <span className="text-primary">✓</span>
            <span>{point}</span>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Need Something Specific?</p>
      <p className="mt-2 text-xs text-text-secondary">
        Tell us what you need and we match you with the right professional
      </p>
      <button
        type="button"
        onClick={() => openRequirementModal()}
        className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-navy"
      >
        Post a Requirement →
      </button>
    </>
  );

  const rightPanel = showMyHires ? (
    <HireSummaryPanel
      onPostRequirement={openRequirementModal}
      onBrowseProfessionals={() =>
        setActiveTab(visibleTabList[0]?.id ?? "merchandisers")
      }
    />
  ) : (
    browseRightPanel
  );

  const myHiresContent = HIRES.length === 0 ? (
    <MyHiresEmptyState />
  ) : (
    <div className="mt-5">
      {HIRES.map((hire) => (
        <HireCard key={hire.id} hire={hire} />
      ))}
    </div>
  );

  const centrePanel = (
    <>
      <TopBar title="FabMerch" subtitle={fabMerchConfig.subtitle} />

      <div className="px-6 py-6">
        {tabsBar}
        {showMyHires ? (
          myHiresContent
        ) : (
          <>
        {filterBar}

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredProfessionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              tab={currentTab}
              onHire={handleHire}
            />
          ))}
        </div>

        {filteredProfessionals.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
            <div className="text-4xl">🔍</div>
            <p className="mt-3 text-sm text-text-primary">
              No professionals match your filters
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Try adjusting your search or clearing filters
            </p>
          </div>
        )}
          </>
        )}
      </div>
    </>
  );

  const requirementModal = showRequirementModal && (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={closeRequirementModal}
    >
      <div
        className="hide-scrollbar"
        style={{
          backgroundColor: "#0D1B33",
          border: "1px solid #1C3050",
          borderRadius: "12px",
          padding: "24px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {reqSubmitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="text-5xl">✅</div>
            <p className="mt-4 text-lg font-bold text-white">
              Requirement Posted!
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              We will match you with verified professionals within 24 hours
            </p>
            <button
              type="button"
              onClick={closeRequirementModal}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-navy"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-white">
                Post a Requirement
              </h2>
              <button
                type="button"
                onClick={closeRequirementModal}
                aria-label="Close"
                className="text-lg text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <p className="mb-6 mt-2 text-[13px] text-text-secondary">
              Tell us what you need and we will match you with the right
              verified professional
            </p>

            <div>
              <p className="text-[13px] text-text-secondary">
                What type of professional do you need?
              </p>
              <div className="mt-2 flex gap-2">
                {PROFESSIONAL_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReqProfessionalType(type)}
                    className={`flex-1 rounded-[20px] border px-3 py-2 text-xs font-medium transition-colors ${
                      reqProfessionalType === type
                        ? "border-primary bg-primary text-navy"
                        : "border-border-dark bg-card text-text-secondary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[13px] text-text-secondary">
                Which stage do you need help with?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => toggleReqStage(stage)}
                    className={`rounded-[20px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                      reqStages.includes(stage)
                        ? "border-primary bg-primary text-navy"
                        : "border-border-dark bg-card text-text-secondary"
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[13px] text-text-secondary">
                Describe your requirement:
              </p>
              <textarea
                value={reqDescription}
                onChange={(event) => setReqDescription(event.target.value)}
                placeholder="e.g. I need a merchandiser to manage my sampling process for 3 ethnic wear styles. Expected timeline is 3 weeks."
                rows={4}
                className="mt-2 w-full rounded-[6px] border border-border-dark bg-background p-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
              <p className="mt-1 text-[11px] italic text-text-secondary">
                The more detail you give the better the match
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[13px] text-text-secondary">Timeline:</p>
              <div className="mt-2 flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-text-secondary">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={reqStartDate}
                    onChange={(event) => setReqStartDate(event.target.value)}
                    className="mt-1 w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-text-secondary">
                    End date
                  </label>
                  <input
                    type="date"
                    value={reqEndDate}
                    onChange={(event) => setReqEndDate(event.target.value)}
                    className="mt-1 w-full rounded-[6px] border border-border-dark bg-background p-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[13px] text-text-secondary">
                Budget per stage:
              </p>
              <div className="mt-2 flex gap-3">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={reqBudgetMin}
                    onChange={(event) => setReqBudgetMin(event.target.value)}
                    placeholder="Min"
                    className="w-full rounded-[6px] border border-border-dark bg-background py-2.5 pl-7 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={reqBudgetMax}
                    onChange={(event) => setReqBudgetMax(event.target.value)}
                    placeholder="Max"
                    className="w-full rounded-[6px] border border-border-dark bg-background py-2.5 pl-7 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>
              <p className="mt-1 text-[11px] italic text-text-secondary">
                Leave blank if flexible
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[13px] text-text-secondary">
                Your category:
              </p>
              <select
                value={reqCategory}
                onChange={(event) => setReqCategory(event.target.value)}
                className="mt-2 w-full appearance-none rounded-[6px] border border-border-dark bg-background py-2.5 pl-3 pr-8 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                style={SELECT_STYLE}
              >
                {REQUIREMENT_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeRequirementModal}
                className="flex-1 rounded-lg border border-border-dark px-4 py-2.5 text-sm font-semibold text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostRequirement}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-navy"
              >
                Post Requirement →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col pb-20 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="text-lg text-text-primary"
          >
            🔔
          </button>
        </div>

        <div className="flex-1 px-4 py-5">
          <h1 className="font-display text-lg font-bold text-white">
            FabMerch
          </h1>
          <p className="text-[13px] text-text-secondary">
            {fabMerchConfig.subtitle}
          </p>

          <div className="mt-4">{tabsBar}</div>
          {showMyHires ? (
            myHiresContent
          ) : (
            <>
          {filterBar}

          <div className="mt-4 flex flex-col gap-3">
            {filteredProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                tab={currentTab}
                onHire={handleHire}
              />
            ))}
          </div>

          {filteredProfessionals.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
              <div className="text-4xl">🔍</div>
              <p className="mt-3 text-sm text-text-primary">
                No professionals match your filters
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Try adjusting your search or clearing filters
              </p>
            </div>
          )}
            </>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-border-dark bg-card">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-primary"
                  : "text-text-secondary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <HireModal
        professional={hireTarget}
        viewerUserType={user.userType}
        onClose={() => setHireTarget(null)}
        onViewHires={handleViewHires}
      />
      {requirementModal}
    </>
  );
}
