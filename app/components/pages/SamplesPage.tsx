"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import TopBar from "../TopBar";
import { useUser } from "../../context/UserContext";
import screenConfig from "../../config/screens";
import type { SampleBriefRow } from "../../lib/mapSampleBrief";
import { authFetch } from "../../lib/apiClient";

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "🔍", label: "Discover", href: "/manufacturers" },
  { icon: "👔", label: "Merch", href: "/fabmerch" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

const INPUT_CLASSNAME =
  "w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary";
const LABEL_CLASSNAME = "mb-1.5 block text-xs font-medium text-text-secondary";
const SELECT_CLASSNAME = INPUT_CLASSNAME;
const CUSTOM_INPUT_CLASSNAME =
  "field-fade-in mt-2 w-full rounded-[6px] border border-border-dark bg-background px-3.5 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary";

const pillClassName = (selected: boolean) =>
  `cursor-pointer rounded-[20px] border px-2.5 py-1 text-[11px] font-medium transition-colors ${
    selected
      ? "border-primary bg-primary/15 text-primary"
      : "border-border-dark bg-background text-text-secondary hover:border-primary/50"
  }`;

const HINT_CLASSNAME = "mt-1.5 text-[11px] italic text-text-secondary";
const DROPDOWN_HINT = "Can't find your type? Select 'Other' to specify your own";
const PILL_HINT = "Don't see your option? Click '+ Add custom' to add your own";
const SUGGESTION_HINT = "Click a suggestion or type your own below";

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={LABEL_CLASSNAME}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASSNAME}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={LABEL_CLASSNAME}>{label}</label>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className={INPUT_CLASSNAME}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allowOther,
  otherValue,
  onOtherChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className={LABEL_CLASSNAME}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={SELECT_CLASSNAME}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {allowOther && <p className={HINT_CLASSNAME}>{DROPDOWN_HINT}</p>}
      {allowOther && value === "Other" && (
        <input
          value={otherValue ?? ""}
          onChange={(event) => onOtherChange?.(event.target.value)}
          placeholder="Please specify..."
          className={CUSTOM_INPUT_CLASSNAME}
        />
      )}
    </div>
  );
}

function PillMultiSelect({
  options,
  selected,
  onToggle,
  customValues,
  onAddCustom,
  onRemoveCustom,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  customValues: string[];
  onAddCustom: (value: string) => void;
  onRemoveCustom: (value: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onAddCustom(trimmed);
    setDraft("");
    setIsAdding(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={pillClassName(selected.includes(option))}
          >
            {option}
          </button>
        ))}
        {customValues.map((value) => (
          <span
            key={value}
            className={`${pillClassName(true)} flex items-center gap-1.5`}
          >
            {value}
            <button
              type="button"
              onClick={() => onRemoveCustom(value)}
              aria-label={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}
        {isAdding ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") {
                setDraft("");
                setIsAdding(false);
              }
            }}
            onBlur={commit}
            placeholder="Type your own..."
            className="field-fade-in w-32 rounded-[20px] border border-border-dark bg-background px-3 py-1 text-[11px] text-text-primary outline-none focus:border-primary"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={pillClassName(false)}
          >
            + Add custom
          </button>
        )}
      </div>
      <p className={HINT_CLASSNAME}>{PILL_HINT}</p>
    </div>
  );
}

