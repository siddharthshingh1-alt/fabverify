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
  AttentionSection,
  ALERT_COLOR,
  RightHeading,
  RightDivider,
  ProgressBar,
  FabScoreBlock,
  type AttentionItem,
} from "@/app/components/dashboard/DashboardKit";

const ACTIVE_SAMPLES = [
  { id: "SMP-101", brand: "Studio Kavya", garmentType: "Ethnic Kurta", stage: "Construction", due: "Jul 14" },
  { id: "SMP-102", brand: "Little Sprout Kids", garmentType: "Knit Romper", stage: "Fitting", due: "Jul 18" },
];

const REVISION_REQUESTS: AttentionItem[] = [
  {
    title: "Studio Kavya requested a revision on SMP-101",
    detail: "Sleeve length needs adjustment — see annotated photos",
    action: "View Annotation →",
    href: "/talent/master/projects",
    color: ALERT_COLOR.amber,
  },
  {
    title: "Urban Thread Co. requested a pattern revision",
    detail: "Grading revision needed for size M",
    action: "View Feedback →",
    href: "/talent/master/projects",
    color: ALERT_COLOR.amber,
  },
];

export default function TalentMasterDashboard() {
  const authorized = useTypeGuard("master");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const enquiries = getEnquiries("master");
  const capacityPercent = 55;

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is your sample work status today"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Sample Work Status</h2>
        <StatGrid>
          <StatCard value="2" label="Active Samples" />
          <StatCard value="1" label="Due This Week" valueClass="text-amber-400" />
          <StatCard value="2" label="Pending Feedback" valueClass="text-primary" />
          <StatCard value="₹4,800" label="Earned This Month" valueClass="text-green-400" />
        </StatGrid>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Samples</h2>
          <TableShell columns={["Sample", "Brand", "Garment Type", "Stage", "Due"]} minWidth={560}>
            {ACTIVE_SAMPLES.map((row, index) => (
              <TableRow key={row.id} columns={5} index={index}>
                <span className="text-[13px] font-bold text-white">{row.id}</span>
                <span className="text-xs text-text-primary">{row.brand}</span>
                <span className="text-xs text-text-secondary">{row.garmentType}</span>
                <span className="text-xs text-text-secondary">{row.stage}</span>
                <span className="text-xs text-text-secondary">{row.due}</span>
              </TableRow>
            ))}
          </TableShell>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Revision Requests</h2>
          <AttentionSection items={REVISION_REQUESTS} allClearMessage="No revisions waiting. All samples are approved." />
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <RightHeading>New Sample Requests Waiting</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="font-display text-2xl font-bold text-primary">{enquiries.length}</p>
        <p className="mt-1 text-[11px] text-text-secondary">Brands want you to construct samples</p>
      </div>
      <Link
        href="/talent/master/enquiries"
        className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        View Requests →
      </Link>

      <RightDivider />

      <RightHeading>Your Workshop Capacity</RightHeading>
      <div className="mt-3">
        <p className="text-xs text-text-secondary">{capacityPercent}% booked</p>
        <div className="mt-2">
          <ProgressBar percent={capacityPercent} />
        </div>
      </div>

      <RightDivider />

      <FabScoreBlock fabscore={user.fabscore} basePath="/talent/master" title="FabTalent Rating" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
