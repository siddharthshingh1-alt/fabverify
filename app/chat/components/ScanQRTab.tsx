"use client";

import { useRef, useState } from "react";
import type { ChatRole } from "../data";
import type { OrderCard } from "../types";
import { useChatTab } from "../context";

type Stage = "scan" | "action" | "success";
type Variant = "milestone" | "receipt" | "inspection" | "craft" | "dispatch" | "generic";

const SUBTITLES: Record<ChatRole, string> = {
  brand: "Scan to verify delivery received",
  enterprise: "Scan to verify delivery received",
  manufacturer: "Scan bundle QR to record production milestone",
  mill: "Scan to confirm fabric dispatched",
  supplier: "Scan to confirm trim dispatched",
  artisan: "Scan to confirm craft stage complete",
  qc: "Scan to record inspection complete",
  jobworker: "Scan order QR code",
  designer: "Scan order QR code",
  master: "Scan order QR code",
  merchandiser: "Scan order QR code",
};

const VARIANTS: Record<ChatRole, Variant> = {
  brand: "receipt",
  enterprise: "receipt",
  manufacturer: "milestone",
  mill: "dispatch",
  supplier: "dispatch",
  artisan: "craft",
  qc: "inspection",
  jobworker: "generic",
  designer: "generic",
  master: "generic",
  merchandiser: "generic",
};

const CONDITIONS = ["Good", "Minor Issues", "Major Issues"];
const INSPECTION_RESULTS = ["Pass", "Fail", "Conditional Pass"];
const CRAFT_STAGES = ["Cutting", "Embroidery", "Stitching", "Finishing"];

function successDetail(variant: Variant, order: OrderCard | undefined): string {
  const style = order?.style ?? "the order";
  switch (variant) {
    case "milestone":
      return `Production milestone recorded for ${style}.`;
    case "receipt":
      return `Receipt confirmed for ${style} — escrow release has been triggered.`;
    case "inspection":
      return `Inspection result recorded for ${style}.`;
    case "craft":
      return `Craft stage recorded for ${style}.`;
    case "dispatch":
      return `Dispatch confirmed for ${style}.`;
    default:
      return `Scan confirmed for ${style}.`;
  }
}

