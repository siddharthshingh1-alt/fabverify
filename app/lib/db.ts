/**
 * FabVerify Database Abstraction Layer
 *
 * MIGRATION NOTE:
 * This file is the ONLY place Supabase is imported for actual queries. To
 * migrate to AWS RDS:
 *
 * 1. Replace the supabaseAdmin client with a pg or drizzle client
 * 2. Rewrite the PostgREST query syntax below. This is real work, not a
 *    find-and-replace. Audited 2026-07-30 across 813 lines / 35 exported
 *    functions:
 *      · 16 embedded-resource joins (`buyer:users!buyer_id(...)`) → SQL JOINs
 *      ·  8 `.maybeSingle()`                                      → `rows[0] ?? null`
 *      ·  2 `.upsert(..., { onConflict })`                        → INSERT … ON CONFLICT DO UPDATE
 * 3. All other files stay unchanged
 *
 * The DATA MODEL is standard PostgreSQL — no Supabase-specific column types,
 * extensions, triggers or functions, so the schema itself ports as-is. The
 * QUERY SYNTAX is NOT: PostgREST's builder is a Supabase client feature.
 * This header previously claimed "No Supabase-specific features used", which
 * was inaccurate and would have made any migration planned against it badly
 * underestimate the work. See docs/ARCHITECTURE/MIGRATION.md §1.2.
 *
 * SERVER-ONLY: this file uses the service-role client, which bypasses Row
 * Level Security entirely. Only import it from Route Handlers under
 * app/api/ — never from a "use client" file or anything reachable from one.
 * Dev-mode auth has no real Supabase session/auth.uid() behind it, so
 * direct RLS-protected client calls from the browser would be rejected;
 * every write here goes through this trusted server-side path instead.
 */

import { supabaseAdmin } from "./supabaseAdmin";

// ── USERS ──────────────────────────────────────────────

export async function getUserByPhone(phone: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) return null;
  return data;
}

// Same lookup as getUserByPhone, but THROWS when the database itself fails
// instead of returning null. getUserByPhone swallows errors, which makes
// "no such user" and "database unreachable" indistinguishable — and any
// auth check built on it reports a database outage as "not authenticated".
// Use this wherever that distinction matters. Returns null only for a
// genuine no-match.
export async function getUserByPhoneOrThrow(phone: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function upsertUser(userData: {
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  user_type?: string;
  position?: string;
  profile_photo?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(userData, { onConflict: "phone" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserType(phone: string, userType: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ user_type: userType })
    .eq("phone", phone);

  if (error) throw error;
}

// The role a user holds inside an enterprise (md_ceo, cfo, …). Stored on
// users.position so enterprise position survives logout — it used to live
// only in localStorage, which meant a re-login lost it entirely.
export async function updateUserPosition(phone: string, position: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ position })
    .eq("phone", phone);

  if (error) throw error;
}

// Validates a Supabase auth access token (the real, tamper-proof session
// issued by signInWithOtp/verifyOtp) and returns the phone number Supabase
// itself attests to — not a phone the caller merely claims in the request.
// Returns null when the token is missing, invalid or expired.
//
// Only the TOKEN is checked here. Resolving that phone to a users row is a
// separate step (getUserByPhoneOrThrow) so a database failure can't be
// mistaken for a bad token. users.id is a separate generated UUID, not
// auth.uid(), so phone is the durable link between the two.
export async function getPhoneFromAccessToken(accessToken: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user?.phone) return null;

  return data.user.phone.replace(/\D/g, "").slice(-10);
}

// Generic per-user-type onboarding data (crafts, skills, portfolio, rates,
// etc.) that doesn't have a dedicated table. Stored as JSON on the users
// row so every user type — not just manufacturers — has somewhere to land.
export async function saveUserProfileData(
  phone: string,
  profileData: Record<string, unknown>
) {
  const user = await getUserByPhone(phone);
  if (!user) throw new Error(`No user found for phone ${phone}`);

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ profile_data: profileData })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── MANUFACTURER PROFILES ──────────────────────────────

