import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ?? import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

let clientPromise: Promise<SupabaseClient<Database>> | null = null;

export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabasePublishableKey);

export const getSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }

  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) => (
      createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: "frankcards-auth:v1",
        },
      })
    ));
  }

  return clientPromise;
};
