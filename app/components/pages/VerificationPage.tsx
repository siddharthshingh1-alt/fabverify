"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThreePanelLayout from "../ThreePanelLayout";
import TopBar from "../TopBar";
import { useUser, type UserType } from "../../context/UserContext";
import { authFetch } from "../../lib/apiClient";

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "🔍", label: "Discover", href: "/manufacturers" },
  { icon: "👔", label: "Merch", href: "/fabmerch" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

type Feature = { ok: boolean; text: string };
type Requirement = { icon: string; text: string };

type TierContent = {
  requirements: string[];
  benefits: string[];
};

type UserVerificationConfig = {
  bronze: TierContent;
  silver: TierContent;
  gold: TierContent;
};

const VERIFICATION_CONFIG: Record<UserType, UserVerificationConfig> = {
  buyer: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "📋 PAN card",
      ],
      benefits: [
        "✅ Browse verified manufacturers",
        "✅ Post sample briefs",
        "✅ Basic escrow protection",
        "❌ No credit access",
        "❌ Lower priority responses",
      ],
    },
    silver: {
      requirements: [
        "📋 GST certificate or business registration",
        "🏢 Brand/company details",
        "👥 2 manufacturer references",
        "📹 Video verification call",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ FabPay Later — buy now pay 30/60/90 days",
        "✅ ₹2L credit limit",
        "✅ Priority manufacturer responses",
        "✅ Access to Gold tier manufacturers",
        "❌ No international supplier access",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "💰 Minimum ₹5L annual buying volume proof",
        "👥 3 manufacturer references",
        "🏢 Physical office/studio verification",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ ₹10L credit limit",
        "✅ International manufacturer access",
        "✅ EU compliance certificate for orders",
        "✅ Dedicated account manager",
        "✅ Priority dispute resolution",
      ],
    },
  },

  manufacturer: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "📋 PAN card",
      ],
      benefits: [
        "✅ Appear in buyer search results",
        "✅ Receive sample brief requests",
        "✅ Basic escrow payment protection",
        "❌ No credit access",
        "❌ Lower search ranking",
      ],
    },
    silver: {
      requirements: [
        "📋 GST certificate",
        "🏭 Factory/unit registration",
        "📸 3 geo-tagged factory photos",
        "👥 2 buyer references",
        "📹 Video spot check call",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ FabFloat — get paid in 48 hours",
        "✅ ₹2L raw material credit (FabMaterial)",
        "✅ Priority placement in search",
        "✅ Access to brand buyer enquiries",
        "❌ No international buyer access",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏭 Physical factory visit by FabVerify officer",
        "✅ Production capacity assessment",
        "📊 Quality control process check",
        "🏅 Certifications review (ISO, OEKO-TEX etc)",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ ₹10L credit limit",
        "✅ International buyer access",
        "✅ EU compliance certification",
        "✅ Dedicated account manager",
        "✅ Annual factory audit report",
      ],
    },
  },

  fabric_mill: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar or company ID",
        "📋 PAN card",
      ],
      benefits: [
        "✅ Appear in supplier search",
        "✅ Receive fabric sample requests",
        "✅ Basic escrow protection",
        "❌ No credit access",
        "❌ Lower priority in search",
      ],
    },
    silver: {
      requirements: [
        "📋 GST certificate",
        "🏭 Mill registration documents",
        "📸 Mill photos — weaving or production area",
        "🧵 Fabric quality test certificate",
        "👥 2 buyer references",
        "📹 Video verification call",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ FabMaterial credit line",
        "✅ Priority listing in fabric search",
        "✅ Access to verified brand buyers",
        "✅ Bulk order enquiries",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏭 Physical mill inspection",
        "🧪 OEKO-TEX or equivalent certification",
        "📊 Production capacity verification",
        "🌍 Export licence if applicable",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ International buyer access",
        "✅ Oeko-Tex verification support",
        "✅ EU compliance documentation",
        "✅ Dedicated account manager",
      ],
    },
  },

  trim_supplier: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "📋 PAN card",
      ],
      benefits: [
        "✅ Appear in trim supplier search",
        "✅ Receive trim sample requests",
        "✅ Basic escrow protection",
        "❌ No credit access",
      ],
    },
    silver: {
      requirements: [
        "📋 GST certificate",
        "🏢 Business registration",
        "📸 Product catalogue photos",
        "🧷 Product quality samples submitted",
        "👥 2 manufacturer references",
        "📹 Video verification call",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ FabMaterial credit line",
        "✅ Priority listing in trim search",
        "✅ Access to verified buyers",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏭 Warehouse or production visit",
        "🧪 Product quality certification",
        "📊 Inventory capacity verification",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ International buyer access",
        "✅ Compliance documentation support",
        "✅ Dedicated account manager",
      ],
    },
  },

  artisan: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "🎨 Portfolio — 5 photos of your craft work",
      ],
      benefits: [
        "✅ Appear in artisan search",
        "✅ GI Tag status displayed on profile",
        "✅ Receive craft order requests",
        "❌ No credit access",
      ],
    },
    silver: {
      requirements: [
        "📋 Craft council membership or government ID",
        "🎨 Extended portfolio — 10 craft photos",
        "👥 2 brand/buyer references",
        "📹 Video craft demonstration call",
        "📍 Workshop location verification",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ Direct brand buyer connections",
        "✅ Fair price guarantee — no middlemen",
        "✅ FabMaterial credit for raw materials",
        "✅ Government scheme eligibility alerts",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏅 GI Tag registration proof",
        "🏭 Physical workshop visit by field officer",
        "✅ Craft authenticity assessment",
        "🌍 Export capability verification",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ International brand access",
        "✅ EU authentic craft certificate",
        "✅ Heritage documentation support",
        "✅ Premium buyer priority access",
      ],
    },
  },

  job_worker: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "📋 PAN card",
        "🔧 Service description submitted",
      ],
      benefits: [
        "✅ Appear in job work search",
        "✅ Receive job work requests",
        "✅ Basic escrow protection",
        "❌ No credit access",
      ],
    },
    silver: {
      requirements: [
        "📋 GST certificate or business registration",
        "🏭 Unit photos — equipment and workspace",
        "👥 2 manufacturer references",
        "📹 Video verification showing your work",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ Priority job work matching",
        "✅ FabMaterial credit line",
        "✅ Verified capacity badge",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏭 Physical unit visit by field officer",
        "✅ Equipment capacity verification",
        "📊 Quality output assessment",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ Enterprise brand job work access",
        "✅ Dedicated account manager",
        "✅ Annual capacity audit",
      ],
    },
  },

  designer: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "✏️ Portfolio — 5 tech packs or flat sketches",
      ],
      benefits: [
        "✅ Appear in FabTalent search",
        "✅ Receive design brief requests",
        "✅ Basic escrow for project payments",
        "❌ No priority placement",
      ],
    },
    silver: {
      requirements: [
        "✏️ Extended portfolio — 10 tech packs",
        "💻 Software proficiency proof",
        "🎯 Skill test — create tech pack from reference image",
        "👥 2 client brand references",
        "📹 Portfolio review call with FabTalent panel",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ Priority placement in search",
        "✅ Skill verified badge",
        "✅ Access to enterprise brand projects",
        "✅ Portfolio featured on profile",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏆 5+ completed projects with 5-star ratings",
        "🌍 International client experience",
        "✅ Expert level skill assessment",
        "📊 FabScore above 9.0",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ International brand access",
        "✅ Top of search placement",
        "✅ Dedicated account manager",
        "✅ Annual skill re-verification",
      ],
    },
  },

  master: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "✂️ Portfolio — photos of samples you made",
      ],
      benefits: [
        "✅ Appear in FabTalent Master search",
        "✅ Receive sample making requests",
        "✅ Basic escrow protection",
        "❌ No priority placement",
      ],
    },
    silver: {
      requirements: [
        "✂️ Extended portfolio — 10 sample photos",
        "🎯 Physical skill assessment — make a test sample commissioned by FabVerify field officer",
        "🧵 Equipment verification",
        "👥 3 brand/manufacturer references",
        "📍 Workshop location verified",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ Skill verified after assessment",
        "✅ Priority placement in search",
        "✅ Access to brand and enterprise clients",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏆 10+ completed projects with 5-star ratings",
        "✅ Advanced construction skill assessment",
        "📊 FabScore above 9.5",
        "🌍 Luxury brand experience preferred",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ International brand access",
        "✅ Master craftsperson badge",
        "✅ Dedicated account manager",
      ],
    },
  },

  merchandiser: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "👔 Experience summary submitted",
        "📋 Portfolio of past projects",
      ],
      benefits: [
        "✅ Appear in FabTalent search",
        "✅ Receive merchandising requests",
        "✅ Basic escrow for project payments",
      ],
    },
    silver: {
      requirements: [
        "👔 Detailed portfolio — 5 project case studies",
        "🎯 30-minute video interview with senior FabVerify merchandiser panel",
        "📊 Skill test — costing and consumption calculation",
        "👥 2 brand client references",
        "📹 Interview with industry panel",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ Interview verified badge",
        "✅ Priority placement in search",
        "✅ Access to enterprise brand projects",
        "✅ Seasonal project guarantee",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏆 10+ completed projects with 5-star ratings",
        "💰 Minimum ₹50L GMV managed through FabVerify",
        "📊 FabScore above 9.0",
        "🌍 International buyer experience preferred",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ International brand access",
        "✅ Senior merchandiser badge",
        "✅ Dedicated account manager",
      ],
    },
  },

  qc_inspector: {
    bronze: {
      requirements: [
        "📱 Mobile number verification",
        "🪪 Aadhaar verification",
        "🔍 Experience summary and inspection types",
        "📋 Sample inspection report submitted",
      ],
      benefits: [
        "✅ Appear in QC Inspector search",
        "✅ Receive inspection job requests",
        "✅ Basic escrow per inspection",
      ],
    },
    silver: {
      requirements: [
        "🔍 Extended portfolio — 5 inspection reports",
        "🎯 Practical skill test — identify defects in test garments",
        "📋 Quality standards knowledge test (AQL, ISO)",
        "👥 3 client references",
        "📍 Cities available verified",
      ],
      benefits: [
        "✅ Everything in Bronze",
        "✅ AQL certified badge",
        "✅ Priority job matching",
        "✅ Access to enterprise inspection jobs",
        "✅ Digital inspection report templates",
      ],
    },
    gold: {
      requirements: [
        "📋 Everything in Silver",
        "🏆 20+ completed inspections with 5-star ratings",
        "🏅 ISO 9001 or equivalent certification",
        "📊 FabScore above 9.0",
        "🌍 International inspection experience preferred",
      ],
      benefits: [
        "✅ Everything in Silver",
        "✅ International audit assignments",
        "✅ SMETA/SA8000 certified badge",
        "✅ Dedicated account manager",
        "✅ Annual skill re-certification",
      ],
    },
  },
};

