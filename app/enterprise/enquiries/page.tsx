"use client";

import { useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";

type ReceivedEnquiry = {
  id: string;
  badge: string;
  message: string;
  meta: string;
  sender: string;
  time: string;
};

const RECEIVED_ENQUIRIES: ReceivedEnquiry[] = [
  {
    id: "rc-1",
    badge: "Verified Manufacturer",
    message:
      "We can produce your ethnic wear collection. Sharing capacity and lead time for Summer 2026.",
    meta: "Ethnic Wear · As per brief · ₹380-520 per piece",
    sender: "Jaipur Ethnic Works — Jaipur",
    time: "2 hours ago",
  },
  {
    id: "rc-2",
    badge: "Verified Supplier",
    message:
      "Fabric samples dispatched for your review. Cotton lawn at ₹95-115/metre for 500m+ orders.",
    meta: "Cotton · Surat Cotton Mills — Surat",
    sender: "Surat Cotton Mills — Surat",
    time: "5 hours ago",
  },
  {
    id: "rc-3",
    badge: "Gold Verified",
    message:
      "Capacity available for Q3 2026. Can accommodate 2000 pieces per month for your western wear line.",
    meta: "Western Wear · Delhi Woven Works",
    sender: "Delhi Woven Works",
    time: "Yesterday",
  },
];

type SentEnquiry = {
  id: string;
  sentBy: string;
  to: string;
  message: string;
  status: "Awaiting Response" | "Responded ✓";
  time: string;
};

const SENT_ENQUIRIES: SentEnquiry[] = [
  {
    id: "sn-1",
    sentBy: "Sent by Rahul (Merchandiser)",
    to: "Mumbai Fabric House",
    message: "Requesting capacity for 800 pieces silk blouse, delivery by August 15",
    status: "Awaiting Response",
    time: "2 days ago",
  },
  {
    id: "sn-2",
    sentBy: "Sent by You (MD)",
    to: "Lucknow Chikan Studio",
    message: "Quality query on last batch — 3 pieces had embroidery gaps",
    status: "Responded ✓",
    time: "3 days ago",
  },
  {
    id: "sn-3",
    sentBy: "Sent by Priya (Merchandiser)",
    to: "Tirupur Knits",
    message: "Sampling request for knitwear collection — 5 styles",
    status: "Awaiting Response",
    time: "5 days ago",
  },
];

function ReceivedCard({ enquiry }: { enquiry: ReceivedEnquiry }) {
  return (
    <div className="mb-3 rounded-[10px] border border-border-dark bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
          {enquiry.badge}
        </span>
        <span className="text-xs text-text-secondary">{enquiry.time}</span>
      </div>

      <p className="mt-3 text-sm text-text-primary">{enquiry.message}</p>

      <p className="mt-3 text-xs text-text-secondary">{enquiry.meta}</p>

      <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-secondary">{enquiry.sender}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-navy"
          >
            Reply →
          </button>
          <button
            type="button"
            className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

function SentCard({ enquiry }: { enquiry: SentEnquiry }) {
  const isResponded = enquiry.status === "Responded ✓";
  return (
    <div className="mb-3 rounded-[10px] border border-border-dark bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{enquiry.sentBy}</p>
        <span className="text-xs text-text-secondary">{enquiry.time}</span>
      </div>

      <p className="mt-1.5 text-xs text-text-secondary">To: {enquiry.to}</p>

      <p className="mt-3 text-sm text-text-primary">{enquiry.message}</p>

      <div className="mt-4 border-t border-border-dark pt-3">
        <span
          className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            isResponded
              ? "border-green-500/60 bg-green-500/15 text-green-400"
              : "border-amber-500/60 bg-amber-500/15 text-amber-400"
          }`}
        >
          {enquiry.status}
        </span>
      </div>
    </div>
  );
}

const TEAM_ACTIVITY = [
  "Rahul sent 2 enquiries this week",
  "Priya sent 1 enquiry this week",
];

function RightPanelContent() {
  return (
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
          <span className="font-bold text-primary">12</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Response rate</span>
          <span className="font-bold text-primary">89%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Avg response time</span>
          <span className="font-bold text-primary">3.2 hours</span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Team Activity</p>
      <div className="mt-3 flex flex-col gap-2">
        {TEAM_ACTIVITY.map((line) => (
          <p key={line} className="text-xs text-text-secondary">
            {line}
          </p>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-sm font-bold text-white">Tips</p>
      <ul className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
        <li>💡 Respond within 4 hours for best vendor relationships</li>
      </ul>
    </>
  );
}

export default function EnterpriseEnquiries() {
  const authorized = useEnterpriseAccess();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  if (!authorized) return null;

  const centrePanel = (
    <>
      <TopBar title="Enquiries" subtitle="Vendor communications and responses" />

      <div className="px-6 py-6">
        <div className="flex gap-6 border-b border-border-dark">
          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "received"
                ? "border-b-2 border-primary text-white"
                : "text-text-secondary"
            }`}
          >
            Received
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "sent"
                ? "border-b-2 border-primary text-white"
                : "text-text-secondary"
            }`}
          >
            Sent
          </button>
        </div>

        <div className="mt-5">
          {activeTab === "received"
            ? RECEIVED_ENQUIRIES.map((enquiry) => (
                <ReceivedCard key={enquiry.id} enquiry={enquiry} />
              ))
            : SENT_ENQUIRIES.map((enquiry) => (
                <SentCard key={enquiry.id} enquiry={enquiry} />
              ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        left={<EnterpriseLeftPanel />}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}><RightPanelContent /></div>}
      />

      <div
        className="flex flex-col pb-4 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
        </div>

        <div className="flex-1">
          {centrePanel}
          <div className="px-4 pb-5">
            <div className="mt-4 rounded-xl border border-border-dark bg-card p-4">
              <RightPanelContent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
