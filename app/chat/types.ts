export type PillColor = "gold" | "red" | "blue" | "amber" | "grey" | "green";

export type StatusPillData = {
  label: string;
  color: PillColor;
};

export const PILL_CLASSES: Record<PillColor, string> = {
  gold: "border-primary/40 bg-primary/15 text-primary",
  red: "border-red-500/40 bg-red-500/15 text-red-400",
  blue: "border-[#63B3ED]/40 bg-[#63B3ED]/15 text-[#63B3ED]",
  amber: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  grey: "border-border-dark bg-border-dark/60 text-text-secondary",
  green: "border-green-500/40 bg-green-500/15 text-green-400",
};

export type ChatMessage = {
  id: string;
  kind: "received" | "sent" | "system";
  text?: string;
  time: string;
  read?: boolean;
  photo?: {
    caption?: string;
    verified?: boolean;
    geoNote?: string;
    dataUrl?: string;
  };
  voice?: {
    audioUrl: string;
    duration: number;
  };
};

export type VerificationTier = "gold" | "silver" | "bronze";

export type Conversation = {
  id: string;
  name: string;
  initials: string;
  unread: number;
  lastMessage: string;
  time: string;
  statusPill?: StatusPillData;
  orderId?: string;
  orderLabel?: string;
  messages: ChatMessage[];
  verificationTier?: VerificationTier;
  city?: string;
  fabscore?: number;
};

export type OrderCard = {
  id: string;
  style: string;
  statusPill: StatusPillData;
  counterparty: string;
  progress: number;
  stageLabel: string;
  dueLabel: string;
  conversationId: string;
};

export type RoleChatData = {
  conversations: Conversation[];
  orders: OrderCard[];
};