function PillSuggestions({
  options,
  value,
  onPick,
  extraSuggestions = [],
  onAddCustom,
  onRemoveCustom,
  allowAddCustom = false,
}: {
  options: string[];
  value: string;
  onPick: (value: string) => void;
  extraSuggestions?: string[];
  onAddCustom?: (value: string) => void;
  onRemoveCustom?: (value: string) => void;
  allowAddCustom?: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onPick(trimmed);
      onAddCustom?.(trimmed);
    }
    setDraft("");
    setIsAdding(false);
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onPick(option)}
          className={pillClassName(value === option)}
        >
          {option}
        </button>
      ))}
      {extraSuggestions.map((option) => (
        <span
          key={option}
          className={`${pillClassName(value === option)} flex items-center gap-1.5`}
        >
          <button type="button" onClick={() => onPick(option)}>
            {option}
          </button>
          {onRemoveCustom && (
            <button
              type="button"
              onClick={() => onRemoveCustom(option)}
              aria-label={`Remove ${option}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {allowAddCustom &&
        (isAdding ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") {
                setDraft("");
                setIsAdding(false);
              }
            }}
            onBlur={commit}
            placeholder="Type your own..."
            className="field-fade-in w-32 rounded-[20px] border border-border-dark bg-background px-3 py-1 text-[11px] text-text-primary outline-none focus:border-primary"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={pillClassName(false)}
          >
            + Add custom
          </button>
        ))}
      </div>
      <p className={HINT_CLASSNAME}>{SUGGESTION_HINT}</p>
    </div>
  );
}

const SAMPLE_TYPES = [
  {
    id: "fabric-swatch",
    emoji: "🧵",
    title: "Fabric Swatch",
    description: "Physical fabric samples in your required specs",
    cost: "Cost: Free – ₹200 per vendor",
  },
  {
    id: "lab-dip",
    emoji: "🎨",
    title: "Lab Dip",
    description: "Colour matching samples dyed to your spec",
    cost: "Cost: ₹200–₹500 per dip",
  },
  {
    id: "trim-sample",
    emoji: "🧷",
    title: "Trim Sample",
    description: "Buttons, zips, thread, labels, elastic",
    cost: "Cost: Free – ₹100 per vendor",
  },
  {
    id: "rd-sample",
    emoji: "🔬",
    title: "R&D Development Sample",
    description: "Full product prototype from your tech pack",
    cost: "Cost: ₹500–₹5,000 per vendor",
  },
];

const STEP_LABELS = [
  "Sample Type",
  "Specifications",
  "Select Vendors",
  "Review",
];

const FABRIC_TYPE_OPTIONS = [
  "Cotton",
  "Silk",
  "Linen",
  "Polyester",
  "Blended",
  "Other",
];
const CONSTRUCTION_OPTIONS = [
  "Plain",
  "Twill",
  "Satin",
  "Jersey",
  "Interlock",
  "Other",
];
const COLOUR_TOLERANCE_OPTIONS = ["Strict", "Moderate", "Flexible", "Other"];
const TRIM_TYPE_OPTIONS = ["Button", "Zip", "Elastic", "Label", "Thread", "Lining"];
const PRODUCT_CATEGORY_OPTIONS = [
  "Ethnic Wear",
  "Casual Wear",
  "Activewear",
  "Kids Wear",
  "Western Wear",
  "Luxury",
  "Other",
];
const SAMPLE_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "Other"];

const FINISH_SUGGESTIONS = [
  "Washed",
  "Brushed",
  "Enzyme treated",
  "Mercerised",
  "Sanforized",
];
const MATERIAL_SUGGESTIONS = ["Metal", "Plastic", "Nylon", "Fabric", "Wood", "Horn"];
const DYE_TYPE_OPTIONS = ["Reactive", "Vat", "Pigment", "Natural"];
const SPECIAL_TECHNIQUE_OPTIONS = [
  "Embroidery",
  "Block Print",
  "Screen Print",
  "Digital Print",
  "Appliqué",
  "Smocking",
];
const FABRIC_PREFERENCE_OPTIONS = [
  "Cotton",
  "Linen",
  "Silk",
  "Polyester",
  "Blended",
  "Sustainable",
  "Organic",
];

const OTHER_FIELD_MAP: Record<string, string> = {
  fabricType: "fabricTypeOther",
  construction: "constructionOther",
  colourTolerance: "colourToleranceOther",
  productCategory: "productCategoryOther",
  sampleSize: "sampleSizeOther",
};

const FIELD_LABELS: Record<string, { key: string; label: string }[]> = {
  "fabric-swatch": [
    { key: "fabricType", label: "Fabric Type" },
    { key: "composition", label: "Composition" },
    { key: "weightGsm", label: "Weight (GSM)" },
    { key: "construction", label: "Construction" },
    { key: "fabricColour", label: "Colour" },
    { key: "finish", label: "Finish" },
    { key: "swatchQuantity", label: "Swatches per vendor" },
  ],
  "lab-dip": [
    { key: "baseFabric", label: "Base Fabric" },
    { key: "targetColour", label: "Target Colour" },
    { key: "numOptions", label: "Shade Variations" },
    { key: "colourTolerance", label: "Colour Tolerance" },
    { key: "washTestRequired", label: "Wash Test Required" },
  ],
  "trim-sample": [
    { key: "trimMaterial", label: "Material" },
    { key: "trimSize", label: "Size / Dimensions" },
    { key: "trimColour", label: "Colour" },
    { key: "trimSpecialRequirements", label: "Special Requirements" },
  ],
  "rd-sample": [
    { key: "productCategory", label: "Product Category" },
    { key: "fabricSpec", label: "Fabric Specification" },
    { key: "sampleSize", label: "Sample Size" },
    { key: "colorway", label: "Colorway" },
    { key: "bulkPriceFrom", label: "Target Bulk Price From" },
    { key: "bulkPriceTo", label: "Target Bulk Price To" },
    { key: "bulkQuantity", label: "Target Bulk Quantity" },
    { key: "rdDeadline", label: "Deadline for Sample" },
  ],
};

type VendorTier = "gold" | "silver";

type Vendor = {
  id: string;
  name: string;
  city: string;
  tier: VendorTier;
  tags: string[];
  rating: number;
  orders: number;
};

const VENDORS: Vendor[] = [
  {
    id: "jaipur-ethnic-works",
    name: "Jaipur Ethnic Works",
    city: "Jaipur, Rajasthan",
    tier: "gold",
    tags: ["Ethnic Wear", "Cotton"],
    rating: 4.9,
    orders: 287,
  },
  {
    id: "surat-cotton-mills",
    name: "Surat Cotton Mills",
    city: "Surat, Gujarat",
    tier: "gold",
    tags: ["Cotton Fabric", "Lawn"],
    rating: 4.8,
    orders: 412,
  },
  {
    id: "lucknow-chikankari-house",
    name: "Lucknow Chikankari House",
    city: "Lucknow, UP",
    tier: "gold",
    tags: ["Chikankari", "Ethnic Wear"],
    rating: 4.9,
    orders: 156,
  },
  {
    id: "tirupur-knits",
    name: "Tirupur Knits",
    city: "Tirupur, Tamil Nadu",
    tier: "silver",
    tags: ["Knitwear", "Casual Wear"],
    rating: 4.7,
    orders: 334,
  },
  {
    id: "delhi-woven-works",
    name: "Delhi Woven Works",
    city: "Delhi NCR",
    tier: "silver",
    tags: ["Woven", "Western Wear"],
    rating: 4.6,
    orders: 198,
  },
  {
    id: "mumbai-denim-studio",
    name: "Mumbai Denim Studio",
    city: "Mumbai, Maharashtra",
    tier: "silver",
    tags: ["Denim", "Western Wear"],
    rating: 4.5,
    orders: 167,
  },
];

const DEFAULT_SELECTED_VENDORS = VENDORS.slice(0, 3).map((v) => v.id);

const REAL_BRIEF_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  responses_received: "Responses Received",
};

const REAL_BRIEF_STATUS_STYLES: Record<string, string> = {
  open: "border-secondary/60 bg-secondary/15 text-secondary",
  responses_received: "border-green-500/60 bg-green-500/15 text-green-400",
};

function formatBriefDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TIER_BADGE_STYLES: Record<VendorTier, string> = {
  gold: "border-primary/40 bg-primary/15 text-primary",
  silver: "border-secondary/40 bg-secondary/15 text-secondary",
};

const INITIAL_FORM_DATA = {
  fabricType: "",
  fabricTypeOther: "",
  composition: "",
  weightGsm: "",
  construction: "",
  constructionOther: "",
  fabricColour: "",
  finish: "",
  swatchQuantity: "2",
  baseFabric: "",
  targetColour: "",
  numOptions: "3",
  colourTolerance: "",
  colourToleranceOther: "",
  washTestRequired: "",
  trimMaterial: "",
  trimSize: "",
  trimColour: "",
  trimSpecialRequirements: "",
  productCategory: "",
  productCategoryOther: "",
  fabricSpec: "",
  sampleSize: "",
  sampleSizeOther: "",
  colorway: "",
  bulkPriceFrom: "",
  bulkPriceTo: "",
  bulkQuantity: "",
  rdDeadline: "",
  briefTitle: "",
  additionalNotes: "",
  sampleDeadline: "",
};

type FormDataState = typeof INITIAL_FORM_DATA;

export default function SampleBriefs() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const config = screenConfig.samples[user.userType];
  const [activeTab, setActiveTab] = useState<"primary" | "secondary">(
    "primary"
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSampleTypes, setSelectedSampleTypes] = useState<string[]>(
    []
  );
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_DATA);
  const [trimTypes, setTrimTypes] = useState<string[]>([]);
  const [customTrimTypes, setCustomTrimTypes] = useState<string[]>([]);
  const [materialSuggestions, setMaterialSuggestions] = useState<string[]>([]);
  const [dyeTypePreference, setDyeTypePreference] = useState<string[]>([]);
  const [dyeTypeCustom, setDyeTypeCustom] = useState<string[]>([]);
  const [specialTechniques, setSpecialTechniques] = useState<string[]>([]);
  const [specialTechniquesCustom, setSpecialTechniquesCustom] = useState<
    string[]
  >([]);
  const [fabricPreference, setFabricPreference] = useState<string[]>([]);
  const [fabricPreferenceCustom, setFabricPreferenceCustom] = useState<
    string[]
  >([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<
    string[]
  >(DEFAULT_SELECTED_VENDORS);
  const [referenceFileName, setReferenceFileName] = useState("");
  const [isPosted, setIsPosted] = useState(false);
  const [postedBrief, setPostedBrief] = useState<SampleBriefRow | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [myBriefs, setMyBriefs] = useState<SampleBriefRow[]>([]);
  const [myBriefsLoading, setMyBriefsLoading] = useState(config.showPostForm);
  const [openBriefs, setOpenBriefs] = useState<SampleBriefRow[]>([]);
  const [openBriefsLoading, setOpenBriefsLoading] = useState(!config.showPostForm);
  const [respondingBriefId, setRespondingBriefId] = useState<string | null>(null);

  const loadMyBriefs = async () => {
    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) {
      setMyBriefsLoading(false);
      return;
    }
    try {
      const res = await authFetch(
        `/api/sample-briefs?phone=${encodeURIComponent(auth.phone)}&role=buyer`
      );
      const { briefs } = (await res.json()) as { briefs: SampleBriefRow[] };
      setMyBriefs(briefs ?? []);
    } catch (error) {
      console.error("Failed to load sample briefs:", error);
    } finally {
      setMyBriefsLoading(false);
    }
  };

  useEffect(() => {
    if (!config.showPostForm) return;
    loadMyBriefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.showPostForm]);

  useEffect(() => {
    if (config.showPostForm) return;
    let cancelled = false;
    async function loadOpenBriefs() {
      try {
        // Public listing — the route does not require auth. Sent through
        // authFetch anyway for consistency and so this needs no change if
        // that ever tightens.
        const res = await authFetch("/api/sample-briefs");
        const { briefs } = (await res.json()) as { briefs: SampleBriefRow[] };
        if (!cancelled) setOpenBriefs(briefs ?? []);
      } catch (error) {
        console.error("Failed to load open sample briefs:", error);
      } finally {
        if (!cancelled) setOpenBriefsLoading(false);
      }
    }
    loadOpenBriefs();
    return () => {
      cancelled = true;
    };
  }, [config.showPostForm]);

  const respondToBrief = async (brief: SampleBriefRow) => {
    if (!brief.buyer?.phone || respondingBriefId) return;
    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) {
      router.push("/login");
      return;
    }

    setRespondingBriefId(brief.id);
    try {
      // No senderPhone: sender_id comes from the verified session.
      await authFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverPhone: brief.buyer.phone,
          content: `Hi, I am interested in your sample brief "${brief.title}". I can produce this for you. Let me share my quote and timeline.`,
          messageType: "text",
        }),
      });
      // "responses_received" is the ONLY status a non-owner may set — see
      // the asymmetric ownership rule in the route.
      await authFetch(`/api/sample-briefs/${brief.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "responses_received" }),
      });
      router.push("/chat");
    } catch (error) {
      console.error("Failed to respond to brief:", error);
      setRespondingBriefId(null);
    }
  };

  const updateField = (key: keyof FormDataState, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const toggleSampleType = (id: string) => {
    setSelectedSampleTypes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleTrimType = (type: string) => {
    setTrimTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  };

  const addCustomTrimType = (value: string) => {
    setTrimTypes((current) => (current.includes(value) ? current : [...current, value]));
    setCustomTrimTypes((current) => (current.includes(value) ? current : [...current, value]));
  };

  const removeCustomTrimType = (value: string) => {
    setTrimTypes((current) => current.filter((item) => item !== value));
    setCustomTrimTypes((current) => current.filter((item) => item !== value));
  };

  const toggleDyeType = (value: string) => {
    setDyeTypePreference((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const addCustomDyeType = (value: string) => {
    setDyeTypePreference((current) => (current.includes(value) ? current : [...current, value]));
    setDyeTypeCustom((current) => (current.includes(value) ? current : [...current, value]));
  };

  const removeCustomDyeType = (value: string) => {
    setDyeTypePreference((current) => current.filter((item) => item !== value));
    setDyeTypeCustom((current) => current.filter((item) => item !== value));
  };

  const toggleSpecialTechnique = (value: string) => {
    setSpecialTechniques((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const addCustomSpecialTechnique = (value: string) => {
    setSpecialTechniques((current) =>
      current.includes(value) ? current : [...current, value]
    );
    setSpecialTechniquesCustom((current) =>
      current.includes(value) ? current : [...current, value]
    );
  };

  const removeCustomSpecialTechnique = (value: string) => {
    setSpecialTechniques((current) => current.filter((item) => item !== value));
    setSpecialTechniquesCustom((current) =>
      current.filter((item) => item !== value)
    );
  };

  const toggleFabricPreference = (value: string) => {
    setFabricPreference((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const addCustomFabricPreference = (value: string) => {
    setFabricPreference((current) =>
      current.includes(value) ? current : [...current, value]
    );
    setFabricPreferenceCustom((current) =>
      current.includes(value) ? current : [...current, value]
    );
  };

  const removeCustomFabricPreference = (value: string) => {
    setFabricPreference((current) => current.filter((item) => item !== value));
    setFabricPreferenceCustom((current) =>
      current.filter((item) => item !== value)
    );
  };

  const toggleVendor = (id: string) => {
    setSelectedManufacturers((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 6) {
        return current;
      }
      return [...current, id];
    });
  };

  const handleFileSelect = (file: File | undefined) => {
    if (file) setReferenceFileName(file.name);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedSampleTypes([]);
    setFormData(INITIAL_FORM_DATA);
    setTrimTypes([]);
    setCustomTrimTypes([]);
    setMaterialSuggestions([]);
    setDyeTypePreference([]);
    setDyeTypeCustom([]);
    setSpecialTechniques([]);
    setSpecialTechniquesCustom([]);
    setFabricPreference([]);
    setFabricPreferenceCustom([]);
    setSelectedManufacturers(DEFAULT_SELECTED_VENDORS);
    setReferenceFileName("");
    setIsPosted(false);
    setPostedBrief(null);
    setPostError("");
  };

  const startNewBrief = () => {
    resetWizard();
    setActiveTab("secondary");
  };

  const isStep1Valid = selectedSampleTypes.length > 0;
  const isStep2Valid =
    formData.briefTitle.trim() !== "" && formData.sampleDeadline !== "";
  const isStep3Valid =
    selectedManufacturers.length >= 3 && selectedManufacturers.length <= 6;

  const handleBack = () => setCurrentStep((step) => Math.max(1, step - 1));
  const handleContinue = () => setCurrentStep((step) => Math.min(4, step + 1));

  // sample_briefs has no columns for most of what this wizard collects
  // (per-sample-type specs, trim/dye/technique preferences, deadline) — fold
  // it all into a readable description instead of silently dropping it.
  const buildBriefDescription = () => {
    const lines: string[] = [];

    for (const id of selectedSampleTypes) {
      for (const { key, label } of FIELD_LABELS[id] ?? []) {
        const rawValue = formData[key as keyof FormDataState];
        const otherKey = OTHER_FIELD_MAP[key];
        const displayValue =
          rawValue === "Other" && otherKey
            ? formData[otherKey as keyof FormDataState] || "Other"
            : rawValue;
        if (displayValue && displayValue.trim() !== "") {
          lines.push(`${label}: ${displayValue}`);
        }
      }
    }
    if (trimTypes.length > 0) lines.push(`Trim Type: ${trimTypes.join(", ")}`);
    if (selectedSampleTypes.includes("lab-dip") && dyeTypePreference.length > 0) {
      lines.push(`Dye Type Preference: ${dyeTypePreference.join(", ")}`);
    }
    if (selectedSampleTypes.includes("rd-sample") && specialTechniques.length > 0) {
      lines.push(`Special Techniques: ${specialTechniques.join(", ")}`);
    }
    if (fabricPreference.length > 0) {
      lines.push(`Fabric Preference: ${fabricPreference.join(", ")}`);
    }
    if (formData.sampleDeadline) lines.push(`Sample Deadline: ${formData.sampleDeadline}`);
    if (formData.additionalNotes) lines.push(`Additional Notes: ${formData.additionalNotes}`);

    return lines.join("\n");
  };

  const resolveQuantity = () => {
    const candidate =
      (selectedSampleTypes.includes("fabric-swatch") && formData.swatchQuantity) ||
      (selectedSampleTypes.includes("lab-dip") && formData.numOptions) ||
      (selectedSampleTypes.includes("rd-sample") && formData.bulkQuantity) ||
      "";
    return parseInt(candidate, 10) || 0;
  };

  const postBrief = async () => {
    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) {
      router.push("/login");
      return;
    }

    setIsPosting(true);
    setPostError("");

    try {
      // No buyerPhone: buyer_id comes from the verified session.
      const res = await authFetch("/api/sample-briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.briefTitle,
          category: selectedSampleTypes
            .map((id) => SAMPLE_TYPES.find((t) => t.id === id)?.title)
            .filter(Boolean)
            .join(", "),
          description: buildBriefDescription(),
          quantity: resolveQuantity(),
          budgetMin: Number(formData.bulkPriceFrom) || 0,
          budgetMax: Number(formData.bulkPriceTo) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post brief");

      setPostedBrief(data.brief);
      setIsPosted(true);
      loadMyBriefs();
    } catch (error) {
      setPostError(
        error instanceof Error ? error.message : "Failed to post brief. Please try again."
      );
    }

    setIsPosting(false);
  };

  const perVendorLow = 150;
  const perVendorHigh = 280;
  const totalLow = (selectedManufacturers.length * perVendorLow).toLocaleString(
    "en-IN"
  );
  const totalHigh = (
    selectedManufacturers.length * perVendorHigh
  ).toLocaleString("en-IN");

  const tabsBar = (
    <div className="flex gap-6 border-b border-border-dark">
      <button
        type="button"
        onClick={() => setActiveTab("primary")}
        className={`pb-3 text-sm font-semibold transition-colors ${
          activeTab === "primary"
            ? "border-b-2 border-primary text-white"
            : "text-text-secondary"
        }`}
      >
        {config.tabs[0]}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("secondary")}
        className={`pb-3 text-sm font-semibold transition-colors ${
          activeTab === "secondary"
            ? "border-b-2 border-primary text-white"
            : "text-text-secondary"
        }`}
      >
        {config.tabs[1]}
      </button>
    </div>
  );

  const myBriefsContent = myBriefsLoading ? (
    <div className="flex items-center justify-center py-16 text-sm text-text-secondary">
      Loading briefs...
    </div>
  ) : config.showPostForm && myBriefs.length > 0 ? (
    <div className="mt-6 flex flex-col gap-4">
      {myBriefs.map((brief) => (
        <div key={brief.id} className="rounded-[10px] border border-border-dark bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-white">{brief.title}</p>
            <span
              className={`rounded-[20px] border px-2.5 py-1 text-[11px] font-semibold ${
                REAL_BRIEF_STATUS_STYLES[brief.status] ?? REAL_BRIEF_STATUS_STYLES.open
              }`}
            >
              {REAL_BRIEF_STATUS_LABEL[brief.status] ?? brief.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            {brief.category}
            {brief.quantity ? ` • Qty ${brief.quantity}` : ""}
            {brief.budget_min || brief.budget_max
              ? ` • ₹${brief.budget_min ?? 0}–₹${brief.budget_max ?? 0}`
              : ""}
          </p>
          <p className="mt-2 text-[11px] text-text-secondary">
            Posted {formatBriefDate(brief.created_at)}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">📋</div>
      {config.showPostForm ? (
        <>
          <p className="mt-2 text-base font-bold text-white">No sample briefs posted yet</p>
          <p className="mt-2 max-w-[400px] text-[13px] text-text-secondary">
            Post your first brief to get quotes from verified manufacturers
          </p>
          <button
            type="button"
            onClick={startNewBrief}
            className="mt-5 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
          >
            + Post a Brief →
          </button>
        </>
      ) : (
        <p className="mt-2 max-w-[400px] text-[13px] text-text-secondary">{config.emptyState}</p>
      )}
    </div>
  );

  const openBriefsContent = openBriefsLoading ? (
    <div className="flex items-center justify-center py-16 text-sm text-text-secondary">
      Loading briefs...
    </div>
  ) : openBriefs.length === 0 ? (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">📬</div>
      <p className="mt-2 text-base font-bold text-white">No open sample briefs right now</p>
      <p className="mt-2 max-w-[400px] text-[13px] text-text-secondary">
        Check back soon — brands post new briefs regularly
      </p>
    </div>
  ) : (
    <div className="mt-6 flex flex-col gap-4">
      {openBriefs.map((brief) => (
        <div key={brief.id} className="rounded-[10px] border border-border-dark bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-white">{brief.title}</p>
            <span
              className={`rounded-[20px] border px-2.5 py-1 text-[11px] font-semibold ${
                REAL_BRIEF_STATUS_STYLES[brief.status] ?? REAL_BRIEF_STATUS_STYLES.open
              }`}
            >
              {REAL_BRIEF_STATUS_LABEL[brief.status] ?? brief.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            From {brief.buyer?.name ?? "Unknown buyer"}
            {brief.buyer?.city ? ` · ${brief.buyer.city}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {brief.category}
            {brief.quantity ? ` • Qty ${brief.quantity}` : ""}
            {brief.budget_min || brief.budget_max
              ? ` • ₹${brief.budget_min ?? 0}–₹${brief.budget_max ?? 0}`
              : ""}
          </p>
          {brief.description && (
            <p className="mt-2 whitespace-pre-line text-xs text-text-secondary">
              {brief.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-border-dark pt-3">
            <p className="text-[11px] text-text-secondary">
              Posted {formatBriefDate(brief.created_at)}
            </p>
            <button
              type="button"
              onClick={() => void respondToBrief(brief)}
              disabled={respondingBriefId === brief.id}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-navy disabled:cursor-not-allowed disabled:bg-primary/40"
            >
              {respondingBriefId === brief.id ? "Responding..." : "Respond to Brief →"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const secondaryTabContent = (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">🗂️</div>
      <p className="mt-4 text-base font-bold text-white">Nothing here yet</p>
      <p className="mt-2 max-w-[400px] text-[13px] text-text-secondary">
        {config.tabs[1]} will show up here once available.
      </p>
    </div>
  );

  const stepIndicator = (
    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-1">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;
        return (
          <div key={label} className="flex shrink-0 items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-[9999px] text-[11px] font-bold ${
                isActive || isDone
                  ? "bg-primary text-navy"
                  : "border border-border-dark text-text-secondary"
              }`}
            >
              {stepNumber}
            </div>
            <span
              className={`text-xs font-medium ${
                isActive ? "text-white" : "text-text-secondary"
              }`}
            >
              {label}
            </span>
            {stepNumber < STEP_LABELS.length && (
              <span className="mx-1 text-text-secondary">→</span>
            )}
          </div>
        );
      })}
    </div>
  );

  const step1Content = (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-white">
        What type of sample do you need?
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        You can request multiple types simultaneously
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SAMPLE_TYPES.map((type) => {
          const isSelected = selectedSampleTypes.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleSampleType(type.id)}
              className={`relative rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border-dark bg-card"
              }`}
            >
              {isSelected && (
                <span className="absolute right-3 top-3 font-bold text-primary">
                  ✓
                </span>
              )}
              <div className="text-2xl">{type.emoji}</div>
              <h3 className="mt-2 text-sm font-bold text-white">
                {type.title}
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                {type.description}
              </p>
              <p className="mt-2 text-xs font-medium text-primary">
                {type.cost}
              </p>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-text-secondary">
        Posting briefs is completely free. You only pay courier charges when
        samples are shipped.
      </p>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isStep1Valid}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
            isStep1Valid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );

  const step2Content = (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-white">Specifications</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Tell manufacturers exactly what you need
      </p>

      <div className="mb-5 mt-4 flex gap-3 rounded-[6px] border-l-2 border-primary bg-card px-4 py-3">
        <span className="text-primary">💡</span>
        <p className="text-xs text-text-secondary">
          All fields have a custom option. If you don&apos;t find exactly
          what you need in the dropdown or pills — choose &apos;Other&apos;
          or click &apos;+ Add custom&apos; to type your own specification.
          Your brief goes directly to manufacturers who understand the
          details.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-8">
        {selectedSampleTypes.includes("fabric-swatch") && (
          <div>
            <h3 className="text-sm font-bold text-primary">Fabric Swatch</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Fabric Type"
                value={formData.fabricType}
                onChange={(value) => updateField("fabricType", value)}
                options={FABRIC_TYPE_OPTIONS}
                allowOther
                otherValue={formData.fabricTypeOther}
                onOtherChange={(value) => updateField("fabricTypeOther", value)}
              />
              <TextField
                label="Composition"
                value={formData.composition}
                onChange={(value) => updateField("composition", value)}
                placeholder="e.g. 100% cotton, 60% cotton 40% poly"
              />
              <TextField
                label="Weight (GSM)"
                type="number"
                value={formData.weightGsm}
                onChange={(value) => updateField("weightGsm", value)}
                placeholder="e.g. 80"
              />
              <SelectField
                label="Construction"
                value={formData.construction}
                onChange={(value) => updateField("construction", value)}
                options={CONSTRUCTION_OPTIONS}
                allowOther
                otherValue={formData.constructionOther}
                onOtherChange={(value) =>
                  updateField("constructionOther", value)
                }
              />
              <TextField
                label="Colour"
                value={formData.fabricColour}
                onChange={(value) => updateField("fabricColour", value)}
                placeholder="Pantone number or describe the colour"
              />
              <div>
                <TextField
                  label="Finish"
                  value={formData.finish}
                  onChange={(value) => updateField("finish", value)}
                  placeholder="e.g. washed, brushed, enzyme treated"
                />
                <PillSuggestions
                  options={FINISH_SUGGESTIONS}
                  value={formData.finish}
                  onPick={(value) => updateField("finish", value)}
                />
              </div>
              <TextField
                label="How many swatches per vendor?"
                type="number"
                value={formData.swatchQuantity}
                onChange={(value) => updateField("swatchQuantity", value)}
              />
            </div>
          </div>
        )}

        {selectedSampleTypes.includes("lab-dip") && (
          <div>
            <h3 className="text-sm font-bold text-primary">Lab Dip</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Base Fabric"
                value={formData.baseFabric}
                onChange={(value) => updateField("baseFabric", value)}
              />
              <TextField
                label="Target Colour"
                value={formData.targetColour}
                onChange={(value) => updateField("targetColour", value)}
                placeholder="Pantone number or hex code"
              />
              <TextField
                label="How many shade variations?"
                type="number"
                value={formData.numOptions}
                onChange={(value) => updateField("numOptions", value)}
              />
              <SelectField
                label="Colour Tolerance"
                value={formData.colourTolerance}
                onChange={(value) => updateField("colourTolerance", value)}
                options={COLOUR_TOLERANCE_OPTIONS}
                allowOther
                otherValue={formData.colourToleranceOther}
                onOtherChange={(value) =>
                  updateField("colourToleranceOther", value)
                }
              />
              <div>
                <label className={LABEL_CLASSNAME}>Wash Test Required</label>
                <div className="flex gap-2">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        updateField("washTestRequired", option)
                      }
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        formData.washTestRequired === option
                          ? "border-primary bg-primary text-navy"
                          : "border-border-dark bg-navy text-text-secondary"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASSNAME}>Dye Type Preference</label>
                <PillMultiSelect
                  options={DYE_TYPE_OPTIONS}
                  selected={dyeTypePreference}
                  onToggle={toggleDyeType}
                  customValues={dyeTypeCustom}
                  onAddCustom={addCustomDyeType}
                  onRemoveCustom={removeCustomDyeType}
                />
              </div>
            </div>
          </div>
        )}

        {selectedSampleTypes.includes("trim-sample") && (
          <div>
            <h3 className="text-sm font-bold text-primary">Trim Sample</h3>
            <div className="mt-3">
              <label className={LABEL_CLASSNAME}>Trim Type</label>
              <PillMultiSelect
                options={TRIM_TYPE_OPTIONS}
                selected={trimTypes}
                onToggle={toggleTrimType}
                customValues={customTrimTypes}
                onAddCustom={addCustomTrimType}
                onRemoveCustom={removeCustomTrimType}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <TextField
                  label="Material"
                  value={formData.trimMaterial}
                  onChange={(value) => updateField("trimMaterial", value)}
                />
                <PillSuggestions
                  options={MATERIAL_SUGGESTIONS}
                  value={formData.trimMaterial}
                  onPick={(value) => updateField("trimMaterial", value)}
                  extraSuggestions={materialSuggestions}
                  onAddCustom={(value) =>
                    setMaterialSuggestions((current) =>
                      current.includes(value) ? current : [...current, value]
                    )
                  }
                  onRemoveCustom={(value) =>
                    setMaterialSuggestions((current) =>
                      current.filter((item) => item !== value)
                    )
                  }
                  allowAddCustom
                />
              </div>
              <TextField
                label="Size / Dimensions"
                value={formData.trimSize}
                onChange={(value) => updateField("trimSize", value)}
              />
              <TextField
                label="Colour"
                value={formData.trimColour}
                onChange={(value) => updateField("trimColour", value)}
              />
              <TextField
                label="Special Requirements"
                value={formData.trimSpecialRequirements}
                onChange={(value) =>
                  updateField("trimSpecialRequirements", value)
                }
                placeholder="e.g. eco-friendly, recycled"
              />
            </div>
          </div>
        )}

        {selectedSampleTypes.includes("rd-sample") && (
          <div>
            <h3 className="text-sm font-bold text-primary">
              R&amp;D Development Sample
            </h3>
            <div className="mt-3">
              <label className={LABEL_CLASSNAME}>
                Upload reference image or tech pack
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFileSelect(event.dataTransfer.files?.[0]);
                }}
                onDragOver={(event) => event.preventDefault()}
                className="cursor-pointer rounded-xl border border-dashed border-border-dark bg-navy p-6 text-center transition-colors hover:border-primary"
              >
                <div className="text-2xl">📤</div>
                <p className="mt-2 text-sm text-text-primary">
                  {referenceFileName ||
                    "Upload reference image or tech pack"}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  JPG, PNG or PDF
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={(event) =>
                    handleFileSelect(event.target.files?.[0])
                  }
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Product Category"
                value={formData.productCategory}
                onChange={(value) => updateField("productCategory", value)}
                options={PRODUCT_CATEGORY_OPTIONS}
                allowOther
                otherValue={formData.productCategoryOther}
                onOtherChange={(value) =>
                  updateField("productCategoryOther", value)
                }
              />
              <SelectField
                label="Sample Size"
                value={formData.sampleSize}
                onChange={(value) => updateField("sampleSize", value)}
                options={SAMPLE_SIZE_OPTIONS}
                allowOther
                otherValue={formData.sampleSizeOther}
                onOtherChange={(value) =>
                  updateField("sampleSizeOther", value)
                }
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Fabric Specification"
                  value={formData.fabricSpec}
                  onChange={(value) => updateField("fabricSpec", value)}
                  placeholder="Describe fabric or leave open for manufacturer suggestion"
                />
              </div>
              <TextField
                label="Colorway"
                value={formData.colorway}
                onChange={(value) => updateField("colorway", value)}
              />
              <TextField
                label="Target Bulk Quantity"
                value={formData.bulkQuantity}
                onChange={(value) => updateField("bulkQuantity", value)}
                placeholder="Intended bulk order quantity"
              />
              <TextField
                label="Target Bulk Price From ₹"
                type="number"
                value={formData.bulkPriceFrom}
                onChange={(value) => updateField("bulkPriceFrom", value)}
              />
              <TextField
                label="Target Bulk Price To ₹"
                type="number"
                value={formData.bulkPriceTo}
                onChange={(value) => updateField("bulkPriceTo", value)}
              />
              <TextField
                label="Deadline for Sample"
                type="date"
                value={formData.rdDeadline}
                onChange={(value) => updateField("rdDeadline", value)}
              />
              <div className="sm:col-span-2">
                <label className={LABEL_CLASSNAME}>Special Techniques</label>
                <PillMultiSelect
                  options={SPECIAL_TECHNIQUE_OPTIONS}
                  selected={specialTechniques}
                  onToggle={toggleSpecialTechnique}
                  customValues={specialTechniquesCustom}
                  onAddCustom={addCustomSpecialTechnique}
                  onRemoveCustom={removeCustomSpecialTechnique}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-white">Brief Details</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Brief Title"
              value={formData.briefTitle}
              onChange={(value) => updateField("briefTitle", value)}
              placeholder="e.g. Cotton Kurta Summer 2026"
            />
            <TextField
              label="Sample Deadline"
              type="date"
              value={formData.sampleDeadline}
              onChange={(value) => updateField("sampleDeadline", value)}
            />
            <div className="sm:col-span-2">
              <label className={LABEL_CLASSNAME}>Fabric Preference</label>
              <PillMultiSelect
                options={FABRIC_PREFERENCE_OPTIONS}
                selected={fabricPreference}
                onToggle={toggleFabricPreference}
                customValues={fabricPreferenceCustom}
                onAddCustom={addCustomFabricPreference}
                onRemoveCustom={removeCustomFabricPreference}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                label="Additional Notes"
                value={formData.additionalNotes}
                onChange={(value) => updateField("additionalNotes", value)}
                placeholder="Any other requirements for the manufacturer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-text-secondary"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isStep2Valid}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
            isStep2Valid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );

  const step3Content = (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-white">
        Select manufacturers to send your brief to
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Choose 3–6 verified manufacturers. Brief sent to all simultaneously.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {VENDORS.map((vendor) => {
          const isSelected = selectedManufacturers.includes(vendor.id);
          return (
            <label
              key={vendor.id}
              className="flex cursor-pointer items-center gap-4 rounded-[10px] border border-border-dark bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-navy text-lg">
                🏭
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-white">
                    {vendor.name}
                  </p>
                  <span
                    className={`rounded-[20px] border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      TIER_BADGE_STYLES[vendor.tier]
                    }`}
                  >
                    {vendor.tier} Verified
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{vendor.city}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                  <span>{vendor.tags.join(" • ")}</span>
                  <span>⭐ {vendor.rating}</span>
                  <span>{vendor.orders} orders completed</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleVendor(vendor.id)}
                className="h-5 w-5 shrink-0 accent-primary"
              />
            </label>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-text-secondary">
        {selectedManufacturers.length} of 6 selected
      </p>

      <div className="mt-6 flex gap-3 rounded-xl border-l-4 border-primary bg-card p-4">
        <span className="text-lg">💡</span>
        <p className="text-sm text-text-secondary">
          Your brief is confidential — selected manufacturers cannot see each
          other&apos;s responses or quotes.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-text-secondary"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isStep3Valid}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
            isStep3Valid
              ? "cursor-pointer bg-primary text-navy"
              : "cursor-not-allowed bg-border-dark text-text-secondary"
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );

  const step4Content = isPosted ? (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-6xl">✅</div>
      <h2 className="mt-6 text-xl font-bold text-white">Brief Posted!</h2>
      <p className="mt-2 max-w-[420px] text-sm text-text-secondary">
        Your sample brief is now visible to all verified manufacturers.
      </p>
      {postedBrief && (
        <p className="mt-2 text-xs font-semibold text-primary">
          Brief ID: SB-{postedBrief.id.slice(0, 8).toUpperCase()}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            resetWizard();
            setActiveTab("primary");
          }}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
        >
          View My Briefs →
        </button>
        <button
          type="button"
          onClick={startNewBrief}
          className="rounded-lg border border-border-dark px-6 py-3 text-sm font-semibold text-text-secondary"
        >
          Post Another
        </button>
      </div>
    </div>
  ) : (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-white">
        Review your brief before posting
      </h2>

      <div className="mt-6 rounded-xl border border-border-dark bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          Sample Types
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedSampleTypes.map((id) => {
            const type = SAMPLE_TYPES.find((sampleType) => sampleType.id === id);
            if (!type) return null;
            return (
              <span
                key={id}
                className="rounded-[20px] border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
              >
                {type.title}
              </span>
            );
          })}
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-text-secondary">
          Specifications
        </p>
        <dl className="mt-2 flex flex-col gap-1.5">
          {selectedSampleTypes.flatMap((id) =>
            (FIELD_LABELS[id] ?? []).flatMap(({ key, label }) => {
              const rawValue = formData[key as keyof FormDataState];
              const otherKey = OTHER_FIELD_MAP[key];
              const displayValue =
                rawValue === "Other" && otherKey
                  ? formData[otherKey as keyof FormDataState] || "Other"
                  : rawValue;
              if (!displayValue || displayValue.trim() === "") return [];
              return [
                <div key={key} className="flex justify-between gap-4 text-sm">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="text-right text-text-primary">
                    {displayValue}
                  </dd>
                </div>,
              ];
            })
          )}
          {trimTypes.length > 0 && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-text-secondary">Trim Type</dt>
              <dd className="text-right text-text-primary">
                {trimTypes.join(", ")}
              </dd>
            </div>
          )}
          {selectedSampleTypes.includes("lab-dip") &&
            dyeTypePreference.length > 0 && (
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-text-secondary">Dye Type Preference</dt>
                <dd className="text-right text-text-primary">
                  {dyeTypePreference.join(", ")}
                </dd>
              </div>
            )}
          {selectedSampleTypes.includes("rd-sample") &&
            specialTechniques.length > 0 && (
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-text-secondary">Special Techniques</dt>
                <dd className="text-right text-text-primary">
                  {specialTechniques.join(", ")}
                </dd>
              </div>
            )}
          {fabricPreference.length > 0 && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-text-secondary">Fabric Preference</dt>
              <dd className="text-right text-text-primary">
                {fabricPreference.join(", ")}
              </dd>
            </div>
          )}
          {formData.briefTitle && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-text-secondary">Brief Title</dt>
              <dd className="text-right text-text-primary">
                {formData.briefTitle}
              </dd>
            </div>
          )}
          {formData.sampleDeadline && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-text-secondary">Deadline</dt>
              <dd className="text-right text-text-primary">
                {formData.sampleDeadline}
              </dd>
            </div>
          )}
          {formData.additionalNotes && (
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-text-secondary">Additional Notes</dt>
              <dd className="text-right text-text-primary">
                {formData.additionalNotes}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-text-secondary">
          Manufacturers
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {selectedManufacturers.map((id) => {
            const vendor = VENDORS.find((item) => item.id === id);
            if (!vendor) return null;
            return (
              <div
                key={id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-primary">{vendor.name}</span>
                <span
                  className={`rounded-[20px] border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                    TIER_BADGE_STYLES[vendor.tier]
                  }`}
                >
                  {vendor.tier} Verified
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border-dark bg-card p-5">
        <p className="text-sm font-semibold text-primary">
          Estimated courier cost when samples ship: ₹{perVendorLow}–₹
          {perVendorHigh} per vendor
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Total if all vendors respond: ₹{totalLow}–₹{totalHigh} for courier
        </p>
        <p className="mt-2 text-sm font-semibold text-green-400">
          Posting this brief is free
        </p>
      </div>

      {postError && (
        <p className="mt-4 text-center text-[13px] text-red-400">{postError}</p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary"
        >
          ← Edit Brief
        </button>
        <button
          type="button"
          onClick={() => void postBrief()}
          disabled={isPosting}
          className="rounded-lg bg-primary px-8 py-3.5 text-base font-bold text-navy disabled:cursor-not-allowed disabled:bg-primary/40"
        >
          {isPosting ? "Posting..." : "Post Brief →"}
        </button>
      </div>
    </div>
  );

  const postBriefContent = (
    <div className="mt-6">
      {stepIndicator}
      {currentStep === 1 && step1Content}
      {currentStep === 2 && step2Content}
      {currentStep === 3 && step3Content}
      {currentStep === 4 && step4Content}
    </div>
  );

  const tipsForRespondingPanel = (
    <>
      <p className="text-base font-bold text-white">Tips for Responding</p>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-text-secondary">
        <li>• Respond within 24 hours to improve your match rate</li>
        <li>• Be specific about pricing and lead time</li>
        <li>• Complete verification to appear higher in matches</li>
        <li>• A complete profile gets more requests</li>
      </ul>
    </>
  );

  const tipsForBriefPanel = (
    <>
      <p className="text-base font-bold text-white">Tips for a Great Brief</p>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-text-secondary">
        <li>• Be specific about fabric composition and weight</li>
        <li>• Include a Pantone number for accurate colour matching</li>
        <li>• Set a realistic deadline — 10–14 days minimum</li>
        <li>• Select 3–5 manufacturers for best comparison</li>
        <li>• Mention your bulk order intent — manufacturers respond better</li>
      </ul>
    </>
  );

  const howItWorksPanel = (
    <>
      <p className="text-base font-bold text-white">How FabSample Works</p>
      <ol className="mt-4 flex flex-col gap-3 text-sm text-text-secondary">
        <li>1. Post your brief — free, takes 5 minutes</li>
        <li>2. Manufacturers respond within 24 hours</li>
        <li>3. All samples arrive together</li>
        <li>4. Compare side by side</li>
        <li>5. Best price and quality wins bulk order</li>
      </ol>
      <Link
        href="/verification"
        className="mt-4 inline-block text-sm font-medium text-primary"
      >
        Learn more →
      </Link>
    </>
  );

  const centrePanel = (
    <>
      <TopBar
        title={config.title}
        rightContent={
          config.showPostForm ? (
            <button
              type="button"
              onClick={startNewBrief}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
            >
              Post New Brief
            </button>
          ) : undefined
        }
      />

      <div className="px-6 py-6">
        <p className="-mt-2 mb-4 text-sm text-text-secondary">
          {config.subtitle}
        </p>
        {tabsBar}
        {activeTab === "primary"
          ? config.showPostForm
            ? myBriefsContent
            : openBriefsContent
          : config.showPostForm
            ? postBriefContent
            : secondaryTabContent}
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        mobile={false}
        centre={centrePanel}
        right={
          <div style={{ padding: "20px" }}>
            {!config.showPostForm
              ? tipsForRespondingPanel
              : activeTab === "primary"
                ? howItWorksPanel
                : tipsForBriefPanel}
          </div>
        }
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
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-bold text-white">
              {config.title}
            </h1>
            {config.showPostForm && (
              <button
                type="button"
                onClick={startNewBrief}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-navy"
              >
                Post New Brief
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-text-secondary">{config.subtitle}</p>

          <div className="mt-4">{tabsBar}</div>
          {activeTab === "primary"
            ? config.showPostForm
              ? myBriefsContent
              : openBriefsContent
            : config.showPostForm
              ? postBriefContent
              : secondaryTabContent}
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
