"use client";

import Link from "next/link";
import { useTypeGuard } from "@/app/hooks/useTypeGuard";
import { useUser } from "@/app/context/UserContext";
import ThreePanelLayout from "@/app/components/ThreePanelLayout";
import TopBar from "@/app/components/TopBar";
import { fabricPrices } from "@/app/data/fabprice";
import { getEnquiries } from "@/app/data/enquiries";
import {
  StatGrid,
  StatCard,
  TableShell,
  TableRow,
  StatusPill,
  EmptyState,
  RightHeading,
  RightDivider,
  PriceRow,
  VerificationStatusBlock,
  type Status,
} from "@/app/components/dashboard/DashboardKit";

const ACTIVE_ORDERS: {
  id: string;
  buyer: string;
  fabricType: string;
  metres: string;
  stage: string;
  due: string;
  status: Status;
}[] = [
  { id: "SUP-2024-011", buyer: "Jaipur Ethnic Works", fabricType: "Cotton Lawn 80 GSM", metres: "3,000 m", stage: "Weaving & Dyeing", due: "Jul 8", status: "In Progress" },
  { id: "SUP-2024-012", buyer: "Delhi Woven Works", fabricType: "Linen Blend 180 GSM", metres: "1,500 m", stage: "Pending Dispatch", due: "Jul 4", status: "Ready" },
];

export default function MillDashboard() {
  const authorized = useTypeGuard("fabric_mill");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const isNew = user.verificationTier === "unverified";
  const enquiries = getEnquiries("fabric_mill").slice(0, 3);

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is today's supply snapshot"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Today&rsquo;s Snapshot</h2>
        {isNew ? (
          <EmptyState message="No supply orders yet. Complete your profile and get verified to start receiving orders." />
        ) : (
          <StatGrid>
            <StatCard value="2" label="Active Supply Orders" />
            <StatCard value="4,500 m" label="Fabric Dispatched This Month" valueClass="text-primary" />
            <StatCard value="₹2,52,000" label="Pending Payments" valueClass="text-amber-400" />
            <StatCard value="3" label="Sample Requests" valueClass="text-primary" />
          </StatGrid>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Orders</h2>
          {isNew ? (
            <EmptyState message="No supply orders yet. Orders from manufacturers and brands will appear here." />
          ) : (
            <TableShell columns={["Order", "Buyer", "Fabric Type", "Metres", "Stage", "Due"]} minWidth={640}>
              {ACTIVE_ORDERS.map((row, index) => (
                <TableRow key={row.id} columns={6} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.id}</span>
                  <span className="text-xs text-text-primary">{row.buyer}</span>
                  <span className="text-xs text-text-secondary">{row.fabricType}</span>
                  <span className="text-xs text-text-secondary">{row.metres}</span>
                  <span className="text-xs text-text-secondary">{row.stage}</span>
                  <StatusPill status={row.status} />
                </TableRow>
              ))}
            </TableShell>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Enquiries Waiting</h2>
            <span className="text-[11px] font-semibold text-amber-400">Respond within 4 hours</span>
          </div>
          {enquiries.length === 0 ? (
            <EmptyState message="No enquiries waiting right now. New buyer enquiries will show up here." />
          ) : (
            <TableShell columns={["Name", "Fabric Needed", "Quantity", ""]} minWidth={560}>
              {enquiries.map((row, index) => (
                <TableRow key={row.id} columns={4} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.senderName}</span>
                  <span className="text-xs text-text-secondary">{row.category}</span>
                  <span className="text-xs text-text-secondary">{row.quantity}</span>
                  <Link href="/mill/enquiries" className="w-fit text-xs font-semibold text-primary">
                    Reply →
                  </Link>
                </TableRow>
              ))}
            </TableShell>
          )}
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <RightHeading>Fabric Market Prices</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        {fabricPrices.slice(0, 3).map((fabric) => (
          <PriceRow key={fabric.id} label={fabric.name} value={fabric.prices.medium} />
        ))}
      </div>

      <RightDivider />

      <RightHeading>New Sample Requests</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="font-display text-2xl font-bold text-primary">3</p>
        <p className="mt-1 text-[11px] text-text-secondary">Waiting for swatches</p>
      </div>

      <RightDivider />

      <VerificationStatusBlock tier={user.verificationTier} basePath="/mill" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
