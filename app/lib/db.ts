/**
 * FabVerify Database Abstraction Layer
 *
 * MIGRATION NOTE:
 * This file is the ONLY place Supabase is imported for actual queries. To
 * migrate to AWS RDS:
 *
 * 1. Replace the supabaseAdmin client with a pg or drizzle client
 * 2. Update query syntax if needed
 * 3. All other files stay unchanged
 *
 * All queries use standard PostgreSQL. No Supabase-specific features used.
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
}) {
  const orderNumber = "ORD-" + Date.now().toString().slice(-6);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      ...order,
      order_number: orderNumber,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  const milestones = [
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
  return data;
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
  order_id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type?: string;
  media_url?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      ...message,
      message_type: message.message_type || "text",
    })
    .select()
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
        id, name, city
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
