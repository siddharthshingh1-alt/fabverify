"use client";

import Link from "next/link";
import ThreePanelLayout from "../components/ThreePanelLayout";
import TopBar from "../components/TopBar";
import { useUser, type UserType } from "../context/UserContext";

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", active: false },
  { icon: "📦", label: "Orders", active: false },
  { icon: "🔍", label: "Discover", active: false },
  { icon: "👔", label: "Merch", active: false },
  { icon: "👤", label: "Profile", active: false },
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
        "✅ Listed on FabVerify",
        "✅ Receive sample brief requests",
        "✅ Basic escrow protection",
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
        "✅ FabFloat — get paid instantly",
        "✅ FabMaterial — raw material credit",
        "✅ ₹2L credit limit",
        "✅ Higher search ranking",
        "✅ Silver badge on profile",
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
        "✅ Top search ranking",
        "✅ International buyer access (EU, UK, USA)",
        "✅ EU supply chain compliance certificate",
        "✅ Gold badge — highest trust level",
        "✅ FabVerify field officer visit proof",
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
        "✅ Listed as verified fabric supplier",
        "✅ Receive fabric sample requests",
        "✅ Basic order protection",
        "❌ No credit access",
        "❌ Lower search visibility",
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
        "✅ FabMaterial credit access",
        "✅ ₹2L credit limit",
        "✅ Priority in fabric search results",
        "✅ Verified Fabric Mill badge",
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
        "✅ ₹10L credit limit",
        "✅ International brand access",
        "✅ EU fabric compliance certificate",
        "✅ Gold Fabric Mill badge",
        "✅ Sustainable sourcing badge if certified",
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
        "✅ Listed as verified trim supplier",
        "✅ Receive trim sample requests",
        "✅ Basic order protection",
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
        "✅ ₹2L credit limit",
        "✅ Priority in trim search results",
        "✅ Verified Trim Supplier badge",
        "✅ Direct manufacturer enquiries",
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
        "✅ ₹10L credit limit",
        "✅ International brand access",
        "✅ Gold Trim Supplier badge",
        "✅ Bulk order priority matching",
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
        "✅ Listed as verified artisan",
        "✅ Receive craft order requests",
        "✅ Basic payment protection",
        "❌ No GI tag verification",
        "❌ Lower search ranking",
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
        "✅ GI Tag eligible badge",
        "✅ FabTalent artisan listing",
        "✅ Premium brand access",
        "✅ ₹2L credit limit",
        "✅ Verified Artisan badge",
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
        "✅ GI Certified badge",
        "✅ International buyer access",
        "✅ Premium artisan showcase",
        "✅ ₹10L credit limit",
        "✅ EU ethical sourcing certificate",
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
        "✅ Listed as verified job worker",
        "✅ Receive job work requests",
        "✅ Basic payment protection",
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
        "✅ ₹2L credit limit",
        "✅ Priority in job work search",
        "✅ Verified Job Worker badge",
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
        "✅ ₹10L credit limit",
        "✅ Gold Job Worker badge",
        "✅ Priority matching with manufacturers",
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
        "✅ Listed as FabTalent Designer",
        "✅ Receive design hire requests",
        "✅ Basic payment protection",
        "❌ Unverified tag on profile",
        "❌ Lower search ranking",
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
        "✅ FabTalent Verified Designer badge",
        "✅ Access to premium brand clients",
        "✅ ₹2L credit limit",
        "✅ Priority in designer search results",
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
        "✅ FabTalent Gold Designer badge",
        "✅ International brand access",
        "✅ Top of designer search results",
        "✅ ₹10L credit limit",
        "✅ Exclusive high-value projects",
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
        "✅ Listed as FabTalent Master",
        "✅ Receive sample making requests",
        "✅ Basic payment protection",
        "❌ Unverified tag on profile",
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
        "✅ FabTalent Verified Master badge",
        "✅ Access to premium brand projects",
        "✅ ₹2L credit limit",
        "✅ Priority in master search results",
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
        "✅ FabTalent Gold Master badge",
        "✅ Luxury brand project access",
        "✅ Top of master search results",
        "✅ ₹10L credit limit",
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
        "✅ Listed as FabTalent Merchandiser",
        "✅ Receive hire requests",
        "✅ Basic payment protection",
        "❌ Unverified tag",
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
        "✅ FabTalent Verified Merchandiser badge",
        "✅ Premium brand client access",
        "✅ ₹2L credit limit",
        "✅ Priority in merchandiser search",
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
        "✅ FabTalent Gold Merchandiser badge",
        "✅ International brand access",
        "✅ ₹10L credit limit",
        "✅ Top of merchandiser search",
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
        "✅ Listed as FabTalent QC Inspector",
        "✅ Receive inspection booking requests",
        "✅ Basic payment protection",
        "❌ Unverified tag on profile",
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
        "✅ FabTalent Verified QC Inspector badge",
        "✅ Access to premium factory bookings",
        "✅ ₹2L credit limit",
        "✅ Priority in QC inspector search",
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
        "✅ FabTalent Gold QC Inspector badge",
        "✅ International brand inspection access",
        "✅ ₹10L credit limit",
        "✅ Top of QC inspector search",
        "✅ EU audit approved inspector",
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

