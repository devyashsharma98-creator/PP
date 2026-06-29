/**
 * /api/v1/research
 *   GET  — list research projects with lead name + milestone counts.
 *   POST — create a project (requires canCreateProject).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, desc, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { researchProjects, researchMilestones, scholars } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";

const STATUSES = new Set(["proposed", "active", "under_review", "completed", "published"]);

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const status = req.nextUrl.searchParams.get("status");

  const filters = [eq(researchProjects.orgId, orgId)];
  if (status && STATUSES.has(status)) filters.push(eq(researchProjects.status, status));

  const rows = await db
    .select({
      id: researchProjects.id,
      title: researchProjects.title,
      titleHi: researchProjects.titleHi,
      objective: researchProjects.objective,
      status: researchProjects.status,
      progress: researchProjects.progress,
      startDate: researchProjects.startDate,
      endDate: researchProjects.endDate,
      leadResearcherId: researchProjects.leadResearcherId,
      leadName: scholars.name,
      leadNameHi: scholars.nameHi,
      teamIds: researchProjects.teamIds,
      updatedAt: researchProjects.updatedAt,
    })
    .from(researchProjects)
    .leftJoin(scholars, eq(researchProjects.leadResearcherId, scholars.id))
    .where(and(...filters))
    .orderBy(desc(researchProjects.updatedAt));

  const counts = await db
    .select({ projectId: researchMilestones.projectId, count: dsql<number>`count(*)::int` })
    .from(researchMilestones)
    .where(eq(researchMilestones.orgId, orgId))
    .groupBy(researchMilestones.projectId);
  const countByProject = new Map(counts.map((c) => [c.projectId, c.count]));

  return apiSuccess(rows.map((p) => ({ ...p, milestoneCount: countByProject.get(p.id) ?? 0 })));
});

export const POST = withPermission("canCreateProject", async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const title = String(body.title ?? "").trim();
  if (!title) return badRequest("title is required.");

  const status = STATUSES.has(String(body.status)) ? String(body.status) : "proposed";

  try {
    const [inserted] = await db
      .insert(researchProjects)
      .values({
        orgId,
        title,
        titleHi: body.titleHi ? String(body.titleHi).trim() : null,
        objective: body.objective ? String(body.objective).trim() : null,
        objectiveHi: body.objectiveHi ? String(body.objectiveHi).trim() : null,
        methodology: body.methodology ? String(body.methodology).trim() : null,
        status,
        leadResearcherId: body.leadResearcherId ? String(body.leadResearcherId) : null,
        teamIds: Array.isArray(body.teamIds) ? (body.teamIds as string[]) : null,
        startDate: body.startDate ? new Date(String(body.startDate)) : null,
        endDate: body.endDate ? new Date(String(body.endDate)) : null,
        budget: body.budget ? String(body.budget) : null,
        submittedBy: userId,
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
