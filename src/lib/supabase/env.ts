import "server-only";

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(publicUrl && publicAnonKey);

export function getSupabasePublicEnv() {
  if (!publicUrl || !publicAnonKey) {
    throw new Error(
      "Missing Supabase public env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    url: publicUrl,
    anonKey: publicAnonKey,
  };
}

