import { createClient } from "@supabase/supabase-js";

// Falls back to placeholder values so `next build` doesn't crash when
// NEXT_PUBLIC_SUPABASE_URL isn't a real URL yet (createClient throws
// synchronously on an invalid URL, and Next imports every route module
// during build to collect page data). Calls made without real credentials
// configured in .env.local will fail at request time instead, which is
// the expected/safe failure mode.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// supabase-js appends its own /auth/v1, /rest/v1, etc. suffixes — the env
// var must be the bare project URL with no path or trailing slash, or auth
// calls end up double-pathed (e.g. /rest/v1/auth/v1/otp).
const cleanUrl = supabaseUrl.replace(/\/(rest|auth|realtime|storage)\/v1\/?$/, "").replace(/\/$/, "");

if (typeof window !== "undefined") {
  console.log("Supabase URL:", cleanUrl);
}

export const supabase = createClient(cleanUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
