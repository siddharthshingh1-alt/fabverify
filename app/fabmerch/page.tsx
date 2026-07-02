"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThreePanelLayout from "../components/ThreePanelLayout";

const WORKSPACE_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard", active: false },
  { icon: "📦", label: "My Orders", href: "/orders", active: false },
  { icon: "🧵", label: "Find Manufacturers", href: "/manufacturers", active: false },
  { icon: "👔", label: "FabMerch", href: "/fabmerch", active: true },
  { icon: "💳", label: "FabScore & Credit", href: "/credit", active: false },
];

const TOOLS_NAV = [
  { icon: "📋", label: "Sample Briefs", href: "/samples", active: false },
  { icon: "💰", label: "FabPrice", href: "/fabprice", active: false },
  { icon: "📊", label: "Analytics", href: "/analytics", active: false },
];

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", active: false },
  { icon: "📦", label: "Orders", active: false },
  { icon: "🔍", label: "Discover", active: false },
  { icon: "👔", label: "Merch", active: true },
  { icon: "👤", label: "Profile", active: false },
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

type TabId = "merchandisers" | "designers" | "masters";

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
};

const ALL_STAGES = [
  "Design",
  "Sourcing",
  "Sampling",
  "Production",
  "QC",
  "Dispatch",
];

const MERCHANDISERS: Professional[] = [
  {
    id: "meera-sharma",
    name: "Meera Sharma",
    city: "Delhi NCR",
    fabScore: 9.8,
    tags: ["Ethnic Wear", "Luxury", "Sustainable"],
    years: 12,
    countLabel: "89 projects",
    qualityLabel: "99% on time",
    extraPills: ["Design", "Sourcing", "Sampling", "Production", "QC", "Dispatch"],
    rateRange: "₹12,000 – ₹20,000 per stage",
  },
  {
    id: "rahul-verma",
    name: "Rahul Verma",
    city: "Mumbai",
    fabScore: 9.5,
    tags: ["Western Wear", "Denim", "Activewear"],
    years: 8,
    countLabel: "67 projects",
    qualityLabel: "98% on time",
    extraPills: ["Sourcing", "Sampling", "Production", "QC"],
    rateRange: "₹8,000 – ₹15,000 per stage",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    city: "Tirupur",
    fabScore: 9.3,
    tags: ["Knitwear", "Activewear", "Kids Wear"],
    years: 6,
    countLabel: "54 projects",
    qualityLabel: "97% on time",
    extraPills: ["Sourcing", "Production", "QC", "Dispatch"],
    rateRange: "₹6,000 – ₹12,000 per stage",
  },
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    city: "Jaipur",
    fabScore: 9.6,
    tags: ["Ethnic Wear", "Block Print", "Artisan"],
    years: 10,
    countLabel: "78 projects",
    qualityLabel: "98% on time",
    extraPills: ["Design", "Sourcing", "Sampling", "Production", "QC"],
    rateRange: "₹10,000 – ₹18,000 per stage",
  },
  {
    id: "fatima-sheikh",
    name: "Fatima Sheikh",
    city: "Surat",
    fabScore: 9.1,
    tags: ["Luxury", "Western Wear", "Export"],
    years: 7,
    countLabel: "43 projects",
    qualityLabel: "96% on time",
    extraPills: ["Sourcing", "Sampling", "Production", "QC", "Dispatch"],
    rateRange: "₹8,000 – ₹14,000 per stage",
  },
  {
    id: "vikram-singh",
    name: "Vikram Singh",
    city: "Ahmedabad",
    fabScore: 9.4,
    tags: ["Cotton", "Ethnic Wear", "Sustainable"],
    years: 9,
    countLabel: "61 projects",
    qualityLabel: "97% on time",
    extraPills: ["Design", "Sourcing", "Sampling", "Production"],
    rateRange: "₹9,000 – ₹16,000 per stage",
  },
];

