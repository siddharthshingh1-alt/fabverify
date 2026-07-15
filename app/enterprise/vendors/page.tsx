"use client";

import { useMemo, useState } from "react";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";

type Tier = "Gold" | "Silver" | "Bronze";

type Vendor = {
  id: string;
  name: string;
  city: string;
  tier: Tier;
  categories: string[];
  orders: number;
  fabscore: number;
  onTime: number;
  connected: string;
};

const VENDORS: Vendor[] = [
  {
    id: "jaipur-ethnic-works",
    name: "Jaipur Ethnic Works",
    city: "Jaipur",
    tier: "Gold",
    categories: ["Ethnic Wear", "Cotton", "Hand Block Print"],
    orders: 12,
    fabscore: 9.2,
    onTime: 99,
    connected: "July 2026",
  },
  {
    id: "delhi-woven-works",
    name: "Delhi Woven Works",
    city: "Delhi",
    tier: "Silver",
    categories: ["Western Wear", "Denim"],
    orders: 8,
    fabscore: 7.9,
    onTime: 88,
    connected: "June 2026",
  },
  {
    id: "mumbai-fabric-house",
    name: "Mumbai Fabric House",
    city: "Mumbai",
    tier: "Silver",
    categories: ["Silk", "Luxury"],
    orders: 6,
    fabscore: 8.5,
    onTime: 95,
    connected: "June 2026",
  },
  {
    id: "lucknow-chikan-studio",
    name: "Lucknow Chikan Studio",
    city: "Lucknow",
    tier: "Bronze",
    categories: ["Chikankari", "Hand Embroidery"],
    orders: 4,
    fabscore: 8.1,
    onTime: 90,
    connected: "May 2026",
  },
  {
    id: "surat-trim-suppliers",
    name: "Surat Trim Suppliers",
    city: "Surat",
    tier: "Gold",
    categories: ["Trims", "Buttons", "Zips"],
    orders: 9,
    fabscore: 8.9,
    onTime: 97,
    connected: "April 2026",
  },
];

const TIER_STYLES: Record<Tier, { emoji: string; className: string }> = {
  Gold: { emoji: "🥇", className: "border-primary bg-primary/15 text-primary" },
  Silver: { emoji: "🥈", className: "border-secondary bg-secondary/15 text-secondary" },
  Bronze: { emoji: "🥉", className: "border-orange-500/50 bg-orange-500/15 text-orange-400" },
};

const CATEGORY_OPTIONS = ["Ethnic Wear", "Western Wear", "Cotton", "Silk", "Trims", "Chikankari"];
const HOW_LONG_OPTIONS = ["Under 1 year", "1-3 years", "3-5 years", "5+ years"];

const TOP_PERFORMERS = [...VENDORS].sort((a, b) => b.fabscore - a.fabscore).slice(0, 3);

