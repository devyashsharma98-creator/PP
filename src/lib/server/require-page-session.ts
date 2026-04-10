import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const NEON_SESSION_COOKIE = "pp_neon_session";

export async function requirePageSession(returnTo: string) {
  const store = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "pp_session";
  const session =
    store.get(sessionCookieName)?.value ?? store.get(NEON_SESSION_COOKIE)?.value;

  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
}
