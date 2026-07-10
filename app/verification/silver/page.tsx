"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";

const STEP_LABELS = ["Documents", "References", "Video Check", "Review & Pay"];

const DURATION_OPTIONS = [
  "Less than 6 months",
  "6-12 months",
  "1-2 years",
  "2+ years",
];

const DAY_LABELS = ["Today", "Tomorrow", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_OPTIONS = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];

const UNLOCK_ITEMS = [
  { icon: "⚡", text: "FabFloat — Instant payment" },
  { icon: "🕐", text: "FabPay Later — Buy now pay later" },
  { icon: "💳", text: "₹2L credit limit" },
  { icon: "⭐", text: "Priority search ranking" },
];

const VIDEO_CHECK_POINTS = [
  "A FabVerify team member calls you on WhatsApp or Google Meet",
  "You show your workspace briefly — just 2-3 minutes of video",
  "We confirm your documents are genuine",
  "We ask 2-3 simple questions about your work experience",
  "Total time: 10-15 minutes",
];

const ACCEPTED_PAYMENTS = ["UPI", "Visa", "Mastercard", "Net Banking"];

type UploadKey = "gst" | "businessReg" | "workspacePhotos" | "identityProof";

type Reference = {
  brandName: string;
  contactPerson: string;
  whatsapp: string;
  email: string;
  duration: string;
};

const EMPTY_REFERENCE: Reference = {
  brandName: "",
  contactPerson: "",
  whatsapp: "",
  email: "",
  duration: DURATION_OPTIONS[0],
};

