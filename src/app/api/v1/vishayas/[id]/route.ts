/**
 * /api/v1/vishayas/[id]
 *   PATCH  — update a vishay (admin only).
 *   DELETE — soft-delete (deactivate) a vishay (admin only).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { vishayas } from "@/db/schema/index";
import { withRole } from "@/lib/middleware/with-auth";
import { apiSuccess, badRequest, notFound, serverError } from "@/lib/response";

type Params = { id: string };

export const PATCH = withRole("org_admin", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.nameEn === "string") patch.nameEn = body.nameEn.trim();
  if (typeof body.nameHi === "string") patch.nameHi = body.nameHi.trim();
  if ("description" in body) patch.description = body.description ? String(body.description).trim() : null;
  if ("descriptionHi" in body) patch.descriptionHi = body.descriptionHi ? String(body.descriptionHi).trim() : null;
  if ("parentVishayId" in body) patch.parentVishayId = body.parentVishayId ? String(body.parentVishayId) : null;
  if (typeof body.color === "string") patch.color = body.color;
  if (typeof body.icon === "string") patch.icon = body.icon;
  if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
  if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;

  try {
    const [updated] = await db
      .update(vishayas)
      .set(patch)
      .where(and(eq(vishayas.id, id), eq(vishayas.orgId, orgId)))
      .returning();
    if (!updated) return notFound("Vishay not found.");
    return apiSuccess(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return serverError(message);
  }
});

export const DELETE = withRole("org_admin", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  try {
    const [updated] = await db
      .update(vishayas)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(vishayas.id, id), eq(vishayas.orgId, orgId)))
      .returning();
    if (!updated) return notFound("Vishay not found.");
    return apiSuccess({ id: updated.id, isActive: updated.isActive });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return serverError(message);
  }
});