const DESIGNERS: Professional[] = [
  {
    id: "ananya-kapoor",
    name: "Ananya Kapoor",
    city: "Mumbai",
    fabScore: 9.7,
    tags: ["Ethnic Wear", "Luxury", "Fusion"],
    years: 9,
    countLabel: "234 tech packs",
    qualityLabel: "99% accuracy",
    extraPills: ["Illustrator", "Hand Sketch", "CLO 3D"],
    rateRange: "₹3,500 – ₹6,000 per tech pack",
  },
  {
    id: "rohit-das",
    name: "Rohit Das",
    city: "Delhi NCR",
    fabScore: 9.4,
    tags: ["Western Wear", "Denim", "Streetwear"],
    years: 6,
    countLabel: "178 tech packs",
    qualityLabel: "97% accuracy",
    extraPills: ["Illustrator", "CAD", "Photoshop"],
    rateRange: "₹2,500 – ₹4,500 per tech pack",
  },
  {
    id: "kavya-menon",
    name: "Kavya Menon",
    city: "Bangalore",
    fabScore: 9.2,
    tags: ["Activewear", "Sustainable", "Kids Wear"],
    years: 5,
    countLabel: "143 tech packs",
    qualityLabel: "96% accuracy",
    extraPills: ["CLO 3D", "Illustrator", "Hand Sketch"],
    rateRange: "₹2,000 – ₹4,000 per tech pack",
  },
  {
    id: "zara-khan",
    name: "Zara Khan",
    city: "Jaipur",
    fabScore: 9.6,
    tags: ["Ethnic Wear", "Block Print", "Artisan Craft"],
    years: 8,
    countLabel: "198 tech packs",
    qualityLabel: "98% accuracy",
    extraPills: ["Illustrator", "Hand Sketch", "Photoshop"],
    rateRange: "₹3,000 – ₹5,500 per tech pack",
  },
  {
    id: "aditya-rao",
    name: "Aditya Rao",
    city: "Chennai",
    fabScore: 9.0,
    tags: ["Menswear", "Formal", "Western"],
    years: 4,
    countLabel: "112 tech packs",
    qualityLabel: "95% accuracy",
    extraPills: ["CAD", "Illustrator"],
    rateRange: "₹2,000 – ₹3,500 per tech pack",
  },
  {
    id: "pooja-iyer",
    name: "Pooja Iyer",
    city: "Hyderabad",
    fabScore: 9.3,
    tags: ["Luxury", "Fusion", "Bridal"],
    years: 7,
    countLabel: "167 tech packs",
    qualityLabel: "97% accuracy",
    extraPills: ["Illustrator", "CLO 3D", "Hand Sketch"],
    rateRange: "₹3,500 – ₹6,500 per tech pack",
  },
];

const MASTERS: Professional[] = [
  {
    id: "ramesh-kumar",
    name: "Ramesh Kumar",
    city: "Delhi NCR",
    fabScore: 9.9,
    tags: ["Ethnic Wear", "Luxury", "Complex Construction"],
    years: 20,
    countLabel: "312 samples",
    qualityLabel: "99% first attempt",
    extraPills: ["Pattern Making", "Draping", "Grading"],
    rateRange: "₹2,500 – ₹5,000 per sample",
  },
  {
    id: "suresh-pillai",
    name: "Suresh Pillai",
    city: "Mumbai",
    fabScore: 9.7,
    tags: ["Western Wear", "Tailored", "Menswear"],
    years: 15,
    countLabel: "267 samples",
    qualityLabel: "98% first attempt",
    extraPills: ["Pattern Making", "Tailoring"],
    rateRange: "₹2,000 – ₹4,500 per sample",
  },
  {
    id: "mohan-lal",
    name: "Mohan Lal",
    city: "Jaipur",
    fabScore: 9.5,
    tags: ["Ethnic Wear", "Block Print", "Lightweight Fabrics"],
    years: 12,
    countLabel: "198 samples",
    qualityLabel: "97% first attempt",
    extraPills: ["Pattern Making", "Draping"],
    rateRange: "₹1,500 – ₹3,500 per sample",
  },
  {
    id: "krishnan-nair",
    name: "Krishnan Nair",
    city: "Tirupur",
    fabScore: 9.6,
    tags: ["Knitwear", "Activewear", "Stretch Fabrics"],
    years: 14,
    countLabel: "223 samples",
    qualityLabel: "98% first attempt",
    extraPills: ["Pattern Making", "Grading"],
    rateRange: "₹1,500 – ₹3,000 per sample",
  },
  {
    id: "abdul-karim",
    name: "Abdul Karim",
    city: "Lucknow",
    fabScore: 9.4,
    tags: ["Chikankari", "Embroidered", "Delicate Fabrics"],
    years: 18,
    countLabel: "189 samples",
    qualityLabel: "97% first attempt",
    extraPills: ["Draping", "Pattern Making"],
    rateRange: "₹2,000 – ₹4,000 per sample",
  },
  {
    id: "ganesh-rao",
    name: "Ganesh Rao",
    city: "Bangalore",
    fabScore: 9.3,
    tags: ["Western Wear", "Denim", "Casual"],
    years: 10,
    countLabel: "156 samples",
    qualityLabel: "96% first attempt",
    extraPills: ["Pattern Making", "Grading"],
    rateRange: "₹1,500 – ₹3,000 per sample",
  },
];

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
];

