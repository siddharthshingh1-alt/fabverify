"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../../context/UserContext";
import type { UserType } from "../../context/UserContext";

// ─────────────────────────────────────────────────────────────
// Step configuration
// ─────────────────────────────────────────────────────────────

type StepKind =
  | "country"
  | "identity"
  | "business_gst"
  | "skill_assessment"
  | "document_upload"
  | "portfolio_upload"
  | "craft_certification"
  | "gi_tag"
  | "references"
  | "video_call"
  | "field_visit_schedule"
  | "field_visit_confirmation"
  | "complete"
  | "intl_location"
  | "intl_identity"
  | "intl_business"
  | "intl_documents"
  | "intl_video_call"
  | "intl_complete";

type FlowGroup = "brand" | "manufacturer" | "artisan" | "supplier" | "talent";
type Region = "india" | "international";

const FLOW_GROUP_BY_USER_TYPE: Record<UserType, FlowGroup> = {
  buyer: "brand",
  manufacturer: "manufacturer",
  fabric_mill: "supplier",
  trim_supplier: "supplier",
  job_worker: "supplier",
  artisan: "artisan",
  designer: "talent",
  master: "talent",
  merchandiser: "talent",
  qc_inspector: "talent",
};

const BASE_STEP_KINDS: Record<FlowGroup, StepKind[]> = {
  brand: ["identity", "business_gst", "references", "video_call", "complete"],
  manufacturer: [
    "identity",
    "business_gst",
    "document_upload",
    "references",
    "video_call",
    "complete",
  ],
  artisan: ["identity", "craft_certification", "document_upload", "gi_tag", "complete"],
  supplier: ["identity", "business_gst", "document_upload", "references", "complete"],
  talent: ["identity", "skill_assessment", "portfolio_upload", "video_call", "complete"],
};

const BASE_STEP_LABELS: Record<FlowGroup, string[]> = {
  brand: ["Identity (Aadhaar)", "Business (GST/PAN)", "References", "Video Call", "Complete"],
  manufacturer: [
    "Identity (Aadhaar)",
    "Business (GST + Factory)",
    "Factory Photos",
    "References",
    "Video Call",
    "Complete",
  ],
  artisan: [
    "Identity (Aadhaar)",
    "Craft Certification",
    "Workshop Photos",
    "GI Tag (if applicable)",
    "Complete",
  ],
  supplier: ["Identity (Aadhaar)", "Business (GST)", "Product Samples", "References", "Complete"],
  talent: [
    "Identity (Aadhaar)",
    "Skill Assessment",
    "Portfolio/Work Samples",
    "Interview Scheduling",
    "Complete",
  ],
};

function injectGoldSteps<T>(arr: T[], extra: T[], enabled: boolean): T[] {
  if (!enabled) return arr;
  return [...arr.slice(0, -1), ...extra, arr[arr.length - 1]];
}

const GOLD_STEP_KINDS: StepKind[] = ["field_visit_schedule", "field_visit_confirmation"];
const GOLD_STEP_LABELS = ["Field Visit Scheduling", "Field Visit Confirmation"];

type Schedule = { label: string; date: string; time: string };

// ─────────────────────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────────────────────

function DevModeHint({ text }: { text: string }) {
  return <p className="mt-3 text-center text-[11px] italic text-text-secondary">{text}</p>;
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-5 rounded-[6px] p-3"
      style={{ backgroundColor: "#07122a", borderLeft: "3px solid #f2ca50" }}
    >
      <p className="text-xs text-text-secondary">{children}</p>
    </div>
  );
}

function StepCard({
  children,
  maxWidth = 560,
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      className="mx-auto w-full rounded-xl border p-6 sm:p-7"
      style={{ backgroundColor: "#0D1B33", borderColor: "#1C3050", maxWidth }}
    >
      {children}
    </div>
  );
}

