"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import TopBar from "../../components/TopBar";
import SampleRequestModal from "../../components/SampleRequestModal";
import EnquiryModal from "../../components/EnquiryModal";
import { getManufacturerById } from "../../data/manufacturers";
import type { Tier } from "../../data/manufacturers";

const TIER_STYLES: Record<Tier, string> = {
  gold: "border-primary/40 bg-primary/15 text-primary",
  silver: "border-secondary/40 bg-secondary/15 text-secondary",
  bronze: "border-[#cd7f32]/40 bg-[#cd7f32]/15 text-[#cd7f32]",
};

export default function ManufacturerProfile() {
  const params = useParams();
  const id = params.id as string;
  const manufacturer = getManufacturerById(id);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  const content = !manufacturer ? (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">🏭</div>
      <p className="mt-4 text-base font-bold text-white">
        Manufacturer not found
      </p>
      <p className="mt-2 text-[13px] text-text-secondary">
        This manufacturer profile doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/manufacturers"
        className="mt-5 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
      >
        ← Back to Manufacturers
      </Link>
    </div>
  ) : (
    <div className="px-6 py-6">
      <div className="rounded-xl border border-border-dark bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-primary bg-navy text-2xl">
              🏭
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">
                {manufacturer.name}
              </h1>
              <p className="text-sm text-text-secondary">
                {manufacturer.city}, {manufacturer.state}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${TIER_STYLES[manufacturer.tier]}`}
          >
            {manufacturer.tier} Verified
          </span>
        </div>

        <p className="mt-5 text-sm text-text-secondary">{manufacturer.about}</p>

        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border-dark pt-5">
          {manufacturer.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border-dark bg-background px-2.5 py-1 text-[11px] text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-dark pt-5 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-text-secondary">⭐ Rating</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.rating}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">📦 Orders</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.orders}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">⏱ On-time Delivery</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.delivery}%
            </p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">📅 Experience</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.experience} years
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-dark pt-5 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-text-secondary">Min. Order</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.moq} {manufacturer.moqUnit}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Capacity</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.capacity.toLocaleString("en-IN")}/mo
            </p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Lead Time</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.leadTime}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-text-secondary">Sampling Time</p>
            <p className="text-sm font-semibold text-text-primary">
              {manufacturer.samplingTime}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border-dark bg-card p-5">
          <h2 className="text-sm font-bold text-white">Fabrics</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {manufacturer.fabric.map((fabric) => (
              <span
                key={fabric}
                className="rounded-full border border-border-dark bg-background px-2.5 py-1 text-[11px] text-text-secondary"
              >
                {fabric}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border-dark bg-card p-5">
          <h2 className="text-sm font-bold text-white">Techniques</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {manufacturer.techniques.map((technique) => (
              <span
                key={technique}
                className="rounded-full border border-border-dark bg-background px-2.5 py-1 text-[11px] text-text-secondary"
              >
                {technique}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border-dark bg-card p-5">
        <h2 className="text-sm font-bold text-white">Notable Clients</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {manufacturer.clients.join(", ")}
        </p>
        {manufacturer.export && (
          <p className="mt-3 text-xs font-semibold text-primary">
            🌍 Export capable
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setShowSampleModal(true)}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
        >
          Request Sample
        </button>
        <button
          type="button"
          onClick={() => setShowEnquiryModal(true)}
          className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary"
        >
          Send Enquiry
        </button>
      </div>
    </div>
  );

  const centrePanel = manufacturer ? (
    <>
      <TopBar
        title={manufacturer.name}
        subtitle={`${manufacturer.city}, ${manufacturer.state}`}
      />
      {content}
    </>
  ) : (
    <>
      <TopBar title="Manufacturer" />
      {content}
    </>
  );

  const rightPanel = !manufacturer ? null : (
    <>
      <p className="text-base font-bold text-white">Quick Facts</p>
      <div className="mt-4 flex flex-col gap-2 text-xs text-text-secondary">
        <div className="flex items-center justify-between">
          <span>Tier</span>
          <span className="font-semibold capitalize text-primary">
            {manufacturer.tier}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Rating</span>
          <span className="font-semibold text-primary">
            ⭐ {manufacturer.rating}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Orders Completed</span>
          <span className="font-semibold text-primary">
            {manufacturer.orders}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Export</span>
          <span className="font-semibold text-primary">
            {manufacturer.export ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowEnquiryModal(true)}
          className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-navy"
        >
          Send Enquiry
        </button>
        <button
          type="button"
          onClick={() => setShowSampleModal(true)}
          className="w-full rounded-lg border border-primary py-2.5 text-xs font-semibold text-primary"
        >
          Request a Sample
        </button>
      </div>
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
        <div className="flex h-14 shrink-0 items-center border-b border-border-dark bg-card px-4">
          <Link
            href="/manufacturers"
            className="text-sm font-medium text-text-secondary"
          >
            ← Back to Manufacturers
          </Link>
        </div>
        <div className="flex-1">{content}</div>
      </div>

      <SampleRequestModal
        manufacturer={showSampleModal ? manufacturer ?? null : null}
        onClose={() => setShowSampleModal(false)}
      />
      <EnquiryModal
        manufacturer={showEnquiryModal ? manufacturer ?? null : null}
        onClose={() => setShowEnquiryModal(false)}
      />
    </>
  );
}
