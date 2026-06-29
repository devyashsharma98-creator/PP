/**
 * /api/v1/outreach
 *   GET  — list outreach items (filters: status, type), newest/ due first.
 *   POST — create an outreach item (requires canUpdatePrachar).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, asc, desc, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { outreachItems } from "@/db/schema/index";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";
import { OUTREACH_TYPES, OUTREACH_STATUSES } from "@/lib/app/outreach-types";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const type = sp.get("type");

  const filters = [eq(outreachItems.orgId, orgId)];
  if (status && (OUTREACH_STATUSES as readonly string[]).includes(status)) {
    filters.push(eq(outreachItems.status, status));
  }
  if (type && type in OUTREACH_TYPES) {
    filters.push(eq(outreachItems.outreachType, type));
  }

  const rows = await db
    .select()
    .from(outreachItems)
    .where(and(...filters))
    // Open items first (completedAt IS NULL), then soonest due, then newest.
    .orderBy(dsql`${outreachItems.completedAt} IS NULL DESC`, asc(outreachItems.dueDate), desc(outreachItems.createdAt));

  return apiSuccess(rows);
});

export const POST = withPermission("canUpdatePrachar", async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const outreachType = String(body.outreachType ?? "").trim();
  if (!(outreachType in OUTREACH_TYPES)) {
    return badRequest(`outreachType must be one of: ${Object.keys(OUTREACH_TYPES).join(", ")}.`);
  }

  const title = String(body.title ?? "").trim();
  if (!title) return badRequest("title is required.");

  try {
    const [inserted] = await db
      .insert(outreachItems)
      .values({
        orgId,
        outreachType,
        relatedType: body.relatedType ? String(body.relatedType) : null,
        relatedId: body.relatedId ? String(body.relatedId) : null,
        title,
        description: body.description ? String(body.description).trim() : null,
        unitId: body.unitId ? String(body.unitId) : null,
        departmentId: body.departmentId ? String(body.departmentId) : null,
        status: "pending",
        assignedTo: body.assignedTo ? String(body.assignedTo) : null,
        dueDate: body.dueDate ? new Date(String(body.dueDate)) : null,
        templateReference: body.templateReference ? String(body.templateReference) : null,
        metadata: (body.metadata as Record<string, unknown>) ?? {},
        createdBy: userId,
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});
