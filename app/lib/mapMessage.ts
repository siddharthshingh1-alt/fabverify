import type { ChatMessage, Conversation, PillColor } from "../chat/types";

// Shapes returned by GET /api/messages and GET /api/conversations.
export type MessageRow = {
  id: string;
  order_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  is_verified_update: boolean;
  read_at: string | null;
  created_at: string;
};

export type ConversationRow = {
  partnerId: string;
  partnerName: string | null;
  partnerPhone: string;
  partnerType: string | null;
  lastMessage: string;
  lastMessageType: string;
  lastMessageTime: string;
  unreadCount: number;
  order: { id: string; order_number: string; style_name: string; status: string } | null;
  orderId: string | null;
};

function initialsFromName(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function formatChatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const ORDER_STATUS_PILL_COLOR: Record<string, PillColor> = {
  pending: "amber",
  confirmed: "blue",
  completed: "green",
  declined: "red",
};

// Real conversations are grouped purely by counterparty (see
// getConversationsForUser in app/lib/db.ts), so `id` is the partner's real
// user id — there's no separate conversation-id concept in the schema.
export function mapConversationRowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.partnerId,
    name: row.partnerName ?? "Unknown",
    initials: initialsFromName(row.partnerName ?? "?"),
    unread: row.unreadCount,
    lastMessage: row.lastMessageType === "photo" ? "📷 Photo" : row.lastMessage,
    time: formatChatTime(row.lastMessageTime),
    statusPill: row.order
      ? { label: row.order.status, color: ORDER_STATUS_PILL_COLOR[row.order.status] ?? "grey" }
      : undefined,
    orderId: row.orderId ?? undefined,
    orderLabel: row.order ? `${row.order.order_number} · ${row.order.style_name}` : undefined,
    messages: [],
    partnerPhone: row.partnerPhone,
  };
}

export function mapMessageRowToChatMessage(row: MessageRow, viewerId: string): ChatMessage {
  const isSent = row.sender_id === viewerId;
  const kind: ChatMessage["kind"] = isSent ? "sent" : "received";
  const base = {
    id: row.id,
    kind,
    time: formatChatTime(row.created_at),
    read: Boolean(row.read_at),
  };

  if (row.message_type === "photo" && row.media_url) {
    return {
      ...base,
      photo: {
        caption: row.content && row.content !== "Photo" ? row.content : undefined,
        verified: row.is_verified_update,
        geoNote: row.is_verified_update ? "Geo-verified · production update" : undefined,
        dataUrl: row.media_url,
      },
    };
  }

  return { ...base, text: row.content };
}
