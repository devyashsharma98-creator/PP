import "server-only";

import { and, eq, ilike, or, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { events, articles, profiles, units, departmentsOrAayams } from "@/db/schema/index";
import type { ScopedAccess } from "@/lib/app/scope";
import { rowMatchesScope } from "@/lib/app/scope";

type CsvRow = Record<string, unknown>;

function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0] as CsvRow);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export async function exportEventsCsv(
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
): Promise<string> {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      description: events.description,
      createdAt: events.createdAt,
      unitId: events.unitId,
      departmentId: events.departmentId,
    })
    .from(events)
    .where(eq(events.orgId, orgId))
    .orderBy(desc(events.createdAt))
    .limit(500);

  const filtered = rows.filter((r) =>
    rowMatchesScope(scopedAccess, { id: r.id, unitId: r.unitId, departmentId: r.departmentId, createdBy: null }, userId),
  );

  return toCsv(filtered);
}

export async function exportArticlesCsv(
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
): Promise<string> {
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      category: articles.category,
      status: articles.status,
      summary: articles.summary,
      createdAt: articles.createdAt,
      publishedAt: articles.publishedAt,
      unitId: articles.unitId,
      departmentId: articles.departmentId,
      authorUserId: articles.authorUserId,
    })
    .from(articles)
    .where(eq(articles.orgId, orgId))
    .orderBy(desc(articles.createdAt))
    .limit(500);

  const filtered = rows.filter((r) =>
    rowMatchesScope(scopedAccess, { id: r.id, unitId: r.unitId, departmentId: r.departmentId, createdBy: r.authorUserId, authorUserId: r.authorUserId }, userId),
  );

  return toCsv(filtered);
}

export async function exportUsersCsv(orgId: string): Promise<string> {
  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      displayNameHi: profiles.displayNameHi,
      phone: profiles.phone,
      isActive: profiles.isActive,
      lastLoginAt: profiles.lastLoginAt,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(and(eq(profiles.orgId, orgId), eq(profiles.isActive, true)))
    .orderBy(desc(profiles.createdAt));

  return toCsv(rows);
}
