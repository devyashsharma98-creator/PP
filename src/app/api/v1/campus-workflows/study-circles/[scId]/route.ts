/**
 * /api/v1/campus-workflows/study-circles/[scId]
 *   PATCH  — update a study circle (mark completed, set attendance, edit).
 *   DELETE — remove it. Both require canManageUsers.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { campusStudyCircles } from "@/db/schema/index";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, notFound, serverError } from "@/lib/response";

type Params = { scId: string };
const FREQ = new Set(["weekly", "biweekly", "monthly", "one_time"]);

export const PATCH = withPermission("canManageUsers", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { scId } = params as Params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if ("topic" in body) patch.topic = body.topic ? String(body.topic) : null;
  if ("readingMaterial" in body) patch.readingMaterial = body.readingMaterial ? String(body.readingMaterial) : null;
  if ("notes" in body) patch.notes = body.notes ? String(body.notes).trim() : null;
  if ("scheduledDate" in body && body.scheduledDate) patch.scheduledDate = new Date(String(body.scheduledDate));
  if ("scheduledTime" in body) patch.scheduledTime = body.scheduledTime ? String(body.scheduledTime) : null;
  if ("frequency" in body && FREQ.has(String(body.frequency))) patch.frequency = String(body.frequency);
  if ("completed" in body) patch.completed = body.completed === true;
  if ("attendance" in body) patch.attendance = body.attendance == null ? null : Number(body.attendance);

  if (Object.keys(patch).length === 0) return badRequest("No updatable fields provided.");

  try {
    const [updated] = await db.update(campusStudyCircles).set(patch)
      .where(and(eq(campusStudyCircles.id, scId), eq(campusStudyCircles.orgId, orgId))).returning();
    if (!updated) return notFound("Study circle not found.");
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withPermission("canManageUsers", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { scId } = params as Params;
  try {
    const [deleted] = await db.delete(campusStudyCircles)
      .where(and(eq(campusStudyCircles.id, scId), eq(campusStudyCircles.orgId, orgId)))
      .returning({ id: campusStudyCircles.id });
    if (!deleted) return notFound("Study circle not found.");
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