function PreviousButton({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="rounded-lg border bg-transparent transition-colors hover:text-text-primary"
      style={{
        borderColor: "#1C3050",
        color: "#7A8FA8",
        padding: "10px 20px",
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      {backLabel}
    </button>
  );
}

function StepFooter({
  onBack,
  backLabel,
  children,
}: {
  onBack: () => void;
  backLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <PreviousButton onBack={onBack} backLabel={backLabel} />
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "green" | "amber" }) {
  const cls =
    tone === "green"
      ? "border-green-500/60 bg-green-500/15 text-green-400"
      : "border-amber-500/60 bg-amber-500/15 text-amber-400";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function ProgressStepper({ labels, currentIndex }: { labels: string[]; currentIndex: number }) {
  return (
    <div className="hide-scrollbar flex items-start overflow-x-auto pb-1">
      {labels.map((label, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={label} className="flex min-w-[92px] flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  isDone
                    ? "border-primary bg-primary text-white"
                    : isCurrent
                      ? "border-primary bg-transparent text-white"
                      : "border-border-dark bg-card text-text-secondary"
                }`}
              >
                {index + 1}
              </div>
              {index < labels.length - 1 && (
                <div className={`h-[2px] flex-1 ${isDone ? "bg-primary" : "bg-border-dark"}`} />
              )}
            </div>
            <p
              className={`mt-2 text-center text-[11px] ${
                isCurrent ? "text-white" : "text-text-secondary"
              }`}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ResultCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; pill?: boolean }[];
}) {
  return (
    <div
      className="mt-3 rounded-[8px] border p-4"
      style={{ backgroundColor: "#07122a", borderColor: "#4ade80" }}
    >
      <p className="text-sm font-bold text-green-400">{title}</p>
      <div className="mt-3 flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-text-secondary">{row.label}</span>
            {row.pill ? (
              <StatusPill label={row.value} tone="green" />
            ) : (
              <span className="text-right font-medium text-text-primary">{row.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAadhaar(digits: string) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

// ─────────────────────────────────────────────────────────────
// STEP 0 — Country and user origin
// ─────────────────────────────────────────────────────────────

const REGION_CARDS: {
  id: Region;
  emoji: string;
  title: string;
  subtitle: string;
  note: string;
  noteClass: string;
}[] = [
  {
    id: "india",
    emoji: "🇮🇳",
    title: "India",
    subtitle: "Aadhaar · GST · PAN",
    note: "Instant verification",
    noteClass: "text-green-400",
  },
  {
    id: "international",
    emoji: "🌐",
    title: "Outside India",
    subtitle: "Passport · Company Docs · Tax ID",
    note: "2-3 day manual review",
    noteClass: "text-amber-400",
  },
];

function CountryStep({ onContinue }: { onContinue: (region: Region) => void }) {
  const [selected, setSelected] = useState<Region | null>(null);

  return (
    <StepCard>
      <h2 className="font-display text-xl font-bold text-white">🌍 Where are you based?</h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        We use this to show you the right verification documents
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {REGION_CARDS.map((card) => {
          const isSelected = selected === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelected(card.id)}
              className={`relative rounded-[10px] border p-5 text-center transition-colors ${
                isSelected ? "border-2 border-primary" : "border border-border-dark hover:border-primary/60"
              }`}
              style={{ backgroundColor: "#07122a" }}
            >
              {isSelected && (
                <span className="absolute right-2.5 top-2.5 font-bold text-primary">✓</span>
              )}
              <div style={{ fontSize: 32 }}>{card.emoji}</div>
              <p className="mt-2 text-[16px] font-bold text-white">{card.title}</p>
              <p className="mt-1 text-[12px] text-text-secondary">{card.subtitle}</p>
              <p className={`mt-1.5 text-[11px] ${card.noteClass}`}>{card.note}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => selected && onContinue(selected)}
        disabled={!selected}
        className={`mt-6 w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
          selected
            ? "cursor-pointer bg-primary text-navy"
            : "cursor-not-allowed bg-border-dark text-text-secondary"
        }`}
      >
        Continue →
      </button>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 1 — Aadhaar identity verification
// ─────────────────────────────────────────────────────────────

function AadhaarIdentityStep({
  verifiedName,
  nextLabel,
  onContinue,
  onBack,
  backLabel,
}: {
  verifiedName: string;
  nextLabel: string;
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [consent, setConsent] = useState(false);
  const [digits, setDigits] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!otpSent || verified) return;
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent, verified]);

  const isValid = digits.length === 12 && consent;
  const last4 = digits.slice(-4);

  const handleSendOtp = () => {
    if (!isValid) return;
    setOtp(Array(6).fill(""));
    setCountdown(45);
    setOtpSent(true);
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setOtp(Array(6).fill(""));
    setCountdown(45);
    otpRefs.current[0]?.focus();
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) otpRefs.current[index + 1]?.focus();

    if (next.every((d) => d !== "") && !verifying && !verified) {
      setVerifying(true);
      setTimeout(() => {
        setVerifying(false);
        setVerified(true);
      }, 1200);
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  if (verified) {
    return (
      <StepCard>
        <div className="flex flex-col items-center py-4 text-center">
          <div className="text-5xl">✅</div>
          <p className="mt-4 text-lg font-bold text-green-400">Identity Verified</p>
          <p className="mt-2 text-[13px] text-text-secondary">
            Your identity has been confirmed via Aadhaar OTP authentication.
          </p>
          <p className="mt-3 text-sm font-semibold text-primary">Verified as: {verifiedName}</p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-bold text-navy sm:w-auto sm:px-8"
          >
            Continue to {nextLabel} →
          </button>
        </div>
        <StepFooter onBack={onBack} backLabel={backLabel} />
      </StepCard>
    );
  }

  return (
    <StepCard>
      <h2 className="font-display text-xl font-bold text-white">🪪 Identity Verification</h2>
      <p className="mt-1 text-[13px] text-text-secondary">Verify your identity using Aadhaar OTP</p>

      <div className="mt-5">
        <InfoBox>
          🔒 Your Aadhaar number is never stored by FabVerify. Only your verified status is
          recorded. This is the same process used by banks and government portals.
        </InfoBox>
      </div>

      <label className="flex items-start gap-2.5 text-[12px] text-text-secondary">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          disabled={otpSent}
          className="mt-0.5 h-4 w-4 accent-[#f2ca50]"
        />
        I consent to FabVerify verifying my identity using Aadhaar OTP authentication as per
        UIDAI guidelines.
      </label>

      <div className="mt-5">
        <label className="mb-1.5 block text-[13px] text-text-secondary">Aadhaar number</label>
        <input
          type="text"
          inputMode="numeric"
          disabled={otpSent}
          value={formatAadhaar(digits)}
          onChange={(event) =>
            setDigits(event.target.value.replace(/\D/g, "").slice(0, 12))
          }
          placeholder="XXXX  XXXX  XXXX"
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-center text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary disabled:opacity-60"
          style={{ fontSize: 18, letterSpacing: 4 }}
        />
      </div>

      {!otpSent ? (
        <>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={!isValid}
            className={`mt-5 w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
              isValid
                ? "cursor-pointer bg-primary text-navy"
                : "cursor-not-allowed bg-border-dark text-text-secondary"
            }`}
          >
            Send OTP to Aadhaar-linked mobile
          </button>
          <DevModeHint text="Development mode: enter any 12 digits and any 6-digit OTP" />
          <StepFooter onBack={onBack} backLabel={backLabel} />
        </>
      ) : (
        <div className="mt-5">
          <p className="text-center text-[13px] text-text-secondary">
            OTP sent to mobile linked with Aadhaar ending {last4}
          </p>

          {verifying ? (
            <div className="mt-5 flex flex-col items-center gap-2 py-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <p className="text-[13px] text-text-secondary">Verifying with UIDAI...</p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    className="rounded-lg border border-border-dark bg-background text-center text-xl font-bold text-text-primary outline-none focus:border-primary"
                    style={{ width: 48, height: 52 }}
                  />
                ))}
              </div>
              <div className="mt-4 text-center text-sm">
                {countdown > 0 ? (
                  <span className="text-text-secondary">Resend OTP in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-medium text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
          <StepFooter onBack={onBack} backLabel={backLabel} />
        </div>
      )}
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 2A — GST / PAN / Udyam business verification
// ─────────────────────────────────────────────────────────────

function BusinessGstStep({
  isManufacturer,
  onContinue,
  onBack,
  backLabel,
}: {
  isManufacturer: boolean;
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [gst, setGst] = useState("");
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  const [pan, setPan] = useState("");
  const [panLoading, setPanLoading] = useState(false);
  const [panVerified, setPanVerified] = useState(false);

  const [udyam, setUdyam] = useState("");
  const [udyamLoading, setUdyamLoading] = useState(false);
  const [udyamVerified, setUdyamVerified] = useState(false);

  const handleVerifyGst = () => {
    if (gst.length !== 15 || gstLoading) return;
    setGstLoading(true);
    setTimeout(() => {
      setGstLoading(false);
      setGstVerified(true);
    }, 1200);
  };

  const handleVerifyPan = () => {
    if (pan.length !== 10 || panLoading) return;
    setPanLoading(true);
    setTimeout(() => {
      setPanLoading(false);
      setPanVerified(true);
    }, 1200);
  };

  const handleVerifyUdyam = () => {
    if (!udyam.trim() || udyamLoading) return;
    setUdyamLoading(true);
    setTimeout(() => {
      setUdyamLoading(false);
      setUdyamVerified(true);
    }, 1200);
  };

  const bothVerified = gstVerified && panVerified;

  return (
    <StepCard maxWidth={640}>
      <h2 className="font-display text-xl font-bold text-white">🏢 Business Verification</h2>
      <p className="mt-1 text-[13px] text-text-secondary">Verify your business registration</p>

      <div className="mt-6 border-t border-border-dark pt-5">
        <p className="text-[13px] font-semibold text-text-primary">GST Number (GSTIN)</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          15-character GST number from your GST certificate
        </p>
        <input
          type="text"
          value={gst}
          disabled={gstVerified}
          onChange={(event) =>
            setGst(event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))
          }
          placeholder="22AAAAA0000A1Z5"
          className="mt-2 w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm uppercase tracking-wide text-text-primary outline-none transition-colors placeholder:normal-case placeholder:text-text-secondary focus:border-primary disabled:opacity-60"
        />
        {!gstVerified && (
          <button
            type="button"
            onClick={handleVerifyGst}
            disabled={gst.length !== 15 || gstLoading}
            className={`mt-3 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
              gst.length === 15 && !gstLoading
                ? "cursor-pointer bg-primary text-navy"
                : "cursor-not-allowed bg-border-dark text-text-secondary"
            }`}
          >
            {gstLoading ? "Checking with GSTN portal..." : "Verify GST →"}
          </button>
        )}
        {gstVerified && (
          <ResultCard
            title="✅ GST Verified"
            rows={[
              { label: "Legal Name", value: "SHARMA GARMENTS PVT LTD" },
              { label: "Trade Name", value: "Sharma Garments" },
              { label: "Registration Date", value: "01/04/2021" },
              { label: "Business Type", value: "Regular" },
              { label: "Status", value: "Active", pill: true },
              { label: "State", value: "Maharashtra" },
            ]}
          />
        )}
      </div>

      <div className="mt-6 border-t border-border-dark pt-5">
        <p className="text-[13px] font-semibold text-text-primary">PAN Number</p>
        <input
          type="text"
          value={pan}
          disabled={panVerified}
          onChange={(event) =>
            setPan(event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 10))
          }
          placeholder="ABCDE1234F"
          className="mt-2 w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm uppercase tracking-wide text-text-primary outline-none transition-colors placeholder:normal-case placeholder:text-text-secondary focus:border-primary disabled:opacity-60"
        />
        {!panVerified && (
          <button
            type="button"
            onClick={handleVerifyPan}
            disabled={pan.length !== 10 || panLoading}
            className={`mt-3 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
              pan.length === 10 && !panLoading
                ? "cursor-pointer bg-primary text-navy"
                : "cursor-not-allowed bg-border-dark text-text-secondary"
            }`}
          >
            {panLoading ? "Verifying with Income Tax portal..." : "Verify PAN →"}
          </button>
        )}
        {panVerified && (
          <ResultCard
            title="✅ PAN Verified"
            rows={[
              { label: "Name", value: "SHARMA GARMENTS PVT LTD" },
              { label: "PAN Type", value: "Company" },
              { label: "Status", value: "Active", pill: true },
            ]}
          />
        )}
      </div>

      {isManufacturer && (
        <div className="mt-6 border-t border-border-dark pt-5">
          <p className="text-[13px] font-semibold text-text-primary">
            Factory Registration / Udyam Number
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Optional — helps confirm your MSME status
          </p>
          <input
            type="text"
            value={udyam}
            disabled={udyamVerified}
            onChange={(event) => setUdyam(event.target.value.toUpperCase().slice(0, 20))}
            placeholder="UDYAM-MH-01-0012345"
            className="mt-2 w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary disabled:opacity-60"
          />
          {!udyamVerified && (
            <button
              type="button"
              onClick={handleVerifyUdyam}
              disabled={!udyam.trim() || udyamLoading}
              className={`mt-3 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
                udyam.trim() && !udyamLoading
                  ? "cursor-pointer bg-primary text-navy"
                  : "cursor-not-allowed bg-border-dark text-text-secondary"
              }`}
            >
              {udyamLoading ? "Checking Udyam registry..." : "Verify Udyam →"}
            </button>
          )}
          {udyamVerified && (
            <ResultCard
              title="✅ Udyam Registration Verified"
              rows={[
                { label: "Enterprise Name", value: "Sharma Garments" },
                { label: "Udyam Number", value: udyam },
                { label: "Enterprise Type", value: "Small" },
                { label: "Major Activity", value: "Manufacturing" },
                { label: "Date of Registration", value: "15/06/2020" },
              ]}
            />
          )}
        </div>
      )}

      <DevModeHint text="Development mode: any valid-format number is accepted and instantly verified" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        {bothVerified && (
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-navy"
          >
            Continue →
          </button>
        )}
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 2B — Skill assessment
// ─────────────────────────────────────────────────────────────

type Question = { text: string; options: string[]; correct: number };
type TalentRole = "designer" | "master" | "merchandiser" | "qc_inspector";

const DESIGNER_QUESTIONS: Question[] = [
  {
    text: "What does GSM stand for in fabric?",
    options: [
      "Grams per Square Metre",
      "General Sizing Method",
      "Garment Stitch Measurement",
      "Global Standard Mark",
    ],
    correct: 0,
  },
  {
    text: "Which software is industry standard for technical flat sketches?",
    options: ["Adobe Illustrator", "Microsoft Paint", "Canva", "Photoshop"],
    correct: 0,
  },
  {
    text: "What is a tech pack?",
    options: [
      "A technical document with all garment specifications",
      "A fabric sample pack",
      "A shipping document",
      "A cost sheet",
    ],
    correct: 0,
  },
  {
    text: "What does BOM stand for?",
    options: [
      "Bill of Materials",
      "Brand Operations Manual",
      "Buying Order Memo",
      "Basic Order Management",
    ],
    correct: 0,
  },
  {
    text: "What is ease allowance in pattern making?",
    options: [
      "Extra fabric added for comfort and movement",
      "The seam allowance measurement",
      "The fabric shrinkage percentage",
      "The cost buffer in pricing",
    ],
    correct: 0,
  },
];

const MASTER_QUESTIONS: Question[] = [
  {
    text: "What is the primary purpose of a sloper/block pattern?",
    options: [
      "A basic fitted pattern used as a foundation for other designs",
      "A fabric cutting guide for mass production",
      "A costing template",
      "A packing list for samples",
    ],
    correct: 0,
  },
  {
    text: "What does 'grading' mean in pattern making?",
    options: [
      "Scaling a pattern up or down across sizes",
      "Rating the fabric quality",
      "Checking stitch quality",
      "Sorting finished garments by defect level",
    ],
    correct: 0,
  },
  {
    text: "In draping, fabric is worked directly on:",
    options: ["A dress form / mannequin", "A flat cutting table only", "A computer screen", "A grading ruler"],
    correct: 0,
  },
  {
    text: "What is 'ease' in garment construction?",
    options: [
      "Extra room added beyond body measurements for movement and comfort",
      "The type of thread used",
      "A pressing technique",
      "A fabric finishing process",
    ],
    correct: 0,
  },
  {
    text: "Which seam type is commonly used for durability in denim construction?",
    options: ["Flat-felled seam", "Rolled hem", "French dart", "Bias binding only"],
    correct: 0,
  },
];

const MERCHANDISER_QUESTIONS: Question[] = [
  {
    text: "What does T&A stand for in merchandising?",
    options: [
      "Time and Action (calendar/schedule)",
      "Trims and Accessories",
      "Testing and Approval",
      "Transport and Allocation",
    ],
    correct: 0,
  },
  {
    text: "What is included in a garment costing sheet?",
    options: [
      "Fabric, trims, labour, overheads and margin",
      "Only the fabric price",
      "Only the factory's profit margin",
      "Shipping insurance only",
    ],
    correct: 0,
  },
  {
    text: "What is the role of a vendor scorecard?",
    options: [
      "To track vendor performance on quality, delivery and compliance",
      "To rank vendors by factory size only",
      "To calculate shipping costs",
      "To set fabric prices",
    ],
    correct: 0,
  },
  {
    text: "What typically comes right after sampling in the production process?",
    options: [
      "Bulk fabric sourcing and pre-production approval",
      "Final shipment",
      "Retail launch",
      "Costing sheet creation",
    ],
    correct: 0,
  },
  {
    text: "What is a 'critical path' in T&A planning?",
    options: [
      "The sequence of key milestones that determine the shortest possible production timeline",
      "The most expensive materials in an order",
      "The factory's emergency contact list",
      "The final quality inspection checklist",
    ],
    correct: 0,
  },
];

const QC_QUESTIONS: Question[] = [
  {
    text: "What does AQL stand for?",
    options: [
      "Acceptable Quality Level",
      "Average Quality Limit",
      "Approved Quantity List",
      "Assessment Quality Log",
    ],
    correct: 0,
  },
  {
    text: "In garment inspection, a 'critical defect' is one that:",
    options: [
      "Makes the garment unsafe or unusable",
      "Is barely visible and doesn't affect use",
      "Only affects packaging",
      "Is found only in trims",
    ],
    correct: 0,
  },
  {
    text: "What is commonly used to determine a pre-shipment inspection sample size?",
    options: [
      "ANSI/ASQ Z1.4 (or equivalent AQL sampling tables)",
      "The full shipment, garment by garment",
      "A single random garment",
      "Only the first carton packed",
    ],
    correct: 0,
  },
  {
    text: "What does 'measurement tolerance' refer to?",
    options: [
      "The acceptable variance allowed from the specified measurement",
      "The maximum garments a factory can produce per day",
      "The fabric shrinkage after washing only",
      "The number of QC inspectors required per shift",
    ],
    correct: 0,
  },
  {
    text: "A 'major defect' in inspection terms usually means:",
    options: [
      "A flaw likely to reduce usability or salability but not make the item unsafe",
      "A flaw invisible to the naked eye",
      "A defect only found in raw fabric",
      "A defect that has zero impact on sale",
    ],
    correct: 0,
  },
];

const QUESTION_BANK: Record<TalentRole, Question[]> = {
  designer: DESIGNER_QUESTIONS,
  master: MASTER_QUESTIONS,
  merchandiser: MERCHANDISER_QUESTIONS,
  qc_inspector: QC_QUESTIONS,
};

const ASSESSMENT_TITLE: Record<TalentRole, string> = {
  designer: "Design Knowledge Assessment",
  master: "Pattern Making & Construction Assessment",
  merchandiser: "Merchandising Knowledge Assessment",
  qc_inspector: "Quality Control Knowledge Assessment",
};

function scoreLabel(score: number) {
  if (score === 5) return "Perfect Score!";
  if (score === 4) return "Excellent";
  if (score === 3) return "Good";
  if (score === 2) return "Fair";
  return "Needs Improvement";
}

function SkillAssessmentStep({
  role,
  onContinue,
  onBack,
  backLabel,
}: {
  role: TalentRole;
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const questions = QUESTION_BANK[role];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const handleNext = () => {
    if (selected === null) return;
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  };

  const score = answers.filter((answer, i) => answer === questions[i]?.correct).length;

  if (finished) {
    return (
      <StepCard>
        <div className="flex flex-col items-center py-4 text-center">
          <h2 className="font-display text-xl font-bold text-white">🎯 Skill Assessment</h2>
          <p className="mt-1 text-[13px] text-text-secondary">{ASSESSMENT_TITLE[role]}</p>
          <p className="mt-6 font-display text-3xl font-bold text-primary">
            {score}/{questions.length} — {scoreLabel(score)}
          </p>
          <p className="mt-2 text-[13px] text-green-400">You have passed the skill assessment</p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 rounded-lg bg-primary px-8 py-3 text-sm font-bold text-navy"
          >
            Continue →
          </button>
        </div>
        <StepFooter onBack={onBack} backLabel={backLabel} />
      </StepCard>
    );
  }

  const question = questions[index];

  return (
    <StepCard>
      <h2 className="font-display text-xl font-bold text-white">🎯 Skill Assessment</h2>
      <p className="mt-1 text-[13px] text-text-secondary">{ASSESSMENT_TITLE[role]}</p>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Question {index + 1} of {questions.length}
      </p>
      <p className="mt-2 text-[15px] font-semibold text-text-primary">{question.text}</p>

      <div className="mt-4 flex flex-col gap-2">
        {question.options.map((option, optIndex) => {
          const isSelected = selected === optIndex;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(optIndex)}
              className={`rounded-[8px] border px-4 py-3 text-left text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-white"
                  : "border-border-dark bg-background text-text-secondary hover:border-primary/50"
              }`}
            >
              {String.fromCharCode(65 + optIndex)}) {option}
            </button>
          );
        })}
      </div>

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={handleNext}
          disabled={selected === null}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
            selected !== null
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          {index + 1 === questions.length ? "Finish →" : "Next →"}
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 3A — Document upload (factory / workshop / product samples)
// ─────────────────────────────────────────────────────────────

type DocBox = { key: string; emoji: string; label: string };
type DocGroupKey = "manufacturer" | "artisan" | "fabric_mill" | "trim_supplier" | "job_worker";

const DOCUMENT_SETS: Record<DocGroupKey, DocBox[]> = {
  manufacturer: [
    { key: "factory_front", emoji: "🏭", label: "Factory Front Photo" },
    { key: "production_floor", emoji: "🧵", label: "Production Floor Photo" },
    { key: "gst_certificate", emoji: "📄", label: "GST Certificate" },
    { key: "trade_licence", emoji: "📜", label: "Factory Licence / Trade Licence" },
  ],
  artisan: [
    { key: "workshop_photo", emoji: "🏚️", label: "Workshop Photo" },
    { key: "craft_sample", emoji: "🎨", label: "Craft Work Sample" },
    { key: "gi_tag_cert", emoji: "🏅", label: "GI Tag Certificate (if any)" },
    { key: "identity_proof", emoji: "🪪", label: "Identity Proof" },
  ],
  fabric_mill: [
    { key: "mill_photo", emoji: "🏭", label: "Mill/Factory Photo" },
    { key: "fabric_sample", emoji: "🧵", label: "Fabric Sample Photo" },
    { key: "gst_certificate", emoji: "📄", label: "GST Certificate" },
    { key: "test_report", emoji: "🧪", label: "Test Report (Oeko-Tex or similar)" },
  ],
  trim_supplier: [
    { key: "unit_photo", emoji: "🏭", label: "Unit/Factory Photo" },
    { key: "product_sample", emoji: "🧷", label: "Product Sample Photo" },
    { key: "gst_certificate", emoji: "📄", label: "GST Certificate" },
    { key: "business_licence", emoji: "📜", label: "Business Licence / Registration" },
  ],
  job_worker: [
    { key: "unit_photo", emoji: "🔧", label: "Unit/Work Photo" },
    { key: "work_sample", emoji: "🧵", label: "Work Sample Photo" },
    { key: "gst_certificate", emoji: "📄", label: "GST Certificate" },
    { key: "business_licence", emoji: "📜", label: "Business Licence / Registration" },
  ],
};

const DOCUMENT_SUBTITLE: Record<DocGroupKey, string> = {
  manufacturer: "Upload factory floor photos and business documents",
  artisan: "Upload workshop photos and craft samples",
  fabric_mill: "Upload product samples and facility photos",
  trim_supplier: "Upload product samples and facility photos",
  job_worker: "Upload product samples and facility photos",
};

function getDocGroupKey(userType: UserType): DocGroupKey {
  if (userType === "manufacturer") return "manufacturer";
  if (userType === "artisan") return "artisan";
  if (userType === "fabric_mill") return "fabric_mill";
  if (userType === "trim_supplier") return "trim_supplier";
  return "job_worker";
}

function UploadTile({
  box,
  fileName,
  onFile,
}: {
  box: DocBox;
  fileName?: string;
  onFile: (name: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(fileName);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-[8px] border-2 border-dashed p-6 text-center transition-colors ${
        hasFile ? "border-solid" : "border-border-dark hover:border-primary"
      }`}
      style={{ backgroundColor: "#07122a", ...(hasFile ? { borderColor: "#4ade80" } : {}) }}
    >
      {hasFile ? (
        <>
          <div className="text-2xl">✓</div>
          <p className="mt-2 truncate text-[13px] font-bold text-primary">{fileName}</p>
          <p className="mt-1 text-[11px] text-green-400">Uploaded</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFile(null);
            }}
            className="mt-1 text-[11px] text-text-secondary hover:text-text-primary"
          >
            Change
          </button>
        </>
      ) : (
        <>
          <div className="text-2xl">📤</div>
          <p className="mt-2 text-[13px] font-bold text-white">
            {box.emoji} {box.label}
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">Click to upload</p>
          <p className="mt-0.5 text-[10px] text-text-secondary">JPG, PNG or PDF · Max 5MB</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}

