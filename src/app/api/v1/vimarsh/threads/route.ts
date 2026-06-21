import "server-only";
import { NextRequest } from "next/server";
import { eq, asc, desc, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";
import { db } from "@/db/client";
import { vimarshThreads, profiles } from "@/db/schema/index";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  const rows = await db
    .select({
      id: vimarshThreads.id,
      slug: vimarshThreads.slug,
      title: vimarshThreads.title,
      titleHi: vimarshThreads.titleHi,
      category: vimarshThreads.category,
      isPinned: vimarshThreads.isPinned,
      isClosed: vimarshThreads.isClosed,
      replyCount: vimarshThreads.replyCount,
      createdAt: vimarshThreads.createdAt,
      updatedAt: vimarshThreads.updatedAt,
      authorUserId: vimarshThreads.authorUserId,
      authorName: profiles.displayName,
      authorNameHi: profiles.displayNameHi,
    })
    .from(vimarshThreads)
    .leftJoin(profiles, eq(vimarshThreads.authorUserId, profiles.id))
    .where(eq(vimarshThreads.orgId, orgId))
    .orderBy(desc(vimarshThreads.isPinned), desc(vimarshThreads.createdAt));

  return apiSuccess(rows);
});

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const title = String(body.title ?? "").trim();
  const titleHi = String(body.titleHi ?? "").trim();
  if (!title || !titleHi) return badRequest("title and titleHi are required.");

  const slug = String(body.slug ?? title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!slug) return badRequest("Could not generate slug.");

  const category = String(body.category ?? "General").trim();
  const threadBody = String(body.body ?? "").trim();
  const threadBodyHi = String(body.bodyHi ?? "").trim();

  try {
    const [inserted] = await db
      .insert(vimarshThreads)
      .values({
        orgId,
        slug,
        title,
        titleHi,
        body: threadBody,
        bodyHi: threadBodyHi,
        category,
        authorUserId: userId,
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Insert failed";
    if (message.includes("duplicate key") || message.includes("unique")) {
      return badRequest("A thread with this slug already exists.");
    }
    return serverError(message);
  }
});
