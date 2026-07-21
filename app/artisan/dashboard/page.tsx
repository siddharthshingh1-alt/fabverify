"use client";

import { useTypeGuard } from "@/app/hooks/useTypeGuard";
import { useUser } from "@/app/context/UserContext";
import ThreePanelLayout from "@/app/components/ThreePanelLayout";
import TopBar from "@/app/components/TopBar";
import {
  StatGrid,
  StatCard,
  TableShell,
  TableRow,
  EmptyState,
  OnboardingCard,
  RightHeading,
  RightDivider,
  PriceRow,
} from "@/app/components/dashboard/DashboardKit";

const ACTIVE_ORDERS = [
  { id: "SUP-2024-021", brand: "Studio Kavya", craftType: "Chikankari Embroidery", pieces: "200 pieces", due: "Jul 12", payment: "₹24,000" },
  { id: "SUP-2024-022", brand: "House of Nira", craftType: "Block Print", pieces: "150 pieces", due: "Jul 6", payment: "₹12,750" },
];

const CRAFT_MARKET_RATES = [
  { craft: "Chikankari", rate: "₹85–140/pc" },
  { craft: "Block Print", rate: "₹60–100/pc" },
  { craft: "Hand Embroidery", rate: "₹300–600/pc" },
];

const GOVT_SCHEMES = [
  { name: "PM Vishwakarma Yojana", detail: "Skill certification + collateral-free loans up to ₹3 lakh" },
  { name: "GI Tag Registration Support", detail: "Free assistance for Geographical Indication tagging" },
];

export default function ArtisanDashboard() {
  const authorized = useTypeGuard("artisan");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const isNew = user.verificationTier === "unverified";

  const craftBusinessSection = isNew ? (
    <OnboardingCard
      heading="Welcome to FabVerify"
      description="You are now connected directly to brands who want to pay fair prices for authentic craft work. No middlemen."
      steps={[
        { title: "Add your craft specialisation", linkLabel: "Tell brands what you make", href: "/artisan/profile" },
        { title: "Upload portfolio photos", linkLabel: "Show your best work", href: "/artisan/profile" },
        { title: "Get GI Tag verified if applicable", linkLabel: "Boost trust with buyers", href: "/artisan/verification" },
        { title: "Start receiving enquiries", linkLabel: "Brands can now find you", href: "/artisan/enquiries" },
      ]}
    />
  ) : (
    <StatGrid>
      <StatCard value="2" label="Active Orders" />
      <StatCard value="350" label="Pieces In Progress" />
      <StatCard value="₹12,000" label="Total Earned This Month" valueClass="text-green-400" />
      <StatCard value="8.7" label="FabScore" valueClass="text-primary" />
    </StatGrid>
  );

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is your craft business today"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Your Craft Business</h2>
        {craftBusinessSection}

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Craft Orders</h2>
          {isNew ? (
            <EmptyState message="No craft orders yet. Join FabTalent to get hired for projects." />
          ) : (
            <TableShell columns={["Order", "Brand", "Craft Type", "Pieces", "Due", "Payment"]} minWidth={640}>
              {ACTIVE_ORDERS.map((row, index) => (
                <TableRow key={row.id} columns={6} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.id}</span>
                  <span className="text-xs text-text-primary">{row.brand}</span>
                  <span className="text-xs text-text-secondary">{row.craftType}</span>
                  <span className="text-xs text-text-secondary">{row.pieces}</span>
                  <span className="text-xs text-text-secondary">{row.due}</span>
                  <span className="text-xs font-semibold text-primary">{row.payment}</span>
                </TableRow>
              ))}
            </TableShell>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">What You Are Earning</h2>
          {isNew ? (
            <EmptyState message="Complete your first order to see how direct brand work compares to going through a middleman." />
          ) : (
            <div className="rounded-[10px] border border-primary bg-green-500/10 p-5">
              <p className="text-sm font-semibold text-green-400">
                You earned ₹12,000 this month directly from brands. Through a
                middleman you would have earned ₹4,000 for the same work.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <RightHeading>Craft Work Market Rates</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        {CRAFT_MARKET_RATES.map((rate) => (
          <PriceRow key={rate.craft} label={rate.craft} value={rate.rate} />
        ))}
      </div>

      <RightDivider />

      <RightHeading>Government Schemes You Qualify For</RightHeading>
      <div className="mt-3 flex flex-col gap-3">
        {GOVT_SCHEMES.map((scheme) => (
          <div key={scheme.name} className="rounded-[6px] border border-border-dark bg-background p-2.5">
            <p className="text-xs font-bold text-text-primary">{scheme.name}</p>
            <p className="mt-1 text-[11px] text-text-secondary">{scheme.detail}</p>
          </div>
        ))}
      </div>

      <RightDivider />

      <RightHeading>Message From Studio Kavya</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="text-xs text-text-secondary">
          &ldquo;Loved the chikankari samples! Can we discuss the next batch?&rdquo;
        </p>
        <p className="mt-2 text-[11px] text-text-secondary">2 hours ago</p>
      </div>
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