function DocumentUploadStep({
  subtitle,
  boxes,
  onContinue,
  onBack,
  backLabel,
}: {
  subtitle: string;
  boxes: DocBox[];
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [files, setFiles] = useState<Record<string, string>>({});
  const uploadedCount = Object.values(files).filter(Boolean).length;
  const isValid = uploadedCount >= 2;

  return (
    <StepCard maxWidth={640}>
      <h2 className="font-display text-xl font-bold text-white">📸 Upload Verification Documents</h2>
      <p className="mt-1 text-[13px] text-text-secondary">{subtitle}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {boxes.map((box) => (
          <UploadTile
            key={box.key}
            box={box}
            fileName={files[box.key]}
            onFile={(name) => setFiles((cur) => ({ ...cur, [box.key]: name ?? "" }))}
          />
        ))}
      </div>

      <div
        className="mt-5 rounded-[6px] p-3"
        style={{ backgroundColor: "#07122a", borderLeft: "3px solid #f2ca50" }}
      >
        <p className="text-xs text-text-secondary">
          📍 Photos must be taken from your registered business location. Location data is
          automatically captured when you take a photo on mobile.
        </p>
      </div>

      <DevModeHint text="Development mode: any file accepted" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 3B — Portfolio upload
// ─────────────────────────────────────────────────────────────

type PortfolioRole = "designer" | "master" | "merchandiser" | "qc_inspector";

const PORTFOLIO_COPY: Record<PortfolioRole, { line1: string; line2: string }> = {
  designer: {
    line1: "Upload 3 to 5 tech pack samples or design sketches",
    line2: "Best formats: PDF tech packs, Illustrator files, or high-res JPGs",
  },
  master: {
    line1: "Upload photos of samples you have made",
    line2: "Show different garment types and construction quality",
  },
  merchandiser: {
    line1: "Upload 3 to 5 project case studies or costing sheets",
    line2: "Show your production planning and vendor management work",
  },
  qc_inspector: {
    line1: "Upload 3 to 5 sample inspection reports",
    line2: "Show your inspection methodology and defect documentation",
  },
};

function PortfolioUploadStep({
  line1,
  line2,
  onContinue,
  onBack,
  backLabel,
}: {
  line1: string;
  line2: string;
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const added = Array.from(fileList).map((file) => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
    }));
    setFiles((cur) => [...cur, ...added]);
  };

  const removeFile = (index: number) => {
    setFiles((cur) => cur.filter((_, i) => i !== index));
  };

  const isValid = files.length >= 3;

  return (
    <StepCard maxWidth={640}>
      <h2 className="font-display text-xl font-bold text-white">💼 Upload Your Portfolio</h2>
      <p className="mt-1 text-[13px] text-text-secondary">{line1}</p>
      <p className="text-[13px] text-text-secondary">{line2}</p>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        onDragOver={(event) => event.preventDefault()}
        className="mt-5 cursor-pointer rounded-[10px] border-2 border-dashed border-border-dark p-10 text-center transition-colors hover:border-primary"
        style={{ backgroundColor: "#07122a" }}
      >
        <div className="text-3xl">📁</div>
        <p className="mt-2 text-[13px] text-text-secondary">
          Drag and drop files here or click to browse
        </p>
        <p className="mt-1 text-[11px] text-text-secondary">
          PDF, JPG, PNG · Max 5MB each · Minimum 3 files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-[6px] border border-border-dark bg-background px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span>📄</span>
                <span className="truncate text-text-primary">{file.name}</span>
                <span className="shrink-0 text-xs text-text-secondary">{file.size}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-green-400">✓</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-text-secondary hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DevModeHint text="Development mode: any file accepted" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// Artisan-only steps — craft certification & GI tag
// ─────────────────────────────────────────────────────────────

const CERT_BODIES = [
  "Craft Council of India",
  "State Handicrafts Board",
  "GI Registry",
  "Other",
  "I don't have formal certification",
];

function CraftCertificationStep({
  onContinue,
  onBack,
  backLabel,
}: {
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [body, setBody] = useState("");
  const [number, setNumber] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <StepCard>
      <h2 className="font-display text-xl font-bold text-white">🎖️ Craft Certification</h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Add your craft council membership or certification details, if you have one
      </p>

      <div className="mt-5">
        <label className="mb-1.5 block text-[13px] text-text-secondary">Certification body</label>
        <select
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="w-full appearance-none rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        >
          <option value="">Select an option</option>
          {CERT_BODIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] text-text-secondary">
          Certificate / membership number (optional)
        </label>
        <input
          type="text"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[13px] text-text-secondary">Certification document (optional)</p>
        <div
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-[8px] border-2 border-dashed p-5 text-center transition-colors ${
            fileName ? "border-solid" : "border-border-dark hover:border-primary"
          }`}
          style={{ backgroundColor: "#07122a", ...(fileName ? { borderColor: "#4ade80" } : {}) }}
        >
          {fileName ? (
            <p className="text-[13px] font-bold text-primary">✓ {fileName}</p>
          ) : (
            <p className="text-[13px] text-text-secondary">📤 Click to upload</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
        </div>
      </div>

      <DevModeHint text="Development mode: this step is optional and simulated" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-navy"
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

function GiTagStep({
  onContinue,
  onBack,
  backLabel,
}: {
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [hasGi, setHasGi] = useState<"yes" | "no" | null>(null);
  const [giNumber, setGiNumber] = useState("");

  return (
    <StepCard>
      <h2 className="font-display text-xl font-bold text-white">🏅 GI Tag Registration</h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Do you have a Geographical Indication (GI) tag for your craft?
      </p>

      <div className="mt-5 flex gap-2">
        {(["yes", "no"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setHasGi(option)}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
              hasGi === option
                ? "border-primary bg-primary text-navy"
                : "border-border-dark bg-background text-text-secondary"
            }`}
          >
            {option === "yes" ? "Yes, I have a GI tag" : "No / Not applicable"}
          </button>
        ))}
      </div>

      {hasGi === "yes" && (
        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] text-text-secondary">
            GI tag name / registration number
          </label>
          <input
            type="text"
            value={giNumber}
            onChange={(event) => setGiNumber(event.target.value)}
            placeholder="e.g. Lucknow Chikankari — GI/APP/2008/00001"
            className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
          />
          <p className="mt-2 text-[12px] text-green-400">✅ This craft is GI registered</p>
        </div>
      )}

      {hasGi === "no" && (
        <p className="mt-4 text-[12px] text-text-secondary">
          Not applicable — you can continue without a GI tag. You can add one later from your
          profile.
        </p>
      )}

      <DevModeHint text="Development mode: this step is optional and does not block verification" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-navy"
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 4 — Business references
// ─────────────────────────────────────────────────────────────

