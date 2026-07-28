"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTypeGuard } from "@/app/hooks/useTypeGuard";
import { useUser } from "@/app/context/UserContext";
import { mapManufacturerRow } from "@/app/lib/mapManufacturer";
import type { ManufacturerRow } from "@/app/lib/mapManufacturer";
import { authFetch } from "@/app/lib/apiClient";

const TOTAL_STEPS = 8;

const STEP_TITLES = [
  "Basic Order Details",
  "Quantity and Size Breakdown",
  "Tech Pack",
  "Fabric and Trim Specifications",
  "Pricing and Payment Terms",
  "Delivery and Timeline",
  "Special Requirements and Notes",
  "Review Your Order",
];

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const CATEGORIES = [
  "Ethnic Wear",
  "Western Wear",
  "Knitwear",
  "Kids Wear",
  "Luxury",
  "Denim",
  "Sustainable",
];

const SEASONS = ["Summer 2026", "Winter 2026", "Summer 2027", "Custom"];

const ORDER_TYPES = ["Fresh Order", "Repeat Order", "Top-up"];

const RECENT_VENDOR_NAMES = ["Jaipur Ethnic Works", "Delhi Woven Works", "Lucknow Chikan Studio"];
const MANUFACTURER_CATEGORY_PILLS = ["Ethnic Wear", "Western Wear", "Knitwear", "Luxury", "Denim"];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function capitalizeTier(tier: string) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

type ReferenceSample = {
  id: string;
  title: string;
  approvedLabel: string;
  manufacturerId: string;
  category: string;
};

const REFERENCE_SAMPLES: ReferenceSample[] = [
  {
    id: "SB-001",
    title: "Block Print Kurta",
    approvedLabel: "Approved Jun 28",
    manufacturerId: "jaipur-ethnic-works",
    category: "Ethnic Wear",
  },
  {
    id: "SB-002",
    title: "Palazzo Set",
    approvedLabel: "Approved Jul 5",
    manufacturerId: "jaipur-ethnic-works",
    category: "Ethnic Wear",
  },
];

const FABRIC_TYPES = [
  "Cotton",
  "Silk",
  "Linen",
  "Polyester",
  "Rayon",
  "Viscose",
  "Wool",
  "Blended",
  "Other",
];

const CONNECTED_FABRIC_MILLS = ["Surat Cotton Mills", "Ahmedabad Silk House", "Kolkata Handloom"];

type TrimRow = {
  key: string;
  label: string;
  placeholder: string;
  checked: boolean;
  spec: string;
};

const DEFAULT_TRIMS: TrimRow[] = [
  { key: "mainLabel", label: "Main label", placeholder: "e.g. Woven brand label", checked: false, spec: "" },
  { key: "sizeLabel", label: "Size label", placeholder: "e.g. Printed size labels", checked: false, spec: "" },
  { key: "careLabel", label: "Care label", placeholder: "e.g. As per wash care sheet", checked: false, spec: "" },
  { key: "hangTag", label: "Hang tag", placeholder: "e.g. Gold foil brand tag", checked: false, spec: "" },
  { key: "buttons", label: "Buttons", placeholder: "e.g. 4-hole wooden 15mm", checked: false, spec: "" },
  { key: "zip", label: "Zip", placeholder: "e.g. YKK metal 20cm silver", checked: false, spec: "" },
  { key: "elastic", label: "Elastic", placeholder: "e.g. 25mm soft elastic waist", checked: false, spec: "" },
  { key: "thread", label: "Thread", placeholder: "e.g. Match fabric colour", checked: false, spec: "" },
  { key: "lining", label: "Lining", placeholder: "e.g. Satin lining ivory", checked: false, spec: "" },
  { key: "interlining", label: "Interlining", placeholder: "e.g. Medium woven", checked: false, spec: "" },
  { key: "packaging", label: "Packaging", placeholder: "e.g. Individual poly bag", checked: false, spec: "" },
];

type SupportingSheet = {
  key: string;
  icon: string;
  label: string;
  description: string;
  accept: string;
  note?: string;
};

const SUPPORTING_SHEETS: SupportingSheet[] = [
  { key: "cad", icon: "🖥", label: "CAD Sheet", description: "Technical flat sketch with measurements", accept: ".pdf,.ai,.dxf,.jpg,.jpeg" },
  { key: "grading", icon: "📐", label: "Grading Sheet", description: "Size-wise measurement specifications", accept: ".pdf,.xls,.xlsx" },
  { key: "product", icon: "📋", label: "Product Sheet", description: "Complete product specifications", accept: ".pdf,.xls,.xlsx" },
  { key: "quality", icon: "✅", label: "Quality Report Sheet", description: "AQL and quality parameters", accept: ".pdf,.xls,.xlsx" },
  { key: "trim", icon: "🧷", label: "Trim Sheet", description: "All trims — buttons, zips, labels, elastic, thread, lining", accept: ".pdf,.xls,.xlsx" },
  { key: "fabricIndent", icon: "🏭", label: "Fabric Indent Sheet", description: "Fabric requirements — type, GSM, width, quantity per colour", accept: ".pdf,.xls,.xlsx" },
  { key: "washCare", icon: "🧺", label: "Wash Care Sheet", description: "Care instructions and symbols", accept: ".pdf,.jpg,.jpeg" },
  { key: "ppm", icon: "📝", label: "PPM Report Sheet", description: "Pre-Production Meeting checklist", accept: ".pdf,.xls,.xlsx", note: "Can be filled after order confirmation" },
];

type MilestoneDef = { name: string; percent: number; min: number; max: number };

type PlacedOrderSummary = {
  orderNumber: string;
  orderId: string;
  manufacturerName: string;
  firstMilestoneAmount: number;
};

const DEFAULT_MILESTONES: MilestoneDef[] = [
  { name: "Order Confirmation", percent: 20, min: 0, max: 40 },
  { name: "Fabric In-house", percent: 10, min: 0, max: 20 },
  { name: "Production Complete", percent: 30, min: 0, max: 40 },
  { name: "QC Passed", percent: 20, min: 0, max: 30 },
  { name: "Delivery Confirmed", percent: 20, min: 0, max: 30 },
];

