/**
 * /api/v1/campus-units/[id]/outreach
 *   GET  — outreach log for a unit (newest first).
 *   POST — record an outreach activity (canManageUsers).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { campusOutreachLog } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";

type Params = { id: string };
const TYPES = new Set(["seminar", "lecture", "workshop", "book_discussion"]);

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: unitId } = params as Params;
  const rows = await db
    .select()
    .from(campusOutreachLog)
    .where(and(eq(campusOutreachLog.orgId, orgId), eq(campusOutreachLog.unitId, unitId)))
    .orderBy(desc(campusOutreachLog.conductedDate));
  return apiSuccess(rows);
});

export const POST = withPermission("canManageUsers", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: unitId } = params as Params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const title = String(body.title ?? "").trim();
  if (!title) return badRequest("title is required.");
  if (!body.conductedDate) return badRequest("conductedDate is required.");
  const outreachType = TYPES.has(String(body.outreachType)) ? String(body.outreachType) : "lecture";

  try {
    const [inserted] = await db.insert(campusOutreachLog).values({
      orgId,
      unitId,
      outreachType,
      title,
      conductedBy: body.conductedBy ? String(body.conductedBy) : null,
      conductedDate: new Date(String(body.conductedDate)),
      attendance: body.attendance != null ? Number(body.attendance) : null,
      followUpNeeded: body.followUpNeeded === true,
      nextPlannedDate: body.nextPlannedDate ? new Date(String(body.nextPlannedDate)) : null,
      notes: body.notes ? String(body.notes).trim() : null,
    }).returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
