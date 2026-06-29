/**
 * /api/v1/outreach/[id]
 *   PATCH  — update an outreach item: status transitions, edits (canUpdatePrachar).
 *   DELETE — remove an outreach item (canUpdatePrachar).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { outreachItems } from "@/db/schema/index";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, notFound, serverError } from "@/lib/response";
import { OUTREACH_STATUSES } from "@/lib/app/outreach-types";

type Params = { id: string };

export const PATCH = withPermission("canUpdatePrachar", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.title === "string") patch.title = body.title.trim();
  if ("description" in body) patch.description = body.description ? String(body.description).trim() : null;
  if ("templateReference" in body) patch.templateReference = body.templateReference ? String(body.templateReference) : null;
  if ("dueDate" in body) patch.dueDate = body.dueDate ? new Date(String(body.dueDate)) : null;
  if ("assignedTo" in body) patch.assignedTo = body.assignedTo ? String(body.assignedTo) : null;
  if ("metadata" in body && typeof body.metadata === "object") patch.metadata = body.metadata;

  if (typeof body.status === "string") {
    if (!(OUTREACH_STATUSES as readonly string[]).includes(body.status)) {
      return badRequest(`status must be one of: ${OUTREACH_STATUSES.join(", ")}.`);
    }
    patch.status = body.status;
    // Keep derived fields consistent with the status.
    if (body.status === "completed") {
      patch.completedAt = new Date();
      patch.skipReason = null;
    } else if (body.status === "skipped") {
      patch.skipReason = body.skipReason ? String(body.skipReason).trim() : null;
      patch.completedAt = null;
    } else {
      patch.completedAt = null;
      patch.skipReason = null;
    }
  }

  try {
    const [updated] = await db
      .update(outreachItems)
      .set(patch)
      .where(and(eq(outreachItems.id, id), eq(outreachItems.orgId, orgId)))
      .returning();
    if (!updated) return notFound("Outreach item not found.");
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withPermission("canUpdatePrachar", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  try {
    const [deleted] = await db
      .delete(outreachItems)
      .where(and(eq(outreachItems.id, id), eq(outreachItems.orgId, orgId)))
      .returning({ id: outreachItems.id });
    if (!deleted) return notFound("Outreach item not found.");
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
