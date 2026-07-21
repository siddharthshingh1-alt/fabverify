"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  OnboardingHeader,
  PillMultiSelect,
  StepNav,
  TextField,
  UploadBox,
} from "../components";
import { useUser } from "../../context/UserContext";
import { getBasePath } from "../../lib/routing";
import { consumePendingChatRedirect } from "../../lib/postAuthRedirect";

const TOTAL_STEPS = 4;

type TalentType = "designer" | "master" | "merchandiser" | "qc_inspector";

const CATEGORIES = [
  { id: "ethnic", emoji: "👗", label: "Ethnic Wear" },
  { id: "casual", emoji: "👕", label: "Casual Wear" },
  { id: "active", emoji: "🏃", label: "Activewear" },
  { id: "kids", emoji: "👶", label: "Kids Wear" },
  { id: "western", emoji: "👔", label: "Western Wear" },
  { id: "luxury", emoji: "✨", label: "Luxury" },
];

const CITY_OPTIONS = [
  "Delhi",
  "Mumbai",
  "Jaipur",
  "Surat",
  "Tirupur",
  "Lucknow",
  "Ahmedabad",
  "Kolkata",
];

const TURNAROUND_OPTIONS = ["Same day", "Next day", "2-3 days"];

type TypeConfig = {
  step1Heading: string;
  categoriesQuestion: string;
  skillsQuestion: string;
  skillOptions: string[];
  skillsAllowCustom: boolean;
  rateLabel: string;
  rateIsRange: boolean;
  portfolioHeading: string;
  portfolioUploadCount: number;
  portfolioOptional: boolean;
  verificationSteps: string[];
};

const TYPE_CONFIG: Record<TalentType, TypeConfig> = {
  designer: {
    step1Heading: "Tell us about your design experience",
    categoriesQuestion: "Which categories do you design for?",
    skillsQuestion: "Software skills",
    skillOptions: ["Illustrator", "CAD", "CLO 3D", "Photoshop", "Hand Sketch"],
    skillsAllowCustom: true,
    rateLabel: "₹ per tech pack",
    rateIsRange: false,
    portfolioHeading: "Upload 3 sample tech packs or sketches",
    portfolioUploadCount: 3,
    portfolioOptional: false,
    verificationSteps: [
      "Portfolio review by our design panel",
      "Skill test — create a tech pack from reference",
      "Client reference check",
    ],
  },
  master: {
    step1Heading: "Tell us about your sample expertise",
    categoriesQuestion: "Garment categories you specialise in",
    skillsQuestion: "Skills",
    skillOptions: [
      "Pattern Making",
      "Draping",
      "Grading",
      "Tailoring",
      "Knit Construction",
    ],
    skillsAllowCustom: true,
    rateLabel: "₹ per sample",
    rateIsRange: false,
    portfolioHeading: "Upload photos of samples you have made",
    portfolioUploadCount: 3,
    portfolioOptional: false,
    verificationSteps: [
      "Portfolio review",
      "Physical skill assessment — commissioned test sample",
      "Equipment verification",
    ],
  },
  merchandiser: {
    step1Heading: "Tell us about your merchandising experience",
    categoriesQuestion: "Categories you work in",
    skillsQuestion: "Stages you handle",
    skillOptions: ["Design", "Sourcing", "Sampling", "Production", "QC", "Dispatch"],
    skillsAllowCustom: false,
    rateLabel: "₹ per stage",
    rateIsRange: true,
    portfolioHeading: "Describe your most successful project",
    portfolioUploadCount: 0,
    portfolioOptional: true,
    verificationSteps: [
      "Portfolio and experience review",
      "30-minute video interview with senior panel",
      "Client reference check",
    ],
  },
  qc_inspector: {
    step1Heading: "Tell us about your QC experience",
    categoriesQuestion: "Categories you inspect",
    skillsQuestion: "Inspection types",
    skillOptions: [
      "Pre-production",
      "In-line",
      "Pre-dispatch",
      "Post-delivery",
      "Factory Audit",
    ],
    skillsAllowCustom: true,
    rateLabel: "₹ per inspection",
    rateIsRange: false,
    portfolioHeading: "Upload a sample inspection report (optional)",
    portfolioUploadCount: 1,
    portfolioOptional: true,
    verificationSteps: [
      "Experience and qualification review",
      "Practical test — identify defects in sample garments",
      "Client reference check",
    ],
  },
};

