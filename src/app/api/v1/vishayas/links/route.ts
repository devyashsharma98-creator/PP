/**
 * /api/v1/vishayas/links
 *   GET ?contentType=&contentId=  — list vishay IDs linked to a content item.
 *   PUT                           — replace the set of vishay links for a content
 *                                   item. Body: { contentType, contentId, vishayIds: string[] }
 *
 * This is the bridge that lets any module tag its rows with vishayas without
 * each module owning its own join table.
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { contentVishayaMap } from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, badRequest, serverError } from "@/lib/response";

const CONTENT_TYPES = new Set([
  "article",
  "event",
  "scholar",
  "project",
  "unit",
  "publication",
  "thread",
]);

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const contentType = req.nextUrl.searchParams.get("contentType") ?? "";
  const contentId = req.nextUrl.searchParams.get("contentId") ?? "";

  if (!contentType || !contentId) {
    return badRequest("contentType and contentId are required.");
  }

  const rows = await db
    .select({ vishayId: contentVishayaMap.vishayId })
    .from(contentVishayaMap)
    .where(
      and(
        eq(contentVishayaMap.orgId, orgId),
        eq(contentVishayaMap.contentType, contentType),
        eq(contentVishayaMap.contentId, contentId),
      ),
    );

  return apiSuccess(rows.map((r) => r.vishayId));
});

export const PUT = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const contentType = String(body.contentType ?? "").trim();
  const contentId = String(body.contentId ?? "").trim();
  if (!CONTENT_TYPES.has(contentType)) {
    return badRequest(`contentType must be one of: ${Array.from(CONTENT_TYPES).join(", ")}.`);
  }
  if (!contentId) return badRequest("contentId is required.");

  const vishayIds = Array.isArray(body.vishayIds)
    ? Array.from(new Set(body.vishayIds.map((v) => String(v)).filter(Boolean)))
    : [];

  try {
    // Replace strategy: drop existing links for this content item, then re-insert.
    // neon-http has no transactions, so we delete then insert sequentially.
    await db
      .delete(contentVishayaMap)
      .where(
        and(
          eq(contentVishayaMap.orgId, orgId),
          eq(contentVishayaMap.contentType, contentType),
          eq(contentVishayaMap.contentId, contentId),
        ),
      );

    if (vishayIds.length > 0) {
      await db
        .insert(contentVishayaMap)
        .values(
          vishayIds.map((vishayId) => ({
            orgId,
            vishayId,
            contentType,
            contentId,
            createdBy: userId,
          })),
        )
        .onConflictDoNothing();
    }

    return apiSuccess({ contentType, contentId, vishayIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update links";
    return serverError(message);
  }
});
