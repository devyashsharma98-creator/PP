/**
 * /api/v1/campus-workflows/outreach/[logId]
 *   PATCH  — update an outreach log entry.
 *   DELETE — remove it. Both require canManageUsers.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { campusOutreachLog } from "@/db/schema/index";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, notFound, serverError } from "@/lib/response";

type Params = { logId: string };
const TYPES = new Set(["seminar", "lecture", "workshop", "book_discussion"]);

export const PATCH = withPermission("canManageUsers", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { logId } = params as Params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if ("outreachType" in body && TYPES.has(String(body.outreachType))) patch.outreachType = String(body.outreachType);
  if ("conductedBy" in body) patch.conductedBy = body.conductedBy ? String(body.conductedBy) : null;
  if ("conductedDate" in body && body.conductedDate) patch.conductedDate = new Date(String(body.conductedDate));
  if ("attendance" in body) patch.attendance = body.attendance == null ? null : Number(body.attendance);
  if ("followUpNeeded" in body) patch.followUpNeeded = body.followUpNeeded === true;
  if ("nextPlannedDate" in body) patch.nextPlannedDate = body.nextPlannedDate ? new Date(String(body.nextPlannedDate)) : null;
  if ("notes" in body) patch.notes = body.notes ? String(body.notes).trim() : null;

  if (Object.keys(patch).length === 0) return badRequest("No updatable fields provided.");

  try {
    const [updated] = await db.update(campusOutreachLog).set(patch)
      .where(and(eq(campusOutreachLog.id, logId), eq(campusOutreachLog.orgId, orgId))).returning();
    if (!updated) return notFound("Outreach entry not found.");
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withPermission("canManageUsers", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { logId } = params as Params;
  try {
    const [deleted] = await db.delete(campusOutreachLog)
      .where(and(eq(campusOutreachLog.id, logId), eq(campusOutreachLog.orgId, orgId)))
      .returning({ id: campusOutreachLog.id });
    if (!deleted) return notFound("Outreach entry not found.");
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
