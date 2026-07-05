import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceSupabase: SupabaseClient | null = null;

export function getRequiredServerEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

export function getServiceSupabaseClient() {
  const supabaseUrl = getRequiredServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceSupabase) {
    serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceSupabase;
}

export function getServiceSupabaseClientOrError() {
  try {
    return { supabase: getServiceSupabaseClient(), error: null };
  } catch (error) {
    return {
      supabase: null,
      error: error instanceof Error ? error.message : "Supabase server client is not configured.",
    };
  }
}