const ALL_CITIES = Array.from(
  new Set(
    [...MERCHANDISERS, ...DESIGNERS, ...MASTERS].map((person) => person.city)
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

type ModalProfessional = Professional & {
  stageQuestion: string;
};

function ProfessionalCard({
  professional,
  tab,
  onHire,
}: {
  professional: Professional;
  tab: (typeof TABS)[number];
  onHire: (professional: Professional, tab: (typeof TABS)[number]) => void;
}) {
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

      <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-primary">
          {professional.rateRange}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
          >
            View Profile
          </button>
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

export default function FabMerch() {
  const [activeTab, setActiveTab] = useState<TabId>("merchandisers");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedExperience, setSelectedExperience] =
    useState("Any Experience");
  const [sortBy, setSortBy] = useState("Top Rated");

  const [showModal, setShowModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] =
    useState<ModalProfessional | null>(null);
  const [selectedStage, setSelectedStage] = useState("");
  const [requirementText, setRequirementText] = useState("");
  const [timelineDate, setTimelineDate] = useState("");

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
    if (showModal || showRequirementModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal, showRequirementModal]);

  const currentTab = TABS.find((tab) => tab.id === activeTab)!;

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

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCity &&
        matchesExperience(professional.years, selectedExperience)
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
    setSelectedProfessional({
      ...professional,
      stageQuestion: tab.stageQuestion,
    });
    setSelectedStage(professional.extraPills[0] ?? "");
    setRequirementText("");
    setTimelineDate("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProfessional(null);
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

  const tabsBar = (
    <div className="flex gap-6 border-b border-border-dark">
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

  const rightPanel = (
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

  const leftPanel = (
    <div className="flex min-h-full flex-col">
      <div className="p-5">
        <div className="flex items-center gap-1 font-display text-lg font-bold">
          <span>🧵</span>
          <span className="text-white">Fab</span>
          <span className="text-primary">Verify</span>
        </div>

        <p className="mt-5 text-sm text-white">
          Good morning, Siddharth 👋
        </p>
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          Brand Builder
        </span>
      </div>

      <div className="mt-4">
        <p className="px-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Workspace
        </p>
        <nav className="mt-2 flex flex-col">
          {WORKSPACE_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 border-l-2 px-5 py-2.5 text-left text-sm font-medium transition-colors ${
                item.active
                  ? "border-primary bg-primary/[0.08] text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <p className="px-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Tools
        </p>
        <nav className="mt-2 flex flex-col">
          {TOOLS_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 border-l-2 border-transparent px-5 py-2.5 text-left text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-border-dark p-5">
        <p className="text-xs text-text-secondary">Your FabScore</p>
        <p className="mt-1 font-display text-2xl font-bold text-primary">
          —
        </p>
        <p className="mt-1 text-[11px] text-text-secondary">
          Complete verification to unlock
        </p>
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-navy"
        >
          Get Verified
        </button>
      </div>
    </div>
  );

  const centrePanel = (
    <>
      <div
        className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border-dark px-6"
        style={{ backgroundColor: "#07122a" }}
      >
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            FabMerch
          </h1>
          <p className="text-[13px] text-text-secondary">
            Hire verified garment professionals per stage
          </p>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="text-lg text-text-primary"
        >
          🔔
        </button>
      </div>

      <div className="px-6 py-6">
        {tabsBar}
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
      </div>
    </>
  );

  const hireModal = showModal && selectedProfessional && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-[480px] rounded-xl border border-border-dark bg-card p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white">
          Hire {selectedProfessional.name}
        </h2>

        <div className="mt-5">
          <p className="text-sm font-medium text-text-primary">
            {selectedProfessional.stageQuestion}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedProfessional.extraPills.map((pill) => (
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
            {selectedProfessional.rateRange}
          </p>
          <p className="mt-1 text-[12px] text-text-secondary">
            Your payment will be held in escrow until work is approved
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg border border-border-dark px-4 py-2 text-sm font-semibold text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
          >
            Send Hire Request →
          </button>
        </div>
      </div>
    </div>
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
        left={leftPanel}
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
            Hire verified garment professionals per stage
          </p>

          <div className="mt-4">{tabsBar}</div>
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
        </div>

        <nav className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-border-dark bg-card">
          {BOTTOM_NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                item.active ? "text-primary" : "text-text-secondary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {hireModal}
      {requirementModal}
    </>
  );
}
