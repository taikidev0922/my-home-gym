import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export const createSupabaseAdminClient = getSupabaseAdminClient;
