import { NextRequest } from "next/server";

import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, badRequest, serverError } from "@/lib/response";
import { updatePracharPlatform } from "@/lib/server/services/prachar-service";

export const POST = withPermission("canUpdatePrachar", async (req: NextRequest, ctx) => {
  try {
    const { eventId, platform, done, skipReason } = await req.json();

    if (!eventId || !platform) {
      return badRequest("Missing eventId or platform");
    }

    await updatePracharPlatform(
      eventId,
      platform,
      done,
      skipReason,
      ctx.session.orgId,
      ctx.session.userId,
      ctx.session.email,
      ctx.session.email
    );

    return apiSuccess({ ok: true });
  } catch (error) {
    console.error("Failed to update prachar platform:", error);
    return serverError("Failed to update prachar platform");
  }
});
