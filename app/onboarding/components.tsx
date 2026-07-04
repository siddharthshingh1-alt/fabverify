import { useRef, useState } from "react";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
];

export function OnboardingHeader({
  step,
  totalSteps,
  stepLabel,
}: {
  step: number;
  totalSteps: number;
  stepLabel: string;
}) {
  const progressPercent = (step / totalSteps) * 100;
  return (
    <>
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
        {stepLabel}
      </p>
    </>
  );
}

export function StepNav({
  step,
  totalSteps,
  isValid,
  onBack,
  onContinue,
  continueLabel,
}: {
  step: number;
  totalSteps: number;
  isValid: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
}) {
  const label = continueLabel ?? (step === totalSteps ? "Finish →" : "Continue →");

  const buttons = (
    <div
      className={`flex items-center ${
        step > 1 ? "justify-between" : "justify-end"
      }`}
    >
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-text-secondary"
        >
          ← Back
        </button>
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={!isValid}
        className={`rounded-lg px-8 py-3.5 font-bold transition-colors ${
          isValid
            ? "cursor-pointer bg-primary text-navy"
            : "cursor-not-allowed bg-border-dark text-text-secondary"
        }`}
      >
        {label}
      </button>
    </div>
  );

  return <div className="mt-10">{buttons}</div>;
}

export function CardOption({
  emoji,
  title,
  description,
  tag,
  isSelected,
  onClick,
}: {
  emoji: string;
  title: string;
  description: string;
  tag?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      <div className="text-[28px]">{emoji}</div>
      <div className="mt-2 text-[13px] font-bold text-white">{title}</div>
      {description && (
        <p className="mt-1 text-xs text-text-secondary">{description}</p>
      )}
      {tag && (
        <span className="mt-2 inline-block rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
          {tag}
        </span>
      )}
    </button>
  );
}

export function PillMultiSelect({
  options,
  selected,
  onToggle,
  onAddCustom,
  single,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAddCustom?: (value: string) => void;
  single?: boolean;
}) {
  const [showInput, setShowInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submitCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && onAddCustom) {
      onAddCustom(trimmed);
    }
    setCustomValue("");
    setShowInput(false);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-primary text-navy"
                : "bg-card text-text-secondary"
            }`}
          >
            {isSelected && !single ? "✓ " : ""}
            {option}
          </button>
        );
      })}
      {onAddCustom &&
        (showInput ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitCustom();
                if (event.key === "Escape") setShowInput(false);
              }}
              placeholder="Type and press Enter"
              className="rounded-full border border-border-dark bg-navy px-3 py-1.5 text-sm text-text-primary outline-none focus:border-primary"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="rounded-full border border-dashed border-border-dark px-4 py-2 text-sm font-medium text-text-secondary hover:border-primary hover:text-primary"
          >
            + Add custom
          </button>
        ))}
    </div>
  );
}

export function UploadBox({
  emoji,
  title,
  subtitle,
  fileName,
  onFile,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  fileName?: string;
  onFile: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(fileName);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 p-6 text-center transition-colors ${
        hasFile
          ? "border-solid border-green-500/60 bg-green-500/5"
          : "border-dashed border-border-dark bg-card hover:border-primary"
      }`}
    >
      <div className="text-2xl">{hasFile ? "✅" : "📤"}</div>
      <p className="mt-2 text-sm font-semibold text-text-primary">
        {hasFile ? fileName : `${emoji} ${title}`}
      </p>
      {!hasFile && subtitle && (
        <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function StateDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full appearance-none rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors focus:border-primary"
    >
      <option value="">Select state</option>
      {INDIAN_STATES.map((state) => (
        <option key={state} value={state}>
          {state}
        </option>
      ))}
    </select>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-text-primary">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[6px] border border-border-dark bg-navy px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
      />
    </div>
  );
}
