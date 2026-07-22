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
  RightHeading,
  RightDivider,
  FabScoreBlock,
} from "@/app/components/dashboard/DashboardKit";

const UPCOMING_INSPECTIONS = [
  { factory: "Jaipur Ethnic Works", brand: "Studio Kavya", type: "Pre-dispatch", date: "Jul 14", location: "Jaipur" },
  { factory: "Tirupur Knits", brand: "Studio Kavya", type: "In-line", date: "Jul 16", location: "Tirupur" },
];

const REPORTS_DUE = [
  { factory: "Delhi Woven Works", inspected: "Jul 8", due: "Jul 10" },
];

const AVAILABLE_CITIES = ["Jaipur", "Delhi NCR", "Tirupur", "Mumbai"];

export default function TalentQcDashboard() {
  const authorized = useTypeGuard("qc_inspector");
  const { user, greeting } = useUser();

  if (!authorized) return null;

  const enquiries = getEnquiries("qc_inspector");

  const centrePanel = (
    <>
      <TopBar
        title={`${greeting}, ${user.name} 👋`}
        subtitle="Here is your inspection overview today"
      />

      <div className="px-6 py-6">
        <h2 className="mb-4 text-base font-bold text-white">Inspection Overview</h2>
        <StatGrid>
          <StatCard value="6" label="Inspections This Month" />
          <StatCard value="2" label="Upcoming Scheduled" />
          <StatCard value="1" label="Reports Pending" valueClass="text-amber-400" />
          <StatCard value="₹14,500" label="Earned This Month" valueClass="text-green-400" />
        </StatGrid>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Upcoming Inspections</h2>
          <TableShell columns={["Factory", "Brand", "Type", "Date", "Location", "Status"]} minWidth={680}>
            {UPCOMING_INSPECTIONS.map((row, index) => (
              <TableRow key={`${row.factory}-${row.date}`} columns={6} index={index}>
                <span className="text-[13px] font-bold text-white">{row.factory}</span>
                <span className="text-xs text-text-primary">{row.brand}</span>
                <span className="text-xs text-text-secondary">{row.type}</span>
                <span className="text-xs text-text-secondary">{row.date}</span>
                <span className="text-xs text-text-secondary">{row.location}</span>
                <StatusPill status="Scheduled" />
              </TableRow>
            ))}
          </TableShell>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-bold text-white">Reports Due</h2>
          <TableShell columns={["Factory", "Date Inspected", "Report Due"]} minWidth={440}>
            {REPORTS_DUE.map((row, index) => (
              <TableRow key={`${row.factory}-${row.inspected}`} columns={3} index={index}>
                <span className="text-[13px] font-bold text-white">{row.factory}</span>
                <span className="text-xs text-text-secondary">{row.inspected}</span>
                <span className="text-xs font-semibold text-amber-400">{row.due}</span>
              </TableRow>
            ))}
          </TableShell>
        </div>
      </div>
    </>
  );

  const rightPanel = (
    <>
      <RightHeading>New Inspection Job Requests</RightHeading>
      <div className="mt-3 rounded-[6px] border border-border-dark bg-background p-3">
        <p className="font-display text-2xl font-bold text-primary">{enquiries.length}</p>
        <p className="mt-1 text-[11px] text-text-secondary">Waiting for your response</p>
      </div>
      <Link
        href="/talent/qc/enquiries"
        className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
      >
        View Requests →
      </Link>

      <RightDivider />

      <RightHeading>Cities Where You Are Available</RightHeading>
      <div className="mt-3 flex flex-wrap gap-2">
        {AVAILABLE_CITIES.map((city) => (
          <span
            key={city}
            className="rounded-[20px] border border-border-dark bg-background px-2.5 py-1 text-[11px] text-text-secondary"
          >
            {city}
          </span>
        ))}
      </div>

      <RightDivider />

      <RightHeading>Certification Status</RightHeading>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">AQL Certified</span>
          <span className="font-semibold text-green-400">✅ Active</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">ISO Certified</span>
          <span className="font-semibold text-green-400">✅ Active</span>
        </div>
      </div>

      <RightDivider />

      <FabScoreBlock fabscore={user.fabscore} basePath="/talent/qc" title="FabTalent Rating" />
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
