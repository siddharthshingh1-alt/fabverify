import Link from "next/link";

const WORKSPACE_NAV = [
  { icon: "🏠", label: "Home", href: "/dashboard", active: true },
  { icon: "📦", label: "My Orders", href: "/orders" },
  { icon: "🧵", label: "Find Manufacturers", href: "/manufacturers" },
  { icon: "👔", label: "FabMerch", href: "/fabmerch" },
  { icon: "💳", label: "FabScore & Credit", href: "/credit" },
];

const TOOLS_NAV = [
  { icon: "📋", label: "Sample Briefs", href: "/samples" },
  { icon: "💰", label: "FabPrice", href: "/fabprice" },
  { icon: "📊", label: "Analytics", href: "/analytics" },
];

const QUICK_ACTIONS = [
  {
    icon: "🔍",
    title: "Find a Manufacturer",
    description: "Browse 200+ verified manufacturers",
    href: "/manufacturers",
  },
  {
    icon: "📋",
    title: "Post Sample Brief",
    description: "Get samples from multiple vendors",
    href: "/samples",
  },
  {
    icon: "👔",
    title: "Hire a Merchandiser",
    description: "Get expert help per stage",
    href: "/fabmerch",
  },
  {
    icon: "💰",
    title: "Check Market Prices",
    description: "See current fabric and making rates",
    href: "/fabprice",
  },
];

type OnboardingStepStatus = "pending" | "complete";

const ONBOARDING_STEPS: { title: string; status: OnboardingStepStatus }[] = [
  { title: "Complete verification", status: "pending" },
  { title: "Browse manufacturers", status: "pending" },
  { title: "Post your first sample brief", status: "pending" },
];

const TODAY_STATS = [
  { label: "Active Orders", value: 0 },
  { label: "Pending Approvals", value: 0 },
  { label: "Unread Messages", value: 0 },
];

const PRICE_ROWS = [
  { item: "Cotton Lawn (80 GSM)", price: "₹95–₹140/m" },
  { item: "Kurta Making Charge", price: "₹280–₹420/pc" },
  { item: "Chikankari Embroidery", price: "₹85–₹140/pc" },
];

const SUGGESTED_MANUFACTURERS = [
  {
    name: "Jaipur Ethnic Works",
    tag: "Ethnic Wear • Gold Verified",
    rating: "⭐ 4.8",
  },
  {
    name: "Surat Cotton Mills",
    tag: "Cotton Fabric • Silver Verified",
    rating: "⭐ 4.6",
  },
];

const MOBILE_TASK_CARDS = [
  {
    title: "Complete your verification",
    description: "Get your Bronze badge to start transacting",
    cta: "Start verification →",
  },
  {
    title: "Browse manufacturers",
    description: "Find verified manufacturers for your category",
    cta: "Browse →",
  },
  {
    title: "Post a sample brief",
    description: "Get samples from multiple manufacturers at once",
    cta: "Post brief →",
  },
];

const BOTTOM_NAV = [
  { icon: "🏠", label: "Home", active: true },
  { icon: "📦", label: "Orders" },
  { icon: "🔍", label: "Discover" },
  { icon: "👔", label: "Merch" },
  { icon: "👤", label: "Profile" },
];

export default function Dashboard() {
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
              Dashboard
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
            <div className="border-l-[3px] border-primary bg-card p-5">
              <h2 className="text-lg font-bold text-white">
                Welcome to FabVerify, Siddharth! 🎉
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                You are 3 steps away from placing your first order.
              </p>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:gap-6">
                {ONBOARDING_STEPS.map((step, index) => (
                  <div key={step.title} className="flex flex-1 items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9999px] border border-border-dark text-xs font-bold text-text-secondary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {step.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {step.status === "complete" ? "Complete" : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-base font-bold text-white">
                What do you want to do today?
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="block rounded-xl border border-border-dark bg-card p-4 transition-colors hover:border-primary"
                  >
                    <div className="text-2xl">{action.icon}</div>
                    <h3 className="mt-2 text-sm font-bold text-text-primary">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      {action.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-base font-bold text-white">
                Recent Activity
              </h2>
              <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
                <div className="text-5xl">📭</div>
                <p className="mt-4 text-[15px] text-text-primary">
                  No activity yet
                </p>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Your orders, samples, and approvals will appear here
                </p>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Place your first order to get started
                </p>
              </div>
            </div>
          </div>
        </main>

        <aside className="scrollbar-hide flex h-screen w-[280px] shrink-0 flex-col overflow-y-auto border-l border-border-dark bg-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Today
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {TODAY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-secondary">{stat.label}</span>
                <span className="font-bold text-primary">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Market Prices
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {PRICE_ROWS.map((row) => (
              <div
                key={row.item}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-text-secondary">{row.item}</span>
                <span className="whitespace-nowrap font-semibold text-primary">
                  {row.price}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-text-secondary">
            Updated daily from verified transactions
          </p>

          <div className="my-5 h-px bg-border-dark" />

          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
            Suggested For You
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {SUGGESTED_MANUFACTURERS.map((manufacturer) => (
              <div
                key={manufacturer.name}
                className="rounded-[6px] border border-border-dark bg-background p-2.5"
              >
                <div className="text-xl">🏭</div>
                <p className="mt-1 text-xs font-bold text-text-primary">
                  {manufacturer.name}
                </p>
                <p className="text-[11px] text-text-secondary">
                  {manufacturer.tag}
                </p>
                <p className="mt-0.5 text-[11px] text-primary">
                  {manufacturer.rating}
                </p>
                <a
                  href="#"
                  className="mt-1 inline-block text-[11px] font-medium text-primary"
                >
                  View Profile
                </a>
              </div>
            ))}
          </div>
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
            Things to do today
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {MOBILE_TASK_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border-l-2 border-primary bg-card p-4"
              >
                <p className="text-sm font-bold text-text-primary">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {card.description}
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-primary"
                >
                  {card.cta}
                </button>
              </div>
            ))}
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
