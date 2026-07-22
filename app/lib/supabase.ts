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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
