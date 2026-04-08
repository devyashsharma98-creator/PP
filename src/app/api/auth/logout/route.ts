/**
 * POST /api/auth/logout
 *
 * Clears the session cookie, ending the authenticated session.
 */
import "server-only";

import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { apiSuccess } from "@/lib/response";

export async function POST(): Promise<Response> {
  const session = await getSession();

  if (session) {
    await writeAuditLog({
      orgId: session.orgId,
      action: "auth.logout",
      actorUserId: session.userId,
      actorEmail: session.email,
      entityType: "profile",
      entityId: session.userId,
      changeSummary: "User logged out.",
    });
  }

  await clearSessionCookie();
  return apiSuccess({ loggedOut: true });
}
