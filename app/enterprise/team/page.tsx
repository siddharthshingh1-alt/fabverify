"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ThreePanelLayout from "../../components/ThreePanelLayout";
import EnterpriseLeftPanel from "../../components/EnterpriseLeftPanel";
import TopBar from "../../components/TopBar";
import { useEnterpriseAccess } from "../../hooks/useEnterpriseAccess";

const ROLE_CARDS = [
  { emoji: "👑", label: "Owner", desc: "Full access", labelClass: "text-primary" },
  { emoji: "👔", label: "Manager", desc: "All except billing", labelClass: "text-white" },
  { emoji: "📋", label: "Merchandiser", desc: "Orders and vendors", labelClass: "text-white" },
  { emoji: "✏️", label: "Designer", desc: "Styles and tech packs", labelClass: "text-white" },
  { emoji: "💰", label: "Accounts", desc: "Payments only", labelClass: "text-white" },
];

type Role = "Owner" | "Manager" | "Merchandiser" | "Designer" | "Accounts";
const INVITE_ROLES: Role[] = ["Owner", "Manager", "Merchandiser", "Designer", "Accounts"];

type PermissionKey =
  | "viewOrders"
  | "updateMilestones"
  | "approvePayments"
  | "manageTeam"
  | "viewFinancials"
  | "accessVendorMaster";

const PERMISSION_LABELS: { key: PermissionKey; label: string }[] = [
  { key: "viewOrders", label: "View all orders" },
  { key: "updateMilestones", label: "Update production milestones" },
  { key: "approvePayments", label: "Approve payments" },
  { key: "manageTeam", label: "Manage team members" },
  { key: "viewFinancials", label: "View financial reports" },
  { key: "accessVendorMaster", label: "Access vendor master" },
];

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  joined: string;
  avatarClass: string;
};

const PERFORMANCE_STATS = [
  { value: "12", label: "Tasks completed", sub: "this month", colorClass: "text-white" },
  { value: "3", label: "Active right now", sub: "in progress", colorClass: "text-primary" },
  { value: "94%", label: "On-time rate", sub: "last 30 days", colorClass: "text-green-400" },
  { value: "1", label: "Stuck items", sub: "needs attention", colorClass: "text-amber-400" },
];

type ActiveTask = {
  name: string;
  status: string;
  barClass: string;
  pillClass: string;
  relation: string;
  meta: string;
};

type StuckItem = { title: string; detail: string };
type ActivityItem = { time: string; text: string };

type ManagementTable = {
  title: string;
  columns: string[];
  rows: string[][];
  linkLabel: string;
  linkHref: string;
};

type CommsSummary = {
  stats: { label: string; value: string }[];
  lastLabel: string;
  lastValue: string;
};

type RoleWorkData = {
  activeTasks: ActiveTask[];
  stuckItems: StuckItem[];
  activity: ActivityItem[];
  table: ManagementTable;
  comms: CommsSummary;
};

function statusColorClass(cell: string): string {
  if (cell.includes("✓")) return "text-green-400";
  if (/Stuck|Overdue|Delayed/i.test(cell)) return "text-red-400";
  if (cell.includes("⚠")) return "text-amber-400";
  return "text-text-secondary";
}

const GOLD_PILL = "border-primary bg-primary/15 text-primary";
const RED_PILL = "border-red-400 bg-red-400/15 text-red-400";

