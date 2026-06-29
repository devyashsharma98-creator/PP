/**
 * /api/v1/campus-workflows/resources/[resId]
 *   PATCH  — update a resource record (feedback, quantity, etc).
 *   DELETE — remove it. Both require canManageUsers.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { campusResourceDistribution } from "@/db/schema/index";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, notFound, serverError } from "@/lib/response";

type Params = { resId: string };
const TYPES = new Set(["book", "journal", "digital", "study_material"]);

export const PATCH = withPermission("canManageUsers", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { resId } = params as Params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return badRequest("Request body must be valid JSON."); }

  const patch: Record<string, unknown> = {};
  if (typeof body.resourceName === "string") patch.resourceName = body.resourceName.trim();
  if ("resourceType" in body && TYPES.has(String(body.resourceType))) patch.resourceType = String(body.resourceType);
  if ("quantity" in body) patch.quantity = Math.max(1, Number(body.quantity) || 1);
  if ("feedbackReceived" in body) patch.feedbackReceived = body.feedbackReceived === true;
  if ("feedbackNotes" in body) patch.feedbackNotes = body.feedbackNotes ? String(body.feedbackNotes).trim() : null;

  if (Object.keys(patch).length === 0) return badRequest("No updatable fields provided.");

  try {
    const [updated] = await db.update(campusResourceDistribution).set(patch)
      .where(and(eq(campusResourceDistribution.id, resId), eq(campusResourceDistribution.orgId, orgId))).returning();
    if (!updated) return notFound("Resource record not found.");
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withPermission("canManageUsers", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { resId } = params as Params;
  try {
    const [deleted] = await db.delete(campusResourceDistribution)
      .where(and(eq(campusResourceDistribution.id, resId), eq(campusResourceDistribution.orgId, orgId)))
      .returning({ id: campusResourceDistribution.id });
    if (!deleted) return notFound("Resource record not found.");
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