const SUBTITLES: Record<UserType, string> = {
  buyer: "Build trust with manufacturers. Unlock credit. Get better prices.",
  manufacturer:
    "Get verified to appear in search. Unlock credit. Attract international buyers.",
  fabric_mill:
    "Get verified to attract brands. Unlock credit. Access international buyers.",
  trim_supplier: "Get verified to attract manufacturers. Unlock credit.",
  artisan:
    "Get verified to showcase your craft. Access premium brands. Unlock GI tag status.",
  job_worker: "Get verified to attract manufacturers. Unlock credit.",
  designer:
    "Get FabTalent verified. Access premium brands. Unlock high-value projects.",
  master: "Get skill-verified as a Master. Access premium sampling projects.",
  merchandiser: "Get interview-verified. Access premium brand clients.",
  qc_inspector:
    "Get skill-tested as a QC Inspector. Access premium factory inspection bookings.",
};

const STATUS_MESSAGES: Record<UserType, string> = {
  buyer:
    "You are verified as a Bronze Brand Builder. Upgrade to Silver to unlock FabPay Later and a ₹2L credit limit.",
  manufacturer:
    "You are verified as a Bronze Manufacturer. Upgrade to Silver to unlock FabFloat and start receiving more orders.",
  fabric_mill:
    "You are verified as a Bronze Fabric Mill. Upgrade to Silver to unlock FabMaterial credit and priority in fabric search.",
  trim_supplier:
    "You are verified as a Bronze Trim Supplier. Upgrade to Silver to unlock credit access and priority in trim search.",
  artisan:
    "You are verified as a Bronze Artisan. Upgrade to Silver to become GI Tag eligible and reach premium brands.",
  job_worker:
    "You are verified as a Bronze Job Worker. Upgrade to Silver to unlock credit access and priority in job work search.",
  designer:
    "You are verified as a Bronze Designer. Upgrade to Silver through our FabTalent skill test to get the Verified Designer badge.",
  master:
    "You are verified as a Bronze Master. Upgrade to Silver through a physical skill assessment to get the Verified Master badge.",
  merchandiser:
    "You are verified as a Bronze Merchandiser. Upgrade to Silver through a panel interview to get the Verified Merchandiser badge.",
  qc_inspector:
    "You are verified as a Bronze QC Inspector. Upgrade to Silver through our skill test to get the Verified QC Inspector badge.",
};

