/**
 * /api/v1/campus-units/[id]/resources
 *   GET  — resource distribution records for a unit (newest first).
 *   POST — record a resource distribution (canManageUsers).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { campusResourceDistribution } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";

type Params = { id: string };
const TYPES = new Set(["book", "journal", "digital", "study_material"]);

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: unitId } = params as Params;
  const rows = await db
    .select()
    .from(campusResourceDistribution)
    .where(and(eq(campusResourceDistribution.orgId, orgId), eq(campusResourceDistribution.unitId, unitId)))
    .orderBy(desc(campusResourceDistribution.distributedAt));
  return apiSuccess(rows);
});

export const POST = withPermission("canManageUsers", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: unitId } = params as Params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const resourceName = String(body.resourceName ?? "").trim();
  if (!resourceName) return badRequest("resourceName is required.");
  const resourceType = TYPES.has(String(body.resourceType)) ? String(body.resourceType) : "book";

  try {
    const [inserted] = await db.insert(campusResourceDistribution).values({
      orgId,
      unitId,
      resourceType,
      resourceName,
      quantity: body.quantity != null ? Math.max(1, Number(body.quantity)) : 1,
      distributedBy: ctx.session.userId,
      feedbackReceived: body.feedbackReceived === true,
      feedbackNotes: body.feedbackNotes ? String(body.feedbackNotes).trim() : null,
    }).returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
