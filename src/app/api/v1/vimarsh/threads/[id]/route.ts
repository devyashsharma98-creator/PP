import "server-only";
import { NextRequest } from "next/server";
import { eq, and, asc, sql } from "drizzle-orm";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, notFound, serverError } from "@/lib/response";
import { db } from "@/db/client";
import { vimarshThreads, vimarshThreadReplies, profiles } from "@/db/schema/index";
import type { RoleCode } from "@/lib/permissions/types";

const CAN_MANAGE_ROLES: RoleCode[] = ["super_admin", "org_admin", "vibhag_pramukh", "prant_sanyojak"];

function canManage(session: { effectiveRoleCodes?: readonly RoleCode[] | null }): boolean {
  return session.effectiveRoleCodes?.some((r) => CAN_MANAGE_ROLES.includes(r)) ?? false;
}

// ── GET: thread + replies ────────────────────────────────────────────────

export const GET = withAuth(async (_req: NextRequest, ctx, params) => {
  const p = params as { id: string };
  if (!p?.id) return badRequest("Thread ID is required.");
  const orgId = ctx.session.orgId;

  const [thread] = await db
    .select({
      id: vimarshThreads.id,
      slug: vimarshThreads.slug,
      title: vimarshThreads.title,
      titleHi: vimarshThreads.titleHi,
      body: vimarshThreads.body,
      bodyHi: vimarshThreads.bodyHi,
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
    .where(and(eq(vimarshThreads.id, p.id), eq(vimarshThreads.orgId, orgId)));

  if (!thread) return notFound("Thread not found.");

  const replies = await db
    .select({
      id: vimarshThreadReplies.id,
      threadId: vimarshThreadReplies.threadId,
      body: vimarshThreadReplies.body,
      createdAt: vimarshThreadReplies.createdAt,
      authorUserId: vimarshThreadReplies.authorUserId,
      authorName: profiles.displayName,
      authorNameHi: profiles.displayNameHi,
    })
    .from(vimarshThreadReplies)
    .leftJoin(profiles, eq(vimarshThreadReplies.authorUserId, profiles.id))
    .where(and(eq(vimarshThreadReplies.threadId, p.id), eq(vimarshThreadReplies.orgId, orgId)))
    .orderBy(asc(vimarshThreadReplies.createdAt));

  return apiSuccess({ thread, replies });
});

// ── POST: add reply ───────────────────────────────────────────────────────

export const POST = withAuth(async (req: NextRequest, ctx, params) => {
  const p = params as { id: string };
  if (!p?.id) return badRequest("Thread ID is required.");
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  const [thread] = await db
    .select({ id: vimarshThreads.id, isClosed: vimarshThreads.isClosed, orgId: vimarshThreads.orgId })
    .from(vimarshThreads)
    .where(and(eq(vimarshThreads.id, p.id), eq(vimarshThreads.orgId, orgId)));

  if (!thread) return notFound("Thread not found.");
  if (thread.isClosed) return badRequest("This thread is closed for new replies.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const replyBody = String(body.body ?? "").trim();
  if (!replyBody) return badRequest("Reply body is required.");

  try {
    // The neon-http driver has no transaction support, so insert then recompute
    // the count from a COUNT subquery (accurate without an atomic transaction).
    const [inserted] = await db
      .insert(vimarshThreadReplies)
      .values({
        orgId,
        threadId: p.id,
        authorUserId: userId,
        body: replyBody,
      })
      .returning();

    await db
      .update(vimarshThreads)
      .set({
        replyCount: sql`(SELECT count(*) FROM ${vimarshThreadReplies} WHERE ${vimarshThreadReplies.threadId} = ${p.id})`,
        updatedAt: sql`now()`,
      })
      .where(eq(vimarshThreads.id, p.id));

    return apiCreated(inserted);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Insert failed");
  }
});

// ── PATCH: pin / close ────────────────────────────────────────────────────

export const PATCH = withAuth(async (req: NextRequest, ctx, params) => {
  const p = params as { id: string };
  if (!p?.id) return badRequest("Thread ID is required.");
  if (!canManage(ctx.session)) {
    return badRequest("You do not have permission to manage threads.");
  }
  const orgId = ctx.session.orgId;

  const [existing] = await db
    .select()
    .from(vimarshThreads)
    .where(and(eq(vimarshThreads.id, p.id), eq(vimarshThreads.orgId, orgId)));
  if (!existing) return notFound("Thread not found.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const updateData: Record<string, unknown> = {};
  if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned);
  if (body.isClosed !== undefined) updateData.isClosed = Boolean(body.isClosed);

  if (Object.keys(updateData).length === 0) return badRequest("No fields to update.");

  updateData.updatedAt = sql`now()`;

  try {
    const [updated] = await db
      .update(vimarshThreads)
      .set(updateData)
      .where(and(eq(vimarshThreads.id, p.id), eq(vimarshThreads.orgId, orgId)))
      .returning();
    return apiSuccess(updated);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Update failed");
  }
});

// ── DELETE: author or manager ─────────────────────────────────────────────

export const DELETE = withAuth(async (_req: NextRequest, ctx, params) => {
  const p = params as { id: string };
  if (!p?.id) return badRequest("Thread ID is required.");
  const orgId = ctx.session.orgId;
  const userId = ctx.session.userId;

  const [existing] = await db
    .select({ id: vimarshThreads.id, authorUserId: vimarshThreads.authorUserId })
    .from(vimarshThreads)
    .where(and(eq(vimarshThreads.id, p.id), eq(vimarshThreads.orgId, orgId)));
  if (!existing) return notFound("Thread not found.");

  const isAuthor = existing.authorUserId === userId;
  const isManager = canManage(ctx.session);
  if (!isAuthor && !isManager) {
    return badRequest("You do not have permission to delete this thread.");
  }

  await db
    .delete(vimarshThreads)
    .where(and(eq(vimarshThreads.id, p.id), eq(vimarshThreads.orgId, orgId)));

  return apiSuccess({ deleted: true });
});
