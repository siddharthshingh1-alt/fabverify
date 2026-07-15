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

type TabId = "overview" | "catalogue" | "reviews" | "certifications";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "catalogue", label: "Catalogue" },
  { id: "reviews", label: "Reviews" },
  { id: "certifications", label: "Certifications" },
];

type Product = {
  name: string;
  emoji: string;
  priceRange: string;
  moq: number;
  swatch: string;
};

const CATALOGUE_BY_ID: Record<string, Product[]> = {
  "jaipur-ethnic-works": [
    { name: "Block Print Kurta", emoji: "🎨", priceRange: "₹420-₹680 per piece", moq: 50, swatch: "#3b2a1f" },
    { name: "Hand Embroidered Kurti", emoji: "🪡", priceRange: "₹580-₹920 per piece", moq: 30, swatch: "#2a1f3b" },
    { name: "Cotton Palazzo Set", emoji: "👗", priceRange: "₹380-₹520 per piece", moq: 50, swatch: "#1f3b2a" },
    { name: "Mul Mul Dress", emoji: "👘", priceRange: "₹280-₹420 per piece", moq: 100, swatch: "#3b1f2a" },
    { name: "Block Print Shirt", emoji: "👔", priceRange: "₹350-₹480 per piece", moq: 50, swatch: "#1f2a3b" },
    { name: "Kantha Jacket", emoji: "🧥", priceRange: "₹1,200-₹1,800 per piece", moq: 20, swatch: "#3b3b1f" },
  ],
};

type Review = {
  initial: string;
  name: string;
  rating: number;
  time: string;
  text: string;
};

const REVIEWS_BY_ID: Record<string, Review[]> = {
  "jaipur-ethnic-works": [
    {
      initial: "F",
      name: "Fabindia",
      rating: 5,
      time: "3 months ago",
      text: "Quality has been consistently excellent across 8 orders. Block print is authentic and colours stay vibrant after washing. Highly recommended for ethnic wear.",
    },
    {
      initial: "W",
      name: "W by Westside",
      rating: 4,
      time: "5 months ago",
      text: "Good quality and reasonable pricing. Delivery was 3 days late on our last order but they communicated proactively and compensated with a discount.",
    },
    {
      initial: "B",
      name: "Biba",
      rating: 5,
      time: "6 months ago",
      text: "Best block print manufacturer we have worked with in Jaipur. Consistent quality across all 12 styles this season.",
    },
    {
      initial: "A",
      name: "Anita's Label",
      rating: 5,
      time: "8 months ago",
      text: "As a small brand they treated us with the same care as their large clients. MOQ was flexible for our first order.",
    },
    {
      initial: "S",
      name: "Sustainable Studio",
      rating: 4,
      time: "9 months ago",
      text: "Natural dye work is authentic and documentation for our EU buyers was thorough. Slightly slow on sampling but worth the wait.",
    },
  ],
};

type Certification = {
  emoji: string;
  name: string;
  issuer: string;
  detail: string;
  status: string;
};

const CERTIFICATIONS: Certification[] = [
  { emoji: "🏅", name: "Gold Verified", issuer: "FabVerify Platform", detail: "Valid until Dec 2026", status: "Active ✓" },
  { emoji: "✅", name: "GST Registered", issuer: "Government of India", detail: "GST: 08XXXXX1234X1ZX", status: "Verified ✓" },
  { emoji: "🌿", name: "Oeko-Tex Standard 100", issuer: "Oeko-Tex Association", detail: "Valid until March 2027", status: "Active ✓" },
  { emoji: "📋", name: "MSME Registered", issuer: "Ministry of MSME", detail: "Udyam: UDYAM-RJ-XX-XXXX", status: "Verified ✓" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-primary">
      {"⭐".repeat(rating)}
      <span className="text-text-secondary opacity-40">{"⭐".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ManufacturerProfile() {
  const params = useParams();
  const id = params.id as string;
  const manufacturer = getManufacturerById(id);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const products = manufacturer ? CATALOGUE_BY_ID[manufacturer.id] ?? [] : [];
  const reviews = manufacturer ? REVIEWS_BY_ID[manufacturer.id] ?? [] : [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : null;

  const tabsBar = (
    <div className="mt-5 flex gap-6 border-b border-border-dark">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-primary text-white"
              : "text-text-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const overviewTab = manufacturer && (
    <>
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
    </>
  );

  const catalogueTab = (
    <div className="mt-5">
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
          <div className="text-4xl">🧵</div>
          <p className="mt-3 text-sm text-text-primary">No catalogue items listed yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.name}
              className="overflow-hidden rounded-[8px] border border-border-dark bg-background"
            >
              <div
                className="flex h-[120px] items-center justify-center text-5xl"
                style={{ backgroundColor: product.swatch }}
              >
                {product.emoji}
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold text-white">{product.name}</p>
                <p className="mt-1 text-xs font-semibold text-primary">{product.priceRange}</p>
                <p className="mt-0.5 text-[11px] text-text-secondary">MOQ: {product.moq} pieces</p>
                <button
                  type="button"
                  onClick={() => setShowSampleModal(true)}
                  className="mt-2 text-xs font-semibold text-primary"
                >
                  Request Sample →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const reviewsTab = (
    <div className="mt-5">
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
          <div className="text-4xl">💬</div>
          <p className="mt-3 text-sm text-text-primary">No reviews yet</p>
        </div>
      ) : (
        <>
          <p className="text-lg font-bold text-primary">
            {avgRating} ⭐ average · {reviews.length} reviews
          </p>
          <div className="mt-4 rounded-xl border border-border-dark bg-card">
            {reviews.map((review, index) => (
              <div
                key={review.name}
                className={`bg-background p-4 ${
                  index < reviews.length - 1 ? "border-b border-border-dark" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-navy">
                      {review.initial}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{review.name}</p>
                      <span className="mt-0.5 inline-block rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        Verified Purchase
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRating rating={review.rating} />
                    <p className="mt-0.5 text-[11px] text-text-secondary">{review.time}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-[1.6] text-text-secondary">
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const certificationsTab = (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {CERTIFICATIONS.map((cert) => (
        <div
          key={cert.name}
          className="rounded-[8px] border border-border-dark bg-background p-4 text-center"
        >
          <div className="text-4xl">{cert.emoji}</div>
          <p className="mt-2 text-sm font-bold text-white">{cert.name}</p>
          <p className="mt-1 text-xs text-text-secondary">{cert.issuer}</p>
          <p className="mt-1 text-[11px] text-green-400">{cert.detail}</p>
          <span className="mt-2 inline-block rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-semibold text-green-400">
            {cert.status}
          </span>
        </div>
      ))}
    </div>
  );

  const activeTabContent =
    activeTab === "overview"
      ? overviewTab
      : activeTab === "catalogue"
        ? catalogueTab
        : activeTab === "reviews"
          ? reviewsTab
          : certificationsTab;

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

        {tabsBar}
      </div>

      {activeTabContent}
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