type BenefitGroup = "buyer" | "manufacturer" | "artisan" | "talent";

const BENEFIT_GROUP: Record<UserType, BenefitGroup> = {
  buyer: "buyer",
  manufacturer: "manufacturer",
  fabric_mill: "manufacturer",
  trim_supplier: "manufacturer",
  job_worker: "manufacturer",
  artisan: "artisan",
  designer: "talent",
  master: "talent",
  merchandiser: "talent",
  qc_inspector: "talent",
};

const BENEFIT_CARDS_BY_GROUP: Record<
  BenefitGroup,
  { icon: string; title: string; desc: string }[]
> = {
  buyer: [
    {
      icon: "🔍",
      title: "Find verified manufacturers",
      desc: "Verified profiles appear higher in search results. Gold verified = top of search.",
    },
    {
      icon: "💳",
      title: "Buy now pay later",
      desc: "Silver unlocks ₹2L credit via FabPay Later. Gold unlocks ₹10L. No bank needed.",
    },
    {
      icon: "🌍",
      title: "Source globally",
      desc: "Gold verified brands get access to international manufacturers from the UK, EU, and USA.",
    },
  ],
  manufacturer: [
    {
      icon: "🔍",
      title: "Get found by brands",
      desc: "Verified profiles appear higher in search results. Gold verified = top of search.",
    },
    {
      icon: "💳",
      title: "Get paid in 48 hours",
      desc: "FabFloat pays you in 48 hours. Silver unlocks ₹2L raw material credit, Gold unlocks ₹10L.",
    },
    {
      icon: "🌍",
      title: "Sell to global brands",
      desc: "Gold verified profiles get access to international buyers from the UK, EU, and USA.",
    },
  ],
  artisan: [
    {
      icon: "🔍",
      title: "Sell directly to brands",
      desc: "Verified artisan profiles appear higher in search results. Gold verified = top of search.",
    },
    {
      icon: "💳",
      title: "No middlemen taking commission",
      desc: "Silver unlocks a fair price guarantee and raw material credit. Gold unlocks ₹10L.",
    },
    {
      icon: "🌍",
      title: "Global craft buyers",
      desc: "Gold verified artisans get access to international brands from the UK, EU, and USA.",
    },
  ],
  talent: [
    {
      icon: "🔍",
      title: "Get hired by top brands",
      desc: "Verified profiles appear higher in search results. Gold verified = top of search.",
    },
    {
      icon: "💳",
      title: "Secure project payments",
      desc: "Basic escrow protects every project. Silver and Gold unlock priority and premium clients.",
    },
    {
      icon: "🌍",
      title: "Work with global brands",
      desc: "Gold verified talent gets access to international brand clients from the UK, EU, and USA.",
    },
  ],
};

