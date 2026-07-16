export type HireStatus = "active" | "completed" | "pending_start";

export type Hire = {
  id: string;
  name: string;
  role: string;
  status: HireStatus;
  styleName: string;
  managingLabel: string;
  linkedLabel: string;
  milestonesComplete: number;
  milestonesTotal: number;
  milestoneNote?: string;
  rateLabel: string;
  paid: number;
  due: number;
  bottomLeftLabel?: string;
  bottomRightAction: "message_view" | "download";
};

export const HIRES: Hire[] = [
  {
    id: "hire-1",
    name: "Meera Sharma",
    role: "Merchandiser",
    status: "active",
    styleName: "Style 04 — Block Print Kurta",
    managingLabel: "Sampling to Production",
    linkedLabel: "Order #ORD-2024-001",
    milestonesComplete: 2,
    milestonesTotal: 4,
    rateLabel: "₹15,000 per stage",
    paid: 7500,
    due: 7500,
    bottomLeftLabel: "Started July 10, 2026",
    bottomRightAction: "message_view",
  },
  {
    id: "hire-2",
    name: "Rahul Verma",
    role: "QC Inspector",
    status: "active",
    styleName: "Style 07 — Silk Blouse",
    managingLabel: "Pre-dispatch inspection",
    linkedLabel: "Order #ORD-2024-002",
    milestonesComplete: 0,
    milestonesTotal: 1,
    milestoneNote: "in progress",
    rateLabel: "₹3,500 per inspection",
    paid: 0,
    due: 3500,
    bottomLeftLabel: "Inspection scheduled July 18",
    bottomRightAction: "message_view",
  },
  {
    id: "hire-3",
    name: "Ananya Kapoor",
    role: "Designer",
    status: "completed",
    styleName: "Style 02 — Cotton Coord Set",
    managingLabel: "Tech pack creation — all 3 sizes",
    linkedLabel: "Delivered June 28, 2026",
    milestonesComplete: 3,
    milestonesTotal: 3,
    rateLabel: "₹8,000",
    paid: 8000,
    due: 0,
    bottomRightAction: "download",
  },
];

export function getActiveHires() {
  return HIRES.filter((hire) => hire.status === "active");
}

export function getActiveHiresCount() {
  return getActiveHires().length;
}

export function getCompletedHiresCount() {
  return HIRES.filter((hire) => hire.status === "completed").length;
}

export function getTotalSpent() {
  return HIRES.reduce((sum, hire) => sum + hire.paid, 0);
}