function buildDaySlots() {
  const today = new Date();
  return DAY_LABELS.map((label, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return { label, date: date.getDate() };
  });
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          const isDone = stepNumber < currentStep;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  isCurrent || isDone
                    ? "border-primary bg-primary text-navy"
                    : "border-border-dark text-text-secondary"
                }`}
              >
                {isDone ? "✓" : stepNumber}
              </div>
              {stepNumber < STEP_LABELS.length && (
                <div
                  className={`h-[2px] flex-1 ${
                    isDone ? "bg-primary" : "bg-border-dark"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          return (
            <div key={label} className="flex-1 text-center">
              <p
                className={`text-[10px] ${
                  isCurrent ? "text-white" : "text-text-secondary"
                }`}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadBox({
  emoji,
  title,
  lines,
  fileNames,
  multiple,
  onFiles,
}: {
  emoji: string;
  title: string;
  lines: string[];
  fileNames: string[];
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFiles = fileNames.length > 0;

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(Array.from(event.dataTransfer.files));
      }}
      onDragOver={(event) => event.preventDefault()}
      className={`cursor-pointer rounded-[10px] border-2 p-7 text-center transition-colors ${
        hasFiles
          ? "border-solid"
          : "border-dashed border-border-dark bg-card hover:border-primary"
      }`}
      style={
        hasFiles
          ? { borderColor: "#4ade80", backgroundColor: "rgba(74,222,128,0.05)" }
          : undefined
      }
    >
      {hasFiles ? (
        <>
          <div className="text-2xl" style={{ color: "#4ade80" }}>
            ✅
          </div>
          <p
            className="mt-2 truncate text-sm font-semibold"
            style={{ color: "#4ade80" }}
          >
            {fileNames.join(", ")}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {emoji} {title}
          </p>
        </>
      ) : (
        <>
          <div className="text-2xl text-text-secondary">📤</div>
          <p className="mt-2 text-sm font-semibold text-text-primary">
            {emoji} {title}
          </p>
          {lines.map((line) => (
            <p key={line} className="mt-1 text-xs text-text-secondary">
              {line}
            </p>
          ))}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
      />
    </div>
  );
}

export default function SilverVerification() {
  const [currentStep, setCurrentStep] = useState(1);

  const [uploadedFiles, setUploadedFiles] = useState<Record<UploadKey, string[]>>({
    gst: [],
    businessReg: [],
    workspacePhotos: [],
    identityProof: [],
  });

  const [references, setReferences] = useState<Reference[]>([
    { ...EMPTY_REFERENCE },
    { ...EMPTY_REFERENCE },
  ]);

  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const daySlots = useMemo(buildDaySlots, []);

  const handleUpload = (key: UploadKey, files: File[]) => {
    setUploadedFiles((current) => ({
      ...current,
      [key]: files.map((file) => file.name),
    }));
  };

  const updateReference = (
    index: number,
    field: keyof Reference,
    value: string
  ) => {
    setReferences((current) =>
      current.map((ref, i) => (i === index ? { ...ref, [field]: value } : ref))
    );
  };

  const isStep1Valid =
    uploadedFiles.gst.length > 0 &&
    uploadedFiles.businessReg.length > 0 &&
    uploadedFiles.workspacePhotos.length > 0 &&
    uploadedFiles.identityProof.length > 0;

  const isStep3Valid = Boolean(selectedDay && selectedTime);

  const handleBack = () => setCurrentStep((step) => Math.max(1, step - 1));
  const handleContinue = () => setCurrentStep((step) => Math.min(4, step + 1));

  const step1Content = (
    <div>
      <h2 className="text-lg font-bold text-white">
        Upload your business documents
      </h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        All documents are encrypted and stored securely. Only our
        verification team can access them.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UploadBox
          emoji="📄"
          title="GST Certificate"
          lines={["Click to upload or drag and drop", "PDF or JPG • Max 5MB"]}
          fileNames={uploadedFiles.gst}
          onFiles={(files) => handleUpload("gst", files)}
        />
        <UploadBox
          emoji="🏢"
          title="Business Registration"
          lines={[
            "Proprietorship / Partnership / Company registration",
            "PDF or JPG • Max 5MB",
          ]}
          fileNames={uploadedFiles.businessReg}
          onFiles={(files) => handleUpload("businessReg", files)}
        />
        <UploadBox
          emoji="📸"
          title="Workspace Photos"
          lines={[
            "Upload 3 photos of your factory or workspace",
            "Geo-tagged photos preferred",
            "JPG or PNG • Up to 3 files",
          ]}
          fileNames={uploadedFiles.workspacePhotos}
          multiple
          onFiles={(files) => handleUpload("workspacePhotos", files.slice(0, 3))}
        />
        <UploadBox
          emoji="🪪"
          title="Aadhaar Card"
          lines={["Front and back side", "JPG or PDF • Max 5MB"]}
          fileNames={uploadedFiles.identityProof}
          multiple
          onFiles={(files) => handleUpload("identityProof", files)}
        />
      </div>

      <div
        className="mt-6 rounded-[6px] p-3.5"
        style={{ backgroundColor: "#07122a", borderLeft: "2px solid #f2ca50" }}
      >
        <p className="text-xs text-text-secondary">
          🔒 Your documents are safe. FabVerify uses bank-level encryption.
          Documents are deleted after verification is complete.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isStep1Valid}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
            isStep1Valid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue to References →
        </button>
      </div>
    </div>
  );

  const step2Content = (
    <div>
      <h2 className="text-lg font-bold text-white">
        Add 2 client references
      </h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Brands or buyers you have worked with recently. We send them a quick
        verification message.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {references.map((reference, index) => (
          <div
            key={index}
            className="rounded-[10px] border border-border-dark bg-card p-5"
          >
            <p className="text-sm font-bold text-primary">
              Reference {index + 1}
            </p>
            <div className="mt-3 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Client / Brand name *
                </label>
                <input
                  type="text"
                  value={reference.brandName}
                  onChange={(event) =>
                    updateReference(index, "brandName", event.target.value)
                  }
                  className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Their name and designation *
                </label>
                <input
                  type="text"
                  value={reference.contactPerson}
                  onChange={(event) =>
                    updateReference(index, "contactPerson", event.target.value)
                  }
                  className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Their WhatsApp number *
                </label>
                <input
                  type="tel"
                  value={reference.whatsapp}
                  onChange={(event) =>
                    updateReference(index, "whatsapp", event.target.value)
                  }
                  className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Their email address *
                </label>
                <input
                  type="email"
                  value={reference.email}
                  onChange={(event) =>
                    updateReference(index, "email", event.target.value)
                  }
                  className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  How long have you worked together
                </label>
                <select
                  value={reference.duration}
                  onChange={(event) =>
                    updateReference(index, "duration", event.target.value)
                  }
                  className="w-full appearance-none rounded-[6px] border border-border-dark bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[12px] italic text-text-secondary">
        We send a simple verification link to your references via WhatsApp.
        They confirm in one click. This takes about 24 hours.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-navy"
        >
          Continue to Video Check →
        </button>
      </div>
    </div>
  );

  const step3Content = (
    <div>
      <h2 className="text-lg font-bold text-white">
        Schedule your video spot check
      </h2>

      <div
        className="mt-4 rounded-[8px] bg-card p-5"
        style={{ borderLeft: "3px solid #f2ca50" }}
      >
        <p className="text-sm font-semibold text-text-primary">
          What happens in the video check:
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {VIDEO_CHECK_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13px] text-text-secondary">
              <span className="text-primary">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-[12px] text-primary">
        Available Monday to Saturday 10am to 7pm IST
      </p>

      <p className="mt-6 text-sm text-text-secondary">
        Choose your preferred time
      </p>
      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {daySlots.map((slot) => {
          const isSelected = selectedDay === slot.label;
          return (
            <button
              key={slot.label}
              type="button"
              onClick={() => setSelectedDay(slot.label)}
              className={`shrink-0 rounded-[8px] border px-3.5 py-2.5 text-center transition-colors ${
                isSelected
                  ? "border-primary"
                  : "border-border-dark bg-card"
              }`}
              style={
                isSelected
                  ? { backgroundColor: "rgba(242,202,80,0.08)" }
                  : undefined
              }
            >
              <p
                className={`text-[11px] ${
                  isSelected ? "text-primary" : "text-text-secondary"
                }`}
              >
                {slot.label}
              </p>
              <p
                className={`mt-0.5 text-base font-bold ${
                  isSelected ? "text-primary" : "text-white"
                }`}
              >
                {slot.date}
              </p>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <>
          <p className="mt-5 text-xs text-text-secondary">
            Available slots for {selectedDay}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIME_OPTIONS.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`rounded-[20px] border px-4 py-1.5 text-xs font-medium transition-colors ${
                  selectedTime === time
                    ? "border-primary bg-primary font-bold text-navy"
                    : "border-border-dark bg-card text-text-secondary"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="mt-5 text-[11px] italic text-text-secondary">
        We will send you a confirmation and meeting link 1 hour before your
        slot.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isStep3Valid}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
            isStep3Valid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue to Review →
        </button>
      </div>
    </div>
  );

  const step4Content = (
    <div>
      <h2 className="text-lg font-bold text-white">
        Review your application
      </h2>

      <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Documents submitted
        </p>
        <div className="mt-2 flex flex-col gap-1.5 text-sm text-text-primary">
          <div>✅ GST Certificate — uploaded</div>
          <div>✅ Business Registration — uploaded</div>
          <div>✅ Workspace Photos — uploaded</div>
          <div>✅ Aadhaar Card — uploaded</div>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          References added
        </p>
        <div className="mt-2 flex flex-col gap-1.5 text-sm text-text-primary">
          {references.map((reference, index) => (
            <div key={index}>
              ✅ Reference {index + 1} —{" "}
              {reference.contactPerson || reference.brandName || "Pending name"}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Video check scheduled
        </p>
        <p className="mt-2 text-sm text-text-primary">
          ✅ {selectedDay} at {selectedTime}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Confirmation will be sent to your WhatsApp number
        </p>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Verification level
        </p>
        <p className="mt-2 text-sm font-bold text-primary">
          🥈 Silver Verification
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Business Verified badge upon approval
        </p>
      </div>

      <div className="mt-4 rounded-[10px] border border-border-dark bg-card p-5">
        <h3 className="text-base font-bold text-white">Complete Payment</h3>

        <div className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Silver Verification Fee</span>
            <span className="font-semibold text-primary">₹999</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">GST (18%)</span>
            <span className="font-semibold text-primary">₹180</span>
          </div>
          <div className="flex items-center justify-between border-t border-border-dark pt-2 font-bold">
            <span className="text-text-primary">Total</span>
            <span className="text-primary">₹1,179</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-text-secondary">
          Pay securely with UPI, Card, or Net Banking via Razorpay
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {ACCEPTED_PAYMENTS.map((method) => (
            <span
              key={method}
              className="rounded-[20px] border border-border-dark bg-background px-3 py-1 text-[11px] text-text-secondary"
            >
              {method}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="mt-5 w-full rounded-lg bg-primary py-4 text-base font-bold text-navy"
        >
          Pay ₹1,179 & Submit Application →
        </button>

        <p className="mt-3 text-center text-[11px] text-text-secondary">
          After payment your application goes to our verification team
          immediately. You will receive WhatsApp updates.
        </p>
      </div>

      <p className="mt-4 text-center text-[11px] text-text-secondary">
        🔒 Secure payment powered by Razorpay. FabVerify does not store your
        payment details.
      </p>
    </div>
  );

  const successState = (
    <div
      className="flex flex-col items-center px-6 text-center"
      style={{ paddingTop: "80px" }}
    >
      <div
        className="scale-in flex h-20 w-20 items-center justify-center rounded-full"
        style={{ border: "3px solid #4ade80" }}
      >
        <span className="text-4xl" style={{ color: "#4ade80" }}>
          ✓
        </span>
      </div>

      <h2 className="mt-6 font-display text-[28px] font-bold text-white">
        Application Submitted! 🎉
      </h2>
      <p className="mt-3 text-base text-text-secondary">
        Your Silver verification application has been received.
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[8px] border border-border-dark bg-card p-4 text-left">
          <p className="text-sm font-bold text-text-primary">
            📱 Check your WhatsApp
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            We sent a confirmation to your registered number
          </p>
        </div>
        <div className="rounded-[8px] border border-border-dark bg-card p-4 text-left">
          <p className="text-sm font-bold text-text-primary">
            📧 References notified
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Your references will receive a verification link within 1 hour
          </p>
        </div>
        <div className="rounded-[8px] border border-border-dark bg-card p-4 text-left">
          <p className="text-sm font-bold text-text-primary">
            📅 Video check confirmed
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {selectedDay} at {selectedTime}. You will receive a meeting link 1
            hour before
          </p>
        </div>
      </div>

      <p className="mt-8 text-sm font-semibold text-primary">
        Expected completion: 2-3 business days
      </p>

      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
      >
        Go to Dashboard →
      </Link>
    </div>
  );

  const rightPanel = (
    <>
      <p className="text-base font-bold text-white">Silver Verification</p>
      <div className="mt-4 flex flex-col gap-2.5">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const effectiveStep = submitted ? STEP_LABELS.length + 1 : currentStep;
          const icon =
            stepNumber < effectiveStep
              ? "✅"
              : stepNumber === effectiveStep
                ? "🔄"
                : "○";
          return (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span>{icon}</span>
              <span
                className={
                  stepNumber <= effectiveStep
                    ? "text-text-primary"
                    : "text-text-secondary"
                }
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-semibold text-text-primary">
        What you unlock with Silver:
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {UNLOCK_ITEMS.map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-2 text-xs text-text-secondary"
          >
            <span>{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Need help?</p>
      <p className="mt-2 text-xs text-text-secondary">
        Call or WhatsApp our verification team
      </p>
      <p className="mt-2 text-sm font-semibold text-text-primary">
        +91 98765 43210
      </p>
      <p className="text-xs text-text-secondary">Monday-Saturday 10am-6pm</p>
      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary"
      >
        Chat with us →
      </button>
    </>
  );

  const stepBody = (
    <>
      {!submitted && (
        <div className="mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>
      )}

      {submitted ? (
        successState
      ) : (
        <>
          {currentStep === 1 && step1Content}
          {currentStep === 2 && step2Content}
          {currentStep === 3 && step3Content}
          {currentStep === 4 && step4Content}
        </>
      )}
    </>
  );

  const centrePanel = (
    <>
      <div
        className="sticky top-0 z-10 border-b border-border-dark px-6 py-4"
        style={{ backgroundColor: "#07122a" }}
      >
        <Link
          href="/verification"
          className="text-[13px] text-text-secondary hover:text-text-primary"
        >
          ← Back to Verification
        </Link>
        <h1 className="mt-2 font-display text-xl font-bold text-white">
          Silver Verification
        </h1>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Step by step — takes about 10 minutes
        </p>
      </div>

      <div className="px-6 py-6">{stepBody}</div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 border-b border-border-dark bg-card px-4 py-3">
          <Link
            href="/verification"
            className="text-[13px] text-text-secondary hover:text-text-primary"
          >
            ← Back to Verification
          </Link>
          <h1 className="mt-2 font-display text-lg font-bold text-white">
            Silver Verification
          </h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Step by step — takes about 10 minutes
          </p>
        </div>

        <div className="flex-1 px-4 py-5">{stepBody}</div>
      </div>
    </>
  );
}
