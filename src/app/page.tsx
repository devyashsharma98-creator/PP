import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import LoginPageClient from "@/components/pages/LoginPageClient";

const NEON_SESSION_COOKIE = "pp_neon_session";

export default async function Page() {
  const store = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "pp_session";
  const session =
    store.get(sessionCookieName)?.value ?? store.get(NEON_SESSION_COOKIE)?.value;

  if (!session) return <LoginPageClient />;

  redirect("/overview");
}