const STATS_BY_GROUP: Record<BenefitGroup, { value: string; label: string }[]> = {
  buyer: [
    { value: "847", label: "Manufacturers verified" },
    { value: "4.9", label: "Average FabScore" },
    { value: "98%", label: "Platform satisfaction" },
  ],
  manufacturer: [
    { value: "1,200+", label: "Brands on platform" },
    { value: "₹2.4Cr", label: "Average annual orders" },
    { value: "94%", label: "On-time payment rate" },
  ],
  artisan: [
    { value: "1,200+", label: "Brands on platform" },
    { value: "₹2.4Cr", label: "Average annual orders" },
    { value: "94%", label: "On-time payment rate" },
  ],
  talent: [
    { value: "500+", label: "Projects completed" },
    { value: "4.8", label: "Average client rating" },
    { value: "₹45,000", label: "Average project value" },
  ],
};

function getBenefitCards(userType: UserType) {
  return BENEFIT_CARDS_BY_GROUP[BENEFIT_GROUP[userType]];
}

function getVerificationStats(userType: UserType) {
  return STATS_BY_GROUP[BENEFIT_GROUP[userType]];
}

function parseRequirement(raw: string): Requirement {
  const spaceIndex = raw.indexOf(" ");
  return { icon: raw.slice(0, spaceIndex), text: raw.slice(spaceIndex + 1) };
}

