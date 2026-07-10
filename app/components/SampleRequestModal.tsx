"use client";

import { useEffect } from "react";
import type { Manufacturer } from "../data/manufacturers";

const SAMPLE_TYPES = ["Fabric Swatch", "R&D Sample", "Lab Dip", "Trim Sample"];

export default function SampleRequestModal({
  manufacturer,
  onClose,
}: {
  manufacturer: Manufacturer | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (manufacturer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [manufacturer]);

  if (!manufacturer) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-5"
      onClick={onClose}
    >
      <div
        className="hide-scrollbar relative w-full max-w-[480px] rounded-xl border border-border-dark bg-card p-7"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        <div className="mb-5">
          <p className="text-lg font-bold text-primary">Request Sample</p>
          <p className="mt-1 text-[13px] text-text-secondary">
            {manufacturer.name} • {manufacturer.city}
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[13px] font-semibold text-text-primary">
            What type of sample do you need?
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="rounded-[20px] border border-border-dark px-3.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[13px] font-semibold text-text-primary">
            What do you want to make?
          </p>
          <textarea
            placeholder="Describe your product — fabric type, colour, construction details..."
            rows={3}
            className="w-full resize-none rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[13px] font-semibold text-text-primary">
            Intended bulk quantity
          </p>
          <input
            type="number"
            placeholder="e.g. 200 pieces"
            className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] italic text-text-secondary">
            Mentioning bulk intent gets faster and better responses
          </p>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-[13px] font-semibold text-text-primary">
            Sample needed by
          </p>
          <input
            type="date"
            className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div
          className="mb-5 rounded-lg border border-border-dark bg-background p-3"
          style={{ borderLeft: "3px solid #f2ca50" }}
        >
          <p className="text-xs text-text-secondary">
            💡 Sending this sample request is free. You only pay courier
            charges when the sample is shipped to you.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border-dark py-3 text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-[2] rounded-lg bg-primary py-3 text-sm font-bold text-navy"
          >
            Send Sample Request →
          </button>
        </div>
      </div>
    </div>
  );
}
