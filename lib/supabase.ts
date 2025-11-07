import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time, env vars might not be set - use dummy values to allow build
// At runtime, the actual values from Vercel env vars will be used
const url = supabaseUrl || "https://placeholder.supabase.co";
const key = supabaseAnonKey || "placeholder-key";

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    // Only throw error at runtime in the browser, not during build
    console.error("Missing Supabase environment variables");
  }
}

export const supabase = createClient(url, key);