function VendorCard({ vendor }: { vendor: Vendor }) {
  const tierStyle = TIER_STYLES[vendor.tier];
  return (
    <div className="rounded-[10px] border border-border-dark bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-navy">
            {vendor.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{vendor.name}</p>
            <p className="text-xs text-text-secondary">{vendor.city}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold ${tierStyle.className}`}
        >
          {tierStyle.emoji} {vendor.tier}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {vendor.categories.map((category) => (
          <span
            key={category}
            className="rounded-[20px] bg-background px-2.5 py-1 text-[10px] text-text-secondary"
          >
            {category}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border-dark pt-3 text-center">
        <div>
          <p className="text-sm font-bold text-white">{vendor.orders}</p>
          <p className="text-[10px] text-text-secondary">orders with you</p>
        </div>
        <div>
          <p className="text-sm font-bold text-primary">{vendor.fabscore}</p>
          <p className="text-[10px] text-text-secondary">FabScore</p>
        </div>
        <div>
          <p className="text-sm font-bold text-green-400">{vendor.onTime}%</p>
          <p className="text-[10px] text-text-secondary">on-time</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-dark pt-3">
        <span className="text-[11px] text-text-secondary">Connected {vendor.connected}</span>
        <div className="flex gap-3">
          <button type="button" className="text-[11px] font-medium text-text-secondary hover:text-text-primary">
            View Profile
          </button>
          <button type="button" className="text-[11px] font-semibold text-primary">
            New Order →
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderVendorCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[220px] flex-col items-center justify-center rounded-[10px] border border-dashed border-border-dark bg-card p-4 text-center transition-colors hover:border-primary"
    >
      <span className="text-3xl">🏭</span>
      <p className="mt-2 text-sm font-semibold text-text-secondary">
        Connect your first vendor
      </p>
    </button>
  );
}

function ConnectVendorModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [invited, setInvited] = useState(false);

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

        <p className="mb-5 text-lg font-bold text-primary">Connect a Vendor</p>

        <div className="relative mb-6">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by phone or business name"
            className="w-full rounded-lg border border-border-dark bg-background py-2.5 pl-9 pr-3 text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <p className="mb-2 text-[13px] text-text-secondary">
          Or invite a vendor who is not on FabVerify yet
        </p>
        {invited ? (
          <p className="text-[13px] font-semibold text-green-400">
            ✅ Invite sent. They&apos;ll receive a link to join FabVerify.
          </p>
        ) : (
          <div className="flex gap-2">
            <div className="flex flex-1 items-stretch overflow-hidden rounded-lg border border-border-dark focus-within:border-primary">
              <span className="flex items-center bg-background px-3 text-[13px] text-text-secondary">
                +91
              </span>
              <input
                type="tel"
                value={invitePhone}
                onChange={(event) => setInvitePhone(event.target.value)}
                placeholder="98765 43210"
                className="w-full bg-background p-2.5 text-[13px] text-text-primary outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => invitePhone.trim() && setInvited(true)}
              className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-navy"
            >
              Send Invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VouchVendorModal({ onClose }: { onClose: () => void }) {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [howLong, setHowLong] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isValid = businessName.trim() !== "" && ownerName.trim() !== "";

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

        {submitted ? (
          <div className="py-6 text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-4 text-sm font-bold text-white">
              {businessName} vouched successfully
            </p>
            <p className="mt-2 text-[13px] text-text-secondary">
              They now have temporary Silver access for 60 days.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-navy"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-lg font-bold text-primary">Vouch for a Vendor</p>

            <div
              className="mb-5 rounded-lg border border-primary bg-primary/10 p-3.5"
            >
              <p className="text-xs text-text-secondary">
                By vouching you confirm this vendor is trustworthy. They get
                temporary Silver access for 60 days while completing official
                verification. You take responsibility for their conduct on
                FabVerify.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Business name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Owner name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Phone number
              </label>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-border-dark focus-within:border-primary">
                <span className="flex items-center bg-background px-3 text-[13px] text-text-secondary">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-background p-2.5 text-[13px] text-text-primary outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              >
                <option value="" className="bg-card text-text-secondary">
                  Select category
                </option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-card text-text-primary">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                How long have you worked together?
              </label>
              <div className="flex flex-wrap gap-2">
                {HOW_LONG_OPTIONS.map((option) => {
                  const isSelected = howLong === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setHowLong(option)}
                      className={`rounded-[20px] border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-navy"
                          : "border-border-dark bg-background text-text-secondary"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
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
                disabled={!isValid}
                onClick={() => isValid && setSubmitted(true)}
                className={`flex-[2] rounded-lg py-3 text-sm font-bold transition-colors ${
                  isValid
                    ? "cursor-pointer bg-primary text-navy"
                    : "cursor-not-allowed bg-border-dark text-text-secondary"
                }`}
              >
                Vouch for this Vendor →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search vendors..."
        className="min-w-[200px] flex-1 rounded-lg border border-border-dark bg-card px-3.5 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
      />
      {["All Categories", "All Status", "All Tiers"].map((label) => (
        <select
          key={label}
          defaultValue={label}
          className="rounded-lg border border-border-dark bg-card px-3 py-2 text-[13px] text-text-secondary outline-none focus:border-primary"
        >
          <option className="bg-card text-text-primary">{label}</option>
        </select>
      ))}
    </div>
  );
}

function VendorStatsPanel() {
  return (
    <>
      <p className="font-display text-[28px] font-bold text-white">12</p>
      <p className="text-xs text-text-secondary">Total vendors</p>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Verified</span>
          <span className="font-display text-xl font-bold text-green-400">8</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Vouched</span>
          <span className="font-display text-xl font-bold text-amber-400">2</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Pending verification</span>
          <span className="font-display text-xl font-bold text-red-400">2</span>
        </div>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-primary">Verification credits</p>
      <p className="mt-2 text-xs text-text-secondary">
        Foundational plan: 5 Silver included per year
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
        <div className="h-full rounded-full bg-primary" style={{ width: "40%" }} />
      </div>
      <p className="mt-1.5 text-[11px] text-text-secondary">2 of 5 used · 3 remaining</p>
      <button type="button" className="mt-2 text-[11px] font-semibold text-primary">
        ↑ Upgrade for more
      </button>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-white">Top performers</p>
      <div className="mt-3 flex flex-col gap-2">
        {TOP_PERFORMERS.map((vendor) => (
          <div key={vendor.id} className="flex items-center justify-between text-xs">
            <span className="text-text-primary">⭐ {vendor.name}</span>
            <span className="font-semibold text-primary">{vendor.fabscore}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function VendorMaster() {
  const authorized = useEnterpriseAccess();
  const [search, setSearch] = useState("");
  const [showConnect, setShowConnect] = useState(false);
  const [showVouch, setShowVouch] = useState(false);

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return VENDORS;
    return VENDORS.filter(
      (vendor) =>
        vendor.name.toLowerCase().includes(query) || vendor.city.toLowerCase().includes(query)
    );
  }, [search]);

  if (!authorized) return null;

  const headerButtons = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setShowVouch(true)}
        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
      >
        + Vouch for Vendor
      </button>
      <button
        type="button"
        onClick={() => setShowConnect(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
      >
        + Connect Vendor
      </button>
    </div>
  );

  const vendorGrid = (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      {filteredVendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
      <PlaceholderVendorCard onClick={() => setShowConnect(true)} />
    </div>
  );

  const centrePanel = (
    <>
      <TopBar
        title="Vendor Master"
        subtitle="All vendors your company works with"
        rightContent={headerButtons}
      />

      <div className="px-6 py-6">
        <FilterRow search={search} onSearchChange={setSearch} />
        {vendorGrid}
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        left={<EnterpriseLeftPanel />}
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}><VendorStatsPanel /></div>}
      />

      <div
        className="flex flex-col pb-4 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
        </div>

        <div className="flex-1 px-4 py-5">
          <h1 className="font-display text-lg font-bold text-white">Vendor Master</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            All vendors your company works with
          </p>
          <div className="mt-3">{headerButtons}</div>
          <div className="mt-4">
            <FilterRow search={search} onSearchChange={setSearch} />
          </div>
          {vendorGrid}

          <div className="mt-8 rounded-xl border border-border-dark bg-card p-4">
            <VendorStatsPanel />
          </div>
        </div>
      </div>

      {showConnect && <ConnectVendorModal onClose={() => setShowConnect(false)} />}
      {showVouch && <VouchVendorModal onClose={() => setShowVouch(false)} />}
    </>
  );
}
