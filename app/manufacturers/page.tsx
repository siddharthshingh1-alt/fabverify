"use client";

import Link from "next/link";
import { useState } from "react";

const WORKSPACE_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard", active: false },
  { icon: "📦", label: "My Orders", href: "/orders", active: false },
  {
    icon: "🧵",
    label: "Find Manufacturers",
    href: "/manufacturers",
    active: true,
  },
  { icon: "👔", label: "FabMerch", href: "/fabmerch", active: false },
  { icon: "💳", label: "FabScore & Credit", href: "/credit", active: false },
];

const TOOLS_NAV = [
  { icon: "📋", label: "Sample Briefs", href: "/samples" },
  { icon: "💰", label: "FabPrice", href: "/fabprice" },
  { icon: "📊", label: "Analytics", href: "/analytics" },
];

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", active: false },
  { icon: "📦", label: "Orders", active: false },
  { icon: "🔍", label: "Discover", active: true },
  { icon: "👔", label: "Merch", active: false },
  { icon: "👤", label: "Profile", active: false },
];

const CATEGORY_PILLS = [
  "All",
  "Ethnic Wear",
  "Casual Wear",
  "Activewear",
  "Kids Wear",
  "Western Wear",
  "Luxury",
];

type Tier = "gold" | "silver" | "bronze";

type Manufacturer = {
  id: string;
  name: string;
  city: string;
  state: string;
  tier: Tier;
  tags: string[];
  rating: number;
  orders: number;
  delivery: number;
  moq: string;
};

const MANUFACTURERS: Manufacturer[] = [
  {
    id: "jaipur-ethnic-works",
    name: "Jaipur Ethnic Works",
    city: "Jaipur",
    state: "Rajasthan",
    tier: "gold",
    tags: ["Ethnic Wear", "Cotton", "Hand Block Print"],
    rating: 4.9,
    orders: 287,
    delivery: 99,
    moq: "50 pieces",
  },
  {
    id: "surat-cotton-mills",
    name: "Surat Cotton Mills",
    city: "Surat",
    state: "Gujarat",
    tier: "gold",
    tags: ["Cotton Fabric", "Lawn", "Printed"],
    rating: 4.8,
    orders: 412,
    delivery: 98,
    moq: "100 metres",
  },
  {
    id: "lucknow-chikankari-house",
    name: "Lucknow Chikankari House",
    city: "Lucknow",
    state: "UP",
    tier: "gold",
    tags: ["Chikankari", "Ethnic Wear", "Hand Embroidery"],
    rating: 4.9,
    orders: 156,
    delivery: 97,
    moq: "30 pieces",
  },
  {
    id: "tirupur-knits",
    name: "Tirupur Knits",
    city: "Tirupur",
    state: "Tamil Nadu",
    tier: "silver",
    tags: ["Knitwear", "T-shirts", "Casual Wear"],
    rating: 4.7,
    orders: 334,
    delivery: 96,
    moq: "100 pieces",
  },
  {
    id: "delhi-woven-works",
    name: "Delhi Woven Works",
    city: "Delhi NCR",
    state: "",
    tier: "silver",
    tags: ["Woven", "Western Wear", "Trousers"],
    rating: 4.6,
    orders: 198,
    delivery: 95,
    moq: "50 pieces",
  },
  {
    id: "mumbai-denim-studio",
    name: "Mumbai Denim Studio",
    city: "Mumbai",
    state: "Maharashtra",
    tier: "silver",
    tags: ["Denim", "Western Wear", "Jeans"],
    rating: 4.5,
    orders: 167,
    delivery: 94,
    moq: "100 pieces",
  },
  {
    id: "ahmedabad-silk-house",
    name: "Ahmedabad Silk House",
    city: "Ahmedabad",
    state: "Gujarat",
    tier: "bronze",
    tags: ["Silk", "Ethnic Wear", "Sarees"],
    rating: 4.4,
    orders: 89,
    delivery: 93,
    moq: "20 pieces",
  },
  {
    id: "kolkata-handloom",
    name: "Kolkata Handloom",
    city: "Kolkata",
    state: "West Bengal",
    tier: "bronze",
    tags: ["Handloom", "Cotton", "Ethnic"],
    rating: 4.3,
    orders: 67,
    delivery: 92,
    moq: "25 pieces",
  },
];

const CITY_OPTIONS = MANUFACTURERS.map((m) => m.city);

