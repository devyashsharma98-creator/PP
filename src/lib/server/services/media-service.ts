import "server-only";

import { NextResponse } from "next/server";
import { and, eq, ilike, count, desc, sum, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { mediaAssets, profiles } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { AuthContext } from "@/lib/middleware/with-auth";
import type { CreateMediaAssetInput, UpdateMediaAssetInput, ListMediaAssetsQuery } from "@/lib/validators/media";
import {
  serverError, notFound,
} from "@/lib/response";

type Result<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function err(response: NextResponse): Result<never> { return { ok: false, response }; }

export async function listMediaAssets(
  q: ListMediaAssetsQuery,
  orgId: string,
  page: number,
  limit: number,
  offset: number,
): Promise<Result<{ rows: unknown[]; total: number }>> {
  try {
    const conditions: SQL<unknown>[] = [eq(mediaAssets.orgId, orgId)];
    if (q.category) conditions.push(eq(mediaAssets.category, q.category));
    if (q.search) conditions.push(ilike(mediaAssets.filename, `%${q.search}%`));

    const whereClause = and(...conditions);

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: mediaAssets.id,
          filename: mediaAssets.filename,
          storageKey: mediaAssets.storageKey,
          mimeType: mediaAssets.mimeType,
          sizeBytes: mediaAssets.sizeBytes,
          bucket: mediaAssets.bucket,
          category: mediaAssets.category,
          altText: mediaAssets.altText,
          altTextHi: mediaAssets.altTextHi,
          tags: mediaAssets.tags,
          width: mediaAssets.width,
          height: mediaAssets.height,
          uploadedByName: profiles.displayName,
          createdAt: mediaAssets.createdAt,
        })
        .from(mediaAssets)
        .leftJoin(profiles, eq(mediaAssets.uploadedBy, profiles.id))
        .where(whereClause)
        .orderBy(desc(mediaAssets.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(mediaAssets)
        .where(whereClause)
        .then((r) => r[0]?.count ?? 0),
    ]);

    return ok({ rows, total: totalRow });
  } catch (e) {
    console.error("listMediaAssets error:", e);
    return err(serverError());
  }
}

export async function getMediaAsset(id: string): Promise<Result<unknown>> {
  try {
    const row = await db
      .select({
        id: mediaAssets.id,
        filename: mediaAssets.filename,
        storageKey: mediaAssets.storageKey,
        mimeType: mediaAssets.mimeType,
        sizeBytes: mediaAssets.sizeBytes,
        bucket: mediaAssets.bucket,
        category: mediaAssets.category,
        altText: mediaAssets.altText,
        altTextHi: mediaAssets.altTextHi,
        tags: mediaAssets.tags,
        width: mediaAssets.width,
        height: mediaAssets.height,
        uploadedByName: profiles.displayName,
        createdAt: mediaAssets.createdAt,
      })
      .from(mediaAssets)
      .leftJoin(profiles, eq(mediaAssets.uploadedBy, profiles.id))
      .where(eq(mediaAssets.id, id))
      .then((r) => r[0] ?? null);

    if (!row) return err(notFound("Media asset not found."));
    return ok(row);
  } catch (e) {
    console.error("getMediaAsset error:", e);
    return err(serverError());
  }
}

export async function createMediaAsset(
  input: CreateMediaAssetInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const [row] = await db
      .insert(mediaAssets)
      .values({
        orgId: ctx.session.orgId,
        uploadedBy: ctx.session.userId,
        filename: input.filename,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        bucket: input.bucket ?? "media",
        category: input.category ?? "other",
        altText: input.altText,
        altTextHi: input.altTextHi,
        tags: input.tags,
        width: input.width,
        height: input.height,
      })
      .returning({ id: mediaAssets.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "media.created", actorUserId: ctx.session.userId, entityType: "media_asset", entityId: row.id },
      { summary: `Uploaded media: ${input.filename}`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("createMediaAsset error:", e);
    return err(serverError());
  }
}

export async function updateMediaAsset(
  id: string,
  input: UpdateMediaAssetInput,
  ctx: AuthContext,
): Promise<Result<{ id: string }>> {
  try {
    const existing = await db
      .select({ id: mediaAssets.id, orgId: mediaAssets.orgId })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .then((r) => r[0] ?? null);

    if (!existing) return err(notFound("Media asset not found."));
    if (existing.orgId !== ctx.session.orgId) return err(notFound("Media asset not found."));

    const [row] = await db
      .update(mediaAssets)
      .set({
        altText: input.altText,
        altTextHi: input.altTextHi,
        tags: input.tags,
        category: input.category,
      })
      .where(eq(mediaAssets.id, id))
      .returning({ id: mediaAssets.id });

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "media.updated", actorUserId: ctx.session.userId, entityType: "media_asset", entityId: id },
      { summary: `Updated media metadata`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok(row);
  } catch (e) {
    console.error("updateMediaAsset error:", e);
    return err(serverError());
  }
}

export async function deleteMediaAsset(
  id: string,
  ctx: AuthContext,
): Promise<Result<{ deleted: boolean }>> {
  try {
    const existing = await db
      .select({ id: mediaAssets.id, orgId: mediaAssets.orgId })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .then((r) => r[0] ?? null);

    if (!existing) return err(notFound("Media asset not found."));
    if (existing.orgId !== ctx.session.orgId) return err(notFound("Media asset not found."));

    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));

    await auditAndActivity(
      { orgId: ctx.session.orgId, action: "media.deleted", actorUserId: ctx.session.userId, entityType: "media_asset", entityId: id },
      { summary: `Deleted media asset`, actorNameSnapshot: ctx.session.displayName ?? undefined },
    );

    return ok({ deleted: true });
  } catch (e) {
    console.error("deleteMediaAsset error:", e);
    return err(serverError());
  }
}

export async function getMediaSummary(
  orgId: string,
): Promise<Result<{ totalAssets: number; totalSizeBytes: number; categoryCounts: Record<string, number> }>> {
  try {
    const [countResult, sizeResult, categoryRows] = await Promise.all([
      db
        .select({ count: count() })
        .from(mediaAssets)
        .where(eq(mediaAssets.orgId, orgId))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ total: sum(mediaAssets.sizeBytes) })
        .from(mediaAssets)
        .where(eq(mediaAssets.orgId, orgId))
        .then((r) => r[0]?.total ?? "0"),
      db
        .select({
          category: mediaAssets.category,
          count: count(),
        })
        .from(mediaAssets)
        .where(eq(mediaAssets.orgId, orgId))
        .groupBy(mediaAssets.category),
    ]);

    const categoryCounts: Record<string, number> = {};
    for (const row of categoryRows) {
      categoryCounts[row.category] = row.count;
    }

    return ok({
      totalAssets: countResult,
      totalSizeBytes: Number(sizeResult),
      categoryCounts,
    });
  } catch (e) {
    console.error("getMediaSummary error:", e);
    return err(serverError());
  }
}
