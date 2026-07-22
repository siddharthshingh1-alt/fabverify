import { createClient } from "@supabase/supabase-js";

// Server-only client — uses the service role key, which bypasses Row Level
// Security entirely. Never import this from a "use client" file or any
// module reachable from one; only from Route Handlers under app/api/.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
