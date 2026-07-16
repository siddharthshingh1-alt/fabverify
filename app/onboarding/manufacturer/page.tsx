"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CardOption,
  OnboardingHeader,
  PillMultiSelect,
  StateDropdown,
  StepNav,
  TextField,
} from "../components";
import { useUser } from "../../context/UserContext";

const TOTAL_STEPS = 4;

const UNIT_TYPES = [
  {
    id: "own-factory",
    emoji: "🏭",
    title: "Own Factory",
    description: "I have my own production unit",
  },
  {
    id: "home-unit",
    emoji: "🏠",
    title: "Home Unit",
    description: "I work from home or small space",
  },
  {
    id: "shared-unit",
    emoji: "🤝",
    title: "Shared Factory",
    description: "I share a production unit with other manufacturers",
  },
];

const CATEGORIES = [
  { id: "ethnic", emoji: "👗", label: "Ethnic Wear" },
  { id: "casual", emoji: "👕", label: "Casual Wear" },
  { id: "active", emoji: "🏃", label: "Activewear" },
  { id: "kids", emoji: "👶", label: "Kids Wear" },
  { id: "western", emoji: "👔", label: "Western Wear" },
  { id: "luxury", emoji: "✨", label: "Luxury" },
];

const TECHNIQUE_OPTIONS = [
  "Block Print",
  "Hand Embroidery",
  "Chikankari",
  "Screen Print",
  "Digital Print",
  "Plain Stitch",
  "Denim Wash",
];

const CAPACITY_OPTIONS = [
  { id: "under-500", label: "Under 500 pieces/month" },
  { id: "500-2000", label: "500 to 2,000 pieces/month" },
  { id: "2000-10000", label: "2,000 to 10,000 pieces/month" },
  { id: "above-10000", label: "Above 10,000 pieces/month" },
];

const LEAD_TIME_OPTIONS = ["7-14 days", "14-21 days", "21-30 days", "30+ days"];

const MOQ_UNITS = ["pieces", "metres", "kg"];

