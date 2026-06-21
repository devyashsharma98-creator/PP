import "server-only";
import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, badRequest, notFound, serverError } from "@/lib/response";
import { db } from "@/db/client";
import { campusUnits } from "@/db/schema/index";

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const p = params as { id: string };
  if (!p?.id) return badRequest("Campus unit ID is required.");
  const orgId = ctx.session.orgId;
  const [row] = await db
    .select()
    .from(campusUnits)
    .where(and(eq(campusUnits.id, p.id), eq(campusUnits.orgId, orgId)));
  if (!row) return notFound("Campus unit not found.");
  return apiSuccess(row);
});

export const PATCH = withPermission("canManageUsers", async (req: NextRequest, ctx, params) => {
  const p = params as { id: string };
  if (!p?.id) return badRequest("Campus unit ID is required.");
  const orgId = ctx.session.orgId;

  const [existing] = await db
    .select()
    .from(campusUnits)
    .where(and(eq(campusUnits.id, p.id), eq(campusUnits.orgId, orgId)));
  if (!existing) return notFound("Campus unit not found.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const updateData: Record<string, unknown> = {};
  const stringFields = ["name", "nameHi", "unitType", "city", "state", "coordinatorName", "coordinatorNameHi", "coordinatorEmail", "coordinatorPhone", "status", "establishedYear", "description", "descriptionHi"] as const;
  for (const field of stringFields) {
    if (body[field] !== undefined) {
      updateData[field] = String(body[field]);
    }
  }
  if (body.focusAreas !== undefined) {
    updateData.focusAreas = Array.isArray(body.focusAreas) ? body.focusAreas as string[] : [];
  }
  if (body.memberCount !== undefined) {
    updateData.memberCount = Number(body.memberCount);
  }
  if (body.isPublished !== undefined) {
    updateData.isPublished = Boolean(body.isPublished);
  }
  if (body.sortOrder !== undefined) {
    updateData.sortOrder = Number(body.sortOrder);
  }
  if (body.slug !== undefined) {
    const slug = String(body.slug ?? "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) return badRequest("slug cannot be empty.");
    updateData.slug = slug;
  }

  try {
    const [updated] = await db
      .update(campusUnits)
      .set(updateData)
      .where(and(eq(campusUnits.id, p.id), eq(campusUnits.orgId, orgId)))
      .returning();
    return apiSuccess(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    if (message.includes("duplicate key") || message.includes("unique")) {
      return badRequest("A campus unit with this slug already exists.");
    }
    return serverError(message);
  }
});

export const DELETE = withPermission("canManageUsers", async (_req: NextRequest, ctx, params) => {
  const p = params as { id: string };
  if (!p?.id) return badRequest("Campus unit ID is required.");
  const orgId = ctx.session.orgId;

  const [existing] = await db
    .select()
    .from(campusUnits)
    .where(and(eq(campusUnits.id, p.id), eq(campusUnits.orgId, orgId)));
  if (!existing) return notFound("Campus unit not found.");

  await db
    .delete(campusUnits)
    .where(and(eq(campusUnits.id, p.id), eq(campusUnits.orgId, orgId)));
  return apiSuccess({ deleted: true });
});