function parseBenefit(raw: string): Feature {
  const spaceIndex = raw.indexOf(" ");
  return { ok: raw.startsWith("✅"), text: raw.slice(spaceIndex + 1) };
}

function FeatureRow({ ok, text }: Feature) {
  return (
    <div className="flex items-start gap-2 text-[13px]">
      <span className={ok ? "text-primary" : "text-red-400"}>
        {ok ? "✅" : "❌"}
      </span>
      <span className={ok ? "text-text-primary" : "text-text-secondary"}>
        {text}
      </span>
    </div>
  );
}

function RequirementRow({ icon, text }: Requirement) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function TierCard({
  accentColor,
  emoji,
  name,
  subtitle,
  priceTag,
  benefits,
  requirements,
  recommended,
  footer,
}: {
  accentColor: string;
  emoji: string;
  name: string;
  subtitle: string;
  priceTag: string;
  benefits: Feature[];
  requirements: Requirement[];
  recommended?: boolean;
  footer: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-[12px] bg-card p-5"
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      {recommended && (
        <span className="absolute right-4 top-4 rounded-[20px] bg-primary px-3 py-1 text-[11px] font-bold text-navy">
          ⭐ Recommended
        </span>
      )}

      <h3
        className="font-display text-lg font-bold"
        style={{ color: accentColor }}
      >
        {emoji} {name}
      </h3>
      <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
      <span className="mt-2 inline-block rounded-[20px] border border-border-dark bg-background px-2.5 py-1 text-[11px] text-text-secondary">
        {priceTag}
      </span>

      <div className="mt-4 flex flex-col gap-1.5 border-t border-border-dark pt-4">
        {benefits.map((b) => (
          <FeatureRow key={b.text} ok={b.ok} text={b.text} />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-1.5 border-t border-border-dark pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Requirements
        </p>
        {requirements.map((r) => (
          <RequirementRow key={r.text} icon={r.icon} text={r.text} />
        ))}
      </div>

      <div className="mt-4 border-t border-border-dark pt-4">{footer}</div>
    </div>
  );
}

export default function Verification() {
  const { user, mounted } = useUser();
  const pathname = usePathname();
  const userType = mounted ? user.userType : "buyer";
  const config = VERIFICATION_CONFIG[userType];

  const [verificationData, setVerificationData] = useState<{
    currentTier: string;
    status: string;
    bronzeVerifiedAt: string | null;
    silverVerifiedAt: string | null;
    goldVerifiedAt: string | null;
    latestApplication: { tier: string; status: string } | null;
  } | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [bronzeSubmitting, setBronzeSubmitting] = useState(false);

  const loadVerification = async () => {
    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) {
      setVerificationLoading(false);
      return;
    }
    try {
      const res = await authFetch(`/api/verification?phone=${encodeURIComponent(auth.phone)}`);
      if (res.ok) {
        const { verification } = await res.json();
        setVerificationData(verification);
      }
    } catch (error) {
      console.error("Failed to load verification status:", error);
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    loadVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBronzeVerified = async () => {
    const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
    if (!auth.phone) return;
    setBronzeSubmitting(true);
    try {
      await authFetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: auth.phone, tier: "bronze", documents: {} }),
      });
      await loadVerification();
    } catch (error) {
      console.error("Failed to submit bronze verification:", error);
    }
    setBronzeSubmitting(false);
  };

  const isBronzeDone = Boolean(
    verificationData?.bronzeVerifiedAt ||
      ["bronze", "silver", "gold"].includes(verificationData?.currentTier ?? "")
  );
  const isSilverDone = Boolean(
    verificationData?.silverVerifiedAt || ["silver", "gold"].includes(verificationData?.currentTier ?? "")
  );
  const isGoldDone = Boolean(
    verificationData?.goldVerifiedAt || verificationData?.currentTier === "gold"
  );
  const isSilverUnderReview =
    verificationData?.latestApplication?.tier === "silver" &&
    verificationData?.latestApplication?.status === "pending";
  const isGoldUnderReview =
    verificationData?.latestApplication?.tier === "gold" &&
    verificationData?.latestApplication?.status === "pending";

  const bronzeRequirements = config.bronze.requirements.map(parseRequirement);
  const bronzeBenefits = config.bronze.benefits.map(parseBenefit);
  const silverRequirements = config.silver.requirements.map(parseRequirement);
  const silverBenefits = config.silver.benefits.map(parseBenefit);
  const goldRequirements = config.gold.requirements.map(parseRequirement);
  const goldBenefits = config.gold.benefits.map(parseBenefit);

  const unlockItems = silverBenefits
    .filter((b) => b.ok && b.text !== "Everything in Bronze")
    .map((b) => b.text);

  const [resumeAvailable, setResumeAvailable] = useState(false);
  useEffect(() => {
    try {
      const savedRegion = localStorage.getItem("fabverify_user_region");
      setResumeAvailable(Boolean(savedRegion));
    } catch {}
  }, []);

  const resumeBanner = resumeAvailable && (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-primary/50 bg-primary/10 px-4 py-3">
      <p className="text-sm text-text-primary">You have a verification in progress</p>
      <Link href="/verification/identity" className="text-sm font-bold text-primary">
        Resume verification →
      </Link>
    </div>
  );

  const CURRENT_TIER_DISPLAY: Record<string, { emoji: string; label: string; color: string }> = {
    gold: { emoji: "🥇", label: "Gold Verified", color: "#f2ca50" },
    silver: { emoji: "🥈", label: "Silver Verified", color: "#94a3b8" },
    bronze: { emoji: "🥉", label: "Bronze Verified", color: "#CD7F32" },
    none: { emoji: "🔓", label: "Unverified", color: "#7A8FA8" },
  };
  const currentTierDisplay =
    CURRENT_TIER_DISPLAY[verificationData?.currentTier ?? "none"] ?? CURRENT_TIER_DISPLAY.none;

  const currentStatusCard = (
    <div className="rounded-[12px] border border-border-dark bg-card p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Your current tier
          </p>
          <p className="mt-2 font-display text-xl font-bold" style={{ color: currentTierDisplay.color }}>
            {currentTierDisplay.emoji} {currentTierDisplay.label}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {isSilverDone
              ? "You are verified as a Silver member."
              : isBronzeDone
                ? STATUS_MESSAGES[userType]
                : "Complete Bronze verification to get started."}
          </p>
        </div>

        {!isSilverDone && (
          <div>
            <p className="text-xs text-text-secondary">
              Upgrade to Silver to unlock:
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {unlockItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs text-text-secondary"
                >
                  <span className="opacity-60">🔒</span>
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/verification/identity"
              className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-navy"
            >
              Upgrade to Silver →
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const tierCards = (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <TierCard
        accentColor="#CD7F32"
        emoji="🥉"
        name="Bronze"
        subtitle="Identity Verified"
        priceTag="Free • 24-48 hours"
        benefits={bronzeBenefits}
        requirements={bronzeRequirements}
        footer={
          isBronzeDone ? (
            <span className="inline-block rounded-[20px] border border-green-500/60 bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400">
              ✅ Completed
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void getBronzeVerified()}
              disabled={bronzeSubmitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-navy disabled:cursor-not-allowed disabled:bg-primary/40"
            >
              {bronzeSubmitting ? "Submitting..." : "Get Bronze Verified →"}
            </button>
          )
        }
      />

      <TierCard
        accentColor="#94a3b8"
        emoji="🥈"
        name="Silver"
        subtitle="Business Verified"
        priceTag="₹999 • 2-3 days"
        recommended
        benefits={silverBenefits}
        requirements={silverRequirements}
        footer={
          isSilverDone ? (
            <span className="inline-block rounded-[20px] border border-green-500/60 bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400">
              ✅ Completed
            </span>
          ) : isSilverUnderReview ? (
            <span className="inline-block rounded-[20px] border border-amber-500/60 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-400">
              ⏳ Under Review
            </span>
          ) : (
            <>
              <Link
                href="/verification/identity"
                className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-bold text-navy"
              >
                → Start Verification
              </Link>
              <p className="mt-2 text-center text-[11px] text-text-secondary">
                ₹999 one-time fee
              </p>
            </>
          )
        }
      />

      <TierCard
        accentColor="#f2ca50"
        emoji="🥇"
        name="Gold"
        subtitle="Fully Audited"
        priceTag="₹4,999 • 5-7 days"
        benefits={goldBenefits}
        requirements={goldRequirements}
        footer={
          <>
            <p className="text-[12px] font-semibold text-text-primary">
              Gold verification includes everything in Silver plus:
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {[
                "Physical factory visit by FabVerify field officer",
                "Video recording of factory floor",
                "Annual audit report",
                "EU compliance certificate eligibility",
              ].map((line) => (
                <li key={line} className="text-[11px] text-text-secondary">
                  • {line}
                </li>
              ))}
            </ul>

            {isGoldDone ? (
              <span className="mt-4 inline-block rounded-[20px] border border-green-500/60 bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400">
                ✅ Completed
              </span>
            ) : isGoldUnderReview ? (
              <span className="mt-4 inline-block rounded-[20px] border border-amber-500/60 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-400">
                ⏳ Under Review
              </span>
            ) : isSilverDone ? (
              <Link
                href="/verification/identity?tier=gold"
                className="mt-4 block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-bold text-navy"
              >
                Start Gold Verification →
              </Link>
            ) : (
              <p className="mt-4 text-center text-[12px] text-text-secondary">
                Complete Silver first
              </p>
            )}
          </>
        }
      />
    </div>
  );

  const centreContent = (
    <>
      {resumeBanner}
      {currentStatusCard}
      {tierCards}
    </>
  );

  const benefitCards = getBenefitCards(userType);
  const verificationStats = getVerificationStats(userType);

  const rightPanel = (
    <>
      <p className="text-base font-bold text-white">Why Get Verified?</p>
      <div className="mt-4 flex flex-col gap-3">
        {benefitCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[8px] border border-border-dark bg-background p-3"
          >
            <p className="text-xs font-bold text-text-primary">
              {card.icon} {card.title}
            </p>
            <p className="mt-1 text-[11px] text-text-secondary">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Verified on FabVerify</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {verificationStats.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-xl font-bold text-primary">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-base font-bold text-white">Questions?</p>
      <p className="mt-2 text-xs text-text-secondary">
        Our verification team is available Monday to Saturday, 10am to 6pm
      </p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-text-secondary">
        <span>📱 WhatsApp: +91 98765 43210</span>
        <span>📧 verify@fabverify.com</span>
      </div>
      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary"
      >
        Chat with us →
      </button>
    </>
  );

  const subtitle = SUBTITLES[userType];

  const centrePanel = (
    <>
      <TopBar title="Get Verified" subtitle={subtitle} />

      <div className="px-6 py-6">{centreContent}</div>
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
            Get Verified
          </h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">{subtitle}</p>

          <div className="mt-5">{centreContent}</div>
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
