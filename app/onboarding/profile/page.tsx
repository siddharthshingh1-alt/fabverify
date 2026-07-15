"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import { StateDropdown } from "../components";

const INDIAN_CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Surat",
  "Jaipur",
  "Lucknow",
  "Tirupur",
  "Coimbatore",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Vadodara",
  "Rajkot",
  "Kanpur",
  "Agra",
  "Meerut",
  "Varanasi",
  "Ludhiana",
  "Amritsar",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type FormErrors = {
  name?: string;
  email?: string;
  city?: string;
  photo?: string;
};

export default function ProfileSetup() {
  const router = useRouter();
  const { setUser } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [state, setState] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const citySuggestions = citySearch.trim()
    ? INDIAN_CITIES.filter((option) =>
        option.toLowerCase().includes(citySearch.trim().toLowerCase())
      )
    : [];

  const isNameValid = name.trim().length >= 2;
  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isCityValid = city.trim().length > 0;
  const isFormValid = isNameValid && isEmailValid && isCityValid && termsAccepted;

  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
  };

  const handleNameBlur = () => {
    setErrors((current) => ({
      ...current,
      name: name.trim().length >= 2 ? undefined : "Please enter your name",
    }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
  };

  const handleEmailBlur = () => {
    setErrors((current) => ({
      ...current,
      email: EMAIL_REGEX.test(email.trim())
        ? undefined
        : "Please enter a valid email address",
    }));
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    setCitySearch(value);
    setShowCitySuggestions(true);
    if (errors.city) setErrors((current) => ({ ...current, city: undefined }));
  };

  const selectCitySuggestion = (value: string) => {
    setCity(value);
    setCitySearch(value);
    setShowCitySuggestions(false);
    setErrors((current) => ({ ...current, city: undefined }));
  };

  const handleCityBlur = () => {
    // Delay so a suggestion click registers before the list closes.
    setTimeout(() => setShowCitySuggestions(false), 150);
    setErrors((current) => ({
      ...current,
      city: city.trim().length > 0 ? undefined : "Please enter your city",
    }));
  };

  const triggerPhotoInput = () => fileInputRef.current?.click();

  const handlePhotoChange = (file: File | null) => {
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        photo: "Please upload a JPG, PNG or WEBP image",
      }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((current) => ({ ...current, photo: "Photo must be under 5MB" }));
      return;
    }
    setErrors((current) => ({ ...current, photo: undefined }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleContinue = () => {
    const nextErrors: FormErrors = {
      name: isNameValid ? undefined : "Please enter your name",
      email: isEmailValid ? undefined : "Please enter a valid email address",
      city: isCityValid ? undefined : "Please enter your city",
    };
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (!isNameValid || !isEmailValid || !isCityValid || !termsAccepted) return;

    setUser({
      name: name.trim(),
      email: email.trim(),
      city: city.trim(),
      state,
      profilePhoto: photoPreview || undefined,
    });

    localStorage.setItem(
      "fabverify_profile",
      JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
        state,
        referralCode: referralCode.trim(),
      })
    );

    router.push("/onboarding/type");
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
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "32px 20px" }}>
        <div className="flex items-center justify-center gap-1 font-display text-lg font-bold">
          <span>🧵</span>
          <span className="text-white">Fab</span>
          <span className="text-primary">Verify</span>
        </div>

        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border-dark">
          <div className="h-full w-1/2 bg-primary transition-all" />
        </div>
        <p className="mt-2 text-center text-xs text-text-secondary">
          Step 1 of 2 — Basic Info
        </p>

        <h1 className="mt-8 text-center font-display text-2xl font-bold text-white">
          Tell us about yourself
        </h1>
        <p className="mt-2 text-center text-sm text-text-secondary">
          This takes less than a minute
        </p>

        {/* Profile photo upload */}
        <div className="mt-8 flex flex-col items-center">
          <div
            onClick={triggerPhotoInput}
            className={`relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-card transition-colors ${
              photoPreview
                ? "border-2 border-solid border-primary"
                : "border-2 border-dashed border-border-dark"
            }`}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl">📷</span>
            )}

            {photoPreview && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  triggerPhotoInput();
                }}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-navy bg-primary text-xs"
              >
                ✏️
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) =>
                handlePhotoChange(event.target.files?.[0] ?? null)
              }
            />
          </div>
          <p className="mt-3 text-[13px] text-text-secondary">
            Add profile photo
          </p>
          <p className="text-[11px] italic text-text-secondary">
            Optional but recommended
          </p>
          {errors.photo && (
            <p className="mt-1 text-[11px] text-red-400">{errors.photo}</p>
          )}
        </div>

        {/* Form fields */}
        <div className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-[13px] text-text-secondary">
              Your full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g. Siddharth Singh"
              className={`w-full rounded-[8px] border bg-background px-4 py-3 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-secondary ${
                errors.name
                  ? "border-red-500"
                  : "border-border-dark focus:border-primary"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] text-text-secondary">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => handleEmailChange(event.target.value)}
              onBlur={handleEmailBlur}
              placeholder="your@email.com"
              className={`w-full rounded-[8px] border bg-background px-4 py-3 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-secondary ${
                errors.email
                  ? "border-red-500"
                  : "border-border-dark focus:border-primary"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="relative">
            <label htmlFor="city" className="mb-1.5 block text-[13px] text-text-secondary">
              Your city <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(event) => handleCityChange(event.target.value)}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={handleCityBlur}
              placeholder="e.g. Delhi, Mumbai, Jaipur..."
              autoComplete="off"
              className={`w-full rounded-[8px] border bg-background px-4 py-3 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-secondary ${
                errors.city
                  ? "border-red-500"
                  : "border-border-dark focus:border-primary"
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-400">{errors.city}</p>
            )}

            {showCitySuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-[8px] border border-border-dark bg-card shadow-lg">
                {citySuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCitySuggestion(suggestion)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-background"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="state" className="mb-1.5 block text-[13px] text-text-secondary">
              State
            </label>
            <StateDropdown value={state} onChange={setState} />
          </div>

          <div>
            <label htmlFor="referralCode" className="mb-1.5 block text-[13px] text-text-secondary">
              Referral code (optional)
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
              placeholder="Enter code if you have one"
              className="w-full rounded-[8px] border border-border-dark bg-background px-4 py-3 text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
            />
            <p className="mt-1 text-[11px] italic text-text-secondary">
              Got invited by someone? Enter their code to give them a reward.
            </p>
          </div>
        </div>

        {/* Terms and privacy */}
        <label className="mt-6 flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="text-[13px] text-text-secondary">
            I agree to FabVerify&apos;s{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Privacy Policy
            </a>
          </span>
        </label>

        {/* Continue button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isFormValid}
          className={`mt-8 w-full rounded-[8px] py-3.5 text-[15px] font-bold transition-colors ${
            isFormValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue to Choose Your Role →
        </button>
      </div>
    </div>
  );
}