const BENCHMARKS: Record<string, { low: number; high: number }> = {
  "Ethnic Wear": { low: 380, high: 520 },
  "Western Wear": { low: 420, high: 650 },
  Knitwear: { low: 180, high: 320 },
  "Kids Wear": { low: 150, high: 280 },
  Luxury: { low: 900, high: 2200 },
  Denim: { low: 480, high: 750 },
  Sustainable: { low: 350, high: 600 },
};

const CITIES = ["Mumbai", "Delhi NCR", "Bangalore", "Jaipur", "Surat", "Tirupur", "Lucknow", "Ahmedabad", "Kolkata", "Chennai", "Pune", "Hyderabad"];
const STATES = ["Maharashtra", "Delhi", "Karnataka", "Rajasthan", "Gujarat", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Telangana"];

const SUSTAINABILITY_OPTIONS = [
  "Organic/natural dyes only",
  "Oeko-Tex certified fabric required",
  "GOTS certified production",
  "Fair trade compliance",
  "Carbon neutral shipping",
  "Recycled packaging",
];

type FabricEntry = {
  id: string;
  type: string;
  composition: string;
  gsm: string;
  width: string;
  widthUnit: "cm" | "inches";
  colourDescription: string;
  source: "" | "Buyer supplied" | "Manufacturer to source" | "Specific supplier";
  specificSupplier: string;
};

type ColourRow = { id: string; name: string; quantity: number };

type UploadedFile = { name: string; sizeLabel: string };

let idCounter = 0;
function uid() {
  idCounter += 1;
  return `id-${idCounter}`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function makeFabric(): FabricEntry {
  return {
    id: uid(),
    type: "",
    composition: "",
    gsm: "",
    width: "",
    widthUnit: "cm",
    colourDescription: "",
    source: "",
    specificSupplier: "",
  };
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
}

function formatShort(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRange(start: Date, end: Date) {
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()}–${end.getDate()}`;
  }
  return `${formatShort(start)} – ${formatShort(end)}`;
}

type TimelineEntry = { label: string; desc: string };

function buildTimeline(deliveryDateStr: string): TimelineEntry[] {
  if (!deliveryDateStr) return [];
  const delivery = new Date(`${deliveryDateStr}T00:00:00`);
  if (Number.isNaN(delivery.getTime())) return [];

  const dispatch = addDays(delivery, -2);
  const packingEnd = addDays(dispatch, -1);
  const packingStart = addDays(packingEnd, -2);
  const qcEnd = addDays(packingStart, -1);
  const qcStart = addDays(qcEnd, -2);
  const productionEnd = addDays(qcStart, -1);
  const productionStart = addDays(productionEnd, -13);
  const samplingEnd = addDays(productionStart, -1);
  const samplingStart = addDays(samplingEnd, -2);
  const fabricEnd = addDays(samplingStart, -1);
  const fabricStart = addDays(fabricEnd, -4);

  return [
    { label: "Today", desc: "Order confirmation" },
    { label: formatRange(fabricStart, fabricEnd), desc: "Fabric procurement" },
    { label: formatRange(samplingStart, samplingEnd), desc: "Sampling / PPM" },
    { label: formatRange(productionStart, productionEnd), desc: "Production (14 days)" },
    { label: formatRange(qcStart, qcEnd), desc: "QC inspection" },
    { label: formatRange(packingStart, packingEnd), desc: "Packing" },
    { label: formatShort(dispatch), desc: "Dispatch deadline" },
  ];
}

const INPUT = "w-full rounded-[6px] border border-border-dark bg-navy px-3.5 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary";
const LABEL = "mb-1.5 block text-xs font-medium text-text-secondary";
const CARD = "rounded-xl border border-border-dark bg-card p-5";

function pillClass(selected: boolean) {
  return `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    selected ? "border-primary bg-primary/15 text-primary" : "border-border-dark bg-navy text-text-secondary"
  }`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  );
}

export default function PlaceBulkOrder() {
  return (
    <Suspense fallback={null}>
      <PlaceBulkOrderInner />
    </Suspense>
  );
}

function PlaceBulkOrderInner() {
  const authorized = useTypeGuard("buyer");
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();

  const manufacturerParam = searchParams.get("manufacturer");
  const fromSample = searchParams.get("from") === "sample";
  const sampleIdParam = searchParams.get("sampleId");
  const initialSample = fromSample ? REFERENCE_SAMPLES.find((s) => s.id === sampleIdParam) : undefined;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderSummary | null>(null);
  const [orderError, setOrderError] = useState("");

  const [manufacturerRows, setManufacturerRows] = useState<ManufacturerRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadManufacturers() {
      try {
        const res = await fetch("/api/manufacturers");
        const { manufacturers: rows } = (await res.json()) as {
          manufacturers: ManufacturerRow[];
        };
        if (!cancelled) setManufacturerRows(rows ?? []);
      } catch (error) {
        console.error("Failed to load manufacturers:", error);
      }
    }
    loadManufacturers();
    return () => {
      cancelled = true;
    };
  }, []);

  const manufacturerList = manufacturerRows.map(mapManufacturerRow);
  const manufacturerPhoneById = Object.fromEntries(
    manufacturerRows.map((row) => [row.id, row.user?.phone ?? ""])
  );

  // Step 1
  const [manufacturerId, setManufacturerId] = useState(manufacturerParam ?? initialSample?.manufacturerId ?? "");
  const [mfrSearch, setMfrSearch] = useState("");
  const [showMfrSearch, setShowMfrSearch] = useState(false);
  const mfrFieldRef = useRef<HTMLDivElement>(null);
  const [styleName, setStyleName] = useState(initialSample?.title ?? "");
  const [styleNumber, setStyleNumber] = useState("");
  const [referenceSampleId, setReferenceSampleId] = useState(initialSample?.id ?? "");
  const [category, setCategory] = useState(initialSample?.category ?? "");
  const [season, setSeason] = useState("");
  const [customSeason, setCustomSeason] = useState("");
  const [orderType, setOrderType] = useState("");

  // Step 2
  const [totalQuantity, setTotalQuantity] = useState("");
  const [sizes, setSizes] = useState<string[]>(DEFAULT_SIZES);
  const [sizeQty, setSizeQty] = useState<Record<string, string>>({});
  const [addingSize, setAddingSize] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");
  const [numColours, setNumColours] = useState(2);
  const [colours, setColours] = useState<ColourRow[]>([
    { id: uid(), name: "", quantity: 0 },
    { id: uid(), name: "", quantity: 0 },
  ]);

  // Step 3
  const [techPack, setTechPack] = useState<UploadedFile | null>(null);
  const [sheets, setSheets] = useState<Record<string, UploadedFile | null>>({});

  // Step 4
  const [fabrics, setFabrics] = useState<FabricEntry[]>([makeFabric()]);
  const [trims, setTrims] = useState<TrimRow[]>(DEFAULT_TRIMS);
  const [trimSource, setTrimSource] = useState("");

  // Step 5
  const [pricePerPiece, setPricePerPiece] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDef[]>(DEFAULT_MILESTONES);
  const [useFabPayLater, setUseFabPayLater] = useState(false);
  const [fabPayDays, setFabPayDays] = useState(30);

  // Step 6
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [packingSpec, setPackingSpec] = useState("");
  const [shippingPreference, setShippingPreference] = useState("");

  // Step 7
  const [qualityLevel, setQualityLevel] = useState("");
  const [aqlLevel, setAqlLevel] = useState("");
  const [qcInspection, setQcInspection] = useState(false);
  const [sustainability, setSustainability] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [confidential, setConfidential] = useState(false);

  // Step 8
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    if (!showMfrSearch) return;
    function handleClickOutside(event: MouseEvent) {
      if (mfrFieldRef.current && !mfrFieldRef.current.contains(event.target as Node)) {
        setShowMfrSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMfrSearch]);

  if (!authorized) return null;

  const manufacturer = manufacturerList.find((m) => m.id === manufacturerId);

  const mfrSearchQuery = mfrSearch.trim().toLowerCase();
  const mfrSearchResults =
    mfrSearchQuery === ""
      ? []
      : manufacturerList.filter(
          (m) =>
            m.name.toLowerCase().includes(mfrSearchQuery) ||
            m.city.toLowerCase().includes(mfrSearchQuery) ||
            m.tags.some((tag) => tag.toLowerCase().includes(mfrSearchQuery))
        );

  const selectManufacturer = (id: string) => {
    setManufacturerId(id);
    setShowMfrSearch(false);
    setMfrSearch("");
  };

  const selectManufacturerByName = (name: string) => {
    const found = manufacturerList.find((m) => m.name === name);
    if (found) selectManufacturer(found.id);
  };

  const totalQty = Number(totalQuantity) || 0;
  const sizeSum = sizes.reduce((sum, size) => sum + (Number(sizeQty[size]) || 0), 0);
  const sizesMatch = totalQty > 0 && sizeSum === totalQty;

  const priceNum = Number(pricePerPiece) || 0;
  const totalValue = priceNum * totalQty;
  const benchmark = BENCHMARKS[category];
  const milestoneTotal = milestones.reduce((sum, m) => sum + m.percent, 0);
  const milestone1Amount = Math.round((totalValue * (milestones[0]?.percent ?? 0)) / 100);

  const minDeliveryDate = addDays(new Date(), 21).toISOString().slice(0, 10);
  const deliveryDateValid = deliveryDate !== "" && deliveryDate >= minDeliveryDate;

  const timeline = buildTimeline(deliveryDate);

  const eligibleForCredit =
    user.verificationTier === "silver" || user.verificationTier === "gold" || user.verificationTier === "platinum";

  const allDocs: { key: string; label: string; uploaded: boolean }[] = [
    { key: "techPack", label: "Tech Pack", uploaded: Boolean(techPack) },
    ...SUPPORTING_SHEETS.map((sheet) => ({ key: sheet.key, label: sheet.label, uploaded: Boolean(sheets[sheet.key]) })),
  ];

  const isStep1Valid =
    styleName.trim() !== "" &&
    manufacturerId !== "" &&
    category !== "" &&
    season !== "" &&
    (season !== "Custom" || customSeason.trim() !== "") &&
    orderType !== "";

  const isStep2Valid = totalQty > 0 && sizesMatch && colours.length > 0 && colours.every((c) => c.name.trim() !== "");
  const isStep3Valid = Boolean(techPack);
  const isStep4Valid = fabrics[0]?.type !== "" && fabrics[0]?.composition.trim() !== "";
  const isStep5Valid = priceNum > 0 && milestoneTotal === 100;
  const isStep6Valid =
    deliveryDateValid && deliveryAddress.trim() !== "" && deliveryCity !== "" && deliveryState !== "";
  const isStep7Valid = true;
  const isStep8Valid = declared;

  const isStepValid = [
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    isStep5Valid,
    isStep6Valid,
    isStep7Valid,
    isStep8Valid,
  ][currentStep - 1];

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));
  const handleContinue = () => {
    if (!isStepValid) return;
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const updateSizeQty = (size: string, value: string) => setSizeQty((cur) => ({ ...cur, [size]: value }));

  const commitNewSize = () => {
    const trimmed = newSizeName.trim().toUpperCase();
    if (trimmed && !sizes.includes(trimmed)) setSizes((cur) => [...cur, trimmed]);
    setNewSizeName("");
    setAddingSize(false);
  };

  const setColourCount = (count: number) => {
    const clamped = Math.max(1, Math.min(10, count));
    setNumColours(clamped);
    setColours((cur) => {
      const next = [...cur];
      while (next.length < clamped) next.push({ id: uid(), name: "", quantity: 0 });
      while (next.length > clamped) next.pop();
      return next;
    });
  };

  const updateColour = (id: string, patch: Partial<ColourRow>) =>
    setColours((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const autoSplitColours = () => {
    if (colours.length === 0 || totalQty <= 0) return;
    const base = Math.floor(totalQty / colours.length);
    const remainder = totalQty - base * colours.length;
    setColours((cur) => cur.map((c, i) => ({ ...c, quantity: base + (i === cur.length - 1 ? remainder : 0) })));
  };

  const handleSheetUpload = (key: string, file: File | undefined) => {
    if (!file) return;
    setSheets((cur) => ({ ...cur, [key]: { name: file.name, sizeLabel: formatFileSize(file.size) } }));
  };

  const updateFabric = (id: string, patch: Partial<FabricEntry>) =>
    setFabrics((cur) => cur.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addFabric = () => setFabrics((cur) => [...cur, makeFabric()]);
  const removeFabric = (id: string) => setFabrics((cur) => (cur.length > 1 ? cur.filter((f) => f.id !== id) : cur));

  const toggleTrim = (key: string) =>
    setTrims((cur) => cur.map((t) => (t.key === key ? { ...t, checked: !t.checked } : t)));
  const updateTrimSpec = (key: string, spec: string) =>
    setTrims((cur) => cur.map((t) => (t.key === key ? { ...t, spec } : t)));

  const updateMilestone = (index: number, percent: number) =>
    setMilestones((cur) => cur.map((m, i) => (i === index ? { ...m, percent } : m)));
  const resetMilestones = () => setMilestones(DEFAULT_MILESTONES);

  const toggleSustainability = (option: string) =>
    setSustainability((cur) => (cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option]));

  const resetWizard = () => {
    idCounter = 0;
    setCurrentStep(1);
    setPlacedOrder(null);
    setManufacturerId("");
    setMfrSearch("");
    setShowMfrSearch(false);
    setStyleName("");
    setStyleNumber("");
    setReferenceSampleId("");
    setCategory("");
    setSeason("");
    setCustomSeason("");
    setOrderType("");
    setTotalQuantity("");
    setSizes(DEFAULT_SIZES);
    setSizeQty({});
    setNumColours(2);
    setColours([
      { id: uid(), name: "", quantity: 0 },
      { id: uid(), name: "", quantity: 0 },
    ]);
    setTechPack(null);
    setSheets({});
    setFabrics([makeFabric()]);
    setTrims(DEFAULT_TRIMS);
    setTrimSource("");
    setPricePerPiece("");
    setMilestones(DEFAULT_MILESTONES);
    setUseFabPayLater(false);
    setDeliveryDate("");
    setDeliveryAddress("");
    setDeliveryCity("");
    setDeliveryState("");
    setPackingSpec("");
    setShippingPreference("");
    setQualityLevel("");
    setAqlLevel("");
    setQcInspection(false);
    setSustainability([]);
    setSpecialInstructions("");
    setConfidential(false);
    setDeclared(false);
  };

  const placeOrder = async () => {
    if (!isStep8Valid || !manufacturer) return;

    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) {
      router.push("/login");
      return;
    }

    const manufacturerPhone = manufacturerPhoneById[manufacturer.id];
    if (!manufacturerPhone) {
      setOrderError("This manufacturer can't be reached right now. Please choose another.");
      return;
    }

    setOrderError("");
    setIsSubmitting(true);

    try {
      // No buyerPhone: the server takes buyer_id from the verified session,
      // so sending it would be ignored at best and misleading at worst.
      // manufacturerPhone stays — that is a real counterparty, not us.
      const res = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturerPhone,
          styleName,
          quantity: totalQty,
          pricePerPiece: priceNum,
          deliveryDate,
          milestoneSchedule: milestones.map((m) => ({ name: m.name, pct: m.percent })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setPlacedOrder({
        orderNumber: data.orderNumber,
        orderId: data.order.id,
        manufacturerName: manufacturer.name,
        firstMilestoneAmount: Math.round((totalValue * (milestones[0]?.percent ?? 0)) / 100),
      });
    } catch (error) {
      setOrderError(
        error instanceof Error ? error.message : "Failed to place order. Please try again."
      );
    }

    setIsSubmitting(false);
  };

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  const pageShell = (children: React.ReactNode) => (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#07122a",
        backgroundImage:
          "linear-gradient(to right, rgba(212,175,55,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,175,55,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        overflowY: "auto",
        paddingBottom: "60px",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px" }}>{children}</div>
    </div>
  );

  if (isSubmitting) {
    return pageShell(
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-6 text-sm font-semibold text-text-primary">Placing your order...</p>
      </div>
    );
  }

  if (placedOrder) {
    return pageShell(
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="mt-6 font-display text-2xl font-bold text-white">Order Placed Successfully!</h1>
        <p className="mt-4 text-lg font-bold text-primary">{placedOrder.orderNumber}</p>
        <p className="mt-4 max-w-[400px] text-[13px] text-text-secondary">
          {placedOrder.manufacturerName} has been notified and has 24 hours to confirm your order. You will receive a
          WhatsApp notification when they respond.
        </p>

        <div className="mt-8 w-full max-w-[420px] rounded-xl border border-border-dark bg-card p-5 text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-secondary">What Happens Next</p>
          <ul className="flex flex-col gap-3 text-sm text-text-secondary">
            <li>
              <span className="font-semibold text-primary">Now</span> — Manufacturer notified
            </li>
            <li>
              <span className="font-semibold text-primary">Within 24h</span> — Manufacturer confirms
            </li>
            <li>
              <span className="font-semibold text-primary">On confirmation</span> — ₹
              {placedOrder.firstMilestoneAmount.toLocaleString("en-IN")} held in escrow
            </li>
            <li>Production begins per T&amp;A plan</li>
            <li>You track progress in real time</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(`/brand/orders/${placedOrder.orderId}`)}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
          >
            Track This Order →
          </button>
          <button
            type="button"
            onClick={() => {
              resetWizard();
              router.replace("/brand/orders/new");
            }}
            className="rounded-lg border border-border-dark px-6 py-3 text-sm font-semibold text-text-secondary"
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  const stepFooter = (
    <div className="mt-8 flex items-center justify-between">
      <button
        type="button"
        onClick={handleBack}
        disabled={currentStep === 1}
        className={`text-sm font-medium ${currentStep === 1 ? "invisible" : "text-text-secondary"}`}
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={handleContinue}
        disabled={!isStepValid}
        className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
          isStepValid ? "cursor-pointer bg-primary text-navy" : "cursor-not-allowed bg-border-dark text-text-secondary"
        }`}
      >
        Continue →
      </button>
    </div>
  );

  return pageShell(
    <>
      <div className="flex items-center gap-1 font-display text-lg font-bold">
        <span>🧵</span>
        <span className="text-white">Fab</span>
        <span className="text-primary">Verify</span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="font-display text-[22px] font-bold text-white">Place Bulk Order</h1>
        <span className="text-[13px] text-text-secondary">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border-dark">
        <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-white">{STEP_TITLES[currentStep - 1]}</h2>

        {currentStep === 1 && (
          <div className="mt-6 flex flex-col gap-5">
            <Field label="Style name">
              <input
                className={INPUT}
                placeholder="e.g. Block Print Kurta SS26"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
              />
            </Field>

            <Field label="Style number / internal code (optional)">
              <input
                className={INPUT}
                placeholder="e.g. SS26-BPK-001"
                value={styleNumber}
                onChange={(e) => setStyleNumber(e.target.value)}
              />
            </Field>

            <div>
              <label className={LABEL}>Select Manufacturer</label>
              {manufacturer ? (
                <div
                  className="flex items-center gap-3 rounded-lg border border-primary p-3"
                  style={{ backgroundColor: "#07122a" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {initials(manufacturer.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{manufacturer.name}</p>
                    <p className="text-xs text-text-secondary">
                      {manufacturer.city} • {capitalizeTier(manufacturer.tier)} Verified
                    </p>
                    <p className="text-[11px] font-semibold text-primary">⭐ {manufacturer.fabScore}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManufacturerId("")}
                    className="shrink-0 text-xs text-text-secondary"
                  >
                    Change ✕
                  </button>
                </div>
              ) : (
                <div ref={mfrFieldRef} className="relative">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                      🔍
                    </span>
                    <input
                      value={mfrSearch}
                      onChange={(e) => setMfrSearch(e.target.value)}
                      onFocus={() => setShowMfrSearch(true)}
                      placeholder="Search by name, city, category..."
                      className="w-full rounded-lg border border-border-dark bg-navy py-3 pl-9 pr-3.5 text-sm text-white outline-none focus:border-primary"
                      style={{ backgroundColor: "#07122a", borderColor: "#1C3050" }}
                    />
                  </div>

                  {showMfrSearch && (
                    <div
                      className="absolute z-[100] mt-1.5 w-full overflow-y-auto rounded-lg border"
                      style={{
                        backgroundColor: "#0D1B33",
                        borderColor: "#1C3050",
                        maxHeight: "280px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                      }}
                    >
                      {mfrSearchQuery === "" ? (
                        <div className="p-3.5">
                          <p className="mb-2 text-[11px] text-text-secondary">Your recent vendors</p>
                          <div className="flex flex-wrap gap-2">
                            {RECENT_VENDOR_NAMES.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => selectManufacturerByName(name)}
                                className="rounded-full border border-border-dark bg-navy px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
                              >
                                {name} ×
                              </button>
                            ))}
                          </div>

                          <p className="mb-2 mt-4 text-[11px] text-text-secondary">Filter by category</p>
                          <div className="flex flex-wrap gap-2">
                            {MANUFACTURER_CATEGORY_PILLS.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setMfrSearch(cat)}
                                className="rounded-full border border-border-dark bg-navy px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : mfrSearchResults.length > 0 ? (
                        mfrSearchResults.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => selectManufacturer(m.id)}
                            className="flex cursor-pointer items-center gap-2.5 border-b p-3 last:border-b-0 hover:bg-primary/5"
                            style={{ borderColor: "#1C3050" }}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
                              {initials(m.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-white">{m.name}</p>
                              <p className="truncate text-[11px] text-text-secondary">
                                {m.city} • {m.tags[0]}
                              </p>
                            </div>
                            <p className="shrink-0 text-[11px] font-semibold text-primary">
                              ⭐ {m.fabScore} · {capitalizeTier(m.tier)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-[13px] text-text-secondary">
                            No manufacturers found for &lsquo;{mfrSearch}&rsquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => router.push("/brand/manufacturers")}
                            className="mt-2 text-xs font-semibold text-primary"
                          >
                            Browse all manufacturers →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Field label="Reference sample — which approved sample is this bulk order based on?">
              <select
                className={INPUT}
                value={referenceSampleId}
                onChange={(e) => setReferenceSampleId(e.target.value)}
              >
                <option value="">No sample — new style</option>
                {REFERENCE_SAMPLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.title} — {s.approvedLabel}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Category">
              <select className={INPUT} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Season">
              <select className={INPUT} value={season} onChange={(e) => setSeason(e.target.value)}>
                <option value="">Select season...</option>
                {SEASONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {season === "Custom" && (
                <input
                  className={`${INPUT} mt-2`}
                  placeholder="Describe the season/collection"
                  value={customSeason}
                  onChange={(e) => setCustomSeason(e.target.value)}
                />
              )}
            </Field>

            <Field label="Order type">
              <div className="flex flex-wrap gap-2">
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    className={pillClass(orderType === type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {currentStep === 2 && (
          <div className="mt-6 flex flex-col gap-6">
            <Field label="Total pieces">
              <input
                type="number"
                min={1}
                className={`${INPUT} font-display text-2xl font-bold`}
                placeholder="500"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
              />
            </Field>

            <div>
              <p className="text-sm font-bold text-white">Size Ratio</p>
              <p className="mt-1 text-[13px] text-text-secondary">
                Break down your total quantity by size
              </p>

              <div className="mt-3 overflow-x-auto">
                <div className="flex gap-2" style={{ minWidth: `${sizes.length * 76}px` }}>
                  {sizes.map((size) => (
                    <div key={size} className="flex-1 text-center">
                      <p className="mb-1 text-xs font-semibold text-text-secondary">{size}</p>
                      <input
                        type="number"
                        min={0}
                        value={sizeQty[size] ?? ""}
                        onChange={(e) => updateSizeQty(size, e.target.value)}
                        className="w-full rounded-[6px] border border-border-dark bg-background px-2 py-2 text-center text-sm text-white outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className={`text-sm font-semibold ${sizesMatch ? "text-green-400" : "text-red-400"}`}>
                  Total: {sizeSum} pieces {totalQty > 0 ? `(target ${totalQty})` : ""}
                </p>
                {addingSize ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={newSizeName}
                      onChange={(e) => setNewSizeName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commitNewSize()}
                      placeholder="e.g. 3XL"
                      className="w-24 rounded-[6px] border border-border-dark bg-background px-2 py-1 text-xs text-white outline-none focus:border-primary"
                    />
                    <button type="button" onClick={commitNewSize} className="text-xs font-semibold text-primary">
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingSize(true)}
                    className="text-xs font-semibold text-primary"
                  >
                    + Add custom size
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Colours</p>
                <button type="button" onClick={autoSplitColours} className="text-xs font-semibold text-primary">
                  Auto-split equally
                </button>
              </div>
              <p className="mt-1 text-[13px] text-text-secondary">How many colours for this style?</p>
              <input
                type="number"
                min={1}
                max={10}
                value={numColours}
                onChange={(e) => setColourCount(Number(e.target.value) || 1)}
                className="mt-2 w-24 rounded-[6px] border border-border-dark bg-navy px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />

              <div className="mt-3 flex flex-col gap-2">
                {colours.map((colour, i) => (
                  <div key={colour.id} className="flex gap-2">
                    <input
                      className={INPUT}
                      placeholder={`Colour ${i + 1} name`}
                      value={colour.name}
                      onChange={(e) => updateColour(colour.id, { name: e.target.value })}
                    />
                    <input
                      type="number"
                      min={0}
                      className={`${INPUT} w-32`}
                      placeholder="Quantity"
                      value={colour.quantity || ""}
                      onChange={(e) => updateColour(colour.id, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="mt-6 flex flex-col gap-6">
            <div>
              <p className="mb-3 text-[13px] text-text-secondary">
                Upload your complete technical specification for this style
              </p>
              <UploadBox
                icon="📄"
                label="Upload Tech Pack"
                description="PDF or ZIP file — max 25MB"
                accept=".pdf,.zip"
                file={techPack}
                onFile={(file) => file && setTechPack({ name: file.name, sizeLabel: formatFileSize(file.size) })}
                large
              />
            </div>

            <div>
              <p className="text-sm font-bold text-white">Supporting Documents</p>
              <p className="mt-1 text-[13px] text-text-secondary">Upload all relevant specification sheets</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SUPPORTING_SHEETS.map((sheet) => (
                  <UploadBox
                    key={sheet.key}
                    icon={sheet.icon}
                    label={sheet.label}
                    description={sheet.description}
                    accept={sheet.accept}
                    note={sheet.note}
                    file={sheets[sheet.key] ?? null}
                    onFile={(file) => handleSheetUpload(sheet.key, file)}
                  />
                ))}
              </div>
            </div>

            <div className={`${CARD} border-l-4 border-primary`}>
              <p className="text-xs text-text-secondary">
                Tech Pack is required. All other sheets are strongly recommended. Incomplete specifications lead to
                quality issues and delays.
              </p>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="mt-6 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              {fabrics.map((fabric, index) => (
                <div key={fabric.id} className={CARD}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">
                      {index === 0 ? "Primary Fabric" : `Additional Fabric ${index}`}
                    </p>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeFabric(fabric.id)}
                        className="text-xs text-text-secondary"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Fabric type">
                      <select
                        className={INPUT}
                        value={fabric.type}
                        onChange={(e) => updateFabric(fabric.id, { type: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {FABRIC_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Composition">
                      <input
                        className={INPUT}
                        placeholder="e.g. 100% Cotton or 60% Cotton 40% Poly"
                        value={fabric.composition}
                        onChange={(e) => updateFabric(fabric.id, { composition: e.target.value })}
                      />
                    </Field>
                    <Field label="GSM">
                      <input
                        type="number"
                        className={INPUT}
                        value={fabric.gsm}
                        onChange={(e) => updateFabric(fabric.id, { gsm: e.target.value })}
                      />
                    </Field>
                    <Field label="Width">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className={INPUT}
                          value={fabric.width}
                          onChange={(e) => updateFabric(fabric.id, { width: e.target.value })}
                        />
                        <div className="flex shrink-0 gap-1">
                          {(["cm", "inches"] as const).map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => updateFabric(fabric.id, { widthUnit: unit })}
                              className={pillClass(fabric.widthUnit === unit)}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Colour/print description">
                        <textarea
                          rows={2}
                          className={INPUT}
                          placeholder="e.g. Hand block print on white base"
                          value={fabric.colourDescription}
                          onChange={(e) => updateFabric(fabric.id, { colourDescription: e.target.value })}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Fabric source">
                        <div className="flex flex-wrap gap-2">
                          {(["Buyer supplied", "Manufacturer to source", "Specific supplier"] as const).map(
                            (option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateFabric(fabric.id, { source: option })}
                                className={pillClass(fabric.source === option)}
                              >
                                {option}
                              </button>
                            )
                          )}
                        </div>
                        {fabric.source === "Specific supplier" && (
                          <select
                            className={`${INPUT} mt-2`}
                            value={fabric.specificSupplier}
                            onChange={(e) => updateFabric(fabric.id, { specificSupplier: e.target.value })}
                          >
                            <option value="">Select fabric mill...</option>
                            {CONNECTED_FABRIC_MILLS.map((mill) => (
                              <option key={mill}>{mill}</option>
                            ))}
                          </select>
                        )}
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFabric} className="self-start text-sm font-semibold text-primary">
                + Add another fabric
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-white">Trims Required</p>
              <div className="mt-3 flex flex-col gap-2">
                {trims.map((trim) => (
                  <div
                    key={trim.key}
                    className="flex flex-col gap-2 rounded-[8px] border border-border-dark bg-card p-3 sm:flex-row sm:items-center"
                  >
                    <label className="flex w-40 shrink-0 items-center gap-2 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={trim.checked}
                        onChange={() => toggleTrim(trim.key)}
                        className="h-4 w-4 accent-primary"
                      />
                      {trim.label}
                    </label>
                    <input
                      className={INPUT}
                      placeholder={trim.placeholder}
                      value={trim.spec}
                      onChange={(e) => updateTrimSpec(trim.key, e.target.value)}
                      disabled={!trim.checked}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className={LABEL}>Trim source</p>
                <div className="flex flex-wrap gap-2">
                  {["Buyer supplied", "Manufacturer to source"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTrimSource(option)}
                      className={pillClass(trimSource === option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="mt-6 flex flex-col gap-6">
            <Field label="Agreed price per piece">
              <div className="flex items-center rounded-[6px] border border-border-dark bg-navy px-3.5 focus-within:border-primary">
                <span className="text-lg font-bold text-text-secondary">₹</span>
                <input
                  type="number"
                  min={0}
                  value={pricePerPiece}
                  onChange={(e) => setPricePerPiece(e.target.value)}
                  className="w-full bg-transparent py-2.5 pl-2 text-lg font-bold text-white outline-none"
                  placeholder="0"
                />
              </div>
            </Field>

            {benchmark && (
              <div className={`${CARD} border-l-4 border-primary`}>
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                  FabPrice benchmark for this category
                </p>
                <p className="mt-2 text-sm text-white">
                  {category}: ₹{benchmark.low} — ₹{benchmark.high}/piece
                </p>
                {priceNum > 0 &&
                  (() => {
                    const withinRange = priceNum >= benchmark.low && priceNum <= benchmark.high;
                    const nearRange =
                      !withinRange &&
                      priceNum >= benchmark.low * 0.85 &&
                      priceNum <= benchmark.high * 1.15;
                    const color = withinRange ? "text-green-400" : nearRange ? "text-amber-400" : "text-red-400";
                    const message = withinRange
                      ? "✓ Within range"
                      : nearRange
                        ? "⚠ Slightly outside range"
                        : "✕ Significantly outside range";
                    return (
                      <p className={`mt-1 text-sm font-semibold ${color}`}>
                        Your price: ₹{priceNum}/piece {message}
                      </p>
                    );
                  })()}
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Total order value</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary">
                ₹{totalValue.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Escrow Milestone Schedule</p>
                <button type="button" onClick={resetMilestones} className="text-xs font-semibold text-text-secondary">
                  Reset to default
                </button>
              </div>
              <p className="mt-1 text-[13px] text-text-secondary">How payments release at each milestone</p>

              <div className="mt-3 flex flex-col gap-4">
                {milestones.map((m, i) => {
                  const amount = Math.round((totalValue * m.percent) / 100);
                  return (
                    <div key={m.name} className={CARD}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-white">{m.name}</span>
                        <span className="font-semibold text-primary">
                          {m.percent}% — ₹{amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={m.min}
                        max={m.max}
                        value={m.percent}
                        onChange={(e) => updateMilestone(i, Number(e.target.value))}
                        className="mt-3 w-full accent-primary"
                      />
                    </div>
                  );
                })}
              </div>

              <p className={`mt-3 text-sm font-bold ${milestoneTotal === 100 ? "text-green-400" : "text-red-400"}`}>
                Total: {milestoneTotal}% {milestoneTotal === 100 ? "✓" : "(must equal 100%)"}
              </p>
            </div>

            <div className={`${CARD} border-l-4 border-primary`}>
              <p className="text-xs text-text-secondary">
                The first milestone payment of ₹{milestone1Amount.toLocaleString("en-IN")} will be held in FabVerify
                escrow before the manufacturer begins production. Your payment is protected.
              </p>
            </div>

            {eligibleForCredit && (
              <div className={CARD}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-white">💳 Use FabPay Later</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useFabPayLater}
                    onClick={() => setUseFabPayLater((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      useFabPayLater ? "bg-primary" : "bg-border-dark"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        useFabPayLater ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Pay in 30 / 60 / 90 days. Manufacturer gets paid immediately.
                </p>
                {useFabPayLater && (
                  <div className="mt-3 flex gap-2">
                    {[30, 60, 90].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setFabPayDays(days)}
                        className={pillClass(fabPayDays === days)}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="mt-6 flex flex-col gap-5">
            <Field label="Target delivery date (minimum 21 days ahead)">
              <input
                type="date"
                min={minDeliveryDate}
                className={INPUT}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
              {deliveryDate !== "" && !deliveryDateValid && (
                <p className="mt-1 text-xs text-red-400">Delivery date must be at least 21 days from today</p>
              )}
            </Field>

            <Field label="Delivery address">
              <input
                className={INPUT}
                placeholder="Where should the goods arrive?"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City">
                <select className={INPUT} value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)}>
                  <option value="">Select city...</option>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="State">
                <select className={INPUT} value={deliveryState} onChange={(e) => setDeliveryState(e.target.value)}>
                  <option value="">Select state...</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Packing specifications — how should the garments be packed?">
              <textarea
                rows={3}
                className={INPUT}
                placeholder="e.g. Individually poly-bagged, 12 pieces per carton, cartons marked with style/colour/size"
                value={packingSpec}
                onChange={(e) => setPackingSpec(e.target.value)}
              />
            </Field>

            <Field label="Shipping preference">
              <div className="flex flex-wrap gap-2">
                {["Manufacturer arranges", "I will arrange", "FabVerify courier"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setShippingPreference(option)}
                    className={pillClass(shippingPreference === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {shippingPreference === "FabVerify courier" && (
                <p className="mt-2 text-xs text-text-secondary">
                  Estimated shipping: ₹8,500 for {totalQty || 500} pieces
                </p>
              )}
            </Field>

            {timeline.length > 0 && (
              <div>
                <p className="text-sm font-bold text-white">Estimated production timeline</p>
                <div className="mt-3 flex flex-col">
                  {timeline.map((entry, i) => (
                    <div key={entry.desc} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 shrink-0 rounded-full bg-primary" />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-primary/40" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-semibold text-primary">{entry.label}</p>
                        <p className="text-[12px] text-text-secondary">{entry.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] italic text-text-secondary">
                  This T&amp;A will be shared with the manufacturer on order confirmation
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 7 && (
          <div className="mt-6 flex flex-col gap-6">
            <Field label="Quality level">
              <div className="flex flex-wrap gap-2">
                {["Standard", "Premium", "Export Quality"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setQualityLevel(level)}
                    className={pillClass(qualityLevel === level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="AQL level">
              <select className={INPUT} value={aqlLevel} onChange={(e) => setAqlLevel(e.target.value)}>
                <option value="">Select AQL level...</option>
                <option>AQL 1.0</option>
                <option>AQL 2.5</option>
                <option>AQL 4.0</option>
              </select>
              <p className="mt-1 text-[11px] text-text-secondary">AQL 2.5 is industry standard</p>
            </Field>

            <div className={CARD}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Book QC Inspector</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={qcInspection}
                  onClick={() => setQcInspection((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    qcInspection ? "bg-primary" : "bg-border-dark"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      qcInspection ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {qcInspection && (
                <p className="mt-2 text-xs text-text-secondary">
                  FabVerify will assign a verified QC inspector for pre-dispatch inspection
                </p>
              )}
            </div>

            <div>
              <p className={LABEL}>Sustainability requirements</p>
              <div className="flex flex-col gap-2">
                {SUSTAINABILITY_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={sustainability.includes(option)}
                      onChange={() => toggleSustainability(option)}
                      className="h-4 w-4 accent-primary"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <Field label="Special instructions">
              <textarea
                rows={4}
                className={INPUT}
                placeholder="Any other specific requirements, notes for the manufacturer, or special handling instructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </Field>

            <div className={CARD}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Mark as confidential</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={confidential}
                  onClick={() => setConfidential((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    confidential ? "bg-primary" : "bg-border-dark"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      confidential ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-text-secondary">
                Style details will not be visible to other buyers on the platform
              </p>
            </div>
          </div>
        )}

        {currentStep === 8 && (
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-[13px] text-text-secondary">Check everything before placing</p>

            <div className="rounded-xl border border-primary bg-card p-6">
              <dl className="flex flex-col gap-2 text-sm">
                <Row label="Style" value={styleName || "—"} />
                <Row label="Manufacturer" value={manufacturer?.name ?? "—"} />
                <Row label="Total Pieces" value={`${totalQty}`} />
                <Row
                  label="Size Ratio"
                  value={sizes
                    .filter((s) => Number(sizeQty[s]) > 0)
                    .map((s) => `${s}:${sizeQty[s]}`)
                    .join(" ") || "—"}
                />
                <Row
                  label="Colours"
                  value={`${colours.length} (${colours.map((c) => `${c.name || "—"} ${c.quantity}`).join(", ")})`}
                />
                <Row label="Price/piece" value={`₹${priceNum.toLocaleString("en-IN")}`} />
                <Row label="Total Value" value={`₹${totalValue.toLocaleString("en-IN")}`} />
                <Row
                  label="Delivery"
                  value={
                    deliveryDate
                      ? new Date(`${deliveryDate}T00:00:00`).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
              </dl>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">Documents Uploaded</p>
              <div className="flex flex-col gap-1.5">
                {allDocs.map((doc) => (
                  <p key={doc.key} className="text-sm">
                    {doc.uploaded ? (
                      <span className="text-green-400">✅ {doc.label}</span>
                    ) : (
                      <span className="text-amber-400">
                        ⚠ {doc.label} — not uploaded{" "}
                        <span className="text-[11px] text-text-secondary">(Can be added after confirmation)</span>
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">Payment Schedule</p>
              <div className="flex flex-col gap-1.5">
                {milestones.map((m) => (
                  <div key={m.name} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{m.name}</span>
                    <span className="text-text-primary">
                      {m.percent}% — ₹{Math.round((totalValue * m.percent) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${CARD} border-l-4 border-primary`}>
              <p className="text-xs text-text-secondary">
                On placing this order ₹{milestone1Amount.toLocaleString("en-IN")} ({milestones[0]?.percent ?? 0}%)
                will be held in FabVerify escrow. The manufacturer cannot access this until they confirm the order
                and begin production.
              </p>
            </div>

            {timeline.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">T&amp;A Timeline</p>
                <div className="flex flex-wrap gap-2">
                  {timeline.map((entry) => (
                    <span
                      key={entry.desc}
                      className="rounded-full border border-border-dark bg-card px-3 py-1 text-[11px] text-text-secondary"
                    >
                      {entry.label} — {entry.desc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-start gap-3 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={declared}
                onChange={(e) => setDeclared(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              I confirm all specifications are correct and I authorise FabVerify to hold ₹
              {milestone1Amount.toLocaleString("en-IN")} in escrow on my behalf upon order placement.
            </label>

            {orderError && (
              <p className="text-[13px] text-red-400">{orderError}</p>
            )}

            <div className="flex items-center justify-between">
              <button type="button" onClick={handleBack} className="rounded-lg border border-border-dark px-6 py-3 text-sm font-semibold text-text-secondary">
                ← Edit Order
              </button>
              <button
                type="button"
                onClick={() => void placeOrder()}
                disabled={!isStep8Valid}
                className={`rounded-lg px-8 py-3.5 text-base font-bold transition-colors ${
                  isStep8Valid ? "cursor-pointer bg-primary text-navy" : "cursor-not-allowed bg-border-dark text-text-secondary"
                }`}
              >
                Place Order →
              </button>
            </div>
          </div>
        )}

        {currentStep < 8 && stepFooter}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-right text-text-primary">{value}</dd>
    </div>
  );
}

function UploadBox({
  icon,
  label,
  description,
  accept,
  note,
  file,
  onFile,
  large,
}: {
  icon: string;
  label: string;
  description: string;
  accept: string;
  note?: string;
  file: UploadedFile | null;
  onFile: (file: File | undefined) => void;
  large?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border border-dashed ${
        file ? "border-green-500/60" : "border-primary/50"
      } bg-card text-center transition-colors hover:border-primary ${large ? "p-8" : "p-4"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {!file ? (
        <>
          <div className={large ? "text-3xl" : "text-2xl"}>{icon}</div>
          <p className={`mt-2 font-bold text-white ${large ? "text-base" : "text-sm"}`}>{label}</p>
          <p className="mt-1 text-xs text-text-secondary">{description}</p>
          {note && <p className="mt-1 text-[11px] italic text-text-secondary">{note}</p>}
        </>
      ) : (
        <>
          <div className={large ? "text-3xl" : "text-2xl"}>✅</div>
          <p className={`mt-2 truncate font-bold text-white ${large ? "text-base" : "text-sm"}`}>{file.name}</p>
          <p className="mt-1 text-xs text-text-secondary">{file.sizeLabel}</p>
          <span className="mt-1.5 inline-block text-xs font-semibold text-primary">Change</span>
        </>
      )}
    </div>
  );
}
