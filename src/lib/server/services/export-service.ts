import "server-only";

import { and, eq, ilike, or, desc, inArray, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { events, articles, profiles } from "@/db/schema/index";
import type { ScopedAccess } from "@/lib/app/scope";
import { rowMatchesScope } from "@/lib/app/scope";
import { findMembersInScope } from "./membership-service";

/**
 * Pragya Pravah — CSV Exports
 *
 * Scope and filters are applied in the query, before any row limit, so an
 * export never silently drops matching records. A hard ceiling still exists to
 * protect the process, but reaching it is reported to the caller rather than
 * hidden.
 */

type CsvRow = Record<string, unknown>;

/** Absolute ceiling. Reaching it is surfaced, never silently truncated. */
export const EXPORT_ROW_CEILING = 50_000;

/** Page size for streaming rows out of the database. */
const PAGE_SIZE = 1_000;

export interface ExportFilters {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface ExportOutcome {
  csv: string;
  rowCount: number;
  /** True only when the ceiling was actually hit. */
  truncated: boolean;
}

function toCsv(rows: CsvRow[], headers: string[]): string {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

/**
 * Read every matching row in pages, applying the scope predicate to each page
 * as it arrives. Filtering after pagination is what previously made scoped
 * exports incomplete, so the scope predicate is part of the page loop, not a
 * post-processing step over a single capped fetch.
 */
async function collectScoped<T extends { id: string }>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
  keep: (row: T) => boolean,
): Promise<{ rows: T[]; truncated: boolean }> {
  const collected: T[] = [];
  let offset = 0;

  for (;;) {
    const page = await fetchPage(PAGE_SIZE, offset);
    if (page.length === 0) break;

    for (const row of page) {
      if (!keep(row)) continue;
      if (collected.length >= EXPORT_ROW_CEILING) {
        return { rows: collected, truncated: true };
      }
      collected.push(row);
    }

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return { rows: collected, truncated: false };
}

const EVENT_HEADERS = [
  "id", "title", "status", "startsAt", "endsAt", "description", "createdAt", "unitId", "departmentId",
];

export async function exportEventsCsv(
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  filters: ExportFilters = {},
): Promise<ExportOutcome> {
  const conditions: SQL<unknown>[] = [eq(events.orgId, orgId)];
  if (filters.status) conditions.push(eq(events.status, filters.status as never));
  if (filters.from) conditions.push(gte(events.startsAt, new Date(filters.from)));
  if (filters.to) conditions.push(lte(events.startsAt, new Date(filters.to)));
  if (filters.search) conditions.push(ilike(events.title, `%${filters.search}%`));

  // Narrow in SQL where the scope allows it, so paging does less work.
  if (!scopedAccess.orgWide) {
    const reach: SQL<unknown>[] = [eq(events.createdBy, userId)];
    if (scopedAccess.unitIds.size > 0) reach.push(inArray(events.unitId, [...scopedAccess.unitIds]));
    if (scopedAccess.departmentIds.size > 0) {
      reach.push(inArray(events.departmentId, [...scopedAccess.departmentIds]));
    }
    if (scopedAccess.eventIds.size > 0) reach.push(inArray(events.id, [...scopedAccess.eventIds]));
    const reachClause = or(...reach);
    if (reachClause) conditions.push(reachClause);
  }

  const whereClause = and(...conditions);

  const { rows, truncated } = await collectScoped(
    (limit, offset) =>
      db
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
          createdBy: events.createdBy,
        })
        .from(events)
        .where(whereClause)
        .orderBy(desc(events.createdAt))
        .limit(limit)
        .offset(offset),
    (row) => rowMatchesScope(scopedAccess, row, userId),
  );

  return { csv: toCsv(rows, EVENT_HEADERS), rowCount: rows.length, truncated };
}

const ARTICLE_HEADERS = [
  "id", "title", "category", "status", "summary", "createdAt", "publishedAt", "unitId", "departmentId", "authorUserId",
];

export async function exportArticlesCsv(
  orgId: string,
  scopedAccess: ScopedAccess,
  userId: string,
  filters: ExportFilters = {},
): Promise<ExportOutcome> {
  const conditions: SQL<unknown>[] = [eq(articles.orgId, orgId)];
  if (filters.status) conditions.push(eq(articles.status, filters.status as never));
  if (filters.from) conditions.push(gte(articles.createdAt, new Date(filters.from)));
  if (filters.to) conditions.push(lte(articles.createdAt, new Date(filters.to)));
  if (filters.search) conditions.push(ilike(articles.title, `%${filters.search}%`));

  if (!scopedAccess.orgWide) {
    const reach: SQL<unknown>[] = [eq(articles.authorUserId, userId)];
    if (scopedAccess.unitIds.size > 0) reach.push(inArray(articles.unitId, [...scopedAccess.unitIds]));
    if (scopedAccess.departmentIds.size > 0) {
      reach.push(inArray(articles.departmentId, [...scopedAccess.departmentIds]));
    }
    if (scopedAccess.articleIds.size > 0) reach.push(inArray(articles.id, [...scopedAccess.articleIds]));
    const reachClause = or(...reach);
    if (reachClause) conditions.push(reachClause);
  }

  const whereClause = and(...conditions);

  const { rows, truncated } = await collectScoped(
    (limit, offset) =>
      db
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
        .where(whereClause)
        .orderBy(desc(articles.createdAt))
        .limit(limit)
        .offset(offset),
    (row) =>
      rowMatchesScope(
        scopedAccess,
        { ...row, createdBy: row.authorUserId },
        userId,
      ),
  );

  return { csv: toCsv(rows, ARTICLE_HEADERS), rowCount: rows.length, truncated };
}

const MEMBER_HEADERS = [
  "id", "email", "displayName", "displayNameHi", "phone", "isActive", "lastLoginAt", "createdAt",
];

/**
 * Member export. Authority is checked by the caller; this function still
 * restricts the record set to the caller's scope so an authorised but scoped
 * export cannot reach the whole org.
 */
export async function exportMembersCsv(
  orgId: string,
  scopedAccess: ScopedAccess,
  filters: ExportFilters = {},
): Promise<ExportOutcome> {
  const conditions: SQL<unknown>[] = [eq(profiles.orgId, orgId)];
  if (filters.status === "inactive") conditions.push(eq(profiles.isActive, false));
  else if (filters.status !== "all") conditions.push(eq(profiles.isActive, true));
  if (filters.search) {
    const term = `%${filters.search}%`;
    const nameClause = or(ilike(profiles.displayName, term), ilike(profiles.email, term));
    if (nameClause) conditions.push(nameClause);
  }

  if (!scopedAccess.orgWide) {
    // Members are resolved through their *current* role assignments, so someone
    // who has left this unit or department no longer appears in its export.
    const scopedMembers = await findMembersInScope({ orgId, scope: scopedAccess });
    if (scopedMembers.length === 0) {
      return { csv: toCsv([], MEMBER_HEADERS), rowCount: 0, truncated: false };
    }
    conditions.push(inArray(profiles.id, scopedMembers.map((m) => m.id)));
  }

  const whereClause = and(...conditions);

  const { rows, truncated } = await collectScoped(
    (limit, offset) =>
      db
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
        .where(whereClause)
        .orderBy(desc(profiles.createdAt))
        .limit(limit)
        .offset(offset),
    () => true,
  );

  return { csv: toCsv(rows, MEMBER_HEADERS), rowCount: rows.length, truncated };
}
