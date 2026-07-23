"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  OnboardingHeader,
  PillMultiSelect,
  StateDropdown,
  StepNav,
  TextField,
} from "../components";
import { useUser } from "../../context/UserContext";
import { getBasePath } from "../../lib/routing";
import { consumePendingChatRedirect } from "../../lib/postAuthRedirect";

const TOTAL_STEPS = 3;

type SupplierType = "fabric_mill" | "trim_supplier" | "job_worker";

const HEADINGS: Record<SupplierType, string> = {
  fabric_mill: "Tell us about your mill",
  trim_supplier: "Tell us about your business",
  job_worker: "Tell us about your work",
};

const OFFER_HEADINGS: Record<SupplierType, string> = {
  fabric_mill: "What fabrics do you produce or sell?",
  trim_supplier: "What trims do you supply?",
  job_worker: "What work do you do?",
};

const OFFER_OPTIONS: Record<SupplierType, string[]> = {
  fabric_mill: ["Cotton", "Silk", "Linen", "Polyester", "Blended", "Wool", "Jute"],
  trim_supplier: [
    "Buttons",
    "Zips",
    "Elastic",
    "Labels",
    "Thread",
    "Lining",
    "Interfacing",
  ],
  job_worker: [
    "Embroidery",
    "Printing",
    "Washing",
    "Dyeing",
    "Cutting",
    "Finishing",
    "Packing",
  ],
};

const YEARS_OPTIONS = ["Under 1yr", "1-3 yrs", "3-5 yrs", "5-10 yrs", "10+ yrs"];

const MOQ_UNITS = ["metres", "kg"];

const CONTACT_OPTIONS = [
  {
    id: "sample-briefs",
    emoji: "📋",
    title: "Through sample briefs",
    description: "Buyers post briefs, I respond",
  },
  {
    id: "direct-enquiry",
    emoji: "💬",
    title: "Direct enquiry",
    description: "Buyers message me directly",
  },
];

export default function SupplierOnboarding() {
  const router = useRouter();
  const { setUser } = useUser();
  const [supplierType, setSupplierType] = useState<SupplierType>("fabric_mill");
  const [step, setStep] = useState(1);

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState<string | null>(null);

  const [offerings, setOfferings] = useState<string[]>([]);
  const [moq, setMoq] = useState("");
  const [moqUnit, setMoqUnit] = useState("metres");

  const [contactMethods, setContactMethods] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("userType");
    if (stored === "fabric_mill" || stored === "trim_supplier" || stored === "job_worker") {
      setSupplierType(stored);
    }
  }, []);

  const toggleOffering = (value: string) => {
    setOfferings((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const toggleContact = (id: string) => {
    setContactMethods((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const isStepValid = (() => {
    switch (step) {
      case 1:
        return (
          businessName.trim() !== "" &&
          city.trim() !== "" &&
          state !== "" &&
          yearsInBusiness !== null
        );
      case 2:
        return offerings.length > 0;
      case 3:
        return contactMethods.length > 0;
      default:
        return true;
    }
  })();

  const handleBack = () => setStep((current) => Math.max(1, current - 1));
  const handleContinue = async () => {
    if (!isStepValid) return;
    if (step === TOTAL_STEPS) {
      const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
      if (auth.phone) {
        try {
          const res = await fetch("/api/profile-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: auth.phone,
              profileData: {
                businessName,
                supplierType,
                yearsInBusiness,
                offerings,
                moq: supplierType === "fabric_mill" ? moq : undefined,
                moqUnit: supplierType === "fabric_mill" ? moqUnit : undefined,
                contactMethods,
              },
            }),
          });
          if (!res.ok) {
            const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
            console.error("Profile data save error:", error);
          }
        } catch (error) {
          console.error("Profile data save error:", error);
        }
      }

      setUser({
        name: businessName || "User",
        userType: supplierType,
        verificationTier: "bronze",
        fabscore: 0,
        city,
      });
      router.push(consumePendingChatRedirect() ?? `${getBasePath(supplierType)}/dashboard`);
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const stepLabel = `Step ${step} of ${TOTAL_STEPS}`;
  const offerOptions = OFFER_OPTIONS[supplierType].concat(
    offerings.filter((item) => !OFFER_OPTIONS[supplierType].includes(item))
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
              {HEADINGS[supplierType]}
            </h1>

            <div className="mt-6 flex flex-col gap-4">
              <TextField
                id="businessName"
                label="Business name"
                value={businessName}
                onChange={setBusinessName}
              />
              <TextField id="city" label="City" value={city} onChange={setCity} />
              <div>
                <label className="mb-2 block text-sm text-text-primary">
                  State
                </label>
                <StateDropdown value={state} onChange={setState} />
              </div>
            </div>

            <p className="mb-3 mt-6 text-sm font-medium text-text-primary">
              Years in business
            </p>
            <PillMultiSelect
              options={YEARS_OPTIONS}
              selected={yearsInBusiness ? [yearsInBusiness] : []}
              onToggle={setYearsInBusiness}
              single
            />
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              {OFFER_HEADINGS[supplierType]}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Select all that apply
            </p>

            <div className="mt-4">
              <PillMultiSelect
                options={offerOptions}
                selected={offerings}
                onToggle={toggleOffering}
                onAddCustom={(value) =>
                  setOfferings((current) =>
                    current.includes(value) ? current : [...current, value]
                  )
                }
              />
            </div>

            {supplierType === "fabric_mill" && (
              <>
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
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              How do buyers contact you?
            </h1>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CONTACT_OPTIONS.map((option) => {
                const isSelected = contactMethods.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleContact(option.id)}
                    className={`relative rounded-xl border p-5 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border-dark bg-card"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute right-3 top-3 font-bold text-primary">
                        ✓
                      </span>
                    )}
                    <div className="text-2xl">{option.emoji}</div>
                    <h3 className="mt-2 text-sm font-bold text-white">
                      {option.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <StepNav
          step={step}
          totalSteps={TOTAL_STEPS}
          isValid={isStepValid}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
}
