import type { UserType } from "@/app/context/UserContext";
import type { Conversation, ChatMessage, OrderCard, RoleChatData, PillColor } from "./types";

export type ChatRole =
  | "brand"
  | "manufacturer"
  | "mill"
  | "supplier"
  | "artisan"
  | "jobworker"
  | "designer"
  | "master"
  | "merchandiser"
  | "qc"
  | "enterprise";

const ROLE_BY_USER_TYPE: Record<Exclude<UserType, "buyer">, ChatRole> = {
  manufacturer: "manufacturer",
  fabric_mill: "mill",
  trim_supplier: "supplier",
  artisan: "artisan",
  job_worker: "jobworker",
  designer: "designer",
  master: "master",
  merchandiser: "merchandiser",
  qc_inspector: "qc",
};

export function getChatRole(userType: UserType, hasPosition: boolean): ChatRole {
  if (userType === "buyer") return hasPosition ? "enterprise" : "brand";
  return ROLE_BY_USER_TYPE[userType];
}

export function getChatPath(userType: UserType, hasPosition: boolean): string {
  return `/chat/${getChatRole(userType, hasPosition)}`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// Brand — exact sample content.
// ─────────────────────────────────────────────────────────────

const JAIPUR_MESSAGES: ChatMessage[] = [
  { id: "je-1", kind: "system", text: "Order ORD-001 created", time: "9:02 AM" },
  { id: "je-2", kind: "received", text: "Order received. Starting tomorrow.", time: "9:05 AM" },
  { id: "je-3", kind: "sent", text: "Great. Send daily updates please.", time: "9:07 AM", read: true },
  { id: "je-4", kind: "system", text: "Fabric received confirmed", time: "10:30 AM" },
  {
    id: "je-5",
    kind: "received",
    time: "Yesterday · 4:40 PM",
    photo: { caption: "Cutting done — 200 pieces", verified: true, geoNote: "Geo-verified · 200 pieces" },
  },
  { id: "je-6", kind: "sent", text: "Looking good. On track?", time: "Yesterday · 4:55 PM", read: true },
  { id: "je-7", kind: "received", text: "Yes, finishing July 18.", time: "Yesterday · 5:01 PM" },
  { id: "je-8", kind: "system", text: "Production 45% milestone", time: "Today · 9:10 AM" },
  {
    id: "je-9",
    kind: "received",
    time: "2m ago",
    photo: { caption: "150 pieces complete", verified: true, geoNote: "Geo-verified · 150 pieces" },
  },
  { id: "je-10", kind: "received", text: "Should be fully done by tomorrow.", time: "2m ago" },
];

const BRAND_CONVERSATIONS: Conversation[] = [
  {
    id: "jaipur-ethnic-works",
    name: "Jaipur Ethnic Works",
    initials: "JE",
    unread: 2,
    lastMessage: "📸 150 pieces complete",
    time: "2m ago",
    statusPill: { label: "Production", color: "gold" },
    orderId: "block-print-kurta",
    orderLabel: "Block Print Kurta · Production 45%",
    messages: JAIPUR_MESSAGES,
    verificationTier: "gold",
    city: "Jaipur",
    fabscore: 9.2,
  },
  {
    id: "delhi-woven-works",
    name: "Delhi Woven Works",
    initials: "DW",
    unread: 0,
    lastMessage: "Delivery pushed to July 20",
    time: "1h ago",
    statusPill: { label: "Delayed", color: "red" },
    orderId: "palazzo-set",
    orderLabel: "Palazzo Set · Production 30%",
    messages: [
      { id: "dw-1", kind: "system", text: "Order ORD-002 created", time: "Mon · 9:00 AM" },
      { id: "dw-2", kind: "received", text: "Fabric delayed from our mill, sorry for the trouble.", time: "1h ago" },
      { id: "dw-3", kind: "sent", text: "How long is the delay?", time: "1h ago", read: true },
      { id: "dw-4", kind: "received", text: "Delivery pushed to July 20", time: "1h ago" },
    ],
    verificationTier: "silver",
    city: "Delhi NCR",
    fabscore: 8.4,
  },
  {
    id: "meera-sharma",
    name: "Meera Sharma",
    initials: "MS",
    unread: 0,
    lastMessage: "I will send brief today",
    time: "3h ago",
    statusPill: { label: "Hired", color: "blue" },
    messages: [
      { id: "ms-1", kind: "system", text: "Meera Sharma hired as merchandiser", time: "Yesterday" },
      { id: "ms-2", kind: "sent", text: "Welcome aboard! Can you start with the sample brief?", time: "3h ago", read: true },
      { id: "ms-3", kind: "received", text: "I will send brief today", time: "3h ago" },
    ],
    verificationTier: "silver",
    city: "Mumbai",
    fabscore: 8.7,
  },
  {
    id: "lucknow-chikan-studio",
    name: "Lucknow Chikan Studio",
    initials: "LC",
    unread: 0,
    lastMessage: "QC scheduled July 18",
    time: "Yesterday",
    statusPill: { label: "QC", color: "amber" },
    orderId: "chikankari-kurti",
    orderLabel: "Chikankari Kurti · QC 85%",
    messages: [
      { id: "lc-1", kind: "system", text: "Order ORD-003 created", time: "Last week" },
      { id: "lc-2", kind: "received", text: "Embroidery finished on all pieces.", time: "Yesterday" },
      { id: "lc-3", kind: "sent", text: "Great news. When is QC?", time: "Yesterday", read: true },
      { id: "lc-4", kind: "received", text: "QC scheduled July 18", time: "Yesterday" },
    ],
    verificationTier: "gold",
    city: "Lucknow",
    fabscore: 9.0,
  },
];

const BRAND_ORDERS: OrderCard[] = [
  {
    id: "ORD-2024-001",
    style: "Block Print Kurta",
    statusPill: { label: "On Track", color: "green" },
    counterparty: "Jaipur Ethnic Works",
    progress: 45,
    stageLabel: "Production",
    dueLabel: "Due Jul 20",
    conversationId: "jaipur-ethnic-works",
  },
  {
    id: "palazzo-set",
    style: "Palazzo Set",
    statusPill: { label: "Delayed", color: "red" },
    counterparty: "Delhi Woven Works",
    progress: 30,
    stageLabel: "Production",
    dueLabel: "Due Jul 15 → Jul 20",
    conversationId: "delhi-woven-works",
  },
  {
    id: "chikankari-kurti",
    style: "Chikankari Kurti",
    statusPill: { label: "QC", color: "amber" },
    counterparty: "Lucknow Chikan Studio",
    progress: 85,
    stageLabel: "QC",
    dueLabel: "Due Jul 18",
    conversationId: "lucknow-chikan-studio",
  },
];

// ─────────────────────────────────────────────────────────────
// Generic builder for the other 10 roles — same shape, lighter
// content, reusing counterpart names already established across
// the platform's other mock data (dashboards, enquiries).
// ─────────────────────────────────────────────────────────────

type CounterpartConfig = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  pill: { label: string; color: PillColor };
  orderStyle: string;
  orderColor: OrderCard["statusPill"]["color"];
  progress: number;
  stageLabel: string;
  dueLabel: string;
  firstReceived: string;
};

