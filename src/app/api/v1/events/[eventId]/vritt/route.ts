/**
 * POST /api/v1/events/[eventId]/vritt — Create or update event vritt (report)
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events } from "@/db/schema/index";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, badRequest, notFound } from "@/lib/response";
import * as eventService from "@/lib/server/services/event-service";
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

  const result = await eventService.upsertEventVritt(eventId, input, event.title, ctx, ip);
  if (!result.ok) return result.response;

  return apiSuccess(result.data);
});
