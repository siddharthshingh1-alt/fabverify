"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  OnboardingHeader,
  StateDropdown,
  StepNav,
  TextField,
  UploadBox,
} from "../components";
import { useUser } from "../../context/UserContext";
import { consumePendingChatRedirect } from "../../lib/postAuthRedirect";

const TOTAL_STEPS = 3;

const CRAFT_TYPES = [
  { id: "chikankari", emoji: "🌸", label: "Chikankari" },
  { id: "block-print", emoji: "🎨", label: "Block Print" },
  { id: "zardozi", emoji: "🪡", label: "Zardozi" },
  { id: "bandhani", emoji: "🌈", label: "Bandhani / Tie-Dye" },
  { id: "hand-weaving", emoji: "🧶", label: "Hand Weaving" },
  { id: "hand-embroidery", emoji: "✂️", label: "Hand Embroidery" },
  { id: "kalamkari", emoji: "🖌️", label: "Kalamkari" },
  { id: "natural-dye", emoji: "🌿", label: "Natural Dye" },
];

const TEAM_OPTIONS = [
  { id: "solo", emoji: "👤", label: "Solo artisan" },
  { id: "small-team", emoji: "👥", label: "Small team (2-10 people)" },
];

const CERTIFICATIONS = [
  "GI Tag registered",
  "Craft council member",
  "Government scheme beneficiary",
  "Export certified",
];

export default function ArtisanOnboarding() {
  const router = useRouter();
  const { setUser } = useUser();
  const [step, setStep] = useState(1);

  const [crafts, setCrafts] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [otherCraft, setOtherCraft] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [monthlyQuantity, setMonthlyQuantity] = useState("");
  const [teamType, setTeamType] = useState<string | null>(null);

  const [certifications, setCertifications] = useState<string[]>([]);
  const [noneYet, setNoneYet] = useState(false);
  const [sampleFile, setSampleFile] = useState<string | undefined>(undefined);

  const toggleCraft = (id: string) => {
    setCrafts((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleCertification = (item: string) => {
    setNoneYet(false);
    setCertifications((current) =>
      current.includes(item)
        ? current.filter((entry) => entry !== item)
        : [...current, item]
    );
  };

  const toggleNoneYet = () => {
    setNoneYet((current) => !current);
    setCertifications([]);
  };

  const isStepValid = (() => {
    switch (step) {
      case 1:
        return crafts.length > 0 || otherCraft.trim() !== "";
      case 2:
        return (
          city.trim() !== "" &&
          state !== "" &&
          monthlyQuantity.trim() !== "" &&
          teamType !== null
        );
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
                crafts,
                otherCraft: otherCraft || undefined,
                monthlyQuantity,
                teamType,
                certifications,
                sampleFile,
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
        name: "User",
        userType: "artisan",
        verificationTier: "bronze",
        fabscore: 0,
        city,
      });
      router.push(consumePendingChatRedirect() ?? "/artisan/dashboard");
      return;
    }
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
              Tell us about your craft
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Select all that apply
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {CRAFT_TYPES.map((craft) => {
                const isSelected = crafts.includes(craft.id);
                return (
                  <button
                    key={craft.id}
                    type="button"
                    onClick={() => toggleCraft(craft.id)}
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
                    <div className="text-[28px]">{craft.emoji}</div>
                    <div className="mt-2 text-[13px] font-bold text-white">
                      {craft.label}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowOther(true)}
                className={`relative rounded-xl border p-4 text-center transition-colors ${
                  showOther
                    ? "border-primary bg-primary/10"
                    : "border-dashed border-border-dark bg-card"
                }`}
              >
                <div className="text-[28px]">➕</div>
                <div className="mt-2 text-[13px] font-bold text-white">
                  Other
                </div>
              </button>
            </div>

            {showOther && (
              <div className="mt-4">
                <TextField
                  id="otherCraft"
                  label="Describe your craft"
                  value={otherCraft}
                  onChange={setOtherCraft}
                  placeholder="e.g. Applique work"
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              Location and scale
            </h1>

            <div className="mt-6 flex flex-col gap-4">
              <TextField id="city" label="City" value={city} onChange={setCity} />
              <div>
                <label className="mb-2 block text-sm text-text-primary">
                  State
                </label>
                <StateDropdown value={state} onChange={setState} />
              </div>
              <div>
                <label
                  htmlFor="monthlyQuantity"
                  className="mb-2 block text-sm text-text-primary"
                >
                  How many pieces can you produce monthly?
                </label>
                <input
                  id="monthlyQuantity"
                  type="number"
                  min={0}
                  value={monthlyQuantity}
                  onChange={(event) => setMonthlyQuantity(event.target.value)}
                  placeholder="e.g. 50"
                  className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                />
              </div>
            </div>

            <p className="mb-3 mt-6 text-sm font-medium text-text-primary">
              Do you work alone or with a team?
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TEAM_OPTIONS.map((option) => {
                const isSelected = teamType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTeamType(option.id)}
                    className={`relative rounded-xl border p-5 text-center transition-colors ${
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
                    <div className="text-3xl">{option.emoji}</div>
                    <div className="mt-2 text-sm font-bold text-white">
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <h1 className="font-display text-2xl font-bold text-white">
              Do you have any certifications?
            </h1>

            <div className="mt-6 flex flex-col gap-3">
              {CERTIFICATIONS.map((item) => {
                const isChecked = certifications.includes(item);
                return (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-dark bg-card p-4"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCertification(item)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-text-primary">{item}</span>
                  </label>
                );
              })}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-dark bg-card p-4">
                <input
                  type="checkbox"
                  checked={noneYet}
                  onChange={toggleNoneYet}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-text-primary">None yet</span>
              </label>
            </div>

            <p className="mb-3 mt-8 text-sm font-medium text-text-primary">
              Upload a sample of your work (optional)
            </p>
            <UploadBox
              emoji="📸"
              title="Click to upload a photo"
              subtitle="JPG or PNG • Max 5MB"
              fileName={sampleFile}
              onFile={(file) => setSampleFile(file?.name)}
            />
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