export async function saveManufacturerProfile(profile: {
  user_id: string;
  business_name: string;
  city: string;
  state: string;
  categories: string[];
  min_order: number;
  capacity: string;
  unit_type?: string;
  specialisations?: string[];
}) {
  const { data, error } = await supabaseAdmin
    .from("manufacturer_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getManufacturers(filters?: {
  category?: string;
  city?: string;
  tier?: string;
  minScore?: number;
}) {
  let query = supabaseAdmin
    .from("manufacturer_profiles")
    .select(
      `
      *,
      user:users(
        id, name, phone, city, state
      )
    `
    )
    .eq("is_visible", true);

  if (filters?.city && filters.city !== "All Cities") {
    query = query.eq("city", filters.city);
  }

  if (filters?.tier && filters.tier !== "All Tiers") {
    query = query.eq("verification_tier", filters.tier.toLowerCase());
  }

  if (filters?.category) {
    query = query.contains("categories", [filters.category]);
  }

  if (filters?.minScore) {
    query = query.gte("fab_score", filters.minScore);
  }

  const { data, error } = await query
    .order("fab_score", { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}

export async function getManufacturerById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("manufacturer_profiles")
    .select(
      `
      *,
      user:users(
        id, name, phone, city, state
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data;
}

// ── ORDERS ──────────────────────────────────────────────

export async function createOrder(order: {
  buyer_id: string;
  manufacturer_id: string;
  style_name: string;
  quantity: number;
  price_per_piece: number;
  total_value: number;
  delivery_date: string;
  milestones?: { name: string; pct: number }[];
}) {
  const orderNumber = "ORD-" + Date.now().toString().slice(-6);
  const { milestones: customMilestones, ...orderFields } = order;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      ...orderFields,
      order_number: orderNumber,
      status: "pending",
      escrow_total: order.total_value,
      escrow_released: 0,
    })
    .select()
    .single();

  if (error) throw error;

  const milestones = customMilestones?.length
    ? customMilestones
    : [
        { name: "Order Confirmation", pct: 20 },
        { name: "Fabric In-house", pct: 10 },
        { name: "Production Complete", pct: 30 },
        { name: "QC Passed", pct: 20 },
        { name: "Delivery Confirmed", pct: 20 },
      ];

  await supabaseAdmin.from("order_milestones").insert(
    milestones.map((m, i) => ({
      order_id: data.id,
      milestone_number: i + 1,
      milestone_name: m.name,
      payment_percentage: m.pct,
      status: i === 0 ? "active" : "pending",
    }))
  );

  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw error;
}

// Scoped to the parent order ON PURPOSE. Without the order_id filter, a
// caller authorised on ONE order could advance a milestone belonging to a
// DIFFERENT order just by naming its id — the route's party check proves
// which order you may touch, not which milestone. Filtering here makes the
// two agree in a single atomic statement rather than a read-then-write.
//
// Returns false when nothing matched (wrong order, or no such milestone) so
// the caller can answer 404 instead of reporting a success that never
// happened — a Supabase update matching zero rows is not an error.
export async function updateMilestoneStatus(
  milestoneId: string,
  status: string,
  orderId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("order_milestones")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", milestoneId)
    .eq("order_id", orderId)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function getOrdersByUser(
  userId: string,
  role: "buyer" | "manufacturer"
) {
  const column = role === "buyer" ? "buyer_id" : "manufacturer_id";

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city
      ),
      manufacturer:users!manufacturer_id(
        id, name, city
      ),
      milestones:order_milestones(*)
    `
    )
    .eq(column, userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city, phone
      ),
      manufacturer:users!manufacturer_id(
        id, name, city, phone
      ),
      milestones:order_milestones(
        *
      )
    `
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) return null;
  return data;
}

// ── ENQUIRIES ───────────────────────────────────────────

export async function sendEnquiry(enquiry: {
  sender_id: string;
  receiver_id: string;
  subject: string;
  message: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .insert(enquiry)
    .select()
    .single();

  if (error) throw error;

  // An enquiry is also the first message of a conversation from the
  // recipient's point of view — seed it so FabChat shows this thread
  // immediately, without a separate "start chat" step.
  //
  // A failure here does NOT fail the enquiry: the enquiry row is already
  // committed, so throwing would leave the caller believing nothing was
  // saved when in fact it was. Instead the outcome is REPORTED — the route
  // passes conversationSeeded to the client, which tells the user their
  // enquiry arrived but the chat thread did not. Previously this failure
  // existed only as a console.error on the server, invisible to the user
  // and to anyone not watching the terminal.
  const { error: messageError } = await supabaseAdmin.from("messages").insert({
    sender_id: enquiry.sender_id,
    receiver_id: enquiry.receiver_id,
    content: enquiry.subject ? `${enquiry.subject}\n\n${enquiry.message}` : enquiry.message,
    message_type: "text",
  });
  if (messageError) {
    console.error("Failed to seed conversation from enquiry:", messageError);
  }

  return { enquiry: data, conversationSeeded: !messageError };
}

export async function getEnquiries(
  userId: string,
  type: "received" | "sent"
) {
  const column = type === "received" ? "receiver_id" : "sender_id";

  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .select(
      `
      *,
      sender:users!sender_id(
        id, name, city
      ),
      receiver:users!receiver_id(
        id, name, city
      )
    `
    )
    .eq(column, userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

// ── MESSAGES ────────────────────────────────────────────

export async function sendMessage(message: {
  order_id?: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: string;
  media_url?: string | null;
  is_verified_update?: boolean;
}) {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      ...message,
      message_type: message.message_type || "text",
      is_verified_update: message.is_verified_update ?? false,
    })
    .select(
      `
      *,
      sender:users!sender_id(id, name, phone),
      receiver:users!receiver_id(id, name, phone)
    `
    )
    .single();

  if (error) throw error;
  return data;
}

export async function getMessages(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(
      `
      *,
      sender:users!sender_id(
        id, name
      )
    `
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}

// Messages for a user — optionally narrowed to one conversation partner
// and/or one order. A conversation between two users always has one of
// them as sender and the other as receiver, so ANDing "involves user" with
// "involves partner" (two separate .or() filters) correctly isolates
// exactly the messages between those two people, in either direction.
export async function getMessagesForUser(params: {
  userId: string;
  otherUserId?: string;
  orderId?: string;
}) {
  let query = supabaseAdmin
    .from("messages")
    .select(
      `
      *,
      sender:users!sender_id(id, name, phone),
      receiver:users!receiver_id(id, name, phone)
    `
    )
    .or(`sender_id.eq.${params.userId},receiver_id.eq.${params.userId}`);

  if (params.orderId) {
    query = query.eq("order_id", params.orderId);
  }

  if (params.otherUserId) {
    query = query.or(
      `sender_id.eq.${params.otherUserId},receiver_id.eq.${params.otherUserId}`
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return [];
  return data;
}

export async function markMessagesRead(receiverId: string, senderId: string) {
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", receiverId)
    .eq("sender_id", senderId)
    .is("read_at", null);

  if (error) throw error;
}

// One row per conversation partner, latest message first, with an unread
// count — same grouping FabChat's UI needs, computed here since there's no
// dedicated conversations table (a conversation is just "messages between
// two users", possibly scoped to an order).
export async function getConversationsForUser(userId: string) {
  const { data: messages, error } = await supabaseAdmin
    .from("messages")
    .select(
      `
      *,
      sender:users!sender_id(id, name, phone, user_type),
      receiver:users!receiver_id(id, name, phone, user_type),
      order:orders(id, order_number, style_name, status)
    `
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !messages) return [];

  type ConversationMessage = (typeof messages)[number];
  const conversationMap = new Map<
    string,
    {
      partnerId: string;
      partnerName: string | null;
      partnerPhone: string;
      partnerType: string | null;
      lastMessage: string;
      lastMessageType: string;
      lastMessageTime: string;
      unreadCount: number;
      order: ConversationMessage["order"];
      orderId: string | null;
    }
  >();

  for (const msg of messages) {
    const isSender = msg.sender_id === userId;
    const partnerId = isSender ? msg.receiver_id : msg.sender_id;
    const partner = isSender ? msg.receiver : msg.sender;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId,
        partnerName: partner?.name ?? null,
        partnerPhone: partner?.phone ?? "",
        partnerType: partner?.user_type ?? null,
        lastMessage: msg.content,
        lastMessageType: msg.message_type,
        lastMessageTime: msg.created_at,
        unreadCount: 0,
        order: msg.order,
        orderId: msg.order_id,
      });
    }

    if (msg.receiver_id === userId && !msg.read_at) {
      conversationMap.get(partnerId)!.unreadCount++;
    }
  }

  return Array.from(conversationMap.values());
}

// ── SAMPLE BRIEFS ───────────────────────────────────────

export async function createSampleBrief(brief: {
  buyer_id: string;
  title: string;
  category: string;
  description: string;
  quantity: number;
  budget_min: number;
  budget_max: number;
}) {
  const { data, error } = await supabaseAdmin
    .from("sample_briefs")
    .insert(brief)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSampleBriefs(filters?: {
  category?: string;
  status?: string;
}) {
  let query = supabaseAdmin
    .from("sample_briefs")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city, user_type, phone
      )
    `
    )
    .eq("status", filters?.status || "open");

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) return [];
  return data;
}