export default function ManufacturerOnboarding() {
  const router = useRouter();
  const { setUser } = useUser();
  const [step, setStep] = useState(1);

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [unitType, setUnitType] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [techniques, setTechniques] = useState<string[]>([]);

  const [capacity, setCapacity] = useState<string | null>(null);
  const [leadTime, setLeadTime] = useState<string | null>(null);
  const [moq, setMoq] = useState("");
  const [moqUnit, setMoqUnit] = useState("pieces");

  const toggleCategory = (id: string) => {
    setCategories((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleTechnique = (value: string) => {
    setTechniques((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const isStepValid = (() => {
    switch (step) {
      case 1:
        return businessName.trim() !== "" && city.trim() !== "" && state !== "" && unitType !== null;
      case 2:
        return categories.length > 0;
      case 3:
        return capacity !== null && leadTime !== null && moq.trim() !== "";
      default:
        return true;
    }
  })();

  const handleBack = () => setStep((current) => Math.max(1, current - 1));
  const handleContinue = () => {
    if (!isStepValid) return;
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const stepLabel = `Step ${step} of ${TOTAL_STEPS}`;

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
              Tell us about your unit
            </h1>

            <div className="mt-6 flex flex-col gap-4">
              <TextField
                id="businessName"
                label="Business / factory name"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Sharma Garments"
              />
              <TextField
                id="city"
                label="City"
                value={city}
                onChange={setCity}
                placeholder="e.g. Tirupur"
              />
              <div>
                <label className="mb-2 block text-sm text-text-primary">
                  State
                </label>
                <StateDropdown value={state} onChange={setState} />
              </div>
            </div>

            <p className="mb-3 mt-6 text-sm font-medium text-text-primary">
              Type of unit
            </p>
            <div className="grid grid-cols-2 gap-3">
              {UNIT_TYPES.map((unit) => (
                <CardOption
                  key={unit.id}
                  emoji={unit.emoji}
                  title={unit.title}
                  description={unit.description}
                  isSelected={unitType === unit.id}
                  onClick={() => setUnitType(unit.id)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              What do you specialise in?
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Select all that apply
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {CATEGORIES.map((category) => (
                <CardOption
                  key={category.id}
                  emoji={category.emoji}
                  title={category.label}
                  description=""
                  isSelected={categories.includes(category.id)}
                  onClick={() => toggleCategory(category.id)}
                />
              ))}
            </div>

            <p className="mb-3 mt-8 text-sm font-medium text-text-primary">
              What techniques do you use?
            </p>
            <PillMultiSelect
              options={TECHNIQUE_OPTIONS.concat(
                techniques.filter((t) => !TECHNIQUE_OPTIONS.includes(t))
              )}
              selected={techniques}
              onToggle={toggleTechnique}
              onAddCustom={(value) =>
                setTechniques((current) =>
                  current.includes(value) ? current : [...current, value]
                )
              }
            />
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              What is your production capacity?
            </h1>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CAPACITY_OPTIONS.map((option) => (
                <CardOption
                  key={option.id}
                  emoji="📦"
                  title={option.label}
                  description=""
                  isSelected={capacity === option.id}
                  onClick={() => setCapacity(option.id)}
                />
              ))}
            </div>

            <p className="mb-3 mt-8 text-sm font-medium text-text-primary">
              How long for bulk orders?
            </p>
            <PillMultiSelect
              options={LEAD_TIME_OPTIONS}
              selected={leadTime ? [leadTime] : []}
              onToggle={(value) => setLeadTime(value)}
              single
            />

            <p className="mb-2 mt-8 text-sm font-medium text-text-primary">
              Minimum order quantity
            </p>
            <div className="flex gap-3">
              <input
                type="number"
                min={0}
                value={moq}
                onChange={(event) => setMoq(event.target.value)}
                placeholder="e.g. 100"
                className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
              <select
                value={moqUnit}
                onChange={(event) => setMoqUnit(event.target.value)}
                className="appearance-none rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary"
              >
                {MOQ_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <VerificationStep
            onGetVerified={() => {
              setUser({
                name: businessName || "User",
                userType: "manufacturer",
                verificationTier: "bronze",
                fabscore: 0,
                city,
              });
              router.push("/verification");
            }}
            onSkip={() => {
              setUser({
                name: businessName || "User",
                userType: "manufacturer",
                verificationTier: "bronze",
                fabscore: 0,
                city,
              });
              router.push("/dashboard");
            }}
          />
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

function VerificationStep({
  onGetVerified,
  onSkip,
}: {
  onGetVerified: () => void;
  onSkip: () => void;
}) {
  const tiers = [
    {
      emoji: "🥉",
      name: "Bronze",
      color: "#CD7F32",
      unlocks: ["Listed on FabVerify", "Basic profile visible", "Can receive enquiries"],
      priceTag: "Free • 24 hours",
    },
    {
      emoji: "🥈",
      name: "Silver",
      color: "#94a3b8",
      unlocks: ["Everything in Bronze", "FabFloat & FabPay Later", "₹2L credit limit"],
      priceTag: "₹999 • 2-3 days",
    },
    {
      emoji: "🥇",
      name: "Gold",
      color: "#f2ca50",
      unlocks: ["Everything in Silver", "₹10L credit limit", "International buyer access"],
      priceTag: "₹4,999 • 5-7 days",
    },
  ];

  return (
    <div className="mt-8">
      <h1 className="font-display text-2xl font-bold text-white">
        Get verified to start receiving orders
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="rounded-[12px] bg-card p-5"
            style={{ borderTop: `3px solid ${tier.color}` }}
          >
            <h3 className="font-display text-lg font-bold" style={{ color: tier.color }}>
              {tier.emoji} {tier.name}
            </h3>
            <span className="mt-2 inline-block rounded-[20px] border border-border-dark bg-background px-2.5 py-1 text-[11px] text-text-secondary">
              {tier.priceTag}
            </span>
            <div className="mt-4 flex flex-col gap-1.5 border-t border-border-dark pt-4">
              {tier.unlocks.map((item) => (
                <p key={item} className="text-[13px] text-text-secondary">
                  ✅ {item}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-6 rounded-[6px] p-3.5"
        style={{ backgroundColor: "#07122a", borderLeft: "2px solid #f2ca50" }}
      >
        <p className="text-sm text-text-secondary">
          We recommend starting with Bronze — it is free and takes 24 hours
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onGetVerified}
          className="flex-1 rounded-lg bg-primary py-3.5 text-sm font-bold text-navy"
        >
          Get Bronze Verified →
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-lg bg-border-dark py-3.5 text-sm font-bold text-text-secondary"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}
