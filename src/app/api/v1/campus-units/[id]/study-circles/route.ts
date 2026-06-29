/**
 * /api/v1/campus-units/[id]/study-circles
 *   GET  — list study circles for a unit (upcoming first).
 *   POST — schedule a study circle (canManageUsers).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { campusStudyCircles } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";

type Params = { id: string };
const FREQ = new Set(["weekly", "biweekly", "monthly", "one_time"]);

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: unitId } = params as Params;
  const rows = await db
    .select()
    .from(campusStudyCircles)
    .where(and(eq(campusStudyCircles.orgId, orgId), eq(campusStudyCircles.unitId, unitId)))
    .orderBy(asc(campusStudyCircles.completed), asc(campusStudyCircles.scheduledDate));
  return apiSuccess(rows);
});

export const POST = withPermission("canManageUsers", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: unitId } = params as Params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const title = String(body.title ?? "").trim();
  if (!title) return badRequest("title is required.");
  if (!body.scheduledDate) return badRequest("scheduledDate is required.");
  const frequency = FREQ.has(String(body.frequency)) ? String(body.frequency) : "one_time";

  try {
    const [inserted] = await db.insert(campusStudyCircles).values({
      orgId,
      unitId,
      title,
      titleHi: body.titleHi ? String(body.titleHi) : null,
      description: body.description ? String(body.description).trim() : null,
      frequency,
      scheduledDate: new Date(String(body.scheduledDate)),
      scheduledTime: body.scheduledTime ? String(body.scheduledTime) : null,
      topic: body.topic ? String(body.topic) : null,
      readingMaterial: body.readingMaterial ? String(body.readingMaterial) : null,
      assignedTo: body.assignedTo ? String(body.assignedTo) : null,
    }).returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