export async function getSampleBriefsByBuyer(buyerId: string) {
  const { data, error } = await supabaseAdmin
    .from("sample_briefs")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city
      )
    `
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getSampleBriefById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("sample_briefs")
    .select(
      `
      *,
      buyer:users!buyer_id(
        id, name, city, phone
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function updateSampleBriefStatus(id: string, status: string) {
  const { error } = await supabaseAdmin
    .from("sample_briefs")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

// ── VERIFICATION ────────────────────────────────────────

export async function getVerificationStatus(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(
      `
      verification_tier,
      verification_status,
      bronze_verified_at,
      silver_verified_at,
      gold_verified_at
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getLatestVerificationApplication(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("verification_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function submitVerificationApplication(
  userId: string,
  tier: string,
  documents: object,
  videoCallScheduled?: string | null
) {
  const { data, error } = await supabaseAdmin
    .from("verification_applications")
    .insert({
      user_id: userId,
      tier,
      status: "pending",
      documents,
      video_call_scheduled: videoCallScheduled ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVerificationApplicationStatus(
  applicationId: string,
  status: string
) {
  const { error } = await supabaseAdmin
    .from("verification_applications")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) throw error;
}

const VERIFICATION_TIER_COLUMN: Record<string, string> = {
  bronze: "bronze_verified_at",
  silver: "silver_verified_at",
  gold: "gold_verified_at",
};

export async function updateVerificationTier(userId: string, tier: string) {
  const tierColumn = VERIFICATION_TIER_COLUMN[tier];
  const update: Record<string, string> = {
    verification_tier: tier,
    verification_status: "verified",
  };
  if (tierColumn) update[tierColumn] = new Date().toISOString();

  const { error } = await supabaseAdmin.from("users").update(update).eq("id", userId);

  if (error) throw error;

  // manufacturer_profiles has its own verification_tier column (used by the
  // discovery-page badge/filter) that defaults to 'bronze' at profile
  // creation, independent of this real verification flow. Propagate real
  // silver/gold upgrades onto it so the discovery card doesn't understate a
  // manufacturer's actual status — a no-op update for every other user type
  // (and for bronze, since that's already the profile's default).
  if (tier === "silver" || tier === "gold") {
    const { error: profileError } = await supabaseAdmin
      .from("manufacturer_profiles")
      .update({ verification_tier: tier })
      .eq("user_id", userId);
    if (profileError) {
      console.error("Failed to sync manufacturer_profiles verification_tier:", profileError);
    }
  }
}

export async function updateUserVerificationStatus(userId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ verification_status: status })
    .eq("id", userId);

  if (error) throw error;
}

// ── WAITLIST ────────────────────────────────────────────

export async function addToWaitlist(email: string, phone?: string) {
  const { data, error } = await supabaseAdmin
    .from("waitlist")
    .insert({ email, phone: phone || null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── HEALTH ──────────────────────────────────────────────

/**
 * Connectivity probe for GET /api/test-db.
 *
 * THROWS instead of returning a boolean, deliberately: a boolean collapses
 * "database unreachable" and "query failed" into one false, and the caller
 * needs that distinction to answer 503 vs 500 via dbErrorResponse(). Same
 * reasoning as getUserByPhoneOrThrow (Issue E).
 *
 * Runs on the service-role path because that is the path every real route
 * uses through this file. It previously ran on the anon client from inside
 * the route itself, which tested RLS — retired as a security mechanism in
 * DECISIONS I8 — rather than testing what the application depends on.
 */
export async function checkDatabaseConnection(): Promise<void> {
  const { error } = await supabaseAdmin.from("users").select("id").limit(1);

  if (error) throw error;
}