const ROLE_WORK_DATA_BASE: Record<Exclude<Role, "Owner">, RoleWorkData> = {
  Merchandiser: {
    activeTasks: [
      {
        name: "Managing Palazzo Set production",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Order #ORD-2024-002 · Palazzo Set",
        meta: "Started July 10 · Due July 20",
      },
      {
        name: "Coordinating Block Print Kurta QC",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Order #ORD-2024-001 · Block Print Kurta",
        meta: "Started July 12 · Due July 18",
      },
      {
        name: "Sample approval pending from buyer",
        status: "Stuck",
        barClass: "bg-red-400",
        pillClass: RED_PILL,
        relation: "Style 04 · Silk Blouse sampling",
        meta: "Waiting 3 days — buyer has not responded",
      },
    ],
    stuckItems: [
      {
        title: "Sample approval for Silk Blouse has been waiting 3 days.",
        detail: "Buyer has not responded to approval request sent July 13.",
      },
    ],
    activity: [
      { time: "Today 2:15pm", text: "Updated production milestone for Palazzo Set — 60% complete" },
      { time: "Today 11:30am", text: "Sent enquiry to Delhi Woven Works regarding delay on Palazzo Set" },
      { time: "Yesterday 4:45pm", text: "Uploaded 3 production photos for Block Print Kurta" },
      { time: "Yesterday 2:00pm", text: "Booked QC Inspector for Block Print Kurta — July 18" },
      { time: "July 14 3:30pm", text: "Sent sample approval request to buyer for Silk Blouse — awaiting response" },
      { time: "July 13 11:00am", text: "Created sample brief for Linen Trouser — sent to 3 manufacturers" },
      { time: "July 12 5:00pm", text: "Confirmed order with Tirupur Knits for Cotton T-shirt — ₹84,000" },
      { time: "July 10 10:00am", text: "Joined FabVerify workspace" },
    ],
    table: {
      title: "📦 Orders Under Management",
      columns: ["Order ID", "Style", "Vendor", "Stage", "Status"],
      rows: [
        ["ORD-2024-001", "Block Print Kurta", "Jaipur Ethnic", "Production", "On Track ✓"],
        ["ORD-2024-002", "Palazzo Set", "Delhi Woven", "Production", "Delayed ⚠"],
        ["ORD-2024-003", "Cotton T-shirt", "Tirupur Knits", "QC", "On Track ✓"],
        ["ORD-2024-004", "Linen Trouser", "Ahmedabad Mill", "Sampling", "On Track ✓"],
        ["ORD-2024-005", "Silk Blouse", "Mumbai Fabric", "Sampling", "Stuck ⚠"],
      ],
      linkLabel: "View all orders →",
      linkHref: "/enterprise/orders",
    },
    comms: {
      stats: [
        { label: "Enquiries sent this month", value: "8" },
        { label: "Vendor messages", value: "23" },
        { label: "Response rate", value: "91%" },
      ],
      lastLabel: "Last message sent",
      lastValue: "Delhi Woven Works — 2 hours ago",
    },
  },
  Designer: {
    activeTasks: [
      {
        name: "Designing Autumn Kurta Collection",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Style 07 · Autumn Kurta Collection",
        meta: "Started July 11 · Due July 22",
      },
      {
        name: "Finalizing tech pack for Palazzo Set",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Style 03 · Palazzo Set tech pack",
        meta: "Started July 13 · Due July 19",
      },
      {
        name: "Sample feedback pending from QC",
        status: "Stuck",
        barClass: "bg-red-400",
        pillClass: RED_PILL,
        relation: "Style 04 · Silk Blouse sampling",
        meta: "Waiting 2 days — QC has not responded",
      },
    ],
    stuckItems: [
      {
        title: "Sample feedback for Silk Blouse has been waiting 2 days.",
        detail: "QC team has not responded to feedback request sent July 15.",
      },
    ],
    activity: [
      { time: "Today 3:00pm", text: "Uploaded revised sketches for Autumn Kurta Collection" },
      { time: "Today 10:15am", text: "Sent tech pack for Palazzo Set to production team" },
      { time: "Yesterday 5:00pm", text: "Requested sample feedback from QC for Silk Blouse" },
      { time: "Yesterday 1:30pm", text: "Finalized fabric selection for Linen Trouser" },
      { time: "July 14 4:00pm", text: "Created tech pack draft for Cotton T-shirt" },
      { time: "July 13 2:00pm", text: "Reviewed buyer comments on Block Print Kurta design" },
      { time: "July 12 11:00am", text: "Submitted mood board for Autumn Kurta Collection" },
      { time: "July 10 10:00am", text: "Joined FabVerify workspace" },
    ],
    table: {
      title: "🎨 Styles Under Design",
      columns: ["Style", "Stage", "Tech Pack", "Feedback"],
      rows: [
        ["Autumn Kurta Collection", "Design", "Draft", "Pending ⚠"],
        ["Palazzo Set", "Tech Pack", "Final", "Approved ✓"],
        ["Block Print Kurta", "Approved", "Final", "Approved ✓"],
        ["Linen Trouser", "Sampling", "Draft", "Pending ⚠"],
        ["Silk Blouse", "Sampling", "Final", "Awaiting QC ⚠"],
      ],
      linkLabel: "View all styles →",
      linkHref: "/enterprise/season",
    },
    comms: {
      stats: [
        { label: "Design reviews this month", value: "6" },
        { label: "Sample requests sent", value: "14" },
        { label: "Feedback response rate", value: "78%" },
      ],
      lastLabel: "Last feedback request",
      lastValue: "QC Team — 2 days ago",
    },
  },
  Accounts: {
    activeTasks: [
      {
        name: "Processing payment for Cotton T-shirt order",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Invoice #INV-2024-014 · Tirupur Knits",
        meta: "Started July 15 · Due July 18",
      },
      {
        name: "Reconciling invoice from Jaipur Ethnic Works",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Invoice #INV-2024-011 · Jaipur Ethnic",
        meta: "Started July 14 · Due July 17",
      },
      {
        name: "Budget variance review stuck",
        status: "Stuck",
        barClass: "bg-red-400",
        pillClass: RED_PILL,
        relation: "Q2 Budget · Vendor payments",
        meta: "Waiting 4 days — finance approval pending",
      },
    ],
    stuckItems: [
      {
        title: "Budget variance review has been waiting 4 days.",
        detail: "Finance approval pending since July 13 for Q2 vendor payment budget.",
      },
    ],
    activity: [
      { time: "Today 1:00pm", text: "Processed payment of ₹84,000 to Tirupur Knits" },
      { time: "Today 9:45am", text: "Flagged budget variance on Q2 vendor payments" },
      { time: "Yesterday 3:15pm", text: "Reconciled invoice #INV-2024-011 from Jaipur Ethnic Works" },
      { time: "Yesterday 11:00am", text: "Sent payment reminder to Mumbai Fabric" },
      { time: "July 14 2:30pm", text: "Approved invoice #INV-2024-009 for Delhi Woven Works" },
      { time: "July 13 4:00pm", text: "Raised budget variance flag for Q2 spending" },
      { time: "July 12 5:30pm", text: "Processed advance payment for Silk Blouse sampling" },
      { time: "July 10 10:00am", text: "Joined FabVerify workspace" },
    ],
    table: {
      title: "💳 Payments & Invoices",
      columns: ["Invoice", "Vendor", "Amount", "Status", "Due"],
      rows: [
        ["INV-2024-014", "Tirupur Knits", "₹84,000", "Processing ⚠", "July 18"],
        ["INV-2024-013", "Ahmedabad Mill", "₹42,500", "Paid ✓", "—"],
        ["INV-2024-012", "Mumbai Fabric", "₹1,20,000", "Paid ✓", "—"],
        ["INV-2024-011", "Jaipur Ethnic", "₹65,000", "Reconciling ⚠", "July 17"],
        ["INV-2024-009", "Delhi Woven Works", "₹58,000", "Overdue ⚠", "July 12"],
      ],
      linkLabel: "View all payments →",
      linkHref: "/enterprise/analytics",
    },
    comms: {
      stats: [
        { label: "Invoices processed this month", value: "11" },
        { label: "Payment reminders sent", value: "5" },
        { label: "On-time payment rate", value: "88%" },
      ],
      lastLabel: "Last payment processed",
      lastValue: "Tirupur Knits — 1 hour ago",
    },
  },
  Manager: {
    activeTasks: [
      {
        name: "Reviewing team performance for July",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Team overview · 4 members",
        meta: "Started July 14 · Due July 20",
      },
      {
        name: "Approving Palazzo Set order changes",
        status: "In Progress",
        barClass: "bg-primary",
        pillClass: GOLD_PILL,
        relation: "Order #ORD-2024-002 · Palazzo Set",
        meta: "Started July 15 · Due July 17",
      },
      {
        name: "Escalation pending on Silk Blouse delay",
        status: "Stuck",
        barClass: "bg-red-400",
        pillClass: RED_PILL,
        relation: "Order #ORD-2024-005 · Silk Blouse",
        meta: "Waiting 3 days — needs MD decision",
      },
    ],
    stuckItems: [
      {
        title: "Escalation on Silk Blouse delay has been waiting 3 days.",
        detail: "Needs MD decision — buyer approval blocked since July 13.",
      },
    ],
    activity: [
      { time: "Today 2:30pm", text: "Approved production milestone for Cotton T-shirt" },
      { time: "Today 10:00am", text: "Reviewed team task load across 4 members" },
      { time: "Yesterday 4:30pm", text: "Escalated Silk Blouse delay to MD" },
      { time: "Yesterday 12:00pm", text: "Approved budget variance for Q2 vendor payments" },
      { time: "July 14 3:00pm", text: "Reassigned Linen Trouser sampling to Rahul Sharma" },
      { time: "July 13 5:00pm", text: "Reviewed vendor performance report for Jaipur Ethnic Works" },
      { time: "July 12 9:30am", text: "Approved invoice #INV-2024-009 for Delhi Woven Works" },
      { time: "July 10 10:00am", text: "Joined FabVerify workspace" },
    ],
    table: {
      title: "👥 Team Overview",
      columns: ["Member", "Role", "Active Tasks", "Status"],
      rows: [
        ["Rahul Sharma", "Merchandiser", "3", "On Track ✓"],
        ["Priya Nair", "Designer", "2", "On Track ✓"],
        ["Aman Gupta", "Accounts", "2", "Delayed ⚠"],
        ["Neha Verma", "Merchandiser", "1", "On Track ✓"],
        ["Siddharth Singh", "Owner", "1", "On Track ✓"],
      ],
      linkLabel: "View full team →",
      linkHref: "/enterprise/team",
    },
    comms: {
      stats: [
        { label: "Approvals given this month", value: "9" },
        { label: "Team messages sent", value: "31" },
        { label: "Team response rate", value: "95%" },
      ],
      lastLabel: "Last approval given",
      lastValue: "Cotton T-shirt milestone — 3 hours ago",
    },
  },
};