const DURATION_OPTIONS = ["Under 1 year", "1-3 years", "3-5 years", "5+ years"];

type ReferenceForm = {
  businessName: string;
  contactName: string;
  phone: string;
  duration: string;
  nature: string;
};

const EMPTY_REF: ReferenceForm = {
  businessName: "",
  contactName: "",
  phone: "",
  duration: DURATION_OPTIONS[0],
  nature: "",
};

function isRefFilled(ref: ReferenceForm) {
  return (
    ref.businessName.trim() !== "" &&
    ref.contactName.trim() !== "" &&
    ref.phone.trim() !== "" &&
    ref.nature.trim() !== ""
  );
}

function ReferenceFormCard({
  index,
  reference,
  onChange,
}: {
  index: number;
  reference: ReferenceForm;
  onChange: (patch: Partial<ReferenceForm>) => void;
}) {
  return (
    <div className="rounded-[10px] border border-border-dark bg-background p-4">
      <p className="text-sm font-bold text-primary">Reference {index}</p>
      <div className="mt-3 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Business / Brand name</label>
          <input
            value={reference.businessName}
            onChange={(event) => onChange({ businessName: event.target.value })}
            className="w-full rounded-[6px] border border-border-dark bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Contact person name</label>
          <input
            value={reference.contactName}
            onChange={(event) => onChange({ contactName: event.target.value })}
            className="w-full rounded-[6px] border border-border-dark bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Phone number</label>
          <div className="flex items-center overflow-hidden rounded-[6px] border border-border-dark bg-card focus-within:border-primary">
            <span className="pl-3 text-sm text-text-secondary">+91</span>
            <input
              value={reference.phone}
              onChange={(event) =>
                onChange({ phone: event.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              className="w-full bg-transparent px-2 py-2.5 text-sm text-text-primary outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            How long have you worked together?
          </label>
          <select
            value={reference.duration}
            onChange={(event) => onChange({ duration: event.target.value })}
            className="w-full appearance-none rounded-[6px] border border-border-dark bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Nature of work</label>
          <input
            value={reference.nature}
            onChange={(event) => onChange({ nature: event.target.value })}
            className="w-full rounded-[6px] border border-border-dark bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}

function ReferencesStep({
  onContinue,
  onBack,
  backLabel,
}: {
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [refs, setRefs] = useState<[ReferenceForm, ReferenceForm]>([
    { ...EMPTY_REF },
    { ...EMPTY_REF },
  ]);

  const updateRef = (index: 0 | 1, patch: Partial<ReferenceForm>) => {
    setRefs((cur) => {
      const next: [ReferenceForm, ReferenceForm] = [...cur];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const isValid = isRefFilled(refs[0]) && isRefFilled(refs[1]);

  return (
    <StepCard maxWidth={680}>
      <h2 className="font-display text-xl font-bold text-white">👥 Business References</h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Provide 2 businesses you have worked with
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReferenceFormCard index={1} reference={refs[0]} onChange={(patch) => updateRef(0, patch)} />
        <ReferenceFormCard index={2} reference={refs[1]} onChange={(patch) => updateRef(1, patch)} />
      </div>

      <div
        className="mt-5 rounded-[6px] p-3"
        style={{ backgroundColor: "#07122a", borderLeft: "3px solid #f59e0b" }}
      >
        <p className="text-xs text-text-secondary">
          FabVerify may contact these references to verify your working relationship. They will
          receive a WhatsApp message asking them to confirm.
        </p>
      </div>

      <DevModeHint text="Development mode: reference outreach is simulated" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 5 — Scheduling (video call / interview / field visit)
// ─────────────────────────────────────────────────────────────

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

const INTL_SLOT_CONVERSIONS: Record<string, { gmt: string; cet: string }> = {
  "9:00 AM": { gmt: "3:30 AM", cet: "4:30 AM" },
  "10:00 AM": { gmt: "4:30 AM", cet: "5:30 AM" },
  "11:00 AM": { gmt: "5:30 AM", cet: "6:30 AM" },
  "2:00 PM": { gmt: "8:30 AM", cet: "9:30 AM" },
  "3:00 PM": { gmt: "9:30 AM", cet: "10:30 AM" },
  "4:00 PM": { gmt: "10:30 AM", cet: "11:30 AM" },
};

function buildDayPills(): Schedule[] {
  const today = new Date();
  const days: Schedule[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short" });
    const dateLabel = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    days.push({ label, date: dateLabel, time: "" });
  }
  return days;
}

function SchedulingStep({
  heading,
  subtitle,
  points,
  extraNote,
  slotConversions,
  onDone,
  onBack,
  backLabel,
}: {
  heading: string;
  subtitle: string;
  points: string[];
  extraNote?: string;
  slotConversions?: Record<string, { gmt: string; cet: string }>;
  onDone: (schedule: Schedule | null) => void;
  onBack: () => void;
  backLabel: string;
}) {
  const days = useMemo(buildDayPills, []);
  const [selectedDay, setSelectedDay] = useState<Schedule | null>(null);
  const [selectedTime, setSelectedTime] = useState("");

  const isValid = Boolean(selectedDay && selectedTime);

  return (
    <StepCard maxWidth={680}>
      <h2 className="font-display text-xl font-bold text-white">{heading}</h2>
      <p className="mt-1 text-[13px] text-text-secondary">{subtitle}</p>

      <div className="mt-5 rounded-[8px] p-4" style={{ backgroundColor: "#07122a" }}>
        <ul className="flex flex-col gap-2">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="text-primary">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {extraNote && (
        <div
          className="mt-3 rounded-[8px] p-3"
          style={{ backgroundColor: "#07122a", borderLeft: "3px solid #f2ca50" }}
        >
          <p className="text-xs text-text-secondary">{extraNote}</p>
        </div>
      )}

      <p className="mt-5 text-[13px] text-text-secondary">Select preferred day</p>
      <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const isSelected = selectedDay?.label === day.label;
          return (
            <button
              key={day.label}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`shrink-0 rounded-[8px] border px-3.5 py-2.5 text-center transition-colors ${
                isSelected ? "border-primary bg-primary/10" : "border-border-dark bg-background"
              }`}
            >
              <p className={`text-[11px] ${isSelected ? "text-primary" : "text-text-secondary"}`}>
                {day.label}
              </p>
              <p className={`mt-0.5 text-xs font-bold ${isSelected ? "text-primary" : "text-white"}`}>
                {day.date}
              </p>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-[13px] text-text-secondary">Select time slot</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {TIME_SLOTS.map((time) => {
          const conversion = slotConversions?.[time];
          return (
            <div key={time} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`w-full rounded-[8px] border px-3 py-2.5 text-xs font-semibold transition-colors ${
                  selectedTime === time
                    ? "border-primary bg-primary text-navy"
                    : "border-border-dark bg-background text-text-secondary"
                }`}
              >
                {time}
              </button>
              {conversion && (
                <p className="text-center text-[10px] text-text-secondary">
                  {conversion.gmt} GMT · {conversion.cet} CET
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-text-secondary">Your timezone: IST (UTC+5:30)</p>
      {slotConversions && (
        <p className="mt-1 text-[11px] text-text-secondary">
          9am IST = 3:30am GMT = 4:30am CET
        </p>
      )}

      {isValid && (
        <div className="mt-5 rounded-[8px] border border-primary p-4">
          <p className="text-sm text-text-primary">
            📅 Call scheduled for
            <br />
            <span className="font-bold text-primary">
              {selectedDay!.label}, {selectedDay!.date}
            </span>{" "}
            at <span className="font-bold text-primary">{selectedTime}</span> IST
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            You will receive a WhatsApp reminder 1 hour before the call.
          </p>
        </div>
      )}

      <DevModeHint text="Development mode: scheduling is simulated, no real call is booked" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={() =>
            onDone(selectedDay ? { label: selectedDay.label, date: selectedDay.date, time: selectedTime } : null)
          }
          disabled={!isValid}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Confirm & Schedule →
        </button>
      </StepFooter>

      <button
        type="button"
        onClick={() => onDone(null)}
        className="mt-3 block w-full text-center text-[12px] text-text-secondary hover:text-text-primary"
      >
        Can&apos;t schedule now? Continue and schedule later →
      </button>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// Gold-only — field visit confirmation
// ─────────────────────────────────────────────────────────────

const FIELD_VISIT_CHECKS = [
  "Factory / workspace verified",
  "Production capacity assessed",
  "Submitted documents matched on-site",
  "Video recording of factory floor completed",
];

function FieldVisitConfirmationStep({
  visitDone,
  onSimulate,
  onContinue,
  onBack,
  backLabel,
}: {
  visitDone: boolean;
  onSimulate: () => void;
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <StepCard>
      <h2 className="font-display text-xl font-bold text-white">📋 Field Visit Results</h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Results from your FabVerify field officer visit
      </p>

      {!visitDone ? (
        <>
          <div className="mt-5 rounded-[8px] p-4" style={{ backgroundColor: "#07122a" }}>
            <p className="text-sm text-text-secondary">
              Your field visit is scheduled. Results will appear here once the visit is complete.
            </p>
          </div>
          <DevModeHint text="Development mode: click below to simulate visit completion instantly" />
          <StepFooter onBack={onBack} backLabel={backLabel}>
            <button
              type="button"
              onClick={onSimulate}
              className="w-full rounded-lg border border-primary py-3.5 text-sm font-bold text-primary"
            >
              Simulate Field Visit Completion
            </button>
          </StepFooter>
        </>
      ) : (
        <>
          <div
            className="mt-5 rounded-[8px] border p-4"
            style={{ backgroundColor: "#07122a", borderColor: "#4ade80" }}
          >
            <p className="text-sm font-bold text-green-400">✅ Field Visit Complete</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {FIELD_VISIT_CHECKS.map((check) => (
                <div key={check} className="flex items-center gap-2 text-xs text-text-primary">
                  <span className="text-green-400">✓</span>
                  {check}
                </div>
              ))}
            </div>
          </div>
          <StepFooter onBack={onBack} backLabel={backLabel}>
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-navy"
            >
              Continue →
            </button>
          </StepFooter>
        </>
      )}
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 6 — Complete
// ─────────────────────────────────────────────────────────────

const COMPLETE_BENEFITS = [
  "🔍 Higher search ranking",
  "💳 FabScore unlocked",
  "🤝 Trust badge on profile",
];

type TimelineItem = { icon: string; text: string };

function CompleteStep({
  tierLabel,
  timeline,
  benefitNoteTitle,
  benefitPills,
  benefitBullets,
  onBack,
  backLabel,
}: {
  tierLabel: string;
  timeline: TimelineItem[];
  benefitNoteTitle?: string;
  benefitPills?: string[];
  benefitBullets?: string[];
  onBack: () => void;
  backLabel: string;
}) {
  const progressPercent = Math.round(100 / timeline.length);

  return (
    <StepCard maxWidth={640}>
      <div className="flex flex-col items-center py-2 text-center">
        <div className="animate-pulse text-6xl">✅</div>
        <h2 className="mt-4 font-display text-2xl font-bold text-white">
          Verification Submitted!
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Your {tierLabel} verification is under review.
        </p>
      </div>

      <div className="mt-6 rounded-[10px] border border-border-dark bg-background p-5">
        <p className="text-sm font-bold text-white">What happens next</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {timeline.map((item, index) => (
            <div key={index} className="flex items-start gap-2.5 text-[13px] text-text-primary">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-text-secondary">
          Step 1 of {timeline.length} complete
        </p>
      </div>

      <p className="mt-6 text-center text-sm font-bold text-white">
        {benefitNoteTitle ?? `What you get with ${tierLabel}`}
      </p>
      {benefitPills && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {benefitPills.map((benefit) => (
            <span
              key={benefit}
              className="rounded-[20px] border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              {benefit}
            </span>
          ))}
        </div>
      )}
      {benefitBullets && (
        <div className="mt-3 flex flex-col gap-2">
          {benefitBullets.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2 text-[13px] text-text-secondary">
              <span className="text-primary">•</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="w-full rounded-lg bg-primary py-3.5 text-center text-sm font-bold text-navy"
        >
          Go to Dashboard →
        </Link>
        <Link
          href="/verification"
          className="w-full rounded-lg border border-primary py-3 text-center text-sm font-semibold text-primary"
        >
          View Verification Status →
        </Link>
      </div>

      <StepFooter onBack={onBack} backLabel={backLabel} />
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// International flow — Step 1: Location
// ─────────────────────────────────────────────────────────────

const PRIORITY_COUNTRIES = [
  "🇬🇧 United Kingdom",
  "🇩🇪 Germany",
  "🇫🇷 France",
  "🇺🇸 United States",
  "🇦🇪 UAE / Dubai",
  "🇧🇩 Bangladesh",
  "🇵🇰 Pakistan",
  "🇱🇰 Sri Lanka",
  "🇮🇹 Italy",
  "🇪🇸 Spain",
  "🇯🇵 Japan",
  "🇨🇳 China",
];

const OTHER_COUNTRIES = [
  "🇦🇺 Australia",
  "🇦🇹 Austria",
  "🇧🇪 Belgium",
  "🇧🇷 Brazil",
  "🇨🇦 Canada",
  "🇩🇰 Denmark",
  "🇪🇬 Egypt",
  "🇫🇮 Finland",
  "🇬🇷 Greece",
  "🇭🇰 Hong Kong",
  "🇮🇪 Ireland",
  "🇮🇩 Indonesia",
  "🇮🇱 Israel",
  "🇰🇪 Kenya",
  "🇰🇷 South Korea",
  "🇰🇼 Kuwait",
  "🇲🇾 Malaysia",
  "🇲🇽 Mexico",
  "🇳🇵 Nepal",
  "🇳🇱 Netherlands",
  "🇳🇿 New Zealand",
  "🇳🇬 Nigeria",
  "🇳🇴 Norway",
  "🇴🇲 Oman",
  "🇵🇱 Poland",
  "🇵🇹 Portugal",
  "🇶🇦 Qatar",
  "🇷🇺 Russia",
  "🇸🇦 Saudi Arabia",
  "🇸🇬 Singapore",
  "🇿🇦 South Africa",
  "🇸🇪 Sweden",
  "🇨🇭 Switzerland",
  "🇹🇭 Thailand",
  "🇹🇷 Turkey",
  "🇻🇳 Vietnam",
];

function CountryCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const query_ = query.trim().toLowerCase();
  const priorityMatches = PRIORITY_COUNTRIES.filter((c) => c.toLowerCase().includes(query_));
  const otherMatches = OTHER_COUNTRIES.filter((c) => c.toLowerCase().includes(query_));

  const selectCountry = (country: string) => {
    onChange(country);
    setQuery(country);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search for your country"
        className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
      />
      {open && (priorityMatches.length > 0 || otherMatches.length > 0) && (
        <div className="hide-scrollbar absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-[8px] border border-border-dark bg-card shadow-lg">
          {priorityMatches.length > 0 && (
            <div>
              <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                Most common
              </p>
              {priorityMatches.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => selectCountry(country)}
                  className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-primary/10"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
          {otherMatches.length > 0 && (
            <div>
              <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                Other countries
              </p>
              {otherMatches.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => selectCountry(country)}
                  className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-primary/10"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const INTL_BUSINESS_TYPES = [
  "Fashion Brand",
  "Retailer",
  "Buying House",
  "Export Agent",
  "Designer",
  "Other",
];

const INTL_CURRENCIES = ["GBP £", "EUR €", "USD $", "AED د.إ", "JPY ¥", "Other"];

export type IntlLocation = {
  country: string;
  city: string;
  businessType: string;
  currency: string;
};

function LocationStep({
  onContinue,
  onBack,
  backLabel,
}: {
  onContinue: (data: IntlLocation) => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [currency, setCurrency] = useState("");

  const isValid =
    country.trim() !== "" && city.trim() !== "" && businessType !== "" && currency !== "";

  return (
    <StepCard maxWidth={640}>
      <h2 className="font-display text-xl font-bold text-white">📍 Your Location</h2>
      <p className="mt-1 text-[13px] text-text-secondary">Tell us where your business is based</p>

      <div className="mt-5">
        <label className="mb-1.5 block text-[13px] text-text-secondary">Country</label>
        <CountryCombobox value={country} onChange={setCountry} />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] text-text-secondary">City</label>
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="e.g. London"
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
        />
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[13px] text-text-secondary">Business type</p>
        <div className="flex flex-wrap gap-2">
          {INTL_BUSINESS_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setBusinessType(type)}
              className={`rounded-[20px] border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                businessType === type
                  ? "border-primary bg-primary text-navy"
                  : "border-border-dark bg-background text-text-secondary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] text-text-secondary">
          Currency you transact in
        </label>
        <select
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className="w-full appearance-none rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        >
          <option value="">Select currency</option>
          {INTL_CURRENCIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={() => onContinue({ country, city, businessType, currency })}
          disabled={!isValid}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// International flow — Step 2: Identity (passport)
// ─────────────────────────────────────────────────────────────

function IntlIdentityStep({
  verifiedName,
  onContinue,
  onBack,
  backLabel,
}: {
  verifiedName: string;
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [consent, setConsent] = useState(false);
  const [legalName, setLegalName] = useState(verifiedName);
  const [dob, setDob] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportFile, setPassportFile] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const isValid =
    consent &&
    legalName.trim() !== "" &&
    dob !== "" &&
    passportNumber.trim() !== "" &&
    Boolean(passportFile) &&
    Boolean(selfieFile);

  return (
    <StepCard>
      <h2 className="font-display text-xl font-bold text-white">🪪 Identity Verification</h2>
      <p className="mt-1 text-[13px] text-text-secondary">Verify your personal identity</p>

      <div className="mt-5">
        <InfoBox>
          For international users we verify identity through passport and a short video
          selfie. This takes 2 to 3 business days to review.
        </InfoBox>
      </div>

      <label className="flex items-start gap-2.5 text-[12px] text-text-secondary">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#f2ca50]"
        />
        I consent to FabVerify storing a copy of my identity document for verification
        purposes as per our Privacy Policy.
      </label>

      <div className="mt-5">
        <label className="mb-1.5 block text-[13px] text-text-secondary">Full legal name</label>
        <p className="mb-1 text-[11px] text-text-secondary">As it appears on passport</p>
        <input
          type="text"
          value={legalName}
          onChange={(event) => setLegalName(event.target.value)}
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] text-text-secondary">Date of birth</label>
        <input
          type="date"
          value={dob}
          onChange={(event) => setDob(event.target.value)}
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] text-text-secondary">Passport number</label>
        <p className="mb-1 text-[11px] text-text-secondary">
          Found on the photo page of your passport
        </p>
        <input
          type="text"
          value={passportNumber}
          onChange={(event) => setPassportNumber(event.target.value.toUpperCase())}
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[13px] text-text-secondary">Passport photo page</p>
        <div
          onClick={() => passportInputRef.current?.click()}
          className={`cursor-pointer rounded-[8px] border-2 border-dashed p-6 text-center transition-colors ${
            passportFile ? "border-solid" : "border-border-dark hover:border-primary"
          }`}
          style={{ backgroundColor: "#07122a", ...(passportFile ? { borderColor: "#4ade80" } : {}) }}
        >
          {passportFile ? (
            <>
              <div className="text-2xl">🖼️</div>
              <p className="mt-1 text-[13px] font-bold text-primary">{passportFile}</p>
              <p className="mt-1 text-[11px] text-green-400">Uploaded</p>
            </>
          ) : (
            <>
              <div className="text-2xl">📤</div>
              <p className="mt-2 text-[13px] font-semibold text-white">
                Upload passport photo page
              </p>
              <p className="mt-1 text-[11px] text-text-secondary">
                Show the page with your photo, name, and passport number clearly
              </p>
              <p className="mt-0.5 text-[10px] text-text-secondary">JPG or PNG · Max 5MB</p>
            </>
          )}
          <input
            ref={passportInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            className="hidden"
            onChange={(event) => setPassportFile(event.target.files?.[0]?.name ?? null)}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[13px] text-text-secondary">Selfie verification</p>
        <div
          onClick={() => selfieInputRef.current?.click()}
          className={`cursor-pointer rounded-[8px] border-2 border-dashed p-8 text-center transition-colors ${
            selfieFile ? "border-solid" : "border-border-dark hover:border-primary"
          }`}
          style={{ backgroundColor: "#07122a", ...(selfieFile ? { borderColor: "#4ade80" } : {}) }}
        >
          {selfieFile ? (
            <>
              <div className="text-3xl">✅</div>
              <p className="mt-1 text-[13px] font-bold text-primary">{selfieFile}</p>
              <p className="mt-1 text-[11px] text-green-400">Uploaded</p>
            </>
          ) : (
            <>
              <div className="text-3xl">📷</div>
              <p className="mt-2 text-[13px] font-semibold text-white">
                Take a selfie holding your passport
              </p>
              <p className="mt-1 text-[11px] text-text-secondary">
                This confirms you are the passport holder
              </p>
            </>
          )}
          <input
            ref={selfieInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setSelfieFile(event.target.files?.[0]?.name ?? null)}
          />
        </div>
        <button
          type="button"
          onClick={() => selfieInputRef.current?.click()}
          className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-navy"
        >
          Take Photo →
        </button>
      </div>

      <DevModeHint text="Development mode: upload any photo" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// International flow — Step 3: Business
// ─────────────────────────────────────────────────────────────

type CountryCategory = "uk" | "eu" | "uae" | "usa" | "manual";

const EU_COUNTRY_NAMES = [
  "germany",
  "france",
  "italy",
  "spain",
  "netherlands",
  "belgium",
  "portugal",
  "ireland",
  "poland",
  "sweden",
  "austria",
  "greece",
  "denmark",
  "finland",
];

function classifyCountry(country: string): CountryCategory {
  const c = country.toLowerCase();
  if (c.includes("united kingdom")) return "uk";
  if (c.includes("united states")) return "usa";
  if (c.includes("uae") || c.includes("dubai")) return "uae";
  if (EU_COUNTRY_NAMES.some((name) => c.includes(name))) return "eu";
  return "manual";
}

function vatHintFor(country: string): string {
  const c = country.toLowerCase();
  if (c.includes("germany")) return "DE followed by 9 digits (e.g. DE123456789)";
  if (c.includes("france")) return "FR followed by 11 characters (e.g. FRXX999999999)";
  if (c.includes("italy")) return "IT followed by 11 digits (e.g. IT12345678901)";
  if (c.includes("spain")) return "ES followed by 9 characters (e.g. ESX1234567X)";
  return "Your country's VAT format (e.g. XX123456789)";
}

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"];

function IntlBusinessStep({
  country,
  onContinue,
  onBack,
  backLabel,
}: {
  country: string;
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const category = classifyCountry(country);
  const [regNumber, setRegNumber] = useState("");
  const [emirate, setEmirate] = useState(EMIRATES[0]);
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const fieldMeta: Record<
    CountryCategory,
    { label: string; hint: string; buttonText: string; loadingText: string }
  > = {
    uk: {
      label: "Companies House Number",
      hint: "8-digit number (e.g. 12345678)",
      buttonText: "Verify with Companies House →",
      loadingText: "Checking Companies House...",
    },
    eu: {
      label: "VAT Registration Number",
      hint: vatHintFor(country),
      buttonText: "Verify VAT →",
      loadingText: "Checking VAT registry...",
    },
    uae: {
      label: "Trade Licence Number",
      hint: "e.g. 123456",
      buttonText: "Verify Trade Licence →",
      loadingText: "Checking Trade Licence registry...",
    },
    usa: {
      label: "EIN (Employer ID Number)",
      hint: "XX-XXXXXXX format",
      buttonText: "Verify EIN →",
      loadingText: "Checking IRS EIN records...",
    },
    manual: {
      label: "Business Registration Number",
      hint: "Reviewed manually by our team",
      buttonText: "Submit for Review →",
      loadingText: "Submitting...",
    },
  };
  const meta = fieldMeta[category];

  const handleVerify = () => {
    if (!regNumber.trim() || loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
    }, 1200);
  };

  return (
    <StepCard maxWidth={640}>
      <h2 className="font-display text-xl font-bold text-white">🏢 Business Verification</h2>
      <p className="mt-1 text-[13px] text-text-secondary">Verify your company registration</p>

      <div className="mt-5">
        <label className="mb-1.5 block text-[13px] text-text-secondary">{meta.label}</label>
        <p className="mb-1 text-[11px] text-text-secondary">{meta.hint}</p>
        <input
          type="text"
          value={regNumber}
          disabled={verified}
          onChange={(event) => setRegNumber(event.target.value.toUpperCase())}
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary disabled:opacity-60"
        />

        {category === "uae" && (
          <div className="mt-3">
            <label className="mb-1.5 block text-[13px] text-text-secondary">Emirate</label>
            <select
              value={emirate}
              disabled={verified}
              onChange={(event) => setEmirate(event.target.value)}
              className="w-full appearance-none rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary disabled:opacity-60"
            >
              {EMIRATES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        )}

        {!verified && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={!regNumber.trim() || loading}
            className={`mt-3 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${
              regNumber.trim() && !loading
                ? "cursor-pointer bg-primary text-navy"
                : "cursor-not-allowed bg-border-dark text-text-secondary"
            }`}
          >
            {loading ? meta.loadingText : meta.buttonText}
          </button>
        )}

        {verified && category !== "manual" && (
          <ResultCard
            title="✅ Business Found"
            rows={[
              { label: "Company Name", value: "Sharma Global Trading Ltd" },
              { label: "Registration Date", value: "12/03/2019" },
              { label: "Status", value: "Active", pill: true },
              { label: "Country", value: country.replace(/^\S+\s/, "") || country },
            ]}
          />
        )}

        {verified && category === "manual" && (
          <div
            className="mt-3 rounded-[8px] border p-4"
            style={{ backgroundColor: "#07122a", borderColor: "#f59e0b" }}
          >
            <p className="text-sm font-bold text-amber-400">📋 Manual Review Required</p>
            <p className="mt-2 text-xs text-text-secondary">
              Our team will verify your business registration within 2 business days. You
              will receive an email confirmation.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-border-dark pt-5">
        <label className="mb-1.5 block text-[13px] text-text-secondary">
          Business website (optional)
        </label>
        <input
          type="url"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://"
          className="w-full rounded-[6px] border border-border-dark bg-background px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
        />
        <p className="mt-1 text-[11px] text-text-secondary">Helps our team verify faster</p>
      </div>

      <DevModeHint text="Development mode: any registration number is accepted and instantly verified" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!verified}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            verified
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// International flow — Step 4: Supporting documents
// ─────────────────────────────────────────────────────────────

type IntlDocBox = { key: string; label: string; hint?: string; required: boolean };

const INTL_DOC_BOXES: IntlDocBox[] = [
  { key: "company_cert", label: "Company Registration Certificate", required: true },
  {
    key: "address_proof",
    label: "Proof of Business Address",
    hint: "Utility bill or bank statement not older than 3 months",
    required: true,
  },
  {
    key: "bank_statement",
    label: "Bank Statement or Letter",
    hint: "Shows your business bank account",
    required: false,
  },
  {
    key: "additional_doc",
    label: "Additional Document",
    hint: "Any other relevant business document",
    required: false,
  },
];

function IntlUploadTile({
  box,
  fileName,
  onFile,
}: {
  box: IntlDocBox;
  fileName?: string;
  onFile: (name: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(fileName);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-[8px] border-2 border-dashed p-6 text-center transition-colors ${
        hasFile ? "border-solid" : "border-border-dark hover:border-primary"
      }`}
      style={{ backgroundColor: "#07122a", ...(hasFile ? { borderColor: "#4ade80" } : {}) }}
    >
      {hasFile ? (
        <>
          <div className="text-2xl">✓</div>
          <p className="mt-2 truncate text-[13px] font-bold text-primary">{fileName}</p>
          <p className="mt-1 text-[11px] text-green-400">Uploaded</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFile(null);
            }}
            className="mt-1 text-[11px] text-text-secondary hover:text-text-primary"
          >
            Change
          </button>
        </>
      ) : (
        <>
          <div className="text-2xl">📤</div>
          <p className="mt-2 text-[13px] font-bold text-white">
            {box.label} {box.required && <span className="text-red-400">*</span>}
          </p>
          {box.hint && <p className="mt-1 text-[11px] text-text-secondary">{box.hint}</p>}
          {!box.required && (
            <p className="mt-1 text-[10px] text-text-secondary">Optional</p>
          )}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}

function IntlDocumentsStep({
  onContinue,
  onBack,
  backLabel,
}: {
  onContinue: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const [files, setFiles] = useState<Record<string, string>>({});
  const isValid = Boolean(files.company_cert) && Boolean(files.address_proof);

  return (
    <StepCard maxWidth={640}>
      <h2 className="font-display text-xl font-bold text-white">📄 Supporting Documents</h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Upload documents to complete verification
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {INTL_DOC_BOXES.map((box) => (
          <IntlUploadTile
            key={box.key}
            box={box}
            fileName={files[box.key]}
            onFile={(name) => setFiles((cur) => ({ ...cur, [box.key]: name ?? "" }))}
          />
        ))}
      </div>

      <div
        className="mt-5 rounded-[6px] p-3"
        style={{ backgroundColor: "#07122a", borderLeft: "3px solid #f2ca50" }}
      >
        <p className="text-xs text-text-secondary">
          🔒 All documents are encrypted and stored securely. They are only accessed by
          FabVerify&apos;s verification team and are never shared with third parties.
        </p>
      </div>

      <DevModeHint text="Development mode: any file accepted" />

      <StepFooter onBack={onBack} backLabel={backLabel}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={`w-full rounded-lg py-3.5 text-sm font-bold transition-colors ${
            isValid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </StepFooter>
    </StepCard>
  );
}

// ─────────────────────────────────────────────────────────────
// Wizard shell
// ─────────────────────────────────────────────────────────────

function IdentityVerificationWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, mounted, setUser } = useUser();
  const urlTier = searchParams.get("tier");

  const [stepIndex, setStepIndex] = useState(0);
  const [region, setRegion] = useState<Region | null>(null);
  const [savedTier, setSavedTier] = useState<"silver" | "gold" | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [videoSchedule, setVideoSchedule] = useState<Schedule | null>(null);
  const [fieldVisitSchedule, setFieldVisitSchedule] = useState<Schedule | null>(null);
  const [fieldVisitDone, setFieldVisitDone] = useState(false);
  const [intlLocation, setIntlLocation] = useState<IntlLocation | null>(null);

  const tier: "silver" | "gold" =
    urlTier === "gold" ? "gold" : urlTier === "silver" ? "silver" : (savedTier ?? "silver");

  // Resume from localStorage: read once mounted, then allow persistence writes.
  useEffect(() => {
    if (!mounted) return;
    try {
      const storedRegion = localStorage.getItem("fabverify_user_region");
      const storedStep = localStorage.getItem("fabverify_verify_step");
      const storedTier = localStorage.getItem("fabverify_verify_tier");
      if (storedRegion === "india" || storedRegion === "international") {
        setRegion(storedRegion);
        const parsed = storedStep ? parseInt(storedStep, 10) : 0;
        if (!Number.isNaN(parsed) && parsed >= 0) setStepIndex(parsed);
      }
      if (storedTier === "silver" || storedTier === "gold") {
        setSavedTier(storedTier);
      }
    } catch {}
    setHydrated(true);
  }, [mounted]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (region) localStorage.setItem("fabverify_user_region", region);
      localStorage.setItem("fabverify_verify_step", String(stepIndex));
      localStorage.setItem("fabverify_verify_tier", tier);
    } catch {}
  }, [hydrated, region, stepIndex, tier]);

  const userType = user.userType;
  const flowGroup = FLOW_GROUP_BY_USER_TYPE[userType];
  const isGold = tier === "gold";
  const tierLabel = isGold ? "Gold" : "Silver";

  const stepKinds: StepKind[] =
    region === "india"
      ? ["country", ...injectGoldSteps(BASE_STEP_KINDS[flowGroup], GOLD_STEP_KINDS, isGold)]
      : region === "international"
        ? [
            "country",
            "intl_location",
            "intl_identity",
            "intl_business",
            "intl_documents",
            "intl_video_call",
            "intl_complete",
          ]
        : ["country"];

  const stepLabels: string[] =
    region === "india"
      ? ["Country", ...injectGoldSteps(BASE_STEP_LABELS[flowGroup], GOLD_STEP_LABELS, isGold)]
      : region === "international"
        ? ["Country", "Location", "Identity", "Business", "Documents", "Video Call", "Complete"]
        : ["Country"];

  const clampedStepIndex = Math.min(stepIndex, stepKinds.length - 1);
  const goNext = () => setStepIndex(Math.min(clampedStepIndex + 1, stepKinds.length - 1));
  const goBack = () => setStepIndex(Math.max(clampedStepIndex - 1, 0));

  const currentKind = stepKinds[clampedStepIndex];
  const nextLabel = stepLabels[clampedStepIndex + 1] ?? "Complete";
  const backLabel = `← Back to ${stepLabels[clampedStepIndex - 1] ?? "Country"}`;

  const startOver = () => {
    try {
      localStorage.removeItem("fabverify_verify_step");
      localStorage.removeItem("fabverify_user_region");
      localStorage.removeItem("fabverify_verify_country");
      localStorage.removeItem("fabverify_verify_tier");
    } catch {}
    setRegion(null);
    setStepIndex(0);
  };

  useEffect(() => {
    if (!mounted || (currentKind !== "complete" && currentKind !== "intl_complete")) return;
    const alreadyAtOrAboveTier =
      user.verificationTier === tier ||
      (tier === "silver" && (user.verificationTier === "gold" || user.verificationTier === "platinum"));
    if (!alreadyAtOrAboveTier) {
      setUser({ verificationTier: tier });
    }
    try {
      localStorage.removeItem("fabverify_verify_step");
      localStorage.removeItem("fabverify_user_region");
      localStorage.removeItem("fabverify_verify_tier");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentKind, tier]);

  if (!mounted || !hydrated) return null;

  let stepContent: React.ReactNode = null;

  switch (currentKind) {
    case "country":
      stepContent = (
        <CountryStep
          onContinue={(selectedRegion) => {
            setRegion(selectedRegion);
            setStepIndex(1);
          }}
        />
      );
      break;

    case "intl_location":
      stepContent = (
        <LocationStep
          onContinue={(data) => {
            setIntlLocation(data);
            goNext();
          }}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "intl_identity":
      stepContent = (
        <IntlIdentityStep
          verifiedName={user.name}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "intl_business":
      stepContent = (
        <IntlBusinessStep
          country={intlLocation?.country ?? ""}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "intl_documents":
      stepContent = <IntlDocumentsStep onContinue={goNext} onBack={goBack} backLabel={backLabel} />;
      break;

    case "intl_video_call":
      stepContent = (
        <SchedulingStep
          heading="📹 Schedule Video Verification"
          subtitle="A 10-minute call with our verification team"
          points={[
            "We verify you are the person from your passport and selfie",
            "We ask you to show your workspace briefly on camera",
            "We review your submitted documents",
            "We confirm your business details",
          ]}
          extraNote="For international users the call is in English. Our team is available Monday to Friday 9am to 6pm IST (3:30am to 12:30pm GMT)."
          slotConversions={INTL_SLOT_CONVERSIONS}
          onDone={(schedule) => {
            setVideoSchedule(schedule);
            goNext();
          }}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "intl_complete": {
      const nextStepLine = videoSchedule
        ? `📹 Video call — ${videoSchedule.label}, ${videoSchedule.date} at ${videoSchedule.time}`
        : "📹 Video call — To be scheduled";
      stepContent = (
        <CompleteStep
          tierLabel={tierLabel}
          timeline={[
            { icon: "✅", text: "Documents submitted — Done now" },
            { icon: "⏳", text: "Document review — 2-3 business days" },
            { icon: nextStepLine.slice(0, 2), text: nextStepLine.slice(3) },
            { icon: "📧", text: "Email confirmation — within 24 hours" },
            { icon: "🏅", text: `${tierLabel} badge activated — 3-5 business days` },
          ]}
          benefitNoteTitle="As an international verified user you can:"
          benefitBullets={[
            "Source from 200+ verified Indian manufacturers",
            "Place orders with escrow protection",
            "Receive EU compliance certificates",
            "Access FabPrice international benchmarks",
          ]}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;
    }

    case "identity":
      stepContent = (
        <AadhaarIdentityStep
          verifiedName={user.name}
          nextLabel={nextLabel}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "business_gst":
      stepContent = (
        <BusinessGstStep
          isManufacturer={userType === "manufacturer"}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "skill_assessment":
      stepContent = (
        <SkillAssessmentStep
          role={userType as TalentRole}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "document_upload": {
      const docGroupKey = getDocGroupKey(userType);
      stepContent = (
        <DocumentUploadStep
          subtitle={DOCUMENT_SUBTITLE[docGroupKey]}
          boxes={DOCUMENT_SETS[docGroupKey]}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;
    }

    case "portfolio_upload": {
      const copy = PORTFOLIO_COPY[userType as PortfolioRole];
      stepContent = (
        <PortfolioUploadStep
          line1={copy.line1}
          line2={copy.line2}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;
    }

    case "craft_certification":
      stepContent = <CraftCertificationStep onContinue={goNext} onBack={goBack} backLabel={backLabel} />;
      break;

    case "gi_tag":
      stepContent = <GiTagStep onContinue={goNext} onBack={goBack} backLabel={backLabel} />;
      break;

    case "references":
      stepContent = <ReferencesStep onContinue={goNext} onBack={goBack} backLabel={backLabel} />;
      break;

    case "video_call": {
      const isTalent = flowGroup === "talent";
      stepContent = (
        <SchedulingStep
          heading={isTalent ? "📹 Schedule Your Verification Interview" : "📹 Schedule Video Verification"}
          subtitle={
            isTalent
              ? "A short interview with our FabTalent panel"
              : "A 10-minute call with our verification team"
          }
          points={
            isTalent
              ? [
                  "We review your skill assessment and portfolio together",
                  "We ask a few questions about your experience",
                  "We confirm your availability and working style",
                  "We explain next steps for getting hired on FabVerify",
                ]
              : [
                  "We verify you are the person from the Aadhaar verification",
                  "We ask you to show your workspace briefly on camera",
                  "We review your submitted documents",
                  "We confirm your business details",
                ]
          }
          onDone={(schedule) => {
            setVideoSchedule(schedule);
            goNext();
          }}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;
    }

    case "field_visit_schedule":
      stepContent = (
        <SchedulingStep
          heading="🏭 Schedule Field Visit"
          subtitle="A FabVerify field officer will visit your registered location"
          points={[
            "A field officer visits your registered business location",
            "They record a short video walkthrough of your factory floor",
            "They verify your production capacity in person",
            "They complete an annual audit checklist",
          ]}
          onDone={(schedule) => {
            setFieldVisitSchedule(schedule);
            goNext();
          }}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "field_visit_confirmation":
      stepContent = (
        <FieldVisitConfirmationStep
          visitDone={fieldVisitDone}
          onSimulate={() => setFieldVisitDone(true)}
          onContinue={goNext}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;

    case "complete": {
      const nextStepLine =
        isGold && fieldVisitSchedule
          ? `🏭 Field visit — ${fieldVisitSchedule.label}, ${fieldVisitSchedule.date} at ${fieldVisitSchedule.time}`
          : videoSchedule
            ? `${flowGroup === "talent" ? "📹 Interview" : "📹 Video call"} — ${videoSchedule.label}, ${videoSchedule.date} at ${videoSchedule.time}`
            : "🔍 Final compliance review — 24-48 hours";
      stepContent = (
        <CompleteStep
          tierLabel={tierLabel}
          timeline={[
            { icon: "✅", text: "Documents submitted — Done now" },
            { icon: "⏳", text: "Document review — 24-48 hours" },
            { icon: nextStepLine.slice(0, 2), text: nextStepLine.slice(3) },
            { icon: "🏅", text: `${tierLabel} badge activated — 48-72 hours` },
          ]}
          benefitPills={COMPLETE_BENEFITS}
          onBack={goBack}
          backLabel={backLabel}
        />
      );
      break;
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#07122a",
        overflowY: "auto",
        paddingBottom: 60,
      }}
    >
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem("fabverify_verify_step");
              } catch {}
              router.push("/verification");
            }}
            className="text-[13px] text-text-secondary hover:text-text-primary"
          >
            ← Back to Verification
          </button>
          <span className="text-[11px] font-semibold text-text-secondary">
            {tierLabel} Verification
          </span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 font-display text-lg font-bold">
          <span>🧵</span>
          <span className="text-white">Fab</span>
          <span className="text-primary">Verify</span>
        </div>

        <div className="mt-8">
          <ProgressStepper labels={stepLabels} currentIndex={clampedStepIndex} />
        </div>

        {clampedStepIndex > 0 && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={startOver}
              className="cursor-pointer text-[11px]"
              style={{ color: "#7A8FA8" }}
            >
              Not you? Start over →
            </button>
          </div>
        )}

        <div className="mt-8">{stepContent}</div>
      </div>
    </div>
  );
}

export default function VerificationIdentityPage() {
  return (
    <Suspense fallback={null}>
      <IdentityVerificationWizard />
    </Suspense>
  );
}
