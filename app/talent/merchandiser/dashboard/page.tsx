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
  RightHeading,
  RightDivider,
  FabScoreBlock,
} from "@/app/components/dashboard/DashboardKit";

const ACTIVE_PROJECTS = [
  { project: "Sourcing & Production — Next Drop", brand: "Studio Kavya", stage: "Sourcing", progress: "40%", due: "Jul 20" },
  { project: "QC & Dispatch Coordination", brand: "House of Nira", stage: "QC", progress: "75%", due: "Jul 12" },
];

const TODAYS_TASKS = [
  "Palazzo Set production update due",
  "Block Print Kurta QC booking needed",
  "Silk Blouse sample feedback to send",
];

const BRANDS_WORKING_WITH = ["Studio Kavya", "House of Nira"];

export default function TalentMerchandiserDashboard() {
  const authorized = useTypeGuard("merchandiser");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const enquiries = getEnquiries("merchandiser");

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is your projects overview today"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Projects Overview</h2>
        <StatGrid>
          <StatCard value="2" label="Active Projects" />
          <StatCard value="2" label="Milestones Due" valueClass="text-amber-400" />
          <StatCard value="2" label="Brands Working With" />
          <StatCard value="₹18,000" label="Earned This Month" valueClass="text-green-400" />
        </StatGrid>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Active Projects</h2>
          <TableShell columns={["Project", "Brand", "Stage Managing", "Progress", "Due"]} minWidth={680}>
            {ACTIVE_PROJECTS.map((row, index) => (
              <TableRow key={row.project} columns={5} index={index}>
                <span className="text-[13px] font-bold text-white">{row.project}</span>
                <span className="text-xs text-text-primary">{row.brand}</span>
                <span className="text-xs text-text-secondary">{row.stage}</span>
                <span className="text-xs font-semibold text-primary">{row.progress}</span>
                <span className="text-xs text-text-secondary">{row.due}</span>
              </TableRow>
            ))}
          </TableShell>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Today&rsquo;s Tasks</h2>
          <div className="flex flex-col gap-2">
            {TODAYS_TASKS.map((task) => (
              <div key={task} className="flex items-center gap-2 rounded-[8px] border border-border-dark bg-card p-3">
                <span className="text-primary">☐</span>
                <span className="text-sm text-text-primary">{task}</span>
              </div>
            ))}
          </div>
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
        href="/talent/merchandiser/enquiries"
        className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        View Requests →
      </Link>

      <RightDivider />

      <RightHeading>Brands You Work With</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        {BRANDS_WORKING_WITH.map((brand) => (
          <div key={brand} className="flex items-center justify-between text-xs">
            <span className="text-text-primary">{brand}</span>
          </div>
        ))}
      </div>

      <RightDivider />

      <FabScoreBlock fabscore={user.fabscore} basePath="/talent/merchandiser" title="FabTalent Rating & Reviews" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