const COUNTERPARTY_LABEL: Record<UserType, string> = {
  buyer: "manufacturers",
  manufacturer: "buyers",
  fabric_mill: "buyers",
  trim_supplier: "manufacturers",
  artisan: "buyers",
  job_worker: "manufacturers",
  designer: "brands",
  master: "brands",
  merchandiser: "brands",
  qc_inspector: "factories",
};

function getBenefitCards(userType: UserType) {
  const counterparty = COUNTERPARTY_LABEL[userType];
  return [
    {
      icon: "🔍",
      title: "More Visibility",
      desc: "Verified profiles appear higher in search results. Gold verified = top of search.",
    },
    {
      icon: "💳",
      title: "Credit Access",
      desc: "Silver unlocks ₹2L credit. Gold unlocks ₹10L. Platinum unlocks ₹50L+. No bank needed.",
    },
    {
      icon: "🌍",
      title: "International Reach",
      desc: `Gold verified profiles get access to international ${counterparty} from UK, EU, and USA who require verified partners.`,
    },
  ];
}

function getVerificationStats(userType: UserType) {
  const counterparty = COUNTERPARTY_LABEL[userType];
  const capitalized = counterparty.charAt(0).toUpperCase() + counterparty.slice(1);
  return [
    { value: "847", label: `${capitalized} verified` },
    { value: "4.9", label: "Average FabScore" },
    { value: "98%", label: "Platform satisfaction" },
  ];
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
  const userType = mounted ? user.userType : "buyer";
  const config = VERIFICATION_CONFIG[userType];

  const bronzeRequirements = config.bronze.requirements.map(parseRequirement);
  const bronzeBenefits = config.bronze.benefits.map(parseBenefit);
  const silverRequirements = config.silver.requirements.map(parseRequirement);
  const silverBenefits = config.silver.benefits.map(parseBenefit);
  const goldRequirements = config.gold.requirements.map(parseRequirement);
  const goldBenefits = config.gold.benefits.map(parseBenefit);

  const unlockItems = silverBenefits
    .filter((b) => b.ok && b.text !== "Everything in Bronze")
    .map((b) => b.text);

  const currentStatusCard = (
    <div className="rounded-[12px] border border-border-dark bg-card p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Your current tier
          </p>
          <p className="mt-2 font-display text-xl font-bold text-[#CD7F32]">
            🥉 Bronze Verified
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {STATUS_MESSAGES[userType]}
          </p>
        </div>

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
            href="/verification/silver"
            className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-navy"
          >
            Upgrade to Silver →
          </Link>
        </div>
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
          <span className="inline-block rounded-[20px] border border-green-500/60 bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400">
            ✅ Completed
          </span>
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
          <>
            <Link
              href="/verification/silver"
              className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-bold text-navy"
            >
              → Start Verification
            </Link>
            <p className="mt-2 text-center text-[11px] text-text-secondary">
              ₹999 one-time fee
            </p>
          </>
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
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-border-dark bg-background py-2.5 text-sm font-semibold text-text-secondary"
          >
            Complete Silver first
          </button>
        }
      />
    </div>
  );

  const centreContent = (
    <>
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
