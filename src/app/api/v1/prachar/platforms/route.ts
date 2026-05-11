import { NextRequest } from "next/server";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, badRequest, serverError } from "@/lib/response";
import { sql } from "@/lib/neon/repository";
import { auditAndActivity } from "@/lib/audit";

export const POST = withPermission("canUpdatePrachar", async (req: NextRequest, ctx) => {
  try {
    const { eventId, platform, done, skipReason } = await req.json();

    if (!eventId || !platform) {
      return badRequest("Missing eventId or platform");
    }

    const orgId = ctx.session.orgId;
    const actorId = ctx.session.userId;

    // Check if it exists to update or insert
    const updated = await sql`
      update public.prachar_statuses
      set 
        is_done = ${done},
        skip_reason = ${skipReason ?? null},
        done_by = ${actorId},
        done_at = case when ${done} then now() else null end,
        updated_at = now()
      where entity_type = 'event'
        and entity_id = ${eventId}
        and platform = ${platform}
      returning id
    `;

    if (!(updated as any[]).length) {
      await sql`
        insert into public.prachar_statuses (
          org_id, entity_type, entity_id, platform, 
          is_done, skip_reason, done_by, done_at
        )
        values (
          ${orgId}, 'event', ${eventId}, ${platform},
          ${done}, ${skipReason ?? null}, ${actorId},
          case when ${done} then now() else null end
        )
      `;
    }

    await auditAndActivity(
      {
        orgId,
        actorUserId: actorId,
        actorEmail: ctx.session.email,
        action: "prachar.updated",
        entityType: "event",
        entityId: eventId,
        changeSummary: `Prachar status for ${platform} updated to ${done ? 'Done' : 'Pending'}.`,
      },
      {
        summary: `Prachar status for ${platform} updated to ${done ? 'Done' : 'Pending'}.`,
        actorNameSnapshot: ctx.session.email, // fallback since name might not be in session
      }
    );

    return apiSuccess({ ok: true });
  } catch (error) {
    console.error("Failed to update prachar platform:", error);
    return serverError("Failed to update prachar platform");
  }
});
