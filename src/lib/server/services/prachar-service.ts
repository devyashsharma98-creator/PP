/**
 * Prachar Service — Platform status updates for events.
 */
import "server-only";

import { sql } from "@/lib/neon/repository";
import { auditAndActivity } from "@/lib/audit";

type ReturningIdRow = { id: string };

/**
 * Cyclomatic: 3 | Cognitive: 4
 * Upserts a prachar platform status and writes an audit trail.
 */
export async function updatePracharPlatform(
  eventId: string,
  platform: string,
  done: boolean,
  skipReason: string | undefined,
  orgId: string,
  actorUserId: string,
  actorEmail: string,
  actorNameSnapshot: string
): Promise<void> {
  const updated = await sql`
    update public.prachar_statuses
    set 
      is_done = ${done},
      skip_reason = ${skipReason ?? null},
      done_by = ${actorUserId},
      done_at = case when ${done} then now() else null end,
      updated_at = now()
    where entity_type = 'event'
      and entity_id = ${eventId}
      and platform = ${platform}
    returning id
  `;

  if (!(updated as ReturningIdRow[]).length) {
    await sql`
      insert into public.prachar_statuses (
        org_id, entity_type, entity_id, platform, 
        is_done, skip_reason, done_by, done_at
      )
      values (
        ${orgId}, 'event', ${eventId}, ${platform},
        ${done}, ${skipReason ?? null}, ${actorUserId},
        case when ${done} then now() else null end
      )
    `;
  }

  await auditAndActivity(
    {
      orgId,
      actorUserId,
      actorEmail,
      action: "prachar.updated",
      entityType: "event",
      entityId: eventId,
      changeSummary: `Prachar status for ${platform} updated to ${done ? "Done" : "Pending"}.`,
    },
    {
      summary: `Prachar status for ${platform} updated to ${done ? "Done" : "Pending"}.`,
      actorNameSnapshot,
    }
  );
}
