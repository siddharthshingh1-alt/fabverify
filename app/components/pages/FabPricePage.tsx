"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useId, useMemo, useState } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import TopBar from "../TopBar";
import {
  fabricPrices,
  makingCharges,
  trimPrices,
} from "../../data/fabprice";
import { useUser } from "../../context/UserContext";
import type { UserType } from "../../context/UserContext";

const SELLING_TABS: Partial<Record<UserType, Tab>> = {
  fabric_mill: "fabric",
  trim_supplier: "trims",
  manufacturer: "making",
  artisan: "making",
  job_worker: "making",
  master: "making",
};

function isSellerContext(userType: UserType, tab: Tab) {
  return SELLING_TABS[userType] === tab;
}

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "🔍", label: "Discover", href: "/manufacturers" },
  { icon: "👔", label: "Merch", href: "/fabmerch" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

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

type Tab = "fabric" | "making" | "trims";
type Trend = "up" | "down" | "stable";
type PriceRange = [number, number];

type FabricRow = {
  id: string;
  name: string;
  tags: string[];
  city: string;
  price50: PriceRange;
  price200: PriceRange;
  price500: PriceRange;
  trend: Trend;
  trendLabel: string;
  updatedDaysAgo: number;
  history: number[];
};

type MakingRow = {
  id: string;
  category: string;
  note?: string;
  city: string;
  price50: PriceRange;
  price100: PriceRange;
  price500: PriceRange;
  complexity: "Simple" | "Medium" | "Complex";
  updatedDaysAgo: number;
  history: number[];
};

type TrimRow = {
  id: string;
  name: string;
  material: string;
  price: PriceRange;
  priceUnit: string;
  moq: string;
  city: string;
  updatedDaysAgo: number;
  history: number[];
};

const HISTORY_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function parsePriceRange(range: string): PriceRange {
  const numbers = (range.match(/[\d,]+/g) ?? ["0"]).map((n) =>
    parseInt(n.replace(/,/g, ""), 10)
  );
  return [numbers[0] ?? 0, numbers[1] ?? numbers[0] ?? 0];
}

function parseUpdatedDays(updated: string): number {
  if (/^today$/i.test(updated)) return 0;
  const match = updated.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parsePriceUnit(range: string): string {
  const match = range.match(/₹[\d,]+–₹[\d,]+\s*(.*)$/);
  return match ? match[1] : "";
}

const FABRIC_ROWS: FabricRow[] = fabricPrices.map((row) => ({
  id: row.id,
  name: row.name,
  tags: row.tags,
  city: row.city,
  price50: parsePriceRange(row.prices.small),
  price200: parsePriceRange(row.prices.medium),
  price500: parsePriceRange(row.prices.large),
  trend: row.trend,
  trendLabel: row.trendText,
  updatedDaysAgo: parseUpdatedDays(row.updated),
  history: row.history,
}));

const MAKING_ROWS: MakingRow[] = makingCharges.map((row) => ({
  id: row.id,
  category: row.name,
  note: row.description || undefined,
  city: row.city,
  price50: parsePriceRange(row.prices.small),
  price100: parsePriceRange(row.prices.medium),
  price500: parsePriceRange(row.prices.large),
  complexity: row.complexity === "simple" ? "Simple" : "Complex",
  updatedDaysAgo: parseUpdatedDays(row.updated),
  history: row.history,
}));

const TRIM_ROWS: TrimRow[] = trimPrices.map((row) => ({
  id: row.id,
  name: row.name,
  material: row.material,
  price: parsePriceRange(row.price),
  priceUnit: parsePriceUnit(row.price),
  moq: row.moq,
  city: row.city,
  updatedDaysAgo: parseUpdatedDays(row.updated),
  history: row.history,
}));

const FABRIC_NAMES = Array.from(new Set(FABRIC_ROWS.map((row) => row.name)));
const MAKING_CATEGORIES = Array.from(new Set(MAKING_ROWS.map((row) => row.category)));
const TRIM_NAMES = Array.from(new Set(TRIM_ROWS.map((row) => row.name)));

const TABS: { id: Tab; label: string }[] = [
  { id: "fabric", label: "Fabric" },
  { id: "making", label: "Making Charges" },
  { id: "trims", label: "Trims & Accessories" },
];

const FABRIC_GRID_COLS = "2.2fr 1fr 1.1fr 1.1fr 1.1fr 1.3fr 1fr";
const MAKING_GRID_COLS = "2.2fr 1fr 1.1fr 1.1fr 1.1fr 1fr 1fr";
const TRIMS_GRID_COLS = "2fr 1.3fr 1.4fr 1fr 1fr 1fr";

function formatUpdated(daysAgo: number) {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "1 day ago";
  return `${daysAgo} days ago`;
}

function formatRange(range: PriceRange, suffix: string) {
  return `₹${range[0]}–₹${range[1]}${suffix}`;
}

function TrendBadge({ trend, label }: { trend: Trend; label: string }) {
  const config: Record<Trend, { arrow: string; className: string }> = {
    up: { arrow: "↑", className: "text-[#4ade80]" },
    down: { arrow: "↓", className: "text-[#f87171]" },
    stable: { arrow: "→", className: "text-text-secondary" },
  };
  const { arrow, className } = config[trend];
  return (
    <span className={`text-xs font-semibold ${className}`}>
      {arrow} {label}
    </span>
  );
}

function ComplexityPill({ level }: { level: MakingRow["complexity"] }) {
  const styles: Record<MakingRow["complexity"], string> = {
    Simple: "border-border-dark bg-background text-text-secondary",
    Medium: "border-secondary/40 bg-secondary/15 text-secondary",
    Complex: "border-primary/40 bg-primary/15 text-primary",
  };
  return (
    <span
      className={`inline-block w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[level]}`}
    >
      {level}
    </span>
  );
}

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function PriceHistoryChart({ data, unitLabel }: { data: number[]; unitLabel: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  const chartWidth = 600;
  const chartHeight = 120;
  const paddingLeft = 36;
  const paddingRight = 8;
  const paddingTop = 10;
  const paddingBottom = 10;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => ({
    x: paddingLeft + (index / (data.length - 1)) * plotWidth,
    y: paddingTop + plotHeight - ((value - min) / range) * plotHeight,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`;

  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const boxWidth = 78;
  const boxHeight = 22;
  const boxX = hoverPoint
    ? Math.min(Math.max(hoverPoint.x - boxWidth / 2, 2), chartWidth - boxWidth - 2)
    : 0;
  const boxY = hoverPoint ? Math.max(hoverPoint.y - boxHeight - 10, 2) : 0;

  return (
    <div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2ca50" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#f2ca50" stopOpacity={0} />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((fraction) => (
          <line
            key={fraction}
            x1={paddingLeft}
            x2={chartWidth - paddingRight}
            y1={paddingTop + plotHeight * fraction}
            y2={paddingTop + plotHeight * fraction}
            stroke="#1C3050"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        <text x={2} y={paddingTop + 4} fontSize="10" fill="#7A8FA8">
          {`₹${max}`}
        </text>
        <text x={2} y={paddingTop + plotHeight} fontSize="10" fill="#7A8FA8">
          {`₹${min}`}
        </text>

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="#f2ca50" strokeWidth={2} />

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={hoverIndex === index ? 5 : 4}
            fill="#f2ca50"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}

        {hoverPoint && (
          <g pointerEvents="none">
            <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx={4} fill="#0D1B33" stroke="#1C3050" />
            <text
              x={boxX + boxWidth / 2}
              y={boxY + boxHeight / 2 + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#f2ca50"
            >
              {`${HISTORY_MONTHS[hoverIndex as number]}: ₹${data[hoverIndex as number]}${unitLabel}`}
            </text>
          </g>
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-text-secondary" style={{ paddingLeft: 36, paddingRight: 8 }}>
        {HISTORY_MONTHS.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

function PriceHistoryPanel({
  name,
  history,
  unitLabel,
  onClose,
}: {
  name: string;
  history: number[];
  unitLabel: string;
  onClose: () => void;
}) {
  const low = Math.min(...history);
  const high = Math.max(...history);
  const current = history[history.length - 1];
  const first = history[0];
  const changePercent = ((current - first) / first) * 100;
  const isRising = changePercent > 5;
  const isFalling = changePercent < -2;

  const recommendation = isRising
    ? {
        className: "text-primary",
        text: `📈 Prices are rising. Consider placing your order for ${name} now before further increases. Up ${Math.round(changePercent)}% in the last 6 months.`,
      }
    : isFalling
      ? {
          className: "text-[#4ade80]",
          text: `📉 Prices are falling. You may benefit from waiting 2–4 weeks before placing your order for ${name}. Down ${Math.round(Math.abs(changePercent))}% in the last 6 months.`,
        }
      : {
          className: "text-text-secondary",
          text: `📊 Prices are stable for ${name}. No urgency to buy immediately. Safe to order at current rates.`,
        };

  return (
    <div
      className="rounded-b-[8px] border border-t-0 border-border-dark p-5"
      style={{ backgroundColor: "#07122a", borderLeft: "3px solid #f2ca50", marginBottom: "4px" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-white">{name} — Price History</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">Last 6 months</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close price history"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-4">
        <PriceHistoryChart data={history} unitLabel={unitLabel} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[6px] border border-border-dark bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">6M Low</p>
          <p className="mt-1 text-sm font-bold text-primary">
            ₹{low}{unitLabel}
          </p>
        </div>
        <div className="rounded-[6px] border border-border-dark bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">6M High</p>
          <p className="mt-1 text-sm font-bold text-primary">
            ₹{high}{unitLabel}
          </p>
        </div>
        <div className="rounded-[6px] border border-border-dark bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Current</p>
          <p className="mt-1 text-sm font-bold text-primary">
            ₹{current}{unitLabel}
          </p>
        </div>
        <div className="rounded-[6px] border border-border-dark bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Change</p>
          <p className={`mt-1 text-sm font-bold ${changePercent >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
            {changePercent >= 0 ? "↑" : "↓"} {Math.abs(Math.round(changePercent))}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[6px] p-3" style={{ backgroundColor: "#0D1B33", borderLeft: "2px solid #f2ca50" }}>
        <p className={`text-xs font-medium ${recommendation.className}`}>{recommendation.text}</p>
      </div>
    </div>
  );
}

function TableHeader({
  columns,
  gridTemplate,
}: {
  columns: string[];
  gridTemplate: string;
}) {
  return (
    <div
      className="grid gap-2 border-b border-border-dark bg-card px-4 py-3"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {columns.map((col) => (
        <span
          key={col}
          className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
        >
          {col}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 bg-background px-6 py-12 text-center">
      <div className="text-4xl">🔍</div>
      <p className="text-sm text-text-primary">{message}</p>
      <p className="text-xs text-text-secondary">
        Try adjusting your search or filters
      </p>
    </div>
  );
}

function FairPriceCalculator({
  items,
  getRange,
  unitLabel,
  isSeller,
}: {
  items: string[];
  getRange: (item: string) => PriceRange | null;
  unitLabel: string;
  isSeller: boolean;
}) {
  const [selectedItem, setSelectedItem] = useState(items[0] ?? "");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [result, setResult] = useState<{
    status: "fair" | "high" | "overpriced";
    message: string;
  } | null>(null);

  const handleCheck = () => {
    const range = getRange(selectedItem);
    const quoted = Number(quotedPrice);
    if (!range || !quotedPrice || Number.isNaN(quoted)) return;
    const [lo, hi] = range;
    if (isSeller) {
      if (quoted >= lo) {
        setResult({
          status: "fair",
          message: `₹${quoted} is within the competitive range of ₹${lo}–₹${hi}${unitLabel} for this item. Buyers are likely to accept this.`,
        });
      } else if (quoted >= lo * 0.75) {
        setResult({
          status: "high",
          message: `₹${quoted} is below the market range of ₹${lo}–₹${hi}${unitLabel}. You could likely charge up to ₹${lo} without losing the order.`,
        });
      } else {
        setResult({
          status: "overpriced",
          message: `₹${quoted} is significantly below market rate. The going rate is ₹${lo}–₹${hi}${unitLabel}. You may be underpricing your work.`,
        });
      }
      return;
    }
    if (quoted <= hi) {
      setResult({
        status: "fair",
        message: `₹${quoted} is within the fair range of ₹${lo}–₹${hi}${unitLabel} for this item at your quantity. This is a fair price.`,
      });
    } else if (quoted <= hi * 1.25) {
      setResult({
        status: "high",
        message: `₹${quoted} is above the fair range of ₹${lo}–₹${hi}${unitLabel}. You may be able to negotiate down to ₹${hi}.`,
      });
    } else {
      setResult({
        status: "overpriced",
        message: `₹${quoted} is significantly above market rate. Fair price is ₹${lo}–₹${hi}${unitLabel}. We recommend renegotiating.`,
      });
    }
  };

  const RESULT_STYLES = isSeller
    ? ({
        fair: {
          pill: "border-green-500/60 bg-green-500/15 text-green-400",
          label: "Competitive",
        },
        high: {
          pill: "border-yellow-500/60 bg-yellow-500/15 text-yellow-400",
          label: "Slightly Low",
        },
        overpriced: {
          pill: "border-red-500/60 bg-red-500/15 text-red-400",
          label: "Underpriced",
        },
      } as const)
    : ({
        fair: {
          pill: "border-green-500/60 bg-green-500/15 text-green-400",
          label: "Fair Price",
        },
        high: {
          pill: "border-yellow-500/60 bg-yellow-500/15 text-yellow-400",
          label: "Slightly High",
        },
        overpriced: {
          pill: "border-red-500/60 bg-red-500/15 text-red-400",
          label: "Overpriced",
        },
      } as const);

  return (
    <div className="mt-6 rounded-lg border-l-[3px] border-primary bg-card p-5">
      <p className="text-base font-bold text-white">
        {isSeller ? "💡 Am I Pricing Competitively?" : "💡 Am I Being Quoted Fairly?"}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            {isSeller ? "What are you selling?" : "What are you buying?"}
          </label>
          <select
            value={selectedItem}
            onChange={(event) => {
              setSelectedItem(event.target.value);
              setResult(null);
            }}
            className={`${SELECT_CLASSNAME} w-full`}
            style={SELECT_STYLE}
          >
            {items.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            {isSeller ? "What price are you charging?" : "What price were you quoted?"}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
              ₹
            </span>
            <input
              type="number"
              min={0}
              value={quotedPrice}
              onChange={(event) => {
                setQuotedPrice(event.target.value);
                setResult(null);
              }}
              placeholder="0"
              className="w-full rounded-[6px] border border-border-dark bg-navy py-2.5 pl-7 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheck}
        disabled={!quotedPrice}
        className={`mt-4 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors ${
          quotedPrice
            ? "cursor-pointer bg-primary text-navy"
            : "cursor-not-allowed bg-border-dark text-text-secondary"
        }`}
      >
        {isSeller ? "Check My Pricing →" : "Check Fair Price →"}
      </button>

      {result && (
        <div className="mt-4 rounded-lg border border-border-dark bg-background p-4">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${RESULT_STYLES[result.status].pill}`}
          >
            {RESULT_STYLES[result.status].label}
          </span>
          <p className="mt-2 text-sm text-text-primary">{result.message}</p>
        </div>
      )}
    </div>
  );
}

export default function FabPrice() {
  const { user } = useUser();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<Tab>("fabric");
  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedPill, setSelectedPill] = useState("All");
  const [selectedQuantity, setSelectedQuantity] = useState("Any Quantity");
  const [sortBy, setSortBy] = useState("Most Searched");

  const [alertItem, setAlertItem] = useState(FABRIC_ROWS[0].name);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertConfirmed, setAlertConfirmed] = useState(false);

  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchText("");
    setSelectedCity("All Cities");
    setSelectedPill("All");
    setSelectedQuantity("Any Quantity");
    setSortBy("Most Searched");
    setAlertConfirmed(false);
    setSelectedRow(null);
    setAlertItem(
      tab === "fabric"
        ? FABRIC_ROWS[0].name
        : tab === "making"
          ? MAKING_ROWS[0].category
          : TRIM_ROWS[0].name
    );
  };

  const cities = useMemo(() => {
    const source =
      activeTab === "fabric"
        ? FABRIC_ROWS.map((row) => row.city)
        : activeTab === "making"
          ? MAKING_ROWS.map((row) => row.city)
          : TRIM_ROWS.map((row) => row.city);
    return Array.from(new Set(source));
  }, [activeTab]);

  const pills = useMemo(() => {
    if (activeTab === "fabric") {
      return ["All", ...Array.from(new Set(FABRIC_ROWS.flatMap((row) => row.tags)))];
    }
    if (activeTab === "making") {
      return ["All", "Simple", "Medium", "Complex"];
    }
    return ["All", ...Array.from(new Set(TRIM_ROWS.map((row) => row.material)))];
  }, [activeTab]);

  const quantityOptions =
    activeTab === "fabric"
      ? ["Any Quantity", "50m", "200m", "500m+"]
      : activeTab === "making"
        ? ["Any Quantity", "50 pieces", "100 pieces", "500+ pieces"]
        : [];

  const filteredFabric = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const rows = FABRIC_ROWS.filter((row) => {
      const matchesSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.city.toLowerCase().includes(query) ||
        row.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesCity = selectedCity === "All Cities" || row.city === selectedCity;
      const matchesPill = selectedPill === "All" || row.tags.includes(selectedPill);
      return matchesSearch && matchesCity && matchesPill;
    });
    const tierKey =
      selectedQuantity === "200m" ? "price200" : selectedQuantity === "500m+" ? "price500" : "price50";
    return [...rows].sort((a, b) => {
      if (sortBy === "Price: Low to High") return a[tierKey][0] - b[tierKey][0];
      if (sortBy === "Price: High to Low") return b[tierKey][0] - a[tierKey][0];
      if (sortBy === "Recently Updated") return a.updatedDaysAgo - b.updatedDaysAgo;
      return 0;
    });
  }, [searchText, selectedCity, selectedPill, selectedQuantity, sortBy]);

  const filteredMaking = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const rows = MAKING_ROWS.filter((row) => {
      const matchesSearch =
        !query ||
        row.category.toLowerCase().includes(query) ||
        row.city.toLowerCase().includes(query);
      const matchesCity = selectedCity === "All Cities" || row.city === selectedCity;
      const matchesPill = selectedPill === "All" || row.complexity === selectedPill;
      return matchesSearch && matchesCity && matchesPill;
    });
    const tierKey =
      selectedQuantity === "100 pieces"
        ? "price100"
        : selectedQuantity === "500+ pieces"
          ? "price500"
          : "price50";
    return [...rows].sort((a, b) => {
      if (sortBy === "Price: Low to High") return a[tierKey][0] - b[tierKey][0];
      if (sortBy === "Price: High to Low") return b[tierKey][0] - a[tierKey][0];
      if (sortBy === "Recently Updated") return a.updatedDaysAgo - b.updatedDaysAgo;
      return 0;
    });
  }, [searchText, selectedCity, selectedPill, selectedQuantity, sortBy]);

  const filteredTrims = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const rows = TRIM_ROWS.filter((row) => {
      const matchesSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.city.toLowerCase().includes(query) ||
        row.material.toLowerCase().includes(query);
      const matchesCity = selectedCity === "All Cities" || row.city === selectedCity;
      const matchesPill = selectedPill === "All" || row.material === selectedPill;
      return matchesSearch && matchesCity && matchesPill;
    });
    return [...rows].sort((a, b) => {
      if (sortBy === "Price: Low to High") return a.price[0] - b.price[0];
      if (sortBy === "Price: High to Low") return b.price[0] - a.price[0];
      if (sortBy === "Recently Updated") return a.updatedDaysAgo - b.updatedDaysAgo;
      return 0;
    });
  }, [searchText, selectedCity, selectedPill, sortBy]);

  const handleSetAlert = () => {
    if (!alertPrice) return;
    setAlertConfirmed(true);
  };

  const tabsBar = (
    <div className="flex gap-6 border-b border-border-dark">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleTabChange(tab.id)}
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

  const searchAndFilters = (
    <>
      <div className="relative mt-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          🔍
        </span>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search fabric type, category, city..."
          className="w-full rounded-[6px] border border-border-dark bg-card py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
        />
      </div>

      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {pills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => setSelectedPill(pill)}
            className={`shrink-0 rounded-[20px] border px-4 py-1.5 text-xs font-medium transition-colors ${
              selectedPill === pill
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
          onChange={(event) => setSelectedCity(event.target.value)}
          className={SELECT_CLASSNAME}
          style={SELECT_STYLE}
        >
          <option>All Cities</option>
          {cities.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        {quantityOptions.length > 0 && (
          <select
            value={selectedQuantity}
            onChange={(event) => setSelectedQuantity(event.target.value)}
            className={SELECT_CLASSNAME}
            style={SELECT_STYLE}
          >
            {quantityOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        )}
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className={SELECT_CLASSNAME}
          style={SELECT_STYLE}
        >
          <option>Most Searched</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Recently Updated</option>
        </select>
      </div>
    </>
  );

  const fairPriceCalculator =
    activeTab === "fabric" ? (
      <FairPriceCalculator
        key="fabric-calc"
        items={FABRIC_NAMES}
        getRange={(item) => FABRIC_ROWS.find((row) => row.name === item)?.price200 ?? null}
        unitLabel="/m"
        isSeller={isSellerContext(user.userType, "fabric")}
      />
    ) : activeTab === "making" ? (
      <FairPriceCalculator
        key="making-calc"
        items={MAKING_CATEGORIES}
        getRange={(item) => MAKING_ROWS.find((row) => row.category === item)?.price100 ?? null}
        unitLabel="/pc"
        isSeller={isSellerContext(user.userType, "making")}
      />
    ) : (
      <FairPriceCalculator
        key="trims-calc"
        items={TRIM_NAMES}
        getRange={(item) => TRIM_ROWS.find((row) => row.name === item)?.price ?? null}
        unitLabel=""
        isSeller={isSellerContext(user.userType, "trims")}
      />
    );

  const desktopTable = (
    <div className="mt-5 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
      <div style={{ minWidth: activeTab === "trims" ? 760 : 880 }}>
        {activeTab === "fabric" && (
          <>
            <TableHeader
              columns={["Fabric Type", "City", "50m Price", "200m Price", "500m+ Price", "Trend", "Last Updated"]}
              gridTemplate={FABRIC_GRID_COLS}
            />
            {filteredFabric.map((row, index) => (
              <Fragment key={row.id}>
                <div
                  onClick={() => setSelectedRow(selectedRow === row.id ? null : row.id)}
                  className={`grid cursor-pointer items-center gap-2 border-b border-border-dark px-4 py-3.5 transition-colors ${
                    selectedRow === row.id
                      ? ""
                      : `hover:bg-border-dark ${index % 2 === 0 ? "bg-card" : "bg-background"}`
                  }`}
                  style={{
                    gridTemplateColumns: FABRIC_GRID_COLS,
                    ...(selectedRow === row.id
                      ? { backgroundColor: "#1C3050", borderLeft: "2px solid #f2ca50" }
                      : {}),
                  }}
                >
                  <div>
                    <p className="text-[13px] font-bold text-white">{row.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border-dark bg-background px-2 py-[2px] text-[10px] text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-text-primary">{row.city}</span>
                  <span className="text-[13px] font-bold text-primary">{formatRange(row.price50, "/m")}</span>
                  <span className="text-[13px] font-bold text-primary">{formatRange(row.price200, "/m")}</span>
                  <span className="text-[13px] font-bold text-primary">{formatRange(row.price500, "/m")}</span>
                  <TrendBadge trend={row.trend} label={row.trendLabel} />
                  <span className="text-[11px] text-text-secondary">{formatUpdated(row.updatedDaysAgo)}</span>
                </div>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: selectedRow === row.id ? 600 : 0 }}
                >
                  <PriceHistoryPanel
                    name={row.name}
                    history={row.history}
                    unitLabel="/m"
                    onClose={() => setSelectedRow(null)}
                  />
                </div>
              </Fragment>
            ))}
            {filteredFabric.length === 0 && <EmptyState message="No fabric types match your filters" />}
          </>
        )}

        {activeTab === "making" && (
          <>
            <TableHeader
              columns={["Category", "City", "50 Pieces", "100 Pieces", "500+ Pieces", "Complexity", "Updated"]}
              gridTemplate={MAKING_GRID_COLS}
            />
            {filteredMaking.map((row, index) => (
              <Fragment key={row.id}>
                <div
                  onClick={() => setSelectedRow(selectedRow === row.id ? null : row.id)}
                  className={`grid cursor-pointer items-center gap-2 border-b border-border-dark px-4 py-3.5 transition-colors ${
                    selectedRow === row.id
                      ? ""
                      : `hover:bg-border-dark ${index % 2 === 0 ? "bg-card" : "bg-background"}`
                  }`}
                  style={{
                    gridTemplateColumns: MAKING_GRID_COLS,
                    ...(selectedRow === row.id
                      ? { backgroundColor: "#1C3050", borderLeft: "2px solid #f2ca50" }
                      : {}),
                  }}
                >
                  <div>
                    <p className="text-[13px] font-bold text-white">{row.category}</p>
                    {row.note && <p className="mt-0.5 text-[11px] text-text-secondary">{row.note}</p>}
                  </div>
                  <span className="text-xs text-text-primary">{row.city}</span>
                  <span className="text-[13px] font-bold text-primary">{formatRange(row.price50, "/pc")}</span>
                  <span className="text-[13px] font-bold text-primary">{formatRange(row.price100, "/pc")}</span>
                  <span className="text-[13px] font-bold text-primary">{formatRange(row.price500, "/pc")}</span>
                  <ComplexityPill level={row.complexity} />
                  <span className="text-[11px] text-text-secondary">{formatUpdated(row.updatedDaysAgo)}</span>
                </div>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: selectedRow === row.id ? 600 : 0 }}
                >
                  <PriceHistoryPanel
                    name={row.category}
                    history={row.history}
                    unitLabel="/pc"
                    onClose={() => setSelectedRow(null)}
                  />
                </div>
              </Fragment>
            ))}
            {filteredMaking.length === 0 && <EmptyState message="No categories match your filters" />}
          </>
        )}

        {activeTab === "trims" && (
          <>
            <TableHeader
              columns={["Trim Type", "Material", "Price Range", "MOQ", "City", "Updated"]}
              gridTemplate={TRIMS_GRID_COLS}
            />
            {filteredTrims.map((row, index) => (
              <Fragment key={row.id}>
                <div
                  onClick={() => setSelectedRow(selectedRow === row.id ? null : row.id)}
                  className={`grid cursor-pointer items-center gap-2 border-b border-border-dark px-4 py-3.5 transition-colors ${
                    selectedRow === row.id
                      ? ""
                      : `hover:bg-border-dark ${index % 2 === 0 ? "bg-card" : "bg-background"}`
                  }`}
                  style={{
                    gridTemplateColumns: TRIMS_GRID_COLS,
                    ...(selectedRow === row.id
                      ? { backgroundColor: "#1C3050", borderLeft: "2px solid #f2ca50" }
                      : {}),
                  }}
                >
                  <span className="text-[13px] font-bold text-white">{row.name}</span>
                  <span className="text-xs text-text-primary">{row.material}</span>
                  <span className="text-[13px] font-bold text-primary">
                    {formatRange(row.price, ` ${row.priceUnit}`)}
                  </span>
                  <span className="text-xs text-text-primary">{row.moq}</span>
                  <span className="text-xs text-text-primary">{row.city}</span>
                  <span className="text-[11px] text-text-secondary">{formatUpdated(row.updatedDaysAgo)}</span>
                </div>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: selectedRow === row.id ? 600 : 0 }}
                >
                  <PriceHistoryPanel
                    name={row.name}
                    history={row.history}
                    unitLabel={` ${row.priceUnit}`}
                    onClose={() => setSelectedRow(null)}
                  />
                </div>
              </Fragment>
            ))}
            {filteredTrims.length === 0 && <EmptyState message="No trims match your filters" />}
          </>
        )}
      </div>
    </div>
  );

  const mobileCards = (
    <div className="mt-4 flex flex-col gap-3">
      {activeTab === "fabric" &&
        (filteredFabric.length > 0 ? (
          filteredFabric.map((row) => (
            <div key={row.id} className="rounded-[10px] border border-border-dark bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-bold text-white">{row.name}</p>
                  <p className="text-xs text-text-secondary">{row.city}</p>
                </div>
                <TrendBadge trend={row.trend} label={row.trendLabel} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {row.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border-dark bg-background px-2 py-[2px] text-[10px] text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-dark pt-3 text-[11px]">
                <div>
                  <p className="text-text-secondary">50m</p>
                  <p className="font-bold text-primary">{formatRange(row.price50, "/m")}</p>
                </div>
                <div>
                  <p className="text-text-secondary">200m</p>
                  <p className="font-bold text-primary">{formatRange(row.price200, "/m")}</p>
                </div>
                <div>
                  <p className="text-text-secondary">500m+</p>
                  <p className="font-bold text-primary">{formatRange(row.price500, "/m")}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-text-secondary">Updated {formatUpdated(row.updatedDaysAgo)}</p>
            </div>
          ))
        ) : (
          <EmptyState message="No fabric types match your filters" />
        ))}

      {activeTab === "making" &&
        (filteredMaking.length > 0 ? (
          filteredMaking.map((row) => (
            <div key={row.id} className="rounded-[10px] border border-border-dark bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-bold text-white">{row.category}</p>
                  {row.note && <p className="text-[11px] text-text-secondary">{row.note}</p>}
                  <p className="mt-0.5 text-xs text-text-secondary">{row.city}</p>
                </div>
                <ComplexityPill level={row.complexity} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-dark pt-3 text-[11px]">
                <div>
                  <p className="text-text-secondary">50 pcs</p>
                  <p className="font-bold text-primary">{formatRange(row.price50, "/pc")}</p>
                </div>
                <div>
                  <p className="text-text-secondary">100 pcs</p>
                  <p className="font-bold text-primary">{formatRange(row.price100, "/pc")}</p>
                </div>
                <div>
                  <p className="text-text-secondary">500+ pcs</p>
                  <p className="font-bold text-primary">{formatRange(row.price500, "/pc")}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-text-secondary">Updated {formatUpdated(row.updatedDaysAgo)}</p>
            </div>
          ))
        ) : (
          <EmptyState message="No categories match your filters" />
        ))}

      {activeTab === "trims" &&
        (filteredTrims.length > 0 ? (
          filteredTrims.map((row) => (
            <div key={row.id} className="rounded-[10px] border border-border-dark bg-card p-4">
              <p className="text-[13px] font-bold text-white">{row.name}</p>
              <p className="text-xs text-text-secondary">
                {row.material} • {row.city}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-border-dark pt-3 text-[11px]">
                <div>
                  <p className="text-text-secondary">Price</p>
                  <p className="font-bold text-primary">{formatRange(row.price, ` ${row.priceUnit}`)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">MOQ</p>
                  <p className="font-semibold text-text-primary">{row.moq}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-text-secondary">Updated {formatUpdated(row.updatedDaysAgo)}</p>
            </div>
          ))
        ) : (
          <EmptyState message="No trims match your filters" />
        ))}
    </div>
  );

  const calculatorItemsForCurrentTab =
    activeTab === "fabric"
      ? FABRIC_NAMES
      : activeTab === "making"
        ? MAKING_CATEGORIES
        : TRIM_NAMES;

  const centrePanel = (
    <>
      <TopBar
        title="FabPrice"
        subtitle="Real-time price benchmarks from verified transactions"
        rightContent={
          <span className="text-[11px] text-text-secondary">
            Last updated: Today
          </span>
        }
      />

      <div className="px-6 py-6">
        {tabsBar}
        {searchAndFilters}
        {desktopTable}
        {fairPriceCalculator}
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-base font-bold text-white">How FabPrice Works</p>
      <div className="mt-4 flex flex-col gap-4">
        {[
          {
            icon: "📊",
            title: "Built from real verified transactions",
            desc: "Every price comes from actual orders completed on FabVerify — not estimates",
          },
          {
            icon: "🔄",
            title: "Updated daily",
            desc: "Prices refresh as new transactions complete on the platform",
          },
          {
            icon: "🔒",
            title: "Anonymous",
            desc: "Individual transaction details are never shown. Only aggregated ranges.",
          },
        ].map((point) => (
          <div key={point.title} className="flex items-start gap-3">
            <span className="text-lg">{point.icon}</span>
            <div>
              <p className="text-xs font-semibold text-text-primary">{point.title}</p>
              <p className="mt-0.5 text-[11px] text-text-secondary">{point.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Set a Price Alert</p>
      <p className="mt-2 text-xs text-text-secondary">
        Get notified when prices change for items you source regularly
      </p>
      <select
        value={alertItem}
        onChange={(event) => {
          setAlertItem(event.target.value);
          setAlertConfirmed(false);
        }}
        className={`${SELECT_CLASSNAME} mt-3 w-full`}
        style={SELECT_STYLE}
      >
        {calculatorItemsForCurrentTab.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
          ₹
        </span>
        <input
          type="number"
          min={0}
          value={alertPrice}
          onChange={(event) => {
            setAlertPrice(event.target.value);
            setAlertConfirmed(false);
          }}
          placeholder="Your target price"
          className="w-full rounded-[6px] border border-border-dark bg-navy py-2.5 pl-7 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
        />
      </div>
      <button
        type="button"
        onClick={handleSetAlert}
        disabled={!alertPrice}
        className={`mt-3 w-full rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors ${
          alertPrice
            ? "cursor-pointer border-primary text-primary"
            : "cursor-not-allowed border-border-dark text-text-secondary"
        }`}
      >
        Set Alert →
      </button>
      {alertConfirmed && (
        <p className="mt-2 text-[11px] font-medium text-[#4ade80]">
          ✓ Alert set — we will notify you when {alertItem} crosses ₹{alertPrice}
        </p>
      )}

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Data Coverage</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          { value: "847", label: "Verified transactions" },
          { value: "23", label: "Fabric categories" },
          { value: "8", label: "Cities covered" },
          { value: "Daily", label: "Update frequency" },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-xl font-bold text-primary">{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-[11px] text-text-secondary">
        Data sourced from verified FabVerify transactions only. Prices vary by
        quantity, quality, and supplier relationship.
      </p>
    </>
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
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
          <button type="button" aria-label="Notifications" className="text-lg text-text-primary">
            🔔
          </button>
        </div>

        <div className="flex-1 px-4 py-5">
          <h1 className="font-display text-lg font-bold text-white">FabPrice</h1>
          <p className="text-[13px] text-text-secondary">
            Real-time price benchmarks from verified transactions
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">Last updated: Today</p>

          <div className="mt-4">{tabsBar}</div>
          {searchAndFilters}
          {mobileCards}
          {fairPriceCalculator}
        </div>

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
    </>
  );
}