export default function TalentOnboarding() {
  const router = useRouter();
  const { setUser } = useUser();
  const [talentType, setTalentType] = useState<TalentType>("designer");
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [employer, setEmployer] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [travelCities, setTravelCities] = useState<string[]>([]);

  const [portfolioFiles, setPortfolioFiles] = useState<(string | undefined)[]>([]);
  const [projectDescription, setProjectDescription] = useState("");
  const [rate, setRate] = useState("");
  const [rateMax, setRateMax] = useState("");
  const [turnaround, setTurnaround] = useState(TURNAROUND_OPTIONS[0]);

  useEffect(() => {
    const stored = localStorage.getItem("userType");
    if (
      stored === "designer" ||
      stored === "master" ||
      stored === "merchandiser" ||
      stored === "qc_inspector"
    ) {
      setTalentType(stored);
    }
  }, []);

  const config = TYPE_CONFIG[talentType];

  const toggleCategory = (id: string) => {
    setCategories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSkill = (value: string) => {
    setSkills((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const toggleCity = (value: string) => {
    setTravelCities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const isStepValid = (() => {
    switch (step) {
      case 1:
        return fullName.trim() !== "" && city.trim() !== "" && yearsExperience.trim() !== "";
      case 2:
        return categories.length > 0 && skills.length > 0 && travelCities.length > 0;
      case 3:
        return rate.trim() !== "" && (!config.rateIsRange || rateMax.trim() !== "");
      default:
        return true;
    }
  })();

  const handleBack = () => setStep((current) => Math.max(1, current - 1));
  const handleContinue = () => {
    if (!isStepValid) return;
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const finish = (verified: boolean) => {
    setUser({
      name: fullName || "User",
      userType: talentType,
      verificationTier: "bronze",
      fabscore: 0,
      city,
    });
    if (talentType === "qc_inspector") {
      localStorage.setItem("qcCitiesCovered", travelCities.join(", "));
      localStorage.setItem("qcTurnaround", turnaround);
    }
    if (verified) {
      router.push(`${getBasePath(talentType)}/verification`);
      return;
    }
    router.push(consumePendingChatRedirect() ?? `${getBasePath(talentType)}/dashboard`);
  };

  const stepLabel = `Step ${step} of ${TOTAL_STEPS}`;
  const skillOptions = config.skillOptions.concat(
    skills.filter((item) => !config.skillOptions.includes(item))
  );
  const cityOptions = CITY_OPTIONS.concat(
    travelCities.filter((item) => !CITY_OPTIONS.includes(item))
  );

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
        <OnboardingHeader step={step} totalSteps={TOTAL_STEPS} stepLabel={stepLabel} />

        {step === 1 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              {config.step1Heading}
            </h1>

            <div className="mt-6 flex flex-col gap-4">
              <TextField id="fullName" label="Full name" value={fullName} onChange={setFullName} />
              <TextField id="city" label="City" value={city} onChange={setCity} />
              <div>
                <label
                  htmlFor="yearsExperience"
                  className="mb-2 block text-sm text-text-primary"
                >
                  Years of experience
                </label>
                <input
                  id="yearsExperience"
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(event) => setYearsExperience(event.target.value)}
                  className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary"
                />
              </div>
              <TextField
                id="employer"
                label="Current / last employer (optional)"
                value={employer}
                onChange={setEmployer}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              {config.categoriesQuestion}
            </h1>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {CATEGORIES.map((category) => {
                const isSelected = categories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`relative rounded-xl border p-4 text-center transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border-dark bg-card"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute right-2 top-2 font-bold text-primary">
                        ✓
                      </span>
                    )}
                    <div className="text-[28px]">{category.emoji}</div>
                    <div className="mt-2 text-[13px] font-bold text-white">
                      {category.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mb-3 mt-8 text-sm font-medium text-text-primary">
              {config.skillsQuestion}
            </p>
            <PillMultiSelect
              options={skillOptions}
              selected={skills}
              onToggle={toggleSkill}
              onAddCustom={
                config.skillsAllowCustom
                  ? (value) =>
                      setSkills((current) =>
                        current.includes(value) ? current : [...current, value]
                      )
                  : undefined
              }
            />

            <p className="mb-3 mt-8 text-sm font-medium text-text-primary">
              Cities you can travel to
            </p>
            <PillMultiSelect
              options={cityOptions}
              selected={travelCities}
              onToggle={toggleCity}
              onAddCustom={(value) =>
                setTravelCities((current) =>
                  current.includes(value) ? current : [...current, value]
                )
              }
            />
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              {config.portfolioHeading}
            </h1>

            {config.portfolioUploadCount > 0 && (
              <div
                className={`mt-6 grid gap-4 ${
                  config.portfolioUploadCount === 1
                    ? "grid-cols-1 sm:max-w-xs"
                    : "grid-cols-1 sm:grid-cols-3"
                }`}
              >
                {Array.from({ length: config.portfolioUploadCount }).map((_, index) => (
                  <UploadBox
                    key={index}
                    emoji="📤"
                    title={`Upload ${index + 1}`}
                    subtitle="JPG, PNG or PDF"
                    fileName={portfolioFiles[index]}
                    onFile={(file) =>
                      setPortfolioFiles((current) => {
                        const next = [...current];
                        next[index] = file?.name;
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            )}

            {talentType === "merchandiser" && (
              <textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                placeholder="Tell us about a project you're proud of..."
                rows={4}
                className="mt-6 w-full rounded-[6px] border border-border-dark bg-navy p-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
            )}

            <p className="mb-2 mt-8 text-sm font-medium text-text-primary">
              Your rate
            </p>
            {config.rateIsRange ? (
              <div className="flex gap-3">
                <input
                  type="number"
                  min={0}
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  placeholder={`Min ${config.rateLabel}`}
                  className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                />
                <input
                  type="number"
                  min={0}
                  value={rateMax}
                  onChange={(event) => setRateMax(event.target.value)}
                  placeholder={`Max ${config.rateLabel}`}
                  className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                />
              </div>
            ) : (
              <input
                type="number"
                min={0}
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder={config.rateLabel}
                className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
            )}

            {talentType === "qc_inspector" && (
              <div className="mt-6">
                <label className="mb-2 block text-sm text-text-primary">
                  Inspection turnaround time
                </label>
                <select
                  value={turnaround}
                  onChange={(event) => setTurnaround(event.target.value)}
                  className="w-full appearance-none rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary"
                >
                  {TURNAROUND_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              How FabTalent verification works
            </h1>

            <div className="mt-6 flex flex-col gap-4">
              {config.verificationSteps.map((text, index) => (
                <div
                  key={text}
                  className="flex items-start gap-4 rounded-xl border border-border-dark bg-card p-4"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm text-text-primary">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => finish(true)}
                className="flex-1 rounded-lg bg-primary py-3.5 text-sm font-bold text-navy"
              >
                Apply for Verification →
              </button>
              <button
                type="button"
                onClick={() => finish(false)}
                className="flex-1 rounded-lg bg-border-dark py-3.5 text-sm font-bold text-text-secondary"
              >
                Skip — start as unverified →
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-text-secondary">
              Unverified profiles get fewer enquiries and appear lower in search
            </p>
          </div>
        )}

        {step < TOTAL_STEPS && (
          <StepNav
            step={step}
            totalSteps={TOTAL_STEPS}
            isValid={isStepValid}
            onBack={handleBack}
            onContinue={handleContinue}
          />
        )}
      </div>
    </div>
  );
}