function PillSelect({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              active
                ? "border-primary bg-primary text-navy"
                : "border-border-dark bg-background text-text-secondary"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function ScanQRTab({ role, orders }: { role: ChatRole; orders: OrderCard[] }) {
  const { setActiveTab } = useChatTab();
  const [stage, setStage] = useState<Stage>("scan");
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [condition, setCondition] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [craftStage, setCraftStage] = useState<string | null>(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const variant = VARIANTS[role];
  const subtitle = SUBTITLES[role];
  const order = orders[0];

  const resetForm = () => {
    setCode("");
    setAmount("");
    setNotes("");
    setCondition(null);
    setResult(null);
    setCraftStage(null);
    setPhotoTaken(false);
  };

  const handleScanAnother = () => {
    resetForm();
    setStage("scan");
  };

  const canSubmit = (() => {
    switch (variant) {
      case "milestone":
        return amount.trim() !== "" && photoTaken;
      case "craft":
        return craftStage !== null && photoTaken;
      case "receipt":
        return amount.trim() !== "" && condition !== null;
      case "inspection":
        return result !== null;
      case "dispatch":
        return amount.trim() !== "";
      default:
        return true;
    }
  })();

  if (stage === "success") {
    return (
      <div className="hide-scrollbar flex h-full flex-col items-center justify-center overflow-y-auto px-6 text-center">
        <span className="text-5xl">✅</span>
        <p className="font-display mt-4 text-lg font-bold text-text-primary">Submitted Successfully</p>
        <p className="mt-2 max-w-[280px] text-[13px] text-text-secondary">{successDetail(variant, order)}</p>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className="mt-6 h-11 w-full max-w-[280px] rounded-lg bg-primary text-sm font-bold text-navy"
        >
          View in Orders →
        </button>
        <button
          type="button"
          onClick={handleScanAnother}
          className="mt-3 h-11 w-full max-w-[280px] rounded-lg border border-border-dark text-sm font-semibold text-text-secondary"
        >
          Scan Another
        </button>
      </div>
    );
  }

  if (stage === "action") {
    return (
      <div className="hide-scrollbar h-full overflow-y-auto px-4 py-4">
        <div className="rounded-[10px] border border-primary bg-card p-5">
          <p className="text-base font-bold text-primary">✓ QR Verified</p>

          {variant === "milestone" && (
            <>
              <p className="mt-2 text-sm text-text-primary">{order?.style ?? "Order"} — Milestone</p>
              <p className="text-xs text-text-secondary">Production Complete</p>

              <label className="mt-4 block text-xs text-text-secondary">Pieces completed</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border-dark bg-background px-3 text-sm text-text-primary focus:outline-none"
              />

              <label className="mt-3 block text-xs text-text-secondary">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border-dark bg-background px-3 text-sm text-text-primary focus:outline-none"
              />

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mt-4 h-11 w-full rounded-lg border border-border-dark bg-background text-sm font-semibold text-text-primary"
              >
                {photoTaken ? "✓ Photo Proof Attached" : "📷 Take Photo Proof"}
              </button>
            </>
          )}

          {variant === "craft" && (
            <>
              <p className="mt-2 text-sm text-text-primary">{order?.style ?? "Order"}</p>
              <p className="text-xs text-text-secondary">{order?.counterparty ?? ""}</p>

              <p className="mt-4 text-xs text-text-secondary">Confirm stage complete:</p>
              <PillSelect options={CRAFT_STAGES} selected={craftStage} onSelect={setCraftStage} />

              <label className="mt-4 block text-xs text-text-secondary">Pieces count</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border-dark bg-background px-3 text-sm text-text-primary focus:outline-none"
              />

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mt-4 h-11 w-full rounded-lg border border-border-dark bg-background text-sm font-semibold text-text-primary"
              >
                {photoTaken ? "✓ Photo Taken" : "📷 Take Photo →"}
              </button>
            </>
          )}

          {variant === "receipt" && (
            <>
              <p className="mt-2 text-sm text-text-primary">{order?.style ?? "Order"} — Final Delivery</p>
              <p className="text-xs text-text-secondary">Confirm you have received the goods?</p>

              <label className="mt-4 block text-xs text-text-secondary">Pieces received</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border-dark bg-background px-3 text-sm text-text-primary focus:outline-none"
              />

              <p className="mt-4 text-xs text-text-secondary">Condition</p>
              <PillSelect options={CONDITIONS} selected={condition} onSelect={setCondition} />
            </>
          )}

          {variant === "inspection" && (
            <>
              <p className="mt-2 text-sm text-text-primary">{order?.counterparty ?? "Factory"}</p>
              <p className="text-xs text-text-secondary">{order?.style ?? "Order"}</p>

              <p className="mt-4 text-xs text-text-secondary">Record inspection result:</p>
              <PillSelect options={INSPECTION_RESULTS} selected={result} onSelect={setResult} />

              <label className="mt-4 block text-xs text-text-secondary">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-border-dark bg-background px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
            </>
          )}

          {variant === "dispatch" && (
            <>
              <p className="mt-2 text-sm text-text-primary">{order?.style ?? "Order"} — Dispatch</p>
              <p className="text-xs text-text-secondary">{order?.counterparty ?? ""}</p>

              <label className="mt-4 block text-xs text-text-secondary">
                {role === "mill" ? "Metres dispatched" : "Pieces dispatched"}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border-dark bg-background px-3 text-sm text-text-primary focus:outline-none"
              />
            </>
          )}

          {variant === "generic" && (
            <>
              <p className="mt-2 text-sm text-text-primary">{order?.style ?? "Order"}</p>
              <p className="text-xs text-text-secondary">{order?.counterparty ?? ""}</p>
            </>
          )}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => setStage("success")}
            className="mt-5 h-11 w-full rounded-lg bg-primary text-sm font-bold text-navy disabled:opacity-40"
          >
            {variant === "milestone" && "Submit Milestone →"}
            {variant === "craft" && "Submit →"}
            {variant === "receipt" && "Confirm Receipt →"}
            {variant === "inspection" && "Submit Inspection →"}
            {variant === "dispatch" && "Confirm Dispatch →"}
            {variant === "generic" && "Confirm →"}
          </button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) setPhotoTaken(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="hide-scrollbar flex h-full flex-col items-center overflow-y-auto px-6 py-6">
      <p className="text-base font-bold text-text-primary">Scan QR Code</p>
      <p className="mt-1 text-center text-xs text-text-secondary">{subtitle}</p>

      <div className="relative mt-6 flex h-[280px] w-[280px] shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-background">
        <span className="absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-primary" />
        <span className="absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-primary" />
        <span className="absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-primary" />
        <span className="absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-primary" />
        <span className="text-5xl">📷</span>
      </div>
      <p className="mt-3 text-xs text-text-secondary">Point camera at QR code</p>

      <p className="mt-8 text-[11px] italic text-text-secondary">Enter QR code manually (dev mode)</p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. ORD-2024-001-M3-x7k2p9"
        className="mt-2 h-11 w-full max-w-[280px] rounded-lg border border-border-dark bg-background px-3.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
      />
      <button
        type="button"
        disabled={!code.trim()}
        onClick={() => setStage("action")}
        className="mt-3 h-11 w-full max-w-[280px] rounded-lg bg-primary text-sm font-bold text-navy disabled:opacity-40"
      >
        Confirm →
      </button>
    </div>
  );
}
