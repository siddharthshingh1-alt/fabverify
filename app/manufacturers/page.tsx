"use client";

import { useState } from "react";
import ThreePanelLayout from "../components/ThreePanelLayout";
import { manufacturers } from "../data/manufacturers";
import type { Tier } from "../data/manufacturers";
import { useUser } from "../context/UserContext";
import type { UserType } from "../context/UserContext";
import screenConfig from "../config/screens";

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

const CITY_OPTIONS = manufacturers.map((m) => m.city);

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
const ALL_TIERS: Tier[] = ["gold", "silver", "bronze"];

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

type SupplierType = "Fabric Mill" | "Trim Supplier";

type SupplierCard = {
  id: string;
  name: string;
  typeLabel: SupplierType;
  tier: Tier;
  city: string;
  tags: string[];
  rating: number;
  orders: number;
  moqLabel: string;
};

const SUPPLIERS: SupplierCard[] = [
  {
    id: "surat-cotton-mills",
    name: "Surat Cotton Mills",
    typeLabel: "Fabric Mill",
    tier: "gold",
    city: "Surat, Gujarat",
    tags: ["Cotton", "Lawn", "Printed"],
    rating: 4.8,
    orders: 412,
    moqLabel: "100m",
  },
  {
    id: "delhi-trim-house",
    name: "Delhi Trim House",
    typeLabel: "Trim Supplier",
    tier: "silver",
    city: "Delhi NCR",
    tags: ["Buttons", "Zips", "Labels"],
    rating: 4.6,
    orders: 234,
    moqLabel: "500 pieces",
  },
  {
    id: "lucknow-thread-co",
    name: "Lucknow Thread Co",
    typeLabel: "Trim Supplier",
    tier: "silver",
    city: "Lucknow, UP",
    tags: ["Thread", "Elastic", "Lining"],
    rating: 4.5,
    orders: 189,
    moqLabel: "100 metres",
  },
];

const SUPPLIER_CATEGORY_OPTIONS = Array.from(
  new Set(SUPPLIERS.flatMap((s) => s.tags))
);
const SUPPLIER_CITY_OPTIONS = Array.from(new Set(SUPPLIERS.map((s) => s.city)));

type BuyerCard = {
  id: string;
  name: string;
  tier: Tier;
  city: string;
  category: string;
  tags: string[];
  rating: number;
  orders: number;
  activeBuyer?: boolean;
  budgetMin: number;
  budgetMax: number;
  orderQtyMin: number;
  orderQtyMax: number;
  orderQtyUnit: string;
};

const BUYERS: BuyerCard[] = [
  {
    id: "ethnic-label-co",
    name: "Ethnic Label Co",
    tier: "silver",
    city: "Jaipur, Rajasthan",
    category: "Ethnic Wear",
    tags: ["Ethnic Wear", "Cotton", "50-200 pieces"],
    rating: 4.8,
    orders: 45,
    activeBuyer: true,
    budgetMin: 50000,
    budgetMax: 200000,
    orderQtyMin: 50,
    orderQtyMax: 200,
    orderQtyUnit: "pieces",
  },
  {
    id: "d2c-fashion-brand",
    name: "D2C Fashion Brand",
    tier: "bronze",
    city: "Bengaluru, Karnataka",
    category: "Casual Wear",
    tags: ["Casual Wear", "Sustainable", "100-500 pieces"],
    rating: 4.5,
    orders: 12,
    budgetMin: 25000,
    budgetMax: 100000,
    orderQtyMin: 100,
    orderQtyMax: 500,
    orderQtyUnit: "pieces",
  },
  {
    id: "boutique-collection",
    name: "Boutique Collection",
    tier: "silver",
    city: "Mumbai, Maharashtra",
    category: "Luxury",
    tags: ["Luxury", "Western", "20-100 pieces"],
    rating: 4.9,
    orders: 67,
    budgetMin: 100000,
    budgetMax: 500000,
    orderQtyMin: 20,
    orderQtyMax: 100,
    orderQtyUnit: "pieces",
  },
  {
    id: "kids-fashion-house",
    name: "Kids Fashion House",
    tier: "gold",
    city: "Delhi NCR",
    category: "Kids Wear",
    tags: ["Kids Wear", "Cotton", "200-1000 pieces"],
    rating: 4.7,
    orders: 89,
    budgetMin: 200000,
    budgetMax: 1000000,
    orderQtyMin: 200,
    orderQtyMax: 1000,
    orderQtyUnit: "pieces",
  },
];

