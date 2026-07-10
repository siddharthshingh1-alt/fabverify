"use client";

import { useEffect } from "react";

type EnquiryTarget = { name: string };

const ENQUIRY_TYPES = [
  "Bulk Manufacturing",
  "Sample Making",
  "Job Work",
  "Long Term Partnership",
];

const TIMELINE_OPTIONS = ["Within 2 weeks", "2-4 weeks", "1-2 months", "Flexible"];

export default function EnquiryModal({
  manufacturer,
  onClose,
}: {
  manufacturer: EnquiryTarget | null;
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
          <p className="text-lg font-bold text-primary">Send Enquiry</p>
          <p className="mt-1 text-[13px] text-text-secondary">
            to {manufacturer.name}
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[13px] font-semibold text-text-primary">
            What are you looking for?
          </p>
          <div className="flex flex-wrap gap-2">
            {ENQUIRY_TYPES.map((type) => (
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
            Your message
          </p>
          <textarea
            placeholder="Hi, I am interested in working with you. I need [describe what you need — product type, quantity, timeline, quality requirements]..."
            rows={4}
            className="w-full resize-none rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[13px] font-semibold text-text-primary">
            Estimated order quantity
          </p>
          <input
            type="number"
            placeholder="e.g. 200 pieces"
            className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="mb-5">
          <p className="mb-2 text-[13px] font-semibold text-text-primary">
            Expected delivery timeline
          </p>
          <div className="flex flex-wrap gap-2">
            {TIMELINE_OPTIONS.map((timeline) => (
              <button
                key={timeline}
                type="button"
                className="rounded-[20px] border border-border-dark px-3.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                {timeline}
              </button>
            ))}
          </div>
        </div>

        <div
          className="mb-5 rounded-lg border border-border-dark bg-background p-3"
          style={{ borderLeft: "3px solid #f2ca50" }}
        >
          <p className="text-xs text-text-secondary">
            🔒 Your enquiry is sent directly to the manufacturer. Their
            response will appear in your messages. All communication is
            recorded on FabVerify.
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
            Send Enquiry →
          </button>
        </div>
      </div>
    </div>
  );
}
