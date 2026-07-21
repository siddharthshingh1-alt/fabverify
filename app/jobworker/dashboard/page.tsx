"use client";

import Link from "next/link";
import { useTypeGuard } from "@/app/hooks/useTypeGuard";
import { useUser } from "@/app/context/UserContext";
import ThreePanelLayout from "@/app/components/ThreePanelLayout";
import TopBar from "@/app/components/TopBar";
import { getEnquiries } from "@/app/data/enquiries";
import {
  StatGrid,
  StatCard,
  TableShell,
  TableRow,
  EmptyState,
  RightHeading,
  RightDivider,
  PriceRow,
  ProgressBar,
  FabScoreBlock,
} from "@/app/components/dashboard/DashboardKit";

const ACTIVE_JOBS = [
  { id: "SUP-2024-031", client: "Jaipur Ethnic Works", processType: "Embroidery", pieces: "1,000 pieces", due: "Jul 11" },
  { id: "SUP-2024-032", client: "Mumbai Denim Studio", processType: "Denim Washing", pieces: "2,000 pieces", due: "Jul 3" },
];

const JOB_WORK_RATES = [
  { process: "Embroidery", rate: "₹25–40/pc" },
  { process: "Printing", rate: "₹15–25/pc" },
  { process: "Finishing", rate: "₹8–12/pc" },
];

export default function JobworkerDashboard() {
  const authorized = useTypeGuard("job_worker");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const isNew = user.verificationTier === "unverified";
  const enquiries = getEnquiries("job_worker");
  const capacityPercent = 65;

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is your job work status today"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Job Work Status</h2>
        {isNew ? (
          <EmptyState message="No job work orders yet. Complete verification to start receiving processing orders." />
        ) : (
          <StatGrid>
            <StatCard value="2" label="Active Jobs" />
            <StatCard value="3,000" label="Pieces Processing" />
            <StatCard value="1" label="Due This Week" valueClass="text-amber-400" />
            <StatCard value="₹25,600" label="Payments Pending" valueClass="text-amber-400" />
          </StatGrid>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Job Orders</h2>
          {isNew ? (
            <EmptyState message="No job work orders yet. Processing orders from manufacturers will appear here." />
          ) : (
            <TableShell columns={["Job", "Client", "Process Type", "Pieces", "Due"]} minWidth={560}>
              {ACTIVE_JOBS.map((row, index) => (
                <TableRow key={row.id} columns={5} index={index}>
                  <span className="text-[13px] font-bold text-white">{row.id}</span>
                  <span className="text-xs text-text-primary">{row.client}</span>
                  <span className="text-xs text-text-secondary">{row.processType}</span>
                  <span className="text-xs text-text-secondary">{row.pieces}</span>
                  <span className="text-xs text-text-secondary">{row.due}</span>
                </TableRow>
              ))}
            </TableShell>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Capacity Tracker</h2>
          <div className="rounded-[10px] border border-border-dark bg-card p-5">
            <p className="text-sm font-semibold text-white">
              Your current capacity: {capacityPercent}% booked
            </p>
            <div className="mt-3">
              <ProgressBar percent={capacityPercent} />
            </div>
            <p className="mt-3 text-xs font-semibold text-green-400">
              Available for new jobs
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <RightHeading>New Job Requests Waiting</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="font-display text-2xl font-bold text-primary">{enquiries.length}</p>
        <p className="mt-1 text-[11px] text-text-secondary">Waiting for your response</p>
      </div>
      <Link
        href="/jobworker/enquiries"
        className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        View Requests →
      </Link>

      <RightDivider />

      <RightHeading>Market Rates For Job Work</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        {JOB_WORK_RATES.map((rate) => (
          <PriceRow key={rate.process} label={rate.process} value={rate.rate} />
        ))}
      </div>

      <RightDivider />

      <FabScoreBlock fabscore={user.fabscore} basePath="/jobworker" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
