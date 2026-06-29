/**
 * POST /api/v1/research/[id]/milestones — add a milestone to a project, then
 * recompute project progress. Requires canUpdateProject.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { researchProjects, researchMilestones } from "@/db/schema/index";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiCreated, badRequest, notFound, serverError } from "@/lib/response";
import { recomputeProjectProgress } from "@/lib/server/research-progress";

type Params = { id: string };

const DELIVERABLES = new Set(["report", "article", "presentation", "data"]);
const STATUSES = new Set(["pending", "in_progress", "completed"]);

export const POST = withPermission("canUpdateProject", async (req: NextRequest, ctx, params) => {
  const orgId = ctx.session.orgId;
  const { id: projectId } = params as Params;

  // Ensure the project exists in this org.
  const [project] = await db
    .select({ id: researchProjects.id })
    .from(researchProjects)
    .where(and(eq(researchProjects.id, projectId), eq(researchProjects.orgId, orgId)))
    .limit(1);
  if (!project) return notFound("Project not found.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const title = String(body.title ?? "").trim();
  if (!title) return badRequest("title is required.");

  const deliverableType = DELIVERABLES.has(String(body.deliverableType)) ? String(body.deliverableType) : null;
  const status = STATUSES.has(String(body.status)) ? String(body.status) : "pending";
  const weight = Number.isFinite(Number(body.weight)) ? Math.max(0, Math.min(100, Number(body.weight))) : 0;

  // Append at the end.
  const [{ next }] = await db
    .select({ next: dsql<number>`coalesce(max(${researchMilestones.sortOrder}) + 1, 0)::int` })
    .from(researchMilestones)
    .where(and(eq(researchMilestones.orgId, orgId), eq(researchMilestones.projectId, projectId)));

  try {
    const [inserted] = await db
      .insert(researchMilestones)
      .values({
        orgId,
        projectId,
        title,
        description: body.description ? String(body.description).trim() : null,
        weight,
        deliverableType,
        deliverableUrl: body.deliverableUrl ? String(body.deliverableUrl) : null,
        status,
        completedAt: status === "completed" ? new Date() : null,
        dueDate: body.dueDate ? new Date(String(body.dueDate)) : null,
        sortOrder: next,
      })
      .returning();

    const progress = await recomputeProjectProgress(orgId, projectId);
    return apiCreated({ ...inserted, projectProgress: progress });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
