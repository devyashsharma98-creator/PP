/**
 * Prachar Service — Platform status updates for events.
 */
import "server-only";

import type { NextResponse } from "next/server";

import { sql } from "@/lib/neon/repository";
import { auditAndActivity } from "@/lib/audit";
import { notFound, serverError } from "@/lib/response";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type {
  CreatePracharCampaignInput,
  UpdatePracharCampaignInput,
} from "@/lib/validators/prachar-campaigns";

type ReturningIdRow = { id: string };
type CampaignEventRow = {
  id: string;
  title: string;
  status: string;
  starts_at: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};
type CampaignLookupRow = {
  id: string;
  title: string;
  status: string;
};
type ServiceResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

const PRACHAR_PLATFORMS = ["whatsapp", "facebook", "instagram", "telegram"] as const;

function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

function err(response: NextResponse): ServiceResult<never> {
  return { ok: false, response };
}

function toDateOrNull(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

async function upsertTemplateReferenceRows(
  eventId: string,
  orgId: string,
  actorUserId: string,
  templateReference: string | undefined,
) {
  if (templateReference === undefined) return;

  for (const platform of PRACHAR_PLATFORMS) {
    const updated = await sql`
      update public.prachar_statuses
      set
        template_ref = ${templateReference || null},
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
          is_done, template_ref, done_by
        )
        values (
          ${orgId}, 'event', ${eventId}, ${platform},
          false, ${templateReference || null}, ${actorUserId}
        )
      `;
    }
  }
}

export async function createPracharCampaign(
  input: CreatePracharCampaignInput,
  ctx: AuthContext,
  ip: string,
): Promise<ServiceResult<{ id: string; title: string; status: string; startsAt: Date | null; createdAt: Date | null }>> {
  const actorName = ctx.session.displayName ?? ctx.session.email;
  const rows = await sql`
    insert into public.events (
      org_id,
      unit_id,
      department_id,
      title,
      description,
      starts_at,
      status,
      submitted_by_name_snapshot,
      checklist,
      created_by,
      updated_by
    )
    values (
      ${ctx.session.orgId},
      ${input.unitId ?? ctx.session.unitId ?? null},
      ${input.departmentId ?? ctx.session.departmentId ?? null},
      ${input.title},
      ${input.description ?? null},
      ${input.startsAt},
      'authorized_public',
      ${actorName},
      '{}'::jsonb,
      ${ctx.session.userId},
      ${ctx.session.userId}
    )
    returning id, title, status, starts_at, created_at
  `;
  const newEvent = (rows as CampaignEventRow[])[0];

  if (!newEvent) return err(serverError("Failed to create Prachar campaign."));

  await sql`
    insert into public.event_status_history (
      event_id,
      from_status,
      to_status,
      actor_user_id,
      actor_name_snapshot,
      notes
    )
    values (
      ${newEvent.id},
      null,
      'authorized_public',
      ${ctx.session.userId},
      ${actorName},
      'Prachar campaign created directly from outreach desk.'
    )
  `;

  await upsertTemplateReferenceRows(newEvent.id, ctx.session.orgId, ctx.session.userId, input.templateReference);

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "prachar.campaign_created",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: newEvent.id,
      payload: input as Record<string, unknown>,
      changeSummary: `Prachar campaign created: "${newEvent.title}".`,
    },
    {
      summary: `${actorName} created Prachar campaign: "${newEvent.title}".`,
      actorNameSnapshot: actorName,
    }
  );

  return ok({
    id: newEvent.id,
    title: newEvent.title,
    status: newEvent.status,
    startsAt: toDateOrNull(newEvent.starts_at),
    createdAt: toDateOrNull(newEvent.created_at),
  });
}

export async function updatePracharCampaign(
  eventId: string,
  input: UpdatePracharCampaignInput,
  ctx: AuthContext,
  ip: string,
): Promise<ServiceResult<{ id: string; title: string; status: string; startsAt: Date | null; updatedAt: Date | null }>> {
  const existingRows = await sql`
    select id, title, status
    from public.events
    where id = ${eventId}
      and org_id = ${ctx.session.orgId}
    limit 1
  `;
  const existing = (existingRows as CampaignLookupRow[])[0];

  if (!existing || existing.status !== "authorized_public") {
    return err(notFound("Prachar campaign not found."));
  }

  const rows = await sql`
    update public.events
    set
      title = case when ${input.title !== undefined} then ${input.title ?? null} else title end,
      description = case when ${input.description !== undefined} then ${input.description || null} else description end,
      starts_at = case when ${input.startsAt !== undefined} then ${input.startsAt ?? null} else starts_at end,
      unit_id = case when ${input.unitId !== undefined} then ${input.unitId || null} else unit_id end,
      department_id = case when ${input.departmentId !== undefined} then ${input.departmentId || null} else department_id end,
      updated_by = ${ctx.session.userId},
      updated_at = now()
    where id = ${eventId}
      and org_id = ${ctx.session.orgId}
      and status = 'authorized_public'
    returning id, title, status, starts_at, updated_at
  `;
  const updated = (rows as CampaignEventRow[])[0];

  if (!updated) return err(serverError("Failed to update Prachar campaign."));

  await upsertTemplateReferenceRows(eventId, ctx.session.orgId, ctx.session.userId, input.templateReference);

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "prachar.campaign_updated",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      payload: input as Record<string, unknown>,
      changeSummary: `Prachar campaign updated: "${updated.title}".`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} updated Prachar campaign: "${updated.title}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return ok({
    id: updated.id,
    title: updated.title,
    status: updated.status,
    startsAt: toDateOrNull(updated.starts_at),
    updatedAt: toDateOrNull(updated.updated_at),
  });
}

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
