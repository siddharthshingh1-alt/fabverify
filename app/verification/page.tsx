import Link from "next/link";
import ThreePanelLayout from "../components/ThreePanelLayout";

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", active: false },
  { icon: "📦", label: "Orders", active: false },
  { icon: "🔍", label: "Discover", active: false },
  { icon: "👔", label: "Merch", active: false },
  { icon: "👤", label: "Profile", active: false },
];

const UNLOCK_ITEMS = [
  "FabFloat — Get paid instantly",
  "FabPay Later — Buy now pay later",
  "₹2L credit limit",
  "Priority in search results",
];

type Feature = { ok: boolean; text: string };
type Requirement = { icon: string; text: string };

const BRONZE_BENEFITS: Feature[] = [
  { ok: true, text: "Listed on FabVerify" },
  { ok: true, text: "Basic profile visible" },
  { ok: true, text: "Can post sample briefs" },
  { ok: true, text: "Can receive enquiries" },
  { ok: false, text: "No credit access" },
  { ok: false, text: "Lower search ranking" },
];

const BRONZE_REQUIREMENTS: Requirement[] = [
  { icon: "📱", text: "Mobile number (done)" },
  { icon: "🪪", text: "Aadhaar verification" },
  { icon: "📋", text: "PAN card" },
];

const SILVER_BENEFITS: Feature[] = [
  { ok: true, text: "Everything in Bronze" },
  { ok: true, text: "FabFloat access" },
  { ok: true, text: "FabPay Later access" },
  { ok: true, text: "₹2L credit limit" },
  { ok: true, text: "Higher search ranking" },
  { ok: true, text: "Verified business badge" },
  { ok: false, text: "No physical audit" },
];

const SILVER_REQUIREMENTS: Requirement[] = [
  { icon: "📋", text: "GST certificate" },
  { icon: "🏭", text: "Business registration" },
  { icon: "👥", text: "2 client references" },
  { icon: "📹", text: "Video spot check call" },
];

const GOLD_BENEFITS: Feature[] = [
  { ok: true, text: "Everything in Silver" },
  { ok: true, text: "₹10L credit limit" },
  { ok: true, text: "Top search ranking" },
  { ok: true, text: "Gold badge on profile" },
  { ok: true, text: "Physical factory audit" },
  { ok: true, text: "EU compliance certificate" },
  { ok: true, text: "International buyer access" },
  { ok: true, text: "FabVerify field officer visit" },
];

const GOLD_REQUIREMENTS: Requirement[] = [
  { icon: "📋", text: "Everything in Silver" },
  { icon: "🏭", text: "Physical factory visit" },
  { icon: "✅", text: "Production capacity check" },
  { icon: "📊", text: "Quality assessment" },
  { icon: "🏅", text: "Certifications check" },
];

const BENEFIT_CARDS = [
  {
    icon: "🔍",
    title: "More Visibility",
    desc: "Verified manufacturers appear higher in search results. Gold verified = top of search.",
  },
  {
    icon: "💳",
    title: "Credit Access",
    desc: "Silver unlocks ₹2L credit. Gold unlocks ₹10L. Platinum unlocks ₹50L+. No bank needed.",
  },
  {
    icon: "🌍",
    title: "International Buyers",
    desc: "Gold verified manufacturers get access to international buyers from UK, EU, and USA who require audited supply chains.",
  },
];

const VERIFICATION_STATS = [
  { value: "847", label: "Manufacturers verified" },
  { value: "4.9", label: "Average FabScore" },
  { value: "98%", label: "Buyer satisfaction" },
];

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
        <p className="mt-1 text-xs text-text-secondary">Identity verified</p>
      </div>

      <div>
        <p className="text-xs text-text-secondary">
          Upgrade to Silver to unlock:
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          {UNLOCK_ITEMS.map((item) => (
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
      benefits={BRONZE_BENEFITS}
      requirements={BRONZE_REQUIREMENTS}
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
      benefits={SILVER_BENEFITS}
      requirements={SILVER_REQUIREMENTS}
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
      benefits={GOLD_BENEFITS}
      requirements={GOLD_REQUIREMENTS}
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

const rightPanel = (
  <>
    <p className="text-base font-bold text-white">Why Get Verified?</p>
    <div className="mt-4 flex flex-col gap-3">
      {BENEFIT_CARDS.map((card) => (
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
      {VERIFICATION_STATS.map((stat) => (
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

const centrePanel = (
  <>
    <div
      className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border-dark px-6 py-4"
      style={{ backgroundColor: "#07122a" }}
    >
      <div>
        <h1 className="font-display text-xl font-bold text-white">
          Get Verified
        </h1>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Build trust. Unlock credit. Get more orders.
        </p>
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="text-lg text-text-primary"
      >
        🔔
      </button>
    </div>

    <div className="px-6 py-6">{centreContent}</div>
  </>
);

export default function Verification() {
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
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Build trust. Unlock credit. Get more orders.
          </p>

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
