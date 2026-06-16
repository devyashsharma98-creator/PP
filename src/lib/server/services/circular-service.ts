import "server-only";

import { NextResponse } from "next/server";
import { and, eq, ilike, count, desc, inArray, or, isNull, sql, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { circulars, circularReads, profiles } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { ScopedAccess } from "@/lib/app/scope";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type { CreateCircularInput, UpdateCircularInput, ListCircularsQuery } from "@/lib/validators/circulars";
import { apiSuccess, apiCreated, badRequest, serverError, notFound } from "@/lib/response";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };
function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err(response: NextResponse): Result<never> { return { ok: false, response }; }

// ── Public helpers ───────────────────────────────────────────────────────────

export async function listCirculars(
  q: ListCircularsQuery,
  orgId: string,
  userId: string,
  scopedAccess: ScopedAccess,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  const conditions: SQL<unknown>[] = [eq(circulars.orgId, orgId)];

  if (q.priority) conditions.push(eq(circulars.priority, q.priority));
  if (q.scope) conditions.push(eq(circulars.scope, q.scope));
  if (q.search) conditions.push(ilike(circulars.title, `%${q.search}%`));

  if (!scopedAccess.orgWide) {
    const scopeConditions: SQL<unknown>[] = [
      eq(circulars.authorUserId, userId),
      eq(circulars.scope, "org"),
    ];
    if (scopedAccess.unitIds.size > 0) {
      const unitCond = and(eq(circulars.scope, "unit"), inArray(circulars.scopeEntityId, [...scopedAccess.unitIds]));
      if (unitCond) scopeConditions.push(unitCond);
    }
    if (scopedAccess.departmentIds.size > 0) {
      const deptCond = and(eq(circulars.scope, "department"), inArray(circulars.scopeEntityId, [...scopedAccess.departmentIds]));
      if (deptCond) scopeConditions.push(deptCond);
    }
    const scopeClause = or(...scopeConditions);
    if (scopeClause) conditions.push(scopeClause);
  }

  const whereClause = and(...conditions);

  const columns = {
    id: circulars.id,
    title: circulars.title,
    titleHi: circulars.titleHi,
    body: circulars.body,
    bodyHi: circulars.bodyHi,
    priority: circulars.priority,
    scope: circulars.scope,
    authorName: profiles.displayName,
    publishedAt: circulars.publishedAt,
    expiresAt: circulars.expiresAt,
    createdAt: circulars.createdAt,
  };

  if (q.unreadOnly) {
    conditions.push(isNull(circulars.expiresAt));
    const pubCondition = or(isNull(circulars.publishedAt), sql`${circulars.publishedAt} <= now()`);
    if (pubCondition) conditions.push(pubCondition);

    const notReadCondition = sql`${circulars.id} NOT IN (SELECT ${circularReads.circularId} FROM ${circularReads} WHERE ${circularReads.userId} = ${userId})`;

    const [rows, totalRow] = await Promise.all([
      db.select(columns).from(circulars)
        .leftJoin(profiles, eq(circulars.authorUserId, profiles.id))
        .where(and(...conditions, notReadCondition))
        .orderBy(desc(circulars.priority), desc(circulars.publishedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(circulars)
        .where(and(...conditions, notReadCondition)),
    ]);
    return ok({ rows, total: totalRow[0]?.total ?? 0 });
  }

  const [rows, totalRow] = await Promise.all([
    db.select(columns).from(circulars)
      .leftJoin(profiles, eq(circulars.authorUserId, profiles.id))
      .where(whereClause)
      .orderBy(desc(circulars.priority), desc(circulars.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(circulars).where(whereClause),
  ]);

  return ok({ rows, total: totalRow[0]?.total ?? 0 });
}

export async function getCircular(
  circularId: string,
  orgId: string,
): Promise<Result<unknown>> {
  const [row] = await db
    .select({
      id: circulars.id,
      title: circulars.title,
      titleHi: circulars.titleHi,
      body: circulars.body,
      bodyHi: circulars.bodyHi,
      priority: circulars.priority,
      scope: circulars.scope,
      authorName: profiles.displayName,
      publishedAt: circulars.publishedAt,
      expiresAt: circulars.expiresAt,
      createdAt: circulars.createdAt,
    })
    .from(circulars)
    .leftJoin(profiles, eq(circulars.authorUserId, profiles.id))
    .where(and(eq(circulars.id, circularId), eq(circulars.orgId, orgId)));

  if (!row) return err(notFound("Circular not found."));
  return ok(row);
}

export async function createCircular(
  input: CreateCircularInput,
  ctx: AuthContext,
): Promise<Result<{ id: string; title: string; priority: string }>> {
  const [newCircular] = await db
    .insert(circulars)
    .values({
      orgId: ctx.session.orgId,
      title: input.title,
      titleHi: input.titleHi,
      body: input.body,
      bodyHi: input.bodyHi,
      priority: input.priority ?? "normal",
      scope: input.scope ?? "org",
      scopeEntityId: input.scopeEntityId ?? null,
      authorUserId: ctx.session.userId,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning({ id: circulars.id, title: circulars.title, priority: circulars.priority });

  if (!newCircular) return err(serverError("Failed to create circular."));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "circular.created", actorUserId: ctx.session.userId, entityType: "circular", entityId: newCircular.id },
    { summary: `Circular "${input.title}" created.`, actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(newCircular);
}

export async function updateCircular(
  circularId: string,
  input: UpdateCircularInput,
  ctx: AuthContext,
): Promise<Result<{ id: string; title: string }>> {
  const [existing] = await db
    .select({ id: circulars.id })
    .from(circulars)
    .where(and(eq(circulars.id, circularId), eq(circulars.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Circular not found."));

  const [updated] = await db
    .update(circulars)
    .set({
      ...input,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(circulars.id, circularId))
    .returning({ id: circulars.id, title: circulars.title });

  if (!updated) return err(serverError("Failed to update circular."));
  return ok(updated);
}

export async function deleteCircular(
  circularId: string,
  ctx: AuthContext,
): Promise<Result<void>> {
  const [existing] = await db
    .select({ id: circulars.id })
    .from(circulars)
    .where(and(eq(circulars.id, circularId), eq(circulars.orgId, ctx.session.orgId)));

  if (!existing) return err(notFound("Circular not found."));

  await db.delete(circulars).where(eq(circulars.id, circularId));

  await auditAndActivity(
    { orgId: ctx.session.orgId, action: "circular.deleted", actorUserId: ctx.session.userId, entityType: "circular", entityId: circularId },
    { summary: "Circular deleted.", actorNameSnapshot: ctx.session.displayName ?? undefined },
  );

  return ok(undefined);
}

// ── Read tracking ────────────────────────────────────────────────────────────

export async function acknowledgeCircular(
  circularId: string,
  userId: string,
  orgId: string,
): Promise<Result<{ readAt: string }>> {
  const [circular] = await db
    .select({ id: circulars.id })
    .from(circulars)
    .where(and(eq(circulars.id, circularId), eq(circulars.orgId, orgId)));

  if (!circular) return err(notFound("Circular not found."));

  const result = await db.execute(
    sql`INSERT INTO circular_reads (circular_id, user_id)
        SELECT ${circularId}::uuid, ${userId}::uuid
        WHERE NOT EXISTS (
          SELECT 1 FROM circular_reads WHERE circular_id = ${circularId}::uuid AND user_id = ${userId}::uuid
        )
        RETURNING read_at`,
  );

  const rows = result.rows ?? [];
  return ok({ readAt: (rows[0] as { read_at?: string })?.read_at ?? new Date().toISOString() });
}

export async function getUnreadCount(
  orgId: string,
  userId: string,
): Promise<Result<{ count: number }>> {
  const [result] = await db
    .select({ count: count() })
    .from(circulars)
    .where(
      and(
        eq(circulars.orgId, orgId),
        isNull(circulars.expiresAt),
        sql`(${circulars.publishedAt} IS NULL OR ${circulars.publishedAt} <= now())`,
        sql`${circulars.id} NOT IN (SELECT ${circularReads.circularId} FROM ${circularReads} WHERE ${circularReads.userId} = ${userId})`,
      ),
    );

  return ok({ count: result?.count ?? 0 });
}
