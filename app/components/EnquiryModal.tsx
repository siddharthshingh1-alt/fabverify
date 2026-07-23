"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// user_id is optional because some callers (supplier/buyer discovery cards)
// still point at mock data with no real backing user to send an enquiry to.
type EnquiryTarget = { id?: string; user_id?: string; name: string };

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
  const router = useRouter();
  const [enquiryType, setEnquiryType] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [timeline, setTimeline] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (manufacturer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setEnquiryType(null);
      setMessage("");
      setQuantity("");
      setTimeline(null);
      setErrorMessage("");
      setIsSent(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [manufacturer]);

  if (!manufacturer) return null;

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    if (!manufacturer.user_id) {
      setErrorMessage("Enquiries aren't available for this listing yet.");
      return;
    }

    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) {
      onClose();
      router.push("/login");
      return;
    }

    setIsSending(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderPhone: auth.phone,
          receiverId: manufacturer.user_id,
          subject: enquiryType
            ? `${enquiryType} enquiry for ${manufacturer.name}`
            : `Enquiry for ${manufacturer.name}`,
          message:
            message.trim() +
            (quantity ? `\n\nEstimated quantity: ${quantity}` : "") +
            (timeline ? `\nExpected timeline: ${timeline}` : ""),
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
        setErrorMessage(error || "Failed to send enquiry. Please try again.");
        setIsSending(false);
        return;
      }

      setIsSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setErrorMessage("Failed to send enquiry. Please try again.");
      setIsSending(false);
    }
  };

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

        {isSent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-4 text-base font-bold text-white">
              Enquiry sent!
            </p>
            <p className="mt-2 text-[13px] text-text-secondary">
              {manufacturer.name} will respond in your messages.
            </p>
          </div>
        ) : (
          <>
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
                    onClick={() => setEnquiryType((current) => (current === type ? null : type))}
                    className={`rounded-[20px] border px-3.5 py-1.5 text-xs transition-colors ${
                      enquiryType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-dark text-text-secondary hover:border-primary hover:text-primary"
                    }`}
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
                value={message}
                onChange={(event) => setMessage(event.target.value)}
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
                min={0}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="e.g. 200 pieces"
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-text-primary">
                Expected delivery timeline
              </p>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTimeline((current) => (current === option ? null : option))}
                    className={`rounded-[20px] border px-3.5 py-1.5 text-xs transition-colors ${
                      timeline === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-dark text-text-secondary hover:border-primary hover:text-primary"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <p className="mb-4 text-[12px] text-red-400">{errorMessage}</p>
            )}

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
                onClick={() => void handleSend()}
                disabled={!message.trim() || isSending}
                className="flex-[2] rounded-lg bg-primary py-3 text-sm font-bold text-navy disabled:cursor-not-allowed disabled:bg-primary/40"
              >
                {isSending ? "Sending..." : "Send Enquiry →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
