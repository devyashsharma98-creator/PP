/**
 * POST /api/v1/events/[eventId]/vritt — Create or update event vritt (report)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events, eventVritt } from "@/db/schema/index";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, badRequest, notFound, serverError } from "@/lib/response";
import { auditAndActivity } from "@/lib/audit";
import { z } from "zod";

const updateVrittSchema = z.object({
  content: z.string().optional(),
  contentHi: z.string().optional(),
  attendanceCount: z.number().int().min(0).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  status: z.enum(["draft", "submitted", "reviewed"]).default("draft"),
});

type Params = { eventId: string };

export const POST = withPermission("canUpdateEvent", async (req: NextRequest, ctx, params) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const { eventId } = params as Params;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.orgId, ctx.session.orgId)),
    columns: { id: true, title: true },
  });
  if (!event) return notFound("Event not found.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = updateVrittSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  const input = parsed.data;

  // Upsert vritt record
  const existing = await db.query.eventVritt.findFirst({
    where: eq(eventVritt.eventId, eventId),
  });

  let updated;
  if (existing) {
    [updated] = await db
      .update(eventVritt)
      .set({
        content: input.content,
        contentHi: input.contentHi,
        attendanceCount: input.attendanceCount,
        mediaUrls: input.mediaUrls,
        status: input.status,
        updatedAt: new Date(),
        ...(input.status === 'submitted' && { submittedBy: ctx.session.userId }),
      })
      .where(eq(eventVritt.eventId, eventId))
      .returning();
  } else {
    [updated] = await db
      .insert(eventVritt)
      .values({
        eventId,
        content: input.content,
        contentHi: input.contentHi,
        attendanceCount: input.attendanceCount,
        mediaUrls: input.mediaUrls,
        status: input.status,
        ...(input.status === 'submitted' && { submittedBy: ctx.session.userId }),
      })
      .returning();
  }

  if (!updated) return serverError("Failed to update vritt.");

  await auditAndActivity(
    {
      orgId: ctx.session.orgId,
      action: "event.vritt_updated",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: ip,
      entityType: "event",
      entityId: eventId,
      payload: input as Record<string, unknown>,
      changeSummary: `Vritt ${existing ? 'updated' : 'created'} for event: "${event.title}". Status: ${input.status}.`,
    },
    {
      summary: `${ctx.session.displayName ?? ctx.session.email} updated event vritt for "${event.title}".`,
      actorNameSnapshot: ctx.session.displayName ?? ctx.session.email,
    }
  );

  return apiSuccess(updated);
});