const ROLE_WORK_DATA: Record<Role, RoleWorkData> = {
  ...ROLE_WORK_DATA_BASE,
  Owner: ROLE_WORK_DATA_BASE.Manager,
};

// The report is drawn with base-14 Helvetica (no embedded font), which only
// supports single-byte Latin-1/WinAnsi glyphs — so any character outside
// that range must be swapped for an ASCII-safe equivalent before it's
// written into the content stream, or it renders as mangled bytes.
function sanitizePdfText(value: string): string {
  return value
    .replace(/₹/g, "Rs. ")
    .replace(/[–—]/g, "-")
    .replace(/·/g, "-")
    .replace(/✓/g, "[OK]")
    .replace(/⚠/g, "[!]")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7e]/g, "?");
}

function escapePdfText(value: string): string {
  return sanitizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfLine(line: string, maxChars = 92): string[] {
  if (line.length <= maxChars) return [line];
  const words = line.split(" ");
  const wrapped: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) wrapped.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) wrapped.push(current);
  return wrapped;
}

function buildTextReportPdf(lines: string[]): Blob {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginLeft = 48;
  const startY = 740;
  const lineHeight = 15;
  const maxLines = Math.floor((startY - 40) / lineHeight);
  const wrapped = lines.flatMap((line) => (line ? wrapPdfLine(line) : [""]));
  const pageLines = wrapped.slice(0, maxLines);

  const commands: string[] = ["BT", "/F1 10 Tf", `${marginLeft} ${startY} Td`];
  pageLines.forEach((line, index) => {
    if (index > 0) commands.push(`0 -${lineHeight} Td`);
    commands.push(`(${escapePdfText(line)}) Tj`);
  });
  commands.push("ET");
  const contentStream = commands.join("\n");

  // Byte offsets in the xref table must count encoded UTF-8 bytes, not JS
  // string length (multi-byte characters like ₹/—/✓ would throw them off).
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(contentStream);

  const objectStrings = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const totalObjects = objectStrings.length + 1; // + the content stream object

  const chunks: BlobPart[] = [];
  let length = 0;
  const push = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };

  push("%PDF-1.4\n");
  const offsets: number[] = [];
  objectStrings.forEach((obj, index) => {
    offsets[index] = length;
    push(`${index + 1} 0 obj\n${obj}\nendobj\n`);
  });

  offsets[objectStrings.length] = length;
  push(`${totalObjects} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  chunks.push(contentBytes);
  length += contentBytes.length;
  push(`\nendstream\nendobj\n`);

  const xrefStart = length;
  let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  push(xref);
  push(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

function downloadMemberReport(member: TeamMember, data: RoleWorkData) {
  const lines = [
    "FabVerify — Team Member Report",
    `Generated ${new Date().toLocaleDateString()}`,
    "",
    `Name: ${member.name}`,
    `Role: ${member.role}`,
    `Email: ${member.email}`,
    `Phone: ${member.phone || "+91 XXXXXXXXXX"}`,
    `Joined: ${member.joined || "July 2026"}`,
    "",
    "Performance Snapshot",
    ...PERFORMANCE_STATS.map((stat) => `- ${stat.label}: ${stat.value} (${stat.sub})`),
    "",
    "Active Work",
    ...data.activeTasks.map((task) => `- ${task.name} [${task.status}] — ${task.relation}`),
    "",
    "Recent Activity",
    ...data.activity.map((item) => `- ${item.time}: ${item.text}`),
  ];

  const blob = buildTextReportPdf(lines);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${member.name.replace(/\s+/g, "-")}-report.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "rahul-sharma",
    name: "Rahul Sharma",
    email: "rahul@company.com",
    role: "Merchandiser",
    joined: "—",
    avatarClass: "bg-secondary",
  },
];

type PendingInvite = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  sentAt: string;
  expiresIn: string;
  status: "pending";
};

const INITIAL_PENDING_INVITES: PendingInvite[] = [
  {
    id: "inv-001",
    name: "Priya Sharma",
    phone: "+91 98765 43211",
    email: "priya@company.com",
    role: "Designer",
    sentAt: "2 hours ago",
    expiresIn: "6 days",
    status: "pending",
  },
  {
    id: "inv-002",
    name: "Amit Kumar",
    phone: "+91 87654 32109",
    email: "amit@company.com",
    role: "Accounts",
    sentAt: "Yesterday",
    expiresIn: "5 days",
    status: "pending",
  },
];

const ROLE_PERMISSIONS: Record<Role, Record<PermissionKey, boolean>> = {
  Owner: {
    viewOrders: true,
    updateMilestones: true,
    approvePayments: true,
    manageTeam: true,
    viewFinancials: true,
    accessVendorMaster: true,
  },
  Manager: {
    viewOrders: true,
    updateMilestones: true,
    approvePayments: true,
    manageTeam: false,
    viewFinancials: true,
    accessVendorMaster: true,
  },
  Merchandiser: {
    viewOrders: true,
    updateMilestones: true,
    approvePayments: false,
    manageTeam: false,
    viewFinancials: true,
    accessVendorMaster: true,
  },
  Designer: {
    viewOrders: true,
    updateMilestones: false,
    approvePayments: false,
    manageTeam: false,
    viewFinancials: false,
    accessVendorMaster: false,
  },
  Accounts: {
    viewOrders: true,
    updateMilestones: false,
    approvePayments: true,
    manageTeam: false,
    viewFinancials: true,
    accessVendorMaster: false,
  },
};

const PERMISSIONS_TABLE_ROWS = [
  { label: "Orders", values: ["✓", "✓", "✓", "view", "view"] },
  { label: "Payments", values: ["✓", "✓", "✗", "✗", "✓"] },
  { label: "Team", values: ["✓", "view", "✗", "✗", "✗"] },
  { label: "Vendors", values: ["✓", "✓", "✓", "✗", "✗"] },
  { label: "Analytics", values: ["✓", "✓", "✓", "✗", "✓"] },
  { label: "Settings", values: ["✓", "✗", "✗", "✗", "✗"] },
];

const TIPS = [
  "Start with Merchandiser role for your core team",
  "Accounts role sees payments but cannot approve them",
  "Remove access instantly if someone leaves",
];

function PermissionCell({ value }: { value: string }) {
  if (value === "✓") return <span className="text-primary">✓</span>;
  if (value === "✗") return <span className="text-red-400">✗</span>;
  return <span className="text-text-secondary">{value}</span>;
}

function InviteModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (invite: { name: string; phone: string; email: string; role: Role }) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Merchandiser");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(
    ROLE_PERMISSIONS.Merchandiser
  );
  const [sent, setSent] = useState(false);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setPermissions(ROLE_PERMISSIONS[nextRole]);
  };

  const togglePermission = (key: PermissionKey) => {
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSend = () => {
    if (!name.trim()) return;
    onSend({ name, phone, email, role });
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-5"
      onClick={onClose}
    >
      <div
        className="hide-scrollbar relative w-full max-w-[480px] rounded-xl border border-border-dark bg-card p-7"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        {sent ? (
          <div className="py-6 text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-4 text-sm font-bold text-white">
              Invite sent to {name}
            </p>
            <p className="mt-2 text-[13px] text-text-secondary">
              They will receive a WhatsApp message with a link to join your
              workspace.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-navy"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-lg font-bold text-primary">Invite Team Member</p>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Phone number
              </label>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-border-dark focus-within:border-primary">
                <span className="flex items-center bg-background px-3 text-[13px] text-text-secondary">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-background p-2.5 text-[13px] text-text-primary outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[13px] font-semibold text-text-primary">
                Role
              </label>
              <select
                value={role}
                onChange={(event) => handleRoleChange(event.target.value as Role)}
                className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              >
                {INVITE_ROLES.map((option) => (
                  <option key={option} value={option} className="bg-card text-text-primary">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-[13px] font-semibold text-text-primary">
                What they can access
              </p>
              <div className="flex flex-col gap-2">
                {PERMISSION_LABELS.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 text-[13px] text-text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[item.key]}
                      onChange={() => togglePermission(item.key)}
                      className="h-4 w-4 accent-[#f2ca50]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border-dark py-3 text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="flex-[2] rounded-lg bg-primary py-3 text-sm font-bold text-navy"
              >
                Send Invite →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: TeamMember;
  onClose: () => void;
  onSave: (role: Role) => void;
}) {
  const [role, setRole] = useState<Role>(member.role);
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(
    ROLE_PERMISSIONS[member.role]
  );
  const [saved, setSaved] = useState(false);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setPermissions(ROLE_PERMISSIONS[nextRole]);
  };

  const togglePermission = (key: PermissionKey) => {
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    onSave(role);
    setTimeout(onClose, 900);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[460px] rounded-xl border border-border-dark bg-card p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        <p className="text-lg font-bold text-white">Edit Team Member</p>
        <p className="mb-5 text-[13px] text-text-secondary">{member.name}</p>

        <div className="mb-4">
          <label className="mb-2 block text-[13px] text-text-secondary">Role</label>
          <select
            value={role}
            onChange={(event) => handleRoleChange(event.target.value as Role)}
            className="w-full rounded-lg border border-border-dark bg-background p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          >
            {INVITE_ROLES.map((option) => (
              <option key={option} value={option} className="bg-card text-text-primary">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[13px] text-text-secondary">Access permissions</p>
          <div className="flex flex-col gap-2">
            {PERMISSION_LABELS.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 text-[13px] text-text-secondary"
              >
                <input
                  type="checkbox"
                  checked={permissions[item.key]}
                  onChange={() => togglePermission(item.key)}
                  className="h-4 w-4 accent-[#f2ca50]"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <p className="mb-5 text-xs text-text-secondary">
          Changes take effect immediately. The team member will be notified via
          WhatsApp.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border-dark py-3 text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-[2] rounded-lg bg-primary py-3 text-sm font-bold text-navy"
          >
            {saved ? "✓ Changes saved" : "Save Changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveMemberModal({
  member,
  onClose,
  onConfirm,
}: {
  member: TeamMember;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[420px] rounded-xl border border-red-400 bg-card p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        <div className="text-center text-[32px]">⚠️</div>
        <p className="mt-2 text-center text-lg font-bold text-white">
          Remove Team Member?
        </p>
        <p className="mb-6 mt-2 text-center text-[13px] text-text-secondary">
          {member.name} will immediately lose access to your FabVerify workspace.
          All their activity history will be preserved.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-lg bg-[#e34948] py-3 text-sm font-bold text-white"
          >
            Yes, Remove Access
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-border-dark py-3 text-sm text-text-secondary"
          >
            Cancel — Keep Access
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberDetailModal({
  member,
  onClose,
  onEditRole,
  onRemove,
}: {
  member: TeamMember;
  onClose: () => void;
  onEditRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}) {
  const data = ROLE_WORK_DATA[member.role];
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const visibleActivity = showAllActivity ? data.activity : data.activity.slice(0, 5);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setShowComposer(false);
      setMessageSent(false);
      setMessageText("");
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex w-full max-w-[680px] flex-col rounded-xl border border-border-dark bg-card"
        style={{ maxHeight: "90vh" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>

        <div className="hide-scrollbar overflow-y-auto p-7 pb-4">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-white">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{member.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-fit rounded-[20px] border border-primary bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                    {member.role}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-text-secondary">
                  Member since {member.joined || "July 2026"}
                </p>
                <p className="text-[11px] text-text-secondary">Last active: 2 hours ago</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditRole(member);
                }}
                className="rounded-lg border border-border-dark px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:text-primary"
              >
                Edit Role
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRemove(member);
                }}
                className="text-[11px] font-semibold text-red-400"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="my-4 h-px bg-border-dark" />

          {/* SECTION 1 — PERFORMANCE SNAPSHOT */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PERFORMANCE_STATS.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border-dark bg-background p-3">
                <p className={`text-2xl font-bold ${stat.colorClass}`}>{stat.value}</p>
                <p className="mt-1 text-[11px] text-text-secondary">{stat.label}</p>
                <p className="text-[10px] text-text-secondary">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="my-5 h-px bg-border-dark" />

          {/* SECTION 2 — ACTIVE WORK */}
          <p className="text-sm font-bold text-white">🔄 Active Work</p>
          <div className="mt-3 flex flex-col gap-2">
            {data.activeTasks.map((task) => (
              <div
                key={task.name}
                className="flex overflow-hidden rounded-lg border border-border-dark bg-background"
              >
                <div className={`w-[3px] shrink-0 ${task.barClass}`} />
                <div className="flex-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-white">{task.name}</p>
                    <span
                      className={`w-fit shrink-0 rounded-[20px] border px-2 py-0.5 text-[10px] font-semibold ${task.pillClass}`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-text-secondary">{task.relation}</p>
                  <p className="mt-1 text-[11px] text-text-secondary">{task.meta}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="my-5 h-px bg-border-dark" />

          {/* SECTION 3 — NEEDS ATTENTION */}
          <p className="text-sm font-bold text-amber-400">⚠ Needs Attention</p>
          {data.stuckItems.length === 0 ? (
            <p className="mt-3 text-[13px] text-green-400">✓ Nothing stuck right now</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {data.stuckItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border-l-[3px] border-amber-400 bg-amber-400/10 p-3"
                >
                  <p className="text-[13px] text-white">{item.title}</p>
                  <p className="mt-1 text-[12px] text-text-secondary">{item.detail}</p>
                  <div className="mt-3 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setReminderSent(true)}
                      disabled={reminderSent}
                      className="text-[12px] font-semibold text-primary disabled:text-text-secondary"
                    >
                      {reminderSent ? "Reminder sent ✓" : "Send reminder to buyer →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEscalated(true)}
                      disabled={escalated}
                      className="text-[12px] font-semibold text-amber-400 disabled:text-text-secondary"
                    >
                      {escalated ? "Escalated ✓" : "Escalate to MD →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="my-5 h-px bg-border-dark" />

          {/* SECTION 4 — ACTIVITY TIMELINE */}
          <p className="text-sm font-bold text-white">📋 Activity History</p>
          <div className="relative mt-3 flex flex-col gap-4 border-l border-border-dark pl-4">
            {visibleActivity.map((item) => (
              <div key={`${item.time}-${item.text}`} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-[11px] font-semibold text-text-secondary">{item.time}</p>
                <p className="mt-0.5 text-[12px] text-text-secondary">{item.text}</p>
              </div>
            ))}
          </div>
          {data.activity.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllActivity((current) => !current)}
              className="mt-3 text-[12px] font-semibold text-primary"
            >
              {showAllActivity ? "Show less ←" : "View all activity →"}
            </button>
          )}

          <div className="my-5 h-px bg-border-dark" />

          {/* SECTION 5 — MANAGEMENT TABLE */}
          <p className="text-sm font-bold text-white">{data.table.title}</p>
          <div className="mt-3 overflow-x-auto hide-scrollbar">
            <div style={{ minWidth: data.table.columns.length * 110 }}>
              <div
                className="grid gap-2 border-b border-border-dark pb-2"
                style={{ gridTemplateColumns: `repeat(${data.table.columns.length}, minmax(0, 1fr))` }}
              >
                {data.table.columns.map((column) => (
                  <span
                    key={column}
                    className="text-[10px] font-bold uppercase tracking-wide text-text-secondary"
                  >
                    {column}
                  </span>
                ))}
              </div>
              {data.table.rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid gap-2 border-b border-border-dark/60 py-2 last:border-b-0"
                  style={{ gridTemplateColumns: `repeat(${data.table.columns.length}, minmax(0, 1fr))` }}
                >
                  {row.map((cell, cellIndex) => (
                    <span
                      key={cellIndex}
                      className={`text-[12px] ${
                        cellIndex === row.length - 1 ? statusColorClass(cell) : "text-text-primary"
                      }`}
                    >
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <Link
            href={data.table.linkHref}
            className="mt-3 inline-block text-[12px] font-semibold text-primary"
          >
            {data.table.linkLabel}
          </Link>

          <div className="my-5 h-px bg-border-dark" />

          {/* SECTION 6 — COMMUNICATIONS */}
          <p className="text-sm font-bold text-white">💬 Communications</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {data.comms.stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between text-[13px]">
                <span className="text-text-secondary">{stat.label}</span>
                <span className="font-semibold text-white">{stat.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-text-secondary">
            {data.comms.lastLabel}: {data.comms.lastValue}
          </p>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="border-t border-border-dark bg-card p-4">
          {showComposer && (
            <div className="mb-3 rounded-lg border border-border-dark bg-background p-3">
              {messageSent ? (
                <p className="text-[13px] text-green-400">✓ Message sent to {member.name}</p>
              ) : (
                <>
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder={`Message ${member.name}...`}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border-dark bg-card p-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowComposer(false)}
                      className="rounded-lg border border-border-dark px-3 py-1.5 text-[12px] text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-navy"
                    >
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowComposer((current) => !current)}
              className="flex-1 rounded-lg border border-border-dark py-2.5 text-[13px] font-semibold text-text-secondary hover:text-primary"
            >
              💬 Message {member.name.split(" ")[0]}
            </button>
            <button
              type="button"
              onClick={() => downloadMemberReport(member, data)}
              className="flex-1 rounded-lg border border-border-dark py-2.5 text-[13px] font-semibold text-text-secondary hover:text-primary"
            >
              📊 Full Report
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditRole(member);
              }}
              className="flex-1 rounded-lg bg-primary py-2.5 text-[13px] font-bold text-navy"
            >
              ✏ Edit Role →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCardsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {ROLE_CARDS.map((card) => (
        <div
          key={card.label}
          className="rounded-[8px] border border-border-dark bg-card p-3 text-center"
        >
          <div className="text-2xl">{card.emoji}</div>
          <p className={`mt-1 text-[13px] font-bold ${card.labelClass}`}>{card.label}</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">{card.desc}</p>
        </div>
      ))}
    </div>
  );
}

function TeamTable({
  members,
  onInvite,
  onRowClick,
  onEdit,
  onRemove,
}: {
  members: TeamMember[];
  onInvite: () => void;
  onRowClick: (member: TeamMember) => void;
  onEdit: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-[10px] border border-border-dark hide-scrollbar">
      <div style={{ minWidth: 640 }}>
        <div className="grid grid-cols-5 gap-2 border-b border-primary/40 bg-card px-4 py-3">
          {["Name", "Role", "Status", "Joined", "Actions"].map((col) => (
            <span
              key={col}
              className="text-[11px] font-bold uppercase tracking-wide text-text-secondary"
            >
              {col}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-5 items-center gap-2 border-b border-border-dark bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-navy">
              S
            </div>
            <span className="text-[13px] font-bold text-white">Siddharth Singh</span>
          </div>
          <span className="w-fit rounded-[20px] border border-primary bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">
            Owner
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
          </span>
          <span className="text-xs text-text-secondary">July 2026</span>
          <span className="text-xs text-text-secondary">—</span>
        </div>

        {members.map((member) => (
          <div
            key={member.id}
            onClick={() => onRowClick(member)}
            className="grid cursor-pointer grid-cols-5 items-center gap-2 border-b border-border-dark bg-background px-4 py-3 hover:bg-[rgba(242,202,80,0.05)]"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-navy ${member.avatarClass}`}
              >
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">{member.name}</p>
                <p className="text-[11px] text-text-secondary">{member.email}</p>
              </div>
            </div>
            <span className="w-fit rounded-[20px] border border-secondary bg-secondary/15 px-2.5 py-1 text-[10px] font-semibold text-secondary">
              {member.role}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
            </span>
            <span className="text-xs text-text-secondary">{member.joined}</span>
            <span className="text-xs text-text-secondary">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(member);
                }}
                className="text-text-secondary hover:text-primary"
              >
                Edit
              </button>
              {" | "}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(member);
                }}
                className="text-text-secondary hover:text-red-400"
              >
                Remove
              </button>
            </span>
          </div>
        ))}

        {[1, 2, 3].map((row) => (
          <div
            key={row}
            className="grid grid-cols-5 items-center gap-2 border-b border-dashed border-border-dark px-4 py-3 last:border-b-0"
          >
            <span className="col-span-4 text-[13px] italic text-text-secondary">
              Invite a team member
            </span>
            <button
              type="button"
              onClick={onInvite}
              className="w-fit rounded-lg border border-primary px-3 py-1 text-[11px] font-semibold text-primary"
            >
              + Invite
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingInvitesPanel({
  invites,
  onResend,
  onCancel,
}: {
  invites: PendingInvite[];
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [resentId, setResentId] = useState<string | null>(null);

  const handleResendClick = (id: string) => {
    onResend(id);
    setResentId(id);
    setTimeout(() => {
      setResentId((current) => (current === id ? null : current));
    }, 1500);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white">Pending Invitations</p>
          <span className="w-fit rounded-[20px] border border-primary bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {invites.length}
          </span>
        </div>
        <p className="text-[11px] text-text-secondary">Invitations expire in 7 days</p>
      </div>

      {invites.length === 0 ? (
        <p className="mt-4 text-[13px] text-text-secondary">No pending invitations.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border-dark bg-background p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-xs font-bold text-white">
                  {invite.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">{invite.name}</p>
                  <span className="mt-0.5 inline-block w-fit rounded-[20px] border border-border-dark bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                    {invite.role}
                  </span>
                  <p className="mt-1 text-[11px] text-text-secondary">Invited via WhatsApp</p>
                </div>
              </div>

              <div className="flex flex-col text-[11px]">
                <span className="text-text-secondary">Sent: {invite.sentAt}</span>
                <span className="text-amber-400">Expires in: {invite.expiresIn}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-fit rounded-[20px] border border-amber-400 bg-amber-400/15 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                  Awaiting Response
                </span>

                {confirmingId === invite.id ? (
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="text-text-secondary">Cancel this invitation?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onCancel(invite.id);
                        setConfirmingId(null);
                      }}
                      className="font-semibold text-red-400"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="font-semibold text-text-secondary"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[12px]">
                    <button
                      type="button"
                      onClick={() => handleResendClick(invite.id)}
                      className="font-semibold text-text-secondary hover:text-primary"
                    >
                      {resentId === invite.id ? "✓ Resent" : "Resend"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(invite.id)}
                      className="font-semibold text-red-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RolePermissionsPanel() {
  return (
    <>
      <p className="text-sm font-bold text-white">What each role can do</p>
      <div className="mt-3 overflow-x-auto hide-scrollbar">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="pb-2 text-left text-text-secondary"> </th>
              {["Owner", "Mgr", "Merch", "Des", "Acc"].map((col) => (
                <th key={col} className="pb-2 text-center font-semibold text-text-secondary">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS_TABLE_ROWS.map((row) => (
              <tr key={row.label} className="border-t border-border-dark">
                <td className="py-1.5 text-text-primary">{row.label}</td>
                {row.values.map((value, index) => (
                  <td key={index} className="py-1.5 text-center">
                    <PermissionCell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[13px] font-bold text-primary">💡 Pro tips</p>
      <div className="mt-3 flex flex-col gap-2">
        {TIPS.map((tip) => (
          <p key={tip} className="text-xs text-text-secondary">
            → {tip}
          </p>
        ))}
      </div>
    </>
  );
}

const INVITATION_STEPS = [
  {
    title: "1. You send invite",
    detail: "They receive a WhatsApp message with a link",
  },
  {
    title: "2. They click the link",
    detail: "Opens FabVerify signup/login",
  },
  {
    title: "3. They join your workspace",
    detail: "Automatically added to your team with the role you assigned",
  },
  {
    title: "4. You get notified",
    detail: "WhatsApp message confirms they have joined",
  },
];

function HowInvitationsWorkPanel() {
  return (
    <>
      <div className="my-5 h-px bg-border-dark" />
      <p className="text-[13px] font-bold text-white">How invitations work</p>
      <div className="mt-3 flex flex-col gap-3">
        {INVITATION_STEPS.map((step) => (
          <div key={step.title}>
            <p className="text-xs font-semibold text-text-primary">{step.title}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{step.detail}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default function TeamManagement() {
  const authorized = useEnterpriseAccess();
  const [showInvite, setShowInvite] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(INITIAL_PENDING_INVITES);
  const [activeTab, setActiveTab] = useState<"members" | "pending">("members");
  const [showAcceptedBanner, setShowAcceptedBanner] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!showAcceptedBanner) return;
    const timer = setTimeout(() => setShowAcceptedBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showAcceptedBanner]);

  if (!authorized) return null;

  const handleSaveEdit = (role: Role) => {
    if (!editingMember) return;
    const id = editingMember.id;
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, role } : member))
    );
  };

  const handleConfirmRemove = () => {
    if (!removingMember) return;
    const id = removingMember.id;
    setMembers((current) => current.filter((member) => member.id !== id));
    setRemovingMember(null);
  };

  const handleSendInvite = (invite: { name: string; phone: string; email: string; role: Role }) => {
    setPendingInvites((current) => [
      ...current,
      {
        id: `inv-${Date.now()}`,
        name: invite.name,
        phone: invite.phone,
        email: invite.email,
        role: invite.role,
        sentAt: "Just now",
        expiresIn: "7 days",
        status: "pending",
      },
    ]);
  };

  const handleResendInvite = (id: string) => {
    setPendingInvites((current) =>
      current.map((invite) => (invite.id === id ? { ...invite, sentAt: "Just now" } : invite))
    );
  };

  const handleCancelInvite = (id: string) => {
    setPendingInvites((current) => current.filter((invite) => invite.id !== id));
  };

  const inviteButton = (
    <button
      type="button"
      onClick={() => setShowInvite(true)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy"
    >
      + Invite Member
    </button>
  );

  const alertNotification =
    pendingInvites.length > 0
      ? {
          title: `${pendingInvites.length} team invitation${pendingInvites.length === 1 ? "" : "s"} pending response`,
          detail: "Waiting for them to accept via WhatsApp",
        }
      : undefined;

  const acceptedBanner = showAcceptedBanner && (
    <div className="flex items-center justify-between gap-3 border-b border-green-400/30 bg-green-400/15 px-6 py-3">
      <p className="text-[13px] font-semibold text-white">
        ✅ Kavitha Rajan accepted your invitation and joined as QC Inspector
      </p>
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          onClick={() => setShowAcceptedBanner(false)}
          className="text-[12px] font-semibold text-white underline"
        >
          View profile →
        </button>
        <button
          type="button"
          onClick={() => setShowAcceptedBanner(false)}
          aria-label="Dismiss"
          className="text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );

  const tabsRow = (
    <div className="flex gap-6 border-b border-border-dark">
      <button
        type="button"
        onClick={() => setActiveTab("members")}
        className={`-mb-px border-b-2 pb-2.5 text-[13px] font-semibold ${
          activeTab === "members"
            ? "border-primary text-white"
            : "border-transparent text-text-secondary"
        }`}
      >
        Team Members ({members.length + 1})
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("pending")}
        className={`-mb-px border-b-2 pb-2.5 text-[13px] font-semibold ${
          activeTab === "pending"
            ? "border-primary text-white"
            : "border-transparent text-text-secondary"
        }`}
      >
        Pending ({pendingInvites.length})
      </button>
    </div>
  );

  const centrePanel = (
    <>
      {acceptedBanner}
      <TopBar
        title="My Team"
        subtitle="Manage who has access to your FabVerify workspace"
        rightContent={inviteButton}
        alertNotification={alertNotification}
      />

      <div className="px-6 py-6">
        <RoleCardsRow />
        <div className="mt-6">{tabsRow}</div>
        {activeTab === "members" ? (
          <TeamTable
            members={members}
            onInvite={() => setShowInvite(true)}
            onRowClick={setSelectedMember}
            onEdit={setEditingMember}
            onRemove={setRemovingMember}
          />
        ) : (
          <PendingInvitesPanel
            invites={pendingInvites}
            onResend={handleResendInvite}
            onCancel={handleCancelInvite}
          />
        )}
      </div>
    </>
  );

  return (
    <>
      <ThreePanelLayout
        left={<EnterpriseLeftPanel />}
        centre={centrePanel}
        right={
          <div style={{ padding: "20px" }}>
            <RolePermissionsPanel />
            <HowInvitationsWorkPanel />
          </div>
        }
      />

      <div
        className="flex flex-col pb-4 md:hidden"
        style={{ height: "100vh", overflowY: "auto", scrollbarWidth: "none" }}
      >
        {acceptedBanner}
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
          <div className="flex items-center gap-1 font-display text-base font-bold">
            <span>🧵</span>
            <span className="text-white">Fab</span>
            <span className="text-primary">Verify</span>
          </div>
          {inviteButton}
        </div>

        <div className="flex-1 px-4 py-5">
          <h1 className="font-display text-lg font-bold text-white">My Team</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Manage who has access to your FabVerify workspace
          </p>

          <div className="mt-4">
            <RoleCardsRow />
          </div>
          <div className="mt-6">{tabsRow}</div>
          {activeTab === "members" ? (
            <TeamTable
              members={members}
              onInvite={() => setShowInvite(true)}
              onRowClick={setSelectedMember}
              onEdit={setEditingMember}
              onRemove={setRemovingMember}
            />
          ) : (
            <PendingInvitesPanel
              invites={pendingInvites}
              onResend={handleResendInvite}
              onCancel={handleCancelInvite}
            />
          )}

          <div className="mt-8 rounded-xl border border-border-dark bg-card p-4">
            <RolePermissionsPanel />
            <HowInvitationsWorkPanel />
          </div>
        </div>
      </div>

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onSend={handleSendInvite} />
      )}

      {mounted &&
        selectedMember &&
        createPortal(
          <MemberDetailModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onEditRole={setEditingMember}
            onRemove={setRemovingMember}
          />,
          document.body
        )}

      {mounted &&
        editingMember &&
        createPortal(
          <EditMemberModal
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onSave={handleSaveEdit}
          />,
          document.body
        )}

      {mounted &&
        removingMember &&
        createPortal(
          <RemoveMemberModal
            member={removingMember}
            onClose={() => setRemovingMember(null)}
            onConfirm={handleConfirmRemove}
          />,
          document.body
        )}
    </>
  );
}
