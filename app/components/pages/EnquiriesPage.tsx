"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import TopBar from "../TopBar";
import { UploadBox } from "../../onboarding/components";
import { useUser } from "../../context/UserContext";
import screenConfig from "../../config/screens";
import { getEnquiries, senderEmoji, senderLabel } from "../../data/enquiries";
import type { Enquiry } from "../../data/enquiries";

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "🔍", label: "Discover", href: "/manufacturers" },
  { icon: "👔", label: "Merch", href: "/fabmerch" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

function EnquiryCard({
  enquiry,
  onReply,
  onViewDetails,
}: {
  enquiry: Enquiry;
  onReply: (enquiry: Enquiry) => void;
  onViewDetails: (enquiry: Enquiry) => void;
}) {
  return (
    <div className="mb-3 rounded-[10px] border border-border-dark bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
          {senderEmoji(enquiry.senderType)} {senderLabel(enquiry.senderType)}
        </span>
        <span className="text-xs text-text-secondary">{enquiry.time}</span>
      </div>

      <p className="mt-3 text-sm text-text-primary">{enquiry.message}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        <span className="rounded-full border border-border-dark bg-background px-2.5 py-1 text-primary">
          {enquiry.category}
        </span>
        <span>{enquiry.quantity}</span>
        <span>•</span>
        <span>{enquiry.budget}</span>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-secondary">
          {enquiry.senderName} — {enquiry.senderCity}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onReply(enquiry)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-navy"
          >
            Reply →
          </button>
          <button
            type="button"
            onClick={() => onViewDetails(enquiry)}
            className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

const MODAL_OVERLAY_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.7)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const MODAL_CARD_STYLE: CSSProperties = {
  backgroundColor: "#0D1B33",
  border: "1px solid #1C3050",
  borderRadius: "12px",
  padding: "24px",
  width: "100%",
  maxWidth: "480px",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
};

const REPLY_PLACEHOLDER =
  "Hi, thank you for your enquiry. We can supply [product] at [price] per piece. Our MOQ is [quantity]. Please let us know if you would like to proceed.";

export default function Enquiries() {
  const { user } = useUser();
  const pathname = usePathname();
  const config = screenConfig.enquiries[user.userType];
  const [activeTab, setActiveTab] = useState<"new" | "all">("new");

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const [replyMessage, setReplyMessage] = useState("");
  const [priceListFile, setPriceListFile] = useState<string | undefined>(
    undefined
  );
  const [replySent, setReplySent] = useState(false);

  useEffect(() => {
    if (showReplyModal || showDetailModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showReplyModal, showDetailModal]);

  const openReplyModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setReplyMessage("");
    setPriceListFile(undefined);
    setReplySent(false);
    setShowDetailModal(false);
    setShowReplyModal(true);
  };

  const closeReplyModal = () => {
    setShowReplyModal(false);
  };

  const openDetailModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  const enquiries = getEnquiries(user.userType);
  const visibleEnquiries = activeTab === "new" ? enquiries.slice(0, 3) : enquiries;

  const centrePanel = (
    <>
      <TopBar title="Enquiries" />

      <div className="px-6 py-6">
        <p className="-mt-2 mb-4 text-sm text-text-secondary">
          {config.subtitle}
        </p>

        <div className="flex gap-6 border-b border-border-dark">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "new"
                ? "border-b-2 border-primary text-white"
                : "text-text-secondary"
            }`}
          >
            New Enquiries
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-primary text-white"
                : "text-text-secondary"
            }`}
          >
            All Enquiries
          </button>
        </div>

        <div className="mt-5">
          {visibleEnquiries.map((enquiry) => (
            <EnquiryCard
              key={enquiry.id}
              enquiry={enquiry}
              onReply={openReplyModal}
              onViewDetails={openDetailModal}
            />
          ))}
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Enquiry Stats
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">New this week</span>
          <span className="font-bold text-primary">3</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Total received</span>
          <span className="font-bold text-primary">3</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Response rate</span>
          <span className="font-bold text-text-secondary">—</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Average response time</span>
          <span className="font-bold text-text-secondary">—</span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Get More Enquiries</p>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-text-secondary">
        <li>💡 Complete verification to appear higher in search results</li>
        <li>💡 Add detailed product listings to your profile</li>
        <li>
          💡 Respond within 4 hours — buyers prefer fast responses
        </li>
      </ul>
    </>
  );

  const replyModal = showReplyModal && selectedEnquiry && (
    <div style={MODAL_OVERLAY_STYLE} onClick={closeReplyModal}>
      <div
        className="hide-scrollbar"
        style={MODAL_CARD_STYLE}
        onClick={(event) => event.stopPropagation()}
      >
        {replySent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="text-5xl">✅</div>
            <p className="mt-4 text-lg font-bold text-white">Reply sent!</p>
            <p className="mt-2 text-sm text-text-secondary">
              {selectedEnquiry.senderName} will be notified on WhatsApp
            </p>
            <button
              type="button"
              onClick={closeReplyModal}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-navy"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-white">
                Reply to Enquiry
              </h2>
              <button
                type="button"
                onClick={closeReplyModal}
                aria-label="Close"
                className="text-lg text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div
              className="mt-4 rounded-[8px] p-3"
              style={{ backgroundColor: "#07122a", border: "1px solid #1C3050" }}
            >
              <p className="text-[13px] text-text-secondary">
                {selectedEnquiry.message}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                {selectedEnquiry.senderName} • {selectedEnquiry.category}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-[13px] text-text-secondary">
                Your message
              </label>
              <textarea
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                placeholder={REPLY_PLACEHOLDER}
                rows={4}
                className="w-full rounded-[6px] p-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                style={{ backgroundColor: "#07122a", border: "1px solid #1C3050" }}
              />
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-[13px] text-text-secondary">
                Attach price list (optional)
              </p>
              <UploadBox
                emoji="📎"
                title="Attach price list"
                subtitle="PDF, XLS or image"
                fileName={priceListFile}
                onFile={(file) => setPriceListFile(file?.name)}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeReplyModal}
                className="flex-1 rounded-lg border border-border-dark px-4 py-2.5 text-sm font-semibold text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setReplySent(true)}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-navy"
              >
                Send Reply →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const detailModal = showDetailModal && selectedEnquiry && (
    <div style={MODAL_OVERLAY_STYLE} onClick={closeDetailModal}>
      <div
        className="hide-scrollbar"
        style={MODAL_CARD_STYLE}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-white">Enquiry Details</h2>
          <button
            type="button"
            onClick={closeDetailModal}
            aria-label="Close"
            className="text-lg text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          From
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-white">
              {selectedEnquiry.senderName}
            </p>
            <p className="text-xs text-text-secondary">
              {selectedEnquiry.senderCity}
            </p>
            <span className="mt-1.5 inline-block rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {senderEmoji(selectedEnquiry.senderType)}{" "}
              {senderLabel(selectedEnquiry.senderType)}
            </span>
          </div>
          <p className="font-bold text-primary">
            {selectedEnquiry.senderFabscore
              ? `FabScore: ${selectedEnquiry.senderFabscore} ⭐`
              : "FabScore: —"}
          </p>
        </div>

        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Request Details
        </p>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Product</span>
            <span className="text-right text-text-primary">
              {selectedEnquiry.productName ?? selectedEnquiry.category}
            </span>
          </div>
          {selectedEnquiry.finish && (
            <div className="flex justify-between gap-4">
              <span className="text-text-secondary">Finish</span>
              <span className="text-right text-text-primary">
                {selectedEnquiry.finish}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Quantity</span>
            <span className="text-right text-text-primary">
              {selectedEnquiry.quantity}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Delivery deadline</span>
            <span className="text-right text-text-primary">
              {selectedEnquiry.deadline ?? "Not specified"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Budget</span>
            <span className="text-right text-text-primary">
              {selectedEnquiry.budget}
            </span>
          </div>
        </div>

        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Full Message
        </p>
        <div
          className="rounded-[8px] p-3"
          style={{ backgroundColor: "#07122a", border: "1px solid #1C3050" }}
        >
          <p className="text-sm text-text-primary">
            {selectedEnquiry.fullMessage ?? selectedEnquiry.message}
          </p>
        </div>

        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
          Order Potential
        </p>
        <p className="text-sm text-text-secondary">If this becomes an order:</p>
        <p className="mt-1 font-bold text-primary">
          Estimated value:{" "}
          {selectedEnquiry.estimatedValueMin && selectedEnquiry.estimatedValueMax
            ? `₹${selectedEnquiry.estimatedValueMin} – ₹${selectedEnquiry.estimatedValueMax}`
            : "To be discussed"}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => openReplyModal(selectedEnquiry)}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-navy"
          >
            Reply to This Enquiry →
          </button>
          <button
            type="button"
            onClick={closeDetailModal}
            className="w-full rounded-lg border border-border-dark px-4 py-2.5 text-sm font-semibold text-text-secondary"
          >
            Not Interested
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col pb-20 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        {centrePanel}

        <nav className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-border-dark bg-card">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-primary"
                  : "text-text-secondary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {replyModal}
      {detailModal}
    </>
  );
}