const TIER_STYLES: Record<Tier, string> = {
  gold: "border-primary/40 bg-primary/15 text-primary",
  silver: "border-secondary/40 bg-secondary/15 text-secondary",
  bronze: "border-[#cd7f32]/40 bg-[#cd7f32]/15 text-[#cd7f32]",
};

const TIER_OPTIONS: { tier: Tier; emoji: string }[] = [
  { tier: "gold", emoji: "🥇" },
  { tier: "silver", emoji: "🥈" },
  { tier: "bronze", emoji: "🥉" },
];

const DEFAULT_TIERS: Tier[] = ["gold", "silver"];

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23f2ca50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='5 8 10 13 15 8'%3E%3C/polyline%3E%3C/svg%3E\")";

const SELECT_STYLE = {
  backgroundImage: SELECT_CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "12px",
};

const SELECT_CLASSNAME =
  "appearance-none rounded-[6px] border border-border-dark bg-card py-2 pl-3 pr-8 text-xs text-text-primary outline-none transition-colors focus:border-primary";

function moqValue(moq: string) {
  return parseInt(moq, 10) || 0;
}

export default function Manufacturers() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTiers, setSelectedTiers] = useState<Tier[]>(DEFAULT_TIERS);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedTierDropdown, setSelectedTierDropdown] =
    useState("All Tiers");
  const [sortBy, setSortBy] = useState("Top Rated");
  const [moqFrom, setMoqFrom] = useState("");
  const [moqTo, setMoqTo] = useState("");

  const toggleTier = (tier: Tier) => {
    setSelectedTiers((current) =>
      current.includes(tier)
        ? current.filter((item) => item !== tier)
        : [...current, tier]
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities((current) => {
      const isChecked = current.includes(city);
      if (isChecked) {
        setSelectedCity((currentDropdown) =>
          currentDropdown === city ? "All Cities" : currentDropdown
        );
        return current.filter((item) => item !== city);
      }
      setSelectedCity(city);
      return [...current, city];
    });
  };

  const handleCityDropdownChange = (city: string) => {
    setSelectedCity(city);
    setSelectedCities(city === "All Cities" ? [] : [city]);
  };

  const handleClearAll = () => {
    setSearchText("");
    setSelectedCategory("All");
    setSelectedTiers(DEFAULT_TIERS);
    setSelectedCities([]);
    setMinRating(0);
    setSelectedCity("All Cities");
    setSelectedTierDropdown("All Tiers");
    setSortBy("Top Rated");
    setMoqFrom("");
    setMoqTo("");
  };

  const filteredManufacturers = MANUFACTURERS.filter((manufacturer) => {
    const query = searchText.trim().toLowerCase();
    const matchesSearch =
      !query ||
      manufacturer.name.toLowerCase().includes(query) ||
      manufacturer.city.toLowerCase().includes(query) ||
      manufacturer.tags.some((tag) => tag.toLowerCase().includes(query));

    const matchesCategory =
      selectedCategory === "All" ||
      manufacturer.tags.includes(selectedCategory);

    const matchesTier = selectedTiers.includes(manufacturer.tier);

    const matchesCity =
      selectedCities.length === 0 || selectedCities.includes(manufacturer.city);

    const matchesRating = manufacturer.rating >= minRating;

    const matchesCityDropdown =
      selectedCity === "All Cities" || manufacturer.city === selectedCity;

    const matchesTierDropdown =
      selectedTierDropdown === "All Tiers" ||
      (selectedTierDropdown === "Gold Verified" &&
        manufacturer.tier === "gold") ||
      (selectedTierDropdown === "Silver Verified" &&
        manufacturer.tier === "silver") ||
      (selectedTierDropdown === "Bronze Verified" &&
        manufacturer.tier === "bronze");

    return (
      matchesSearch &&
      matchesCategory &&
      matchesTier &&
      matchesCity &&
      matchesRating &&
      matchesCityDropdown &&
      matchesTierDropdown
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case "Most Orders":
        return b.orders - a.orders;
      case "Fastest Delivery":
        return b.delivery - a.delivery;
      case "Lowest MOQ":
        return moqValue(a.moq) - moqValue(b.moq);
      case "Top Rated":
      default:
        return b.rating - a.rating;
    }
  });

  return (
    <>
      <div className="hidden h-screen overflow-hidden md:flex">
        <aside className="flex h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-border-dark bg-card">
          <div className="p-5">
            <div className="flex items-center gap-1 font-display text-lg font-bold">
              <span>🧵</span>
              <span className="text-white">Fab</span>
              <span className="text-primary">Verify</span>
            </div>

            <p className="mt-5 text-sm text-white">
              Good morning, Siddharth 👋
            </p>
            <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              Brand Builder
            </span>
          </div>

          <div className="mt-4">
            <p className="px-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              Workspace
            </p>
            <nav className="mt-2 flex flex-col">
              {WORKSPACE_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 border-l-2 px-5 py-2.5 text-left text-sm font-medium transition-colors ${
                    item.active
                      ? "border-primary bg-primary/[0.08] text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            <p className="px-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              Tools
            </p>
            <nav className="mt-2 flex flex-col">
              {TOOLS_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 border-l-2 border-transparent px-5 py-2.5 text-left text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-border-dark p-5">
            <p className="text-xs text-text-secondary">Your FabScore</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">
              —
            </p>
            <p className="mt-1 text-[11px] text-text-secondary">
              Complete verification to unlock
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-navy"
            >
              Get Verified
            </button>
          </div>
        </aside>

        <main className="flex h-screen flex-1 flex-col overflow-hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-dark px-6">
            <h1 className="font-display text-xl font-bold text-white">
              Find Manufacturers
            </h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Notifications"
                className="text-lg text-text-primary"
              >
                🔔
              </button>
              <button
                type="button"
                aria-label="Search"
                className="text-lg text-text-primary"
              >
                🔍
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                🔍
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by category, city, specialisation..."
                className="w-full rounded-[6px] border border-border-dark bg-card py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
              />
            </div>

            <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1">
              {CATEGORY_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setSelectedCategory(pill)}
                  className={`shrink-0 rounded-[20px] border px-4 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === pill
                      ? "border-primary bg-primary text-navy"
                      : "border-border-dark bg-card text-text-secondary"
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={selectedCity}
                onChange={(event) =>
                  handleCityDropdownChange(event.target.value)
                }
                className={SELECT_CLASSNAME}
                style={SELECT_STYLE}
              >
                <option>All Cities</option>
                {CITY_OPTIONS.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
              <select
                value={selectedTierDropdown}
                onChange={(event) =>
                  setSelectedTierDropdown(event.target.value)
                }
                className={SELECT_CLASSNAME}
                style={SELECT_STYLE}
              >
                <option>All Tiers</option>
                <option>Gold Verified</option>
                <option>Silver Verified</option>
                <option>Bronze Verified</option>
              </select>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className={SELECT_CLASSNAME}
                style={SELECT_STYLE}
              >
                <option>Top Rated</option>
                <option>Most Orders</option>
                <option>Fastest Delivery</option>
                <option>Lowest MOQ</option>
              </select>
            </div>

            <p className="mt-4 text-[13px] text-text-secondary">
              Showing {filteredManufacturers.length} verified manufacturers
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filteredManufacturers.map((manufacturer) => (
                <div
                  key={manufacturer.id}
                  className="rounded-[10px] border border-border-dark bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[0_4px_20px_rgba(242,202,80,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
                      🏭
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-white">
                        {manufacturer.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {manufacturer.city}
                        {manufacturer.state ? `, ${manufacturer.state}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold capitalize ${
                        TIER_STYLES[manufacturer.tier]
                      }`}
                    >
                      {manufacturer.tier} Verified
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {manufacturer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-[20px] border border-border-dark bg-background px-2 py-[3px] text-[10px] text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-dark pt-3">
                    <div>
                      <p className="text-[11px] text-text-secondary">
                        ⭐ Rating
                      </p>
                      <p className="text-xs font-semibold text-text-primary">
                        {manufacturer.rating}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-text-secondary">
                        📦 Orders
                      </p>
                      <p className="text-xs font-semibold text-text-primary">
                        {manufacturer.orders}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-text-secondary">
                        ⏱ Delivery
                      </p>
                      <p className="text-xs font-semibold text-text-primary">
                        {manufacturer.delivery}% on time
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-text-secondary">
                      Min. {manufacturer.moq}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-navy"
                      >
                        Request Sample
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredManufacturers.length === 0 && (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
                <div className="text-4xl">🔍</div>
                <p className="mt-3 text-sm text-text-primary">
                  No manufacturers match your filters
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Try adjusting your search or clearing filters
                </p>
              </div>
            )}
          </div>
        </main>

        <aside className="scrollbar-hide flex h-screen w-[280px] shrink-0 flex-col overflow-y-auto border-l border-border-dark bg-card p-5">
          <p className="text-base font-bold text-white">Refine Search</p>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Verification Tier
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {TIER_OPTIONS.map((option) => (
              <label
                key={option.tier}
                className="flex items-center gap-2 text-sm capitalize text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={selectedTiers.includes(option.tier)}
                  onChange={() => toggleTier(option.tier)}
                  className="h-4 w-4 accent-primary"
                />
                {option.emoji} {option.tier} Verified
              </label>
            ))}
          </div>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Category
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {CATEGORY_PILLS.filter((pill) => pill !== "All").map(
              (category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 text-sm text-text-primary"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategory === category}
                    onChange={() =>
                      setSelectedCategory((current) =>
                        current === category ? "All" : category
                      )
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  {category}
                </label>
              )
            )}
          </div>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            City
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {CITY_OPTIONS.map((city) => (
              <label
                key={city}
                className="flex items-center gap-2 text-sm text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={selectedCities.includes(city)}
                  onChange={() => toggleCity(city)}
                  className="h-4 w-4 accent-primary"
                />
                {city}
              </label>
            ))}
          </div>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Min Order Quantity
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="From"
              value={moqFrom}
              onChange={(event) => setMoqFrom(event.target.value)}
              className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
            />
            <span className="text-text-secondary">–</span>
            <input
              type="number"
              min={0}
              placeholder="To"
              value={moqTo}
              onChange={(event) => setMoqTo(event.target.value)}
              className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
            />
          </div>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Minimum Rating
          </p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                onClick={() =>
                  setMinRating((current) => (current === star ? 0 : star))
                }
                className={`text-xl ${
                  star <= minRating ? "text-primary" : "text-text-secondary"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="mt-6 text-center text-xs font-medium text-text-secondary"
          >
            Clear All
          </button>
        </aside>
      </div>

      <div className="flex min-h-screen flex-col pb-20 md:hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="text-lg text-text-primary"
          >
            🔔
          </button>
        </div>

        <div className="flex-1 px-4 py-5">
          <h1 className="font-display text-lg font-bold text-white">
            Find Manufacturers
          </h1>

          <div className="relative mt-4">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              🔍
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by category, city, specialisation..."
              className="w-full rounded-[6px] border border-border-dark bg-card py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
            />
          </div>

          <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setSelectedCategory(pill)}
                className={`shrink-0 rounded-[20px] border px-4 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === pill
                    ? "border-primary bg-primary text-navy"
                    : "border-border-dark bg-card text-text-secondary"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[13px] text-text-secondary">
            Showing {filteredManufacturers.length} verified manufacturers
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {filteredManufacturers.map((manufacturer) => (
              <div
                key={manufacturer.id}
                className="rounded-[10px] border border-border-dark bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
                    🏭
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-white">
                      {manufacturer.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {manufacturer.city}
                      {manufacturer.state ? `, ${manufacturer.state}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold capitalize ${
                      TIER_STYLES[manufacturer.tier]
                    }`}
                  >
                    {manufacturer.tier} Verified
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {manufacturer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[20px] border border-border-dark bg-background px-2 py-[3px] text-[10px] text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-dark pt-3">
                  <div>
                    <p className="text-[11px] text-text-secondary">
                      ⭐ Rating
                    </p>
                    <p className="text-xs font-semibold text-text-primary">
                      {manufacturer.rating}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">
                      📦 Orders
                    </p>
                    <p className="text-xs font-semibold text-text-primary">
                      {manufacturer.orders}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">
                      ⏱ Delivery
                    </p>
                    <p className="text-xs font-semibold text-text-primary">
                      {manufacturer.delivery}% on time
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3">
                  <p className="text-xs text-text-secondary">
                    Min. {manufacturer.moq}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-navy"
                    >
                      Request Sample
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredManufacturers.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
                <div className="text-4xl">🔍</div>
                <p className="mt-3 text-sm text-text-primary">
                  No manufacturers match your filters
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Try adjusting your search or clearing filters
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-border-dark bg-card">
          {BOTTOM_NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                item.active ? "text-primary" : "text-text-secondary"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