function buildMessages(config: CounterpartConfig): ChatMessage[] {
  return [
    { id: `${config.id}-1`, kind: "system", text: `Order ${config.id.toUpperCase()} created`, time: "Mon · 9:00 AM" },
    { id: `${config.id}-2`, kind: "received", text: config.firstReceived, time: "Mon · 9:05 AM" },
    { id: `${config.id}-3`, kind: "sent", text: "Great. Send daily updates please.", time: "Mon · 9:07 AM", read: true },
    {
      id: `${config.id}-4`,
      kind: "received",
      time: config.time,
      photo: { caption: config.lastMessage.replace(/^📸\s*/, ""), verified: true, geoNote: "Geo-verified" },
    },
    { id: `${config.id}-5`, kind: "received", text: config.lastMessage.replace(/^📸\s*/, ""), time: config.time },
  ];
}

// Generated counterparts have no real directory entry to pull verification
// data from (unlike the brand's four, which are matched to app/data/manufacturers.ts
// by id) — so tier/fabscore are derived from fields already on the config
// rather than invented outright, and city is left unset.
function deriveVerificationTier(color: PillColor): "gold" | "silver" | "bronze" {
  if (color === "gold" || color === "green") return "gold";
  if (color === "red") return "bronze";
  return "silver";
}

