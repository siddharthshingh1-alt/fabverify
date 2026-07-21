"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import { consumePendingChatRedirect } from "../../lib/postAuthRedirect";

const TOTAL_STEPS = 5;

const CATEGORIES = [
  { id: "ethnic", emoji: "👗", label: "Ethnic Wear" },
  { id: "casual", emoji: "👕", label: "Casual Wear" },
  { id: "active", emoji: "🏃", label: "Activewear" },
  { id: "kids", emoji: "👶", label: "Kids Wear" },
  { id: "western", emoji: "👔", label: "Western Wear" },
  { id: "luxury", emoji: "✨", label: "Luxury" },
];

const CUSTOMERS = [
  { id: "women", emoji: "👩", label: "Women (18–45)" },
  { id: "men", emoji: "👨", label: "Men (18–45)" },
  { id: "kids", emoji: "👶", label: "Kids (0–15)" },
];

const AGE_GROUPS = ["13-18", "18-25", "25-35", "35-50", "50+"];

const BUDGETS = [
  {
    id: "under-25k",
    emoji: "💰",
    label: "Under ₹25,000",
    description: "Perfect for testing your first design",
  },
  {
    id: "25k-1l",
    emoji: "💰",
    label: "₹25,000 – ₹1 Lakh",
    description: "Start with 50–100 pieces",
  },
  {
    id: "1l-5l",
    emoji: "💰",
    label: "₹1 Lakh – ₹5 Lakh",
    description: "Launch a small collection",
  },
  {
    id: "above-5l",
    emoji: "💰",
    label: "Above ₹5 Lakh",
    description: "Full collection launch",
  },
];

export default function BrandBuilderOnboarding() {
  const router = useRouter();
  const { setUser } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [customer, setCustomer] = useState<string | null>(null);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(3);
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isComplete) return;
    const timer = setTimeout(() => {
      router.push(consumePendingChatRedirect() ?? "/brand/dashboard");
    }, 1500);
    return () => clearTimeout(timer);
  }, [isComplete, router]);

  const toggleCategory = (id: string) => {
    setCategories((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAgeGroup = (id: string) => {
    setAgeGroups((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const isStepValid = (() => {
    switch (currentStep) {
      case 1:
        return categories.length > 0;
      case 2:
        return customer !== null;
      case 3:
        return budget !== null;
      case 4:
        return true;
      case 5:
        return name.trim() !== "";
      default:
        return false;
    }
  })();

  const handleBack = () => {
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  const handleContinue = () => {
    if (!isStepValid) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((step) => step + 1);
    } else {
      setUser({
        name: name || "User",
        userType: "buyer",
        verificationTier: "bronze",
        fabscore: 0,
        city: "",
      });
      setIsComplete(true);
    }
  };

  if (isComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="mt-6 font-display text-2xl font-bold text-white">
          Your brand plan is ready!
        </h1>
        <p className="mt-2 text-text-secondary">
          Let&apos;s start building your brand.
        </p>
      </div>
    );
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

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
        <div className="flex items-center gap-1 font-display text-lg font-bold">
          <span>🧵</span>
          <span className="text-white">Fab</span>
          <span className="text-primary">Verify</span>
        </div>

        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border-dark">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-text-secondary">
          Step {currentStep} of {TOTAL_STEPS}
        </p>

        {currentStep === 1 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              What kind of clothing do you want to make?
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Select all that apply
            </p>

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
          </div>
        )}

        {currentStep === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              Who is your customer?
            </h1>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CUSTOMERS.map((option) => {
                const isSelected = customer === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCustomer(option.id)}
                    className={`relative rounded-xl border p-6 text-center transition-colors ${
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
                    <div className="text-4xl">{option.emoji}</div>
                    <div className="mt-2 text-sm font-bold text-white">
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-8 text-sm font-medium text-text-primary">
              Age group?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AGE_GROUPS.map((age) => {
                const isSelected = ageGroups.includes(age);
                return (
                  <button
                    key={age}
                    type="button"
                    onClick={() => toggleAgeGroup(age)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary text-navy"
                        : "bg-card text-text-secondary"
                    }`}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              What is your starting budget?
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              This helps us show you the right manufacturers and quantities
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BUDGETS.map((option) => {
                const isSelected = budget === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setBudget(option.id)}
                    className={`relative rounded-xl border p-4 text-left transition-colors ${
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
                    <div className="text-[28px]">{option.emoji}</div>
                    <div className="mt-2 text-[13px] font-bold text-white">
                      {option.label}
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              How many designs to start with?
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              We recommend 2–3 for first-time brands
            </p>

            <div className="mt-10 flex items-center justify-center gap-8">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-[9999px] border border-primary text-2xl font-bold text-primary"
              >
                −
              </button>
              <div className="font-display text-[64px] font-bold text-primary">
                {quantity}
              </div>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-[9999px] bg-primary text-2xl font-bold text-navy"
              >
                +
              </button>
            </div>

            <div className="mt-10 flex gap-3 rounded-xl border-l-4 border-primary bg-card p-4">
              <span className="text-xl">💡</span>
              <p className="text-sm text-text-secondary">
                Most successful first-time brands start with 2–3 designs.
                This keeps costs manageable while giving customers variety.
              </p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              Almost there! Tell us about you
            </h1>

            <div className="mt-6">
              <label
                htmlFor="name"
                className="mb-2 block text-sm text-text-primary"
              >
                Your name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="brandName"
                className="mb-2 block text-sm text-text-primary"
              >
                Brand name
              </label>
              <input
                id="brandName"
                type="text"
                placeholder="Your brand name (you can change this later)"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
            </div>

            <p className="mt-4 text-sm text-text-secondary">
              Don&apos;t have a brand name yet? No problem — you can add it
              later
            </p>
          </div>
        )}

        <div className="mt-10">
          <div
            className={`flex items-center ${
              currentStep > 1 ? "justify-between" : "justify-end"
            }`}
          >
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-sm font-medium text-text-secondary"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={!isStepValid}
              className={`rounded-lg px-8 py-3.5 font-bold transition-colors ${
                isStepValid
                  ? "cursor-pointer bg-primary text-navy"
                  : "cursor-not-allowed bg-border-dark text-text-secondary"
              }`}
            >
              {currentStep === TOTAL_STEPS
                ? "Start Building My Brand →"
                : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