const BUYER_CATEGORY_OPTIONS = Array.from(new Set(BUYERS.map((b) => b.category)));
const BUYER_CITY_OPTIONS = Array.from(new Set(BUYERS.map((b) => b.city)));

const TALENT_LOOKING_FOR: Partial<Record<UserType, string>> = {
  designer: "Designer",
  master: "Master",
  merchandiser: "Merchandiser",
  qc_inspector: "QC Inspector",
};

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function Manufacturers() {
  const { user, isTalent } = useUser();
  const config = screenConfig.manufacturers[user.userType];
  const talentLookingFor = TALENT_LOOKING_FOR[user.userType];

  // Mode: "manufacturers" (buyer browsing manufacturers)
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

  // Mode: "suppliers" (manufacturer browsing fabric/trim suppliers)
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<
    "All" | SupplierType
  >("All");
  const [supplierCategories, setSupplierCategories] = useState<string[]>([]);
  const [supplierCities, setSupplierCities] = useState<string[]>([]);
  const [supplierTiers, setSupplierTiers] = useState<Tier[]>(ALL_TIERS);

  // Mode: "buyers" (supply side / talent browsing brands)
  const [buyerCategories, setBuyerCategories] = useState<string[]>([]);
  const [buyerCities, setBuyerCities] = useState<string[]>([]);
  const [buyerTiers, setBuyerTiers] = useState<Tier[]>(ALL_TIERS);
  const [qtyFrom, setQtyFrom] = useState("");
  const [qtyTo, setQtyTo] = useState("");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");

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

  const toggleListValue = (
    value: string,
    list: string[],
    setList: (value: string[]) => void
  ) => {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  };

  const toggleSupplierTier = (tier: Tier) => {
    setSupplierTiers((current) =>
      current.includes(tier)
        ? current.filter((item) => item !== tier)
        : [...current, tier]
    );
  };

  const toggleBuyerTier = (tier: Tier) => {
    setBuyerTiers((current) =>
      current.includes(tier)
        ? current.filter((item) => item !== tier)
        : [...current, tier]
    );
  };

  const handleClearSuppliers = () => {
    setSupplierTypeFilter("All");
    setSupplierCategories([]);
    setSupplierCities([]);
    setSupplierTiers(ALL_TIERS);
  };

  const handleClearBuyers = () => {
    setBuyerCategories([]);
    setBuyerCities([]);
    setBuyerTiers(ALL_TIERS);
    setQtyFrom("");
    setQtyTo("");
    setBudgetFrom("");
    setBudgetTo("");
  };

  const filteredManufacturers = manufacturers.filter((manufacturer) => {
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
        return a.moq - b.moq;
      case "Top Rated":
      default:
        return b.rating - a.rating;
    }
  });

  const filteredSuppliers = SUPPLIERS.filter((supplier) => {
    const matchesType =
      supplierTypeFilter === "All" || supplier.typeLabel === supplierTypeFilter;
    const matchesCategory =
      supplierCategories.length === 0 ||
      supplier.tags.some((tag) => supplierCategories.includes(tag));
    const matchesCity =
      supplierCities.length === 0 || supplierCities.includes(supplier.city);
    const matchesTier = supplierTiers.includes(supplier.tier);
    return matchesType && matchesCategory && matchesCity && matchesTier;
  });

  const filteredBuyers = BUYERS.filter((buyer) => {
    const matchesCategory =
      buyerCategories.length === 0 || buyerCategories.includes(buyer.category);
    const matchesCity =
      buyerCities.length === 0 || buyerCities.includes(buyer.city);
    const matchesTier = buyerTiers.includes(buyer.tier);
    const matchesQtyFrom = qtyFrom === "" || buyer.orderQtyMax >= Number(qtyFrom);
    const matchesQtyTo = qtyTo === "" || buyer.orderQtyMin <= Number(qtyTo);
    const matchesBudgetFrom =
      budgetFrom === "" || buyer.budgetMax >= Number(budgetFrom);
    const matchesBudgetTo = budgetTo === "" || buyer.budgetMin <= Number(budgetTo);
    return (
      matchesCategory &&
      matchesCity &&
      matchesTier &&
      matchesQtyFrom &&
      matchesQtyTo &&
      matchesBudgetFrom &&
      matchesBudgetTo
    );
  });

  const supplierCards = (
    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
      {filteredSuppliers.map((supplier) => (
        <div
          key={supplier.id}
          className="rounded-[10px] border border-border-dark bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[0_4px_20px_rgba(242,202,80,0.08)]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
              {supplier.typeLabel === "Fabric Mill" ? "🏗️" : "🧷"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-white">
                {supplier.name}
              </p>
              <p className="text-xs text-text-secondary">
                {supplier.typeLabel} • {supplier.city}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold capitalize ${TIER_STYLES[supplier.tier]}`}
            >
              {supplier.tier} Verified
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {supplier.tags.map((tag) => (
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
              <p className="text-[11px] text-text-secondary">⭐ Rating</p>
              <p className="text-xs font-semibold text-text-primary">
                {supplier.rating}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-secondary">📦 Orders</p>
              <p className="text-xs font-semibold text-text-primary">
                {supplier.orders}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-secondary">MOQ</p>
              <p className="text-xs font-semibold text-text-primary">
                {supplier.moqLabel}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-border-dark pt-3">
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
              Send Enquiry
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const buyerCards = (
    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
      {filteredBuyers.map((buyer) => (
        <div
          key={buyer.id}
          className="rounded-[10px] border border-border-dark bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[0_4px_20px_rgba(242,202,80,0.08)]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
              🛍️
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-white">
                {buyer.name}
              </p>
              <p className="text-xs text-text-secondary">
                Brand / Buyer • {buyer.city}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold capitalize ${TIER_STYLES[buyer.tier]}`}
            >
              {buyer.tier} Verified
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {buyer.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[20px] border border-border-dark bg-background px-2 py-[3px] text-[10px] text-text-secondary"
              >
                {tag}
              </span>
            ))}
            {talentLookingFor && (
              <span className="rounded-[20px] border border-primary/40 bg-primary/15 px-2 py-[3px] text-[10px] font-semibold text-primary">
                Looking for {talentLookingFor}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-dark pt-3 text-xs text-text-secondary">
            <span>⭐ Rating {buyer.rating}</span>
            <span>📦 Orders {buyer.orders}</span>
            {buyer.activeBuyer && (
              <span className="rounded-[20px] border border-green-500/60 bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                Active Buyer
              </span>
            )}
          </div>

          <p className="mt-3 text-[13px] font-semibold text-primary">
            Budget: {formatRupees(buyer.budgetMin)} – {formatRupees(buyer.budgetMax)} per season
          </p>

          <div className="mt-4 flex justify-end gap-2 border-t border-border-dark pt-3">
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
              Send Enquiry
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const manufacturerFilterBar = (
    <>
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
          onChange={(event) => handleCityDropdownChange(event.target.value)}
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
          onChange={(event) => setSelectedTierDropdown(event.target.value)}
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
                <p className="text-[11px] text-text-secondary">⭐ Rating</p>
                <p className="text-xs font-semibold text-text-primary">
                  {manufacturer.rating}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary">📦 Orders</p>
                <p className="text-xs font-semibold text-text-primary">
                  {manufacturer.orders}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary">⏱ Delivery</p>
                <p className="text-xs font-semibold text-text-primary">
                  {manufacturer.delivery}% on time
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-border-dark pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-secondary">
                Min. {manufacturer.moq} {manufacturer.moqUnit}
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
    </>
  );

  const centreContent =
    config.mode === "manufacturers" ? (
      manufacturerFilterBar
    ) : config.mode === "suppliers" ? (
      <>
        <p className="text-[13px] text-text-secondary">
          Showing {filteredSuppliers.length} of {SUPPLIERS.length} verified suppliers
        </p>
        {supplierCards}
        {filteredSuppliers.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
            <div className="text-4xl">🔍</div>
            <p className="mt-3 text-sm text-text-primary">
              No suppliers match your filters
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Try adjusting your filters
            </p>
          </div>
        )}
      </>
    ) : (
      <>
        <p className="text-[13px] text-text-secondary">
          Showing {filteredBuyers.length} of {BUYERS.length} verified buyers
        </p>
        {buyerCards}
        {filteredBuyers.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
            <div className="text-4xl">🔍</div>
            <p className="mt-3 text-sm text-text-primary">
              No buyers match your filters
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Try adjusting your filters
            </p>
          </div>
        )}
      </>
    );

  const centrePanel = (
    <>
      <div
        className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border-dark px-6"
        style={{ backgroundColor: "#07122a" }}
      >
        <h1 className="font-display text-xl font-bold text-white">
          {config.title}
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

      <div className="px-6 py-6">
        <p className="-mt-2 mb-4 text-sm text-text-secondary">
          {config.subtitle}
        </p>
        {centreContent}
      </div>
    </>
  );

  const manufacturersRightPanel = (
    <>
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
        {CATEGORY_PILLS.filter((pill) => pill !== "All").map((category) => (
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
        ))}
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
    </>
  );

  const suppliersRightPanel = (
    <>
      <p className="text-base font-bold text-white">Filter Suppliers</p>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Supplier Type
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {(["All", "Fabric Mill", "Trim Supplier"] as const).map((type) => (
          <label
            key={type}
            className="flex items-center gap-2 text-sm text-text-primary"
          >
            <input
              type="radio"
              name="supplierType"
              checked={supplierTypeFilter === type}
              onChange={() => setSupplierTypeFilter(type)}
              className="h-4 w-4 accent-primary"
            />
            {type === "All" ? "Fabric / Trim / Both" : type}
          </label>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Category
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {SUPPLIER_CATEGORY_OPTIONS.map((category) => (
          <label
            key={category}
            className="flex items-center gap-2 text-sm text-text-primary"
          >
            <input
              type="checkbox"
              checked={supplierCategories.includes(category)}
              onChange={() =>
                toggleListValue(category, supplierCategories, setSupplierCategories)
              }
              className="h-4 w-4 accent-primary"
            />
            {category}
          </label>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        City
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {SUPPLIER_CITY_OPTIONS.map((city) => (
          <label
            key={city}
            className="flex items-center gap-2 text-sm text-text-primary"
          >
            <input
              type="checkbox"
              checked={supplierCities.includes(city)}
              onChange={() =>
                toggleListValue(city, supplierCities, setSupplierCities)
              }
              className="h-4 w-4 accent-primary"
            />
            {city}
          </label>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
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
              checked={supplierTiers.includes(option.tier)}
              onChange={() => toggleSupplierTier(option.tier)}
              className="h-4 w-4 accent-primary"
            />
            {option.emoji} {option.tier} Verified
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleClearSuppliers}
        className="mt-6 text-center text-xs font-medium text-text-secondary"
      >
        Clear All
      </button>
    </>
  );

  const buyersRightPanel = (
    <>
      <p className="text-base font-bold text-white">Filter Buyers</p>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Category They Buy
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {BUYER_CATEGORY_OPTIONS.map((category) => (
          <label
            key={category}
            className="flex items-center gap-2 text-sm text-text-primary"
          >
            <input
              type="checkbox"
              checked={buyerCategories.includes(category)}
              onChange={() =>
                toggleListValue(category, buyerCategories, setBuyerCategories)
              }
              className="h-4 w-4 accent-primary"
            />
            {category}
          </label>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Order Quantity Range
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={0}
          placeholder="From"
          value={qtyFrom}
          onChange={(event) => setQtyFrom(event.target.value)}
          className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
        />
        <span className="text-text-secondary">–</span>
        <input
          type="number"
          min={0}
          placeholder="To"
          value={qtyTo}
          onChange={(event) => setQtyTo(event.target.value)}
          className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Budget Range (₹)
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={0}
          placeholder="From"
          value={budgetFrom}
          onChange={(event) => setBudgetFrom(event.target.value)}
          className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
        />
        <span className="text-text-secondary">–</span>
        <input
          type="number"
          min={0}
          placeholder="To"
          value={budgetTo}
          onChange={(event) => setBudgetTo(event.target.value)}
          className="w-full rounded-[6px] border border-border-dark bg-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
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
              checked={buyerTiers.includes(option.tier)}
              onChange={() => toggleBuyerTier(option.tier)}
              className="h-4 w-4 accent-primary"
            />
            {option.emoji} {option.tier} Verified
          </label>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        City
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {BUYER_CITY_OPTIONS.map((city) => (
          <label
            key={city}
            className="flex items-center gap-2 text-sm text-text-primary"
          >
            <input
              type="checkbox"
              checked={buyerCities.includes(city)}
              onChange={() => toggleListValue(city, buyerCities, setBuyerCities)}
              className="h-4 w-4 accent-primary"
            />
            {city}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleClearBuyers}
        className="mt-6 text-center text-xs font-medium text-text-secondary"
      >
        Clear All
      </button>
    </>
  );

  const rightPanel =
    config.mode === "manufacturers"
      ? manufacturersRightPanel
      : config.mode === "suppliers"
        ? suppliersRightPanel
        : buyersRightPanel;

  const mobileCards =
    config.mode === "manufacturers" ? null : config.mode === "suppliers" ? (
      <div className="mt-4 flex flex-col gap-3">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="rounded-[10px] border border-border-dark bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
                {supplier.typeLabel === "Fabric Mill" ? "🏗️" : "🧷"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-white">
                  {supplier.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {supplier.typeLabel} • {supplier.city}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold capitalize ${TIER_STYLES[supplier.tier]}`}
              >
                {supplier.tier} Verified
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {supplier.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[20px] border border-border-dark bg-background px-2 py-[3px] text-[10px] text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-dark pt-3 text-[11px] text-text-secondary">
              <span>⭐ {supplier.rating}</span>
              <span>📦 {supplier.orders}</span>
              <span>MOQ {supplier.moqLabel}</span>
            </div>
            <div className="mt-4 flex gap-2 border-t border-border-dark pt-3">
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
                Send Enquiry
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-4 flex flex-col gap-3">
        {filteredBuyers.map((buyer) => (
          <div
            key={buyer.id}
            className="rounded-[10px] border border-border-dark bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
                🛍️
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-white">
                  {buyer.name}
                </p>
                <p className="text-xs text-text-secondary">
                  Brand / Buyer • {buyer.city}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-[20px] border px-2.5 py-1 text-[10px] font-semibold capitalize ${TIER_STYLES[buyer.tier]}`}
              >
                {buyer.tier} Verified
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {buyer.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[20px] border border-border-dark bg-background px-2 py-[3px] text-[10px] text-text-secondary"
                >
                  {tag}
                </span>
              ))}
              {talentLookingFor && (
                <span className="rounded-[20px] border border-primary/40 bg-primary/15 px-2 py-[3px] text-[10px] font-semibold text-primary">
                  Looking for {talentLookingFor}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-dark pt-3 text-[11px] text-text-secondary">
              <span>⭐ {buyer.rating}</span>
              <span>📦 {buyer.orders}</span>
              {buyer.activeBuyer && (
                <span className="rounded-[20px] border border-green-500/60 bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                  Active Buyer
                </span>
              )}
            </div>
            <p className="mt-3 text-[13px] font-semibold text-primary">
              Budget: {formatRupees(buyer.budgetMin)} – {formatRupees(buyer.budgetMax)} per season
            </p>
            <div className="mt-4 flex gap-2 border-t border-border-dark pt-3">
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
                Send Enquiry
              </button>
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <>
      <ThreePanelLayout
        centre={centrePanel}
        right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
      />

      <div
        className="flex flex-col pb-20 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
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
            {config.title}
          </h1>
          <p className="mt-1 text-xs text-text-secondary">{config.subtitle}</p>

          {config.mode === "manufacturers" ? (
            <>
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
                        Min. {manufacturer.moq} {manufacturer.moqUnit}
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
            </>
          ) : (
            <>
              <p className="mt-4 text-[13px] text-text-secondary">
                Showing{" "}
                {config.mode === "suppliers"
                  ? filteredSuppliers.length
                  : filteredBuyers.length}{" "}
                {config.mode === "suppliers" ? "suppliers" : "buyers"}
              </p>
              {mobileCards}
            </>
          )}
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
