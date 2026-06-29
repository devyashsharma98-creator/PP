/**
 * /api/v1/research/milestones/[milestoneId]
 *   PATCH  — update a milestone (status/weight/etc), then recompute project progress.
 *   DELETE — remove a milestone, then recompute project progress.
 * Both require canUpdateProject.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { researchMilestones } from "@/db/schema/index";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, notFound, serverError } from "@/lib/response";
import { recomputeProjectProgress } from "@/lib/server/research-progress";

type Params = { milestoneId: string };

const DELIVERABLES = new Set(["report", "article", "presentation", "data"]);
const STATUSES = new Set(["pending", "in_progress", "completed"]);

export const PATCH = withPermission("canUpdateProject", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { milestoneId } = params as Params;

  const [existing] = await db
    .select()
    .from(researchMilestones)
    .where(and(eq(researchMilestones.id, milestoneId), eq(researchMilestones.orgId, orgId)))
    .limit(1);
  if (!existing) return notFound("Milestone not found.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if ("description" in body) patch.description = body.description ? String(body.description).trim() : null;
  if ("deliverableUrl" in body) patch.deliverableUrl = body.deliverableUrl ? String(body.deliverableUrl) : null;
  if ("dueDate" in body) patch.dueDate = body.dueDate ? new Date(String(body.dueDate)) : null;
  if ("weight" in body) {
    const w = Number(body.weight);
    if (!Number.isFinite(w) || w < 0 || w > 100) return badRequest("weight must be 0–100.");
    patch.weight = Math.round(w);
  }
  if ("deliverableType" in body) {
    patch.deliverableType = body.deliverableType && DELIVERABLES.has(String(body.deliverableType)) ? String(body.deliverableType) : null;
  }
  if ("status" in body) {
    if (!STATUSES.has(String(body.status))) return badRequest("Invalid status.");
    patch.status = String(body.status);
    patch.completedAt = body.status === "completed" ? new Date() : null;
  }

  try {
    const [updated] = await db
      .update(researchMilestones)
      .set(patch)
      .where(and(eq(researchMilestones.id, milestoneId), eq(researchMilestones.orgId, orgId)))
      .returning();

    const progress = await recomputeProjectProgress(orgId, existing.projectId);
    return apiSuccess({ ...updated, projectProgress: progress });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withPermission("canUpdateProject", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { milestoneId } = params as Params;

  const [existing] = await db
    .select({ projectId: researchMilestones.projectId })
    .from(researchMilestones)
    .where(and(eq(researchMilestones.id, milestoneId), eq(researchMilestones.orgId, orgId)))
    .limit(1);
  if (!existing) return notFound("Milestone not found.");

  try {
    await db.delete(researchMilestones).where(and(eq(researchMilestones.id, milestoneId), eq(researchMilestones.orgId, orgId)));
    await recomputeProjectProgress(orgId, existing.projectId);
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