function deriveFabscore(progress: number): number {
  return Math.round((7.5 + (progress / 100) * 2) * 10) / 10;
}

function buildRoleData(configs: CounterpartConfig[]): RoleChatData {
  const conversations: Conversation[] = configs.map((c) => ({
    id: c.id,
    name: c.name,
    initials: initialsOf(c.name),
    unread: c.unread,
    lastMessage: c.lastMessage,
    time: c.time,
    statusPill: { label: c.pill.label, color: c.pill.color },
    orderId: c.id,
    orderLabel: `${c.orderStyle} · ${c.stageLabel} ${c.progress}%`,
    messages: buildMessages(c),
    verificationTier: deriveVerificationTier(c.pill.color),
    fabscore: deriveFabscore(c.progress),
  }));

  const orders: OrderCard[] = configs.map((c) => ({
    id: c.id,
    style: c.orderStyle,
    statusPill: { label: c.pill.label, color: c.orderColor },
    counterparty: c.name,
    progress: c.progress,
    stageLabel: c.stageLabel,
    dueLabel: c.dueLabel,
    conversationId: c.id,
  }));

  return { conversations, orders };
}

const ROLE_CONFIGS: Record<Exclude<ChatRole, "brand">, CounterpartConfig[]> = {
  manufacturer: [
    {
      id: "mfg-2024-101",
      name: "Studio Kavya",
      lastMessage: "📸 500 pieces cut and ready for stitching",
      time: "20m ago",
      unread: 1,
      pill: { label: "Production", color: "gold" },
      orderStyle: "Cotton Block Print Kurta",
      orderColor: "green",
      progress: 55,
      stageLabel: "Production",
      dueLabel: "Due Jul 20",
      firstReceived: "We are placing an order for 500 pieces, sharing the tech pack now.",
    },
    {
      id: "mfg-2024-102",
      name: "Urban Thread Co.",
      lastMessage: "Sampling approved, please proceed",
      time: "2h ago",
      unread: 0,
      pill: { label: "Sampling", color: "blue" },
      orderStyle: "Western Wear Set",
      orderColor: "amber",
      progress: 20,
      stageLabel: "Sampling",
      dueLabel: "Due Jul 28",
      firstReceived: "Loved the first sample, one small change on the collar.",
    },
  ],
  mill: [
    {
      id: "sup-2024-011",
      name: "Jaipur Ethnic Works",
      lastMessage: "📸 Weaving in progress, 1200m done",
      time: "45m ago",
      unread: 1,
      pill: { label: "Weaving", color: "gold" },
      orderStyle: "Cotton Lawn 80 GSM",
      orderColor: "green",
      progress: 40,
      stageLabel: "Weaving & Dyeing",
      dueLabel: "Due Jul 8",
      firstReceived: "Confirming the order for 3,000 metres cotton lawn.",
    },
    {
      id: "sup-2024-012",
      name: "Delhi Woven Works",
      lastMessage: "Packed and ready to dispatch",
      time: "3h ago",
      unread: 0,
      pill: { label: "Ready", color: "green" },
      orderStyle: "Linen Blend 180 GSM",
      orderColor: "green",
      progress: 90,
      stageLabel: "Pending Dispatch",
      dueLabel: "Due Jul 4",
      firstReceived: "1,500 metres linen blend order confirmed.",
    },
  ],
  supplier: [
    {
      id: "sup-2024-001",
      name: "Jaipur Ethnic Works",
      lastMessage: "📸 First batch of buttons ready",
      time: "1h ago",
      unread: 1,
      pill: { label: "Production", color: "gold" },
      orderStyle: "Metal Buttons 4-hole 15mm",
      orderColor: "green",
      progress: 60,
      stageLabel: "In Production",
      dueLabel: "Due Jul 10",
      firstReceived: "Need 5,000 pieces silver finish buttons.",
    },
    {
      id: "sup-2024-002",
      name: "Delhi Woven Works",
      lastMessage: "Ready to ship, please confirm pickup",
      time: "5h ago",
      unread: 0,
      pill: { label: "Ready", color: "green" },
      orderStyle: "Invisible Zip 20cm Black",
      orderColor: "green",
      progress: 95,
      stageLabel: "Pending Dispatch",
      dueLabel: "Due Jul 5",
      firstReceived: "2,000 pieces invisible zips confirmed.",
    },
  ],
  artisan: [
    {
      id: "sup-2024-021",
      name: "Studio Kavya",
      lastMessage: "📸 Embroidery halfway done, looks lovely",
      time: "30m ago",
      unread: 2,
      pill: { label: "Production", color: "gold" },
      orderStyle: "Chikankari Embroidery Kurta",
      orderColor: "green",
      progress: 50,
      stageLabel: "Embroidery Work",
      dueLabel: "Due Jul 12",
      firstReceived: "200 pieces chikankari work, sharing the design reference.",
    },
    {
      id: "sup-2024-022",
      name: "House of Nira",
      lastMessage: "Packed, ready for dispatch",
      time: "6h ago",
      unread: 0,
      pill: { label: "Ready", color: "green" },
      orderStyle: "Block Print Dupatta",
      orderColor: "green",
      progress: 100,
      stageLabel: "Pending Dispatch",
      dueLabel: "Due Jul 6",
      firstReceived: "150 pieces block print dupatta, thank you for the quick turnaround.",
    },
  ],
  jobworker: [
    {
      id: "sup-2024-031",
      name: "Jaipur Ethnic Works",
      lastMessage: "📸 600 of 1,000 pieces embroidered",
      time: "1h ago",
      unread: 1,
      pill: { label: "In Progress", color: "gold" },
      orderStyle: "Embroidery Job Work",
      orderColor: "green",
      progress: 60,
      stageLabel: "In Progress",
      dueLabel: "Due Jul 11",
      firstReceived: "1,000 pieces embroidery job work, deadline in 3 weeks.",
    },
    {
      id: "sup-2024-032",
      name: "Mumbai Denim Studio",
      lastMessage: "Washing complete, packed and ready",
      time: "4h ago",
      unread: 0,
      pill: { label: "Ready", color: "green" },
      orderStyle: "Denim Washing",
      orderColor: "green",
      progress: 100,
      stageLabel: "Pending Dispatch",
      dueLabel: "Due Jul 3",
      firstReceived: "2,000 pieces denim washing, monthly order.",
    },
  ],
  designer: [
    {
      id: "de-tech-pack",
      name: "Studio Kavya",
      lastMessage: "📸 Revised tech pack attached",
      time: "15m ago",
      unread: 1,
      pill: { label: "Revision", color: "amber" },
      orderStyle: "Tech Pack — Ethnic Wear Capsule",
      orderColor: "amber",
      progress: 70,
      stageLabel: "Revision",
      dueLabel: "Due Jul 15",
      firstReceived: "Looking for a designer to create tech packs for our next collection.",
    },
    {
      id: "de-flat-sketch",
      name: "Urban Thread Co.",
      lastMessage: "Approved, thank you!",
      time: "1d ago",
      unread: 0,
      pill: { label: "Approved", color: "blue" },
      orderStyle: "Flat Sketches — Western Wear",
      orderColor: "green",
      progress: 100,
      stageLabel: "Review",
      dueLabel: "Due Jul 22",
      firstReceived: "Need a freelance designer for western wear flat sketches.",
    },
  ],
  master: [
    {
      id: "smp-101",
      name: "Studio Kavya",
      lastMessage: "📸 Sample construction in progress",
      time: "40m ago",
      unread: 1,
      pill: { label: "Construction", color: "gold" },
      orderStyle: "Ethnic Kurta Sample",
      orderColor: "green",
      progress: 55,
      stageLabel: "Construction",
      dueLabel: "Due Jul 14",
      firstReceived: "Need a master to construct 3 samples from our tech pack, urgent.",
    },
    {
      id: "smp-102",
      name: "Little Sprout Kids",
      lastMessage: "Fitting scheduled tomorrow",
      time: "2d ago",
      unread: 0,
      pill: { label: "Fitting", color: "blue" },
      orderStyle: "Knit Romper Sample",
      orderColor: "amber",
      progress: 80,
      stageLabel: "Fitting",
      dueLabel: "Due Jul 18",
      firstReceived: "Need a master for knit construction samples, small batch.",
    },
  ],
  merchandiser: [
    {
      id: "me-sourcing",
      name: "Studio Kavya",
      lastMessage: "📸 Vendor shortlist and swatches attached",
      time: "25m ago",
      unread: 1,
      pill: { label: "Sourcing", color: "gold" },
      orderStyle: "Sourcing & Production — Next Drop",
      orderColor: "amber",
      progress: 40,
      stageLabel: "Sourcing",
      dueLabel: "Due Jul 20",
      firstReceived: "Looking for a merchandiser to manage sourcing and production.",
    },
    {
      id: "me-qc",
      name: "House of Nira",
      lastMessage: "QC booked for Friday",
      time: "1d ago",
      unread: 0,
      pill: { label: "QC", color: "amber" },
      orderStyle: "QC & Dispatch Coordination",
      orderColor: "green",
      progress: 75,
      stageLabel: "QC",
      dueLabel: "Due Jul 12",
      firstReceived: "Need help managing QC and dispatch for an ongoing order.",
    },
  ],
  qc: [
    {
      id: "qc-predispatch",
      name: "Jaipur Ethnic Works",
      lastMessage: "📸 Factory floor photos before inspection",
      time: "1h ago",
      unread: 1,
      pill: { label: "Scheduled", color: "blue" },
      orderStyle: "Pre-dispatch Inspection",
      orderColor: "amber",
      progress: 0,
      stageLabel: "Scheduled",
      dueLabel: "Due Jul 14",
      firstReceived: "Need a pre-dispatch inspection for 2,000 pieces before shipment.",
    },
    {
      id: "qc-inline",
      name: "Studio Kavya",
      lastMessage: "Report submitted",
      time: "2d ago",
      unread: 0,
      pill: { label: "Done", color: "grey" },
      orderStyle: "In-line Inspection — Tirupur",
      orderColor: "green",
      progress: 100,
      stageLabel: "Completed",
      dueLabel: "Completed Jul 9",
      firstReceived: "Looking for an in-line inspection for our order at a Tirupur factory.",
    },
  ],
  enterprise: [
    {
      id: "ent-block-print",
      name: "Jaipur Ethnic Works",
      lastMessage: "📸 On track, 75% complete",
      time: "10m ago",
      unread: 1,
      pill: { label: "On Track", color: "gold" },
      orderStyle: "Block Print Kurta",
      orderColor: "green",
      progress: 75,
      stageLabel: "Production",
      dueLabel: "Due Jul 15",
      firstReceived: "Season order confirmed, starting production this week.",
    },
    {
      id: "ent-palazzo",
      name: "Delhi Woven Works",
      lastMessage: "Delayed 5 days, need your sign-off",
      time: "1h ago",
      unread: 1,
      pill: { label: "Delayed", color: "red" },
      orderStyle: "Palazzo Set",
      orderColor: "red",
      progress: 55,
      stageLabel: "Production",
      dueLabel: "Due Jul 20",
      firstReceived: "Flagging a delay on raw material — needs your approval to proceed.",
    },
  ],
};

const ROLE_DATA: Record<ChatRole, RoleChatData> = {
  brand: {
    conversations: BRAND_CONVERSATIONS,
    orders: BRAND_ORDERS,
  },
  manufacturer: buildRoleData(ROLE_CONFIGS.manufacturer),
  mill: buildRoleData(ROLE_CONFIGS.mill),
  supplier: buildRoleData(ROLE_CONFIGS.supplier),
  artisan: buildRoleData(ROLE_CONFIGS.artisan),
  jobworker: buildRoleData(ROLE_CONFIGS.jobworker),
  designer: buildRoleData(ROLE_CONFIGS.designer),
  master: buildRoleData(ROLE_CONFIGS.master),
  merchandiser: buildRoleData(ROLE_CONFIGS.merchandiser),
  qc: buildRoleData(ROLE_CONFIGS.qc),
  enterprise: buildRoleData(ROLE_CONFIGS.enterprise),
};

export function getRoleChatData(role: ChatRole): RoleChatData {
  return ROLE_DATA[role];
}

export function getUnreadCount(userType: UserType, hasPosition: boolean): number {
  const role = getChatRole(userType, hasPosition);
  return ROLE_DATA[role].conversations.reduce((sum, c) => sum + c.unread, 0);
}
