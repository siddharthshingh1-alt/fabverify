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
  StatusPill,
  AttentionSection,
  ALERT_COLOR,
  RightHeading,
  RightDivider,
  FabScoreBlock,
  type Status,
  type AttentionItem,
} from "@/app/components/dashboard/DashboardKit";

const ACTIVE_PROJECTS: {
  project: string;
  brand: string;
  type: string;
  stage: string;
  due: string;
  status: Status;
}[] = [
  { project: "Tech Pack — Ethnic Wear Capsule", brand: "Studio Kavya", type: "Tech Pack", stage: "Revision", due: "Jul 15", status: "In Progress" },
  { project: "Flat Sketches — Western Wear", brand: "Urban Thread Co.", type: "Flat Sketch", stage: "Review", due: "Jul 22", status: "On Track" },
];

const FEEDBACK_WAITING: AttentionItem[] = [
  {
    title: "Studio Kavya requested revisions on Tech Pack v2",
    detail: "2 changes requested · due Jul 15",
    action: "View Feedback →",
    href: "/talent/designer/projects",
    color: ALERT_COLOR.amber,
  },
  {
    title: "Little Sprout Kids approved Kids Wear sketches",
    detail: "Ready to move to the next stage",
    action: "View Project →",
    href: "/talent/designer/projects",
    color: ALERT_COLOR.ready,
  },
];

export default function TalentDesignerDashboard() {
  const authorized = useTypeGuard("designer");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const enquiries = getEnquiries("designer");

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is your design work today"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Your Design Work</h2>
        <StatGrid>
          <StatCard value="2" label="Active Projects" />
          <StatCard value="1" label="Tech Packs Due" valueClass="text-amber-400" />
          <StatCard value="1" label="Pending Approvals" valueClass="text-primary" />
          <StatCard value="₹6,500" label="Earned This Month" valueClass="text-green-400" />
        </StatGrid>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Projects</h2>
          <TableShell columns={["Project", "Brand", "Type", "Stage", "Due", "Status"]} minWidth={680}>
            {ACTIVE_PROJECTS.map((row, index) => (
              <TableRow key={row.project} columns={6} index={index}>
                <span className="text-[13px] font-bold text-white">{row.project}</span>
                <span className="text-xs text-text-primary">{row.brand}</span>
                <span className="text-xs text-text-secondary">{row.type}</span>
                <span className="text-xs text-text-secondary">{row.stage}</span>
                <span className="text-xs text-text-secondary">{row.due}</span>
                <StatusPill status={row.status} />
              </TableRow>
            ))}
          </TableShell>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Feedback Waiting</h2>
          <AttentionSection items={FEEDBACK_WAITING} allClearMessage="No feedback waiting. All brands are up to date." />
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <RightHeading>New Hire Requests</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="font-display text-2xl font-bold text-primary">{enquiries.length}</p>
        <p className="mt-1 text-[11px] text-text-secondary">Brands want to hire you</p>
      </div>
      <Link
        href="/talent/designer/enquiries"
        className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        View Requests →
      </Link>

      <RightDivider />

      <RightHeading>Your Availability</RightHeading>
      <div className="mt-3 rounded-[6px] border border-green-500/40 bg-green-500/10 p-3">
        <p className="text-xs font-bold text-green-400">🟢 Available for new projects</p>
      </div>

      <RightDivider />

      <FabScoreBlock fabscore={user.fabscore} basePath="/talent/designer" title="FabTalent Rating" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
