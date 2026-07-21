"use client";

import Link from "next/link";
import { useTypeGuard } from "@/app/hooks/useTypeGuard";
import { useUser } from "@/app/context/UserContext";
import ThreePanelLayout from "@/app/components/ThreePanelLayout";
import TopBar from "@/app/components/TopBar";
import { trimPrices } from "@/app/data/fabprice";
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
  trimType: string;
  quantity: string;
  stage: string;
  due: string;
  status: Status;
}[] = [
  { id: "SUP-2024-001", buyer: "Jaipur Ethnic Works", trimType: "Metal Buttons 4-hole 15mm", quantity: "5,000 pcs", stage: "In Production", due: "Jul 10", status: "In Progress" },
  { id: "SUP-2024-002", buyer: "Delhi Woven Works", trimType: "Invisible Zip 20cm Black", quantity: "2,000 pcs", stage: "Pending Dispatch", due: "Jul 5", status: "Ready" },
];

const EXTRA_TRIM_PRICES = [
  { name: "Invisible Zip 20cm", price: "₹12–18/pc" },
  { name: "Woven Label", price: "₹2–4/pc" },
];

export default function SupplierDashboard() {
  const authorized = useTypeGuard("trim_supplier");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const isNew = user.verificationTier === "unverified";
  const enquiries = getEnquiries("trim_supplier").slice(0, 3);

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
            <StatCard value="7,000 pcs" label="Trims Dispatched This Month" valueClass="text-primary" />
            <StatCard value="₹68,000" label="Pending Payments" valueClass="text-amber-400" />
            <StatCard value="4" label="Sample Requests" valueClass="text-primary" />
          </StatGrid>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Orders</h2>
          {isNew ? (
            <EmptyState message="No supply orders yet. Trim orders from manufacturers will appear here." />
          ) : (
            <TableShell columns={["Order", "Buyer", "Trim Type", "Quantity", "Stage", "Due"]} minWidth={640}>
              {ACTIVE_ORDERS.map((row, index) => (
                <TableRow key={row.id} columns={6} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.id}</span>
                  <span className="text-xs text-text-primary">{row.buyer}</span>
                  <span className="text-xs text-text-secondary">{row.trimType}</span>
                  <span className="text-xs text-text-secondary">{row.quantity}</span>
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
            <TableShell columns={["Name", "Trim Needed", "Quantity", ""]} minWidth={560}>
              {enquiries.map((row, index) => (
                <TableRow key={row.id} columns={4} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.senderName}</span>
                  <span className="text-xs text-text-secondary">{row.category}</span>
                  <span className="text-xs text-text-secondary">{row.quantity}</span>
                  <Link href="/supplier/enquiries" className="w-fit text-xs font-semibold text-primary">
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
      <RightHeading>Trim Market Prices</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        {trimPrices.map((trim) => (
          <PriceRow key={trim.id} label={trim.name} value={trim.price} />
        ))}
        {EXTRA_TRIM_PRICES.map((trim) => (
          <PriceRow key={trim.name} label={trim.name} value={trim.price} />
        ))}
      </div>

      <RightDivider />

      <RightHeading>New Sample Requests</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="font-display text-2xl font-bold text-primary">4</p>
        <p className="mt-1 text-[11px] text-text-secondary">Waiting for samples</p>
      </div>

      <RightDivider />

      <VerificationStatusBlock tier={user.verificationTier} basePath="/supplier" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
