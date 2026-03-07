import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const { url } = getSupabasePublicEnv();
    const serviceRoleKey = getSupabaseServiceRoleKey();

    adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
