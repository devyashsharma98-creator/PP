/**
 * /api/v1/research/[id]
 *   GET    — project detail with milestones + lead scholar.
 *   PATCH  — update project (canUpdateProject).
 *   DELETE — remove project (cascades milestones) (canUpdateProject).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { researchProjects, researchMilestones, scholars } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiNoContent, badRequest, notFound, serverError } from "@/lib/response";

type Params = { id: string };

const STATUSES = new Set(["proposed", "active", "under_review", "completed", "published"]);

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  const [project] = await db
    .select({
      id: researchProjects.id,
      title: researchProjects.title,
      titleHi: researchProjects.titleHi,
      objective: researchProjects.objective,
      objectiveHi: researchProjects.objectiveHi,
      methodology: researchProjects.methodology,
      status: researchProjects.status,
      progress: researchProjects.progress,
      startDate: researchProjects.startDate,
      endDate: researchProjects.endDate,
      budget: researchProjects.budget,
      teamIds: researchProjects.teamIds,
      leadResearcherId: researchProjects.leadResearcherId,
      leadName: scholars.name,
      leadNameHi: scholars.nameHi,
      createdAt: researchProjects.createdAt,
      updatedAt: researchProjects.updatedAt,
    })
    .from(researchProjects)
    .leftJoin(scholars, eq(researchProjects.leadResearcherId, scholars.id))
    .where(and(eq(researchProjects.id, id), eq(researchProjects.orgId, orgId)))
    .limit(1);
  if (!project) return notFound("Project not found.");

  const milestones = await db
    .select()
    .from(researchMilestones)
    .where(and(eq(researchMilestones.projectId, id), eq(researchMilestones.orgId, orgId)))
    .orderBy(asc(researchMilestones.sortOrder), asc(researchMilestones.createdAt));

  return apiSuccess({ ...project, milestones });
});

export const PATCH = withPermission("canUpdateProject", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["title", "titleHi", "objective", "objectiveHi", "methodology", "budget"] as const) {
    if (k in body) patch[k] = body[k] == null ? null : String(body[k]);
  }
  if ("leadResearcherId" in body) patch.leadResearcherId = body.leadResearcherId ? String(body.leadResearcherId) : null;
  if ("teamIds" in body) patch.teamIds = Array.isArray(body.teamIds) ? body.teamIds : null;
  if ("startDate" in body) patch.startDate = body.startDate ? new Date(String(body.startDate)) : null;
  if ("endDate" in body) patch.endDate = body.endDate ? new Date(String(body.endDate)) : null;
  if ("status" in body) {
    if (!STATUSES.has(String(body.status))) return badRequest("Invalid status.");
    patch.status = String(body.status);
    if (["under_review", "completed", "published"].includes(String(body.status))) {
      patch.reviewedBy = ctx.session.userId;
      patch.reviewedAt = new Date();
    }
  }

  try {
    const [updated] = await db
      .update(researchProjects)
      .set(patch)
      .where(and(eq(researchProjects.id, id), eq(researchProjects.orgId, orgId)))
      .returning();
    if (!updated) return notFound("Project not found.");
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

export const DELETE = withPermission("canUpdateProject", async (_req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id } = params as Params;

  try {
    const [deleted] = await db
      .delete(researchProjects)
      .where(and(eq(researchProjects.id, id), eq(researchProjects.orgId, orgId)))
      .returning({ id: researchProjects.id });
    if (!deleted) return notFound("Project not found.");
    return apiNoContent();
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Delete failed");
  }
});
