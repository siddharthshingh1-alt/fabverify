"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTypeGuard } from "@/app/hooks/useTypeGuard";
import { useUser } from "@/app/context/UserContext";
import ThreePanelLayout from "@/app/components/ThreePanelLayout";
import TopBar from "@/app/components/TopBar";
import { makingCharges } from "@/app/data/fabprice";
import { getEnquiries } from "@/app/data/enquiries";
import { getBulkOrders, type BulkOrder } from "@/app/lib/bulkOrders";
import {
  StatGrid,
  StatCard,
  TableShell,
  TableRow,
  StatusPill,
  EmptyState,
  OnboardingCard,
  RightHeading,
  RightDivider,
  PriceRow,
  VerificationStatusBlock,
  type Status,
} from "@/app/components/dashboard/DashboardKit";

const ACTIVE_ORDERS: {
  id: string;
  brand: string;
  pieces: string;
  stage: string;
  due: string;
  status: Status;
}[] = [
  { id: "MFG-2024-101", brand: "Studio Kavya", pieces: "500 pieces", stage: "Production", due: "Jul 20", status: "In Progress" },
  { id: "MFG-2024-102", brand: "Urban Thread Co.", pieces: "800 pieces", stage: "Sampling", due: "Jul 28", status: "On Track" },
];

const PAYMENT_TRACKER = [
  { order: "MFG-2024-101", amount: "₹84,000", expected: "July 20", status: "In Escrow", color: "text-[#63B3ED]" },
  { order: "MFG-2024-102", amount: "₹1,20,000", expected: "July 25", status: "Pending milestone", color: "text-amber-400" },
];

export default function ManufacturerDashboard() {
  const authorized = useTypeGuard("manufacturer");
  const { user, greeting } = useUser();
  const router = useRouter();
  const [pendingBulkOrders, setPendingBulkOrders] = useState<BulkOrder[]>([]);

  useEffect(() => {
    setPendingBulkOrders(getBulkOrders().filter((order) => order.status === "pending_acceptance"));
  }, []);

  if (!authorized) return null;

  const isNew = user.verificationTier === "unverified";
  const enquiries = getEnquiries("manufacturer");

  const productionSection = isNew ? (
    <OnboardingCard
      heading="Complete your profile to start receiving orders from brands"
      description="Brands can only find and order from verified, complete profiles."
      steps={[
        { title: "Complete verification", linkLabel: "Get bronze verified in minutes", href: "/manufacturer/verification" },
        { title: "Add your product catalogue", linkLabel: "Show brands what you make", href: "/manufacturer/profile" },
        { title: "Set your capacity and MOQ", linkLabel: "Help brands find the right fit", href: "/manufacturer/profile" },
      ]}
    />
  ) : (
    <StatGrid>
      <StatCard value="2" label="Active Orders" />
      <StatCard value="1,300" label="Pieces Due This Week" valueClass="text-primary" />
      <StatCard value="₹2,04,000" label="Pending Payments" valueClass="text-amber-400" />
      <StatCard value="8.4/10" label="FabScore" valueClass="text-primary" />
    </StatGrid>
  );

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is today's production status"
      />

      <div className="px-6 py-6">
        {pendingBulkOrders.length > 0 && (
          <div className="mb-8 flex flex-col gap-4">
            {pendingBulkOrders.map((order) => (
              <div
                key={order.id}
                className="animate-pulse rounded-[10px] border-2 border-primary bg-card p-5"
                style={{ animationDuration: "2.5s" }}
              >
                <p className="text-sm font-bold text-primary">🔔 New Bulk Order Request</p>
                <p className="mt-2 text-[15px] font-bold text-white">
                  {order.styleName} — {order.totalQuantity} pieces
                </p>
                <p className="mt-1 text-sm text-text-secondary">From: {order.brandName}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Value: ₹{order.totalValue.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Delivery:{" "}
                  {new Date(`${order.deliveryDate}T00:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/manufacturer/orders")}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-navy"
                  >
                    View Details →
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/manufacturer/orders")}
                    className="rounded-lg bg-green-500 px-4 py-2 text-xs font-bold text-navy"
                  >
                    Accept Order ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mb-4 text-base font-bold text-white">Today&rsquo;s Production</h2>
        {productionSection}

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Orders Status</h2>
          {isNew ? (
            <EmptyState message="No orders received yet. Complete verification to appear in search results and start receiving orders." />
          ) : (
            <TableShell columns={["Order ID", "Brand", "Pieces", "Stage", "Due Date", "Status"]} minWidth={640}>
              {ACTIVE_ORDERS.map((row, index) => (
                <TableRow key={row.id} columns={6} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.id}</span>
                  <span className="text-xs text-text-primary">{row.brand}</span>
                  <span className="text-xs text-text-secondary">{row.pieces}</span>
                  <span className="text-xs text-text-secondary">{row.stage}</span>
                  <span className="text-xs text-text-secondary">{row.due}</span>
                  <StatusPill status={row.status} />
                </TableRow>
              ))}
            </TableShell>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Payment Tracker</h2>
          {isNew ? (
            <EmptyState message="No payments to track yet. Payments appear here once you accept your first order." />
          ) : (
            <TableShell columns={["Order", "Amount", "Expected Date", "Status"]} minWidth={480}>
              {PAYMENT_TRACKER.map((row, index) => (
                <TableRow key={row.order} columns={4} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.order}</span>
                  <span className="text-xs text-text-primary">{row.amount}</span>
                  <span className="text-xs text-text-secondary">{row.expected}</span>
                  <span className={`text-xs font-semibold ${row.color}`}>{row.status}</span>
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
      <RightHeading>New Enquiries Received</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="font-display text-2xl font-bold text-primary">{enquiries.length}</p>
        <p className="mt-1 text-[11px] text-text-secondary">Waiting for your response</p>
      </div>
      <Link
        href="/manufacturer/enquiries"
        className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        View Enquiries →
      </Link>

      <RightDivider />

      <RightHeading>FabPrice — Making Charges</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        {makingCharges.map((charge) => (
          <PriceRow key={charge.id} label={charge.name} value={charge.prices.medium} />
        ))}
      </div>

      <RightDivider />

      <VerificationStatusBlock tier={user.verificationTier} basePath="/manufacturer" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
