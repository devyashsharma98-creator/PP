import "server-only";

import { and, eq, gt, isNull, lte, or, sql, inArray, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, userRoleAssignments } from "@/db/schema/index";
import type { ScopedAccess } from "@/lib/app/scope";

/**
 * Pragya Pravah — Current Membership
 *
 * Role assignments are time-bounded (`starts_at` / `ends_at`) precisely so that
 * a person can move between units without their old placement being erased. Any
 * query that answers "who is in this unit *now*" must therefore filter on
 * validity — otherwise somebody who left a unit last year still shows up in that
 * unit's contact export and in its assignee picker.
 *
 * Every caller that resolves people from scope goes through this module, so the
 * validity predicate exists once rather than being re-derived (and forgotten)
 * per call site.
 */

/** `starts_at <= now < ends_at` (open-ended when `ends_at` is null). */
export function currentAssignmentPredicate(): SQL<unknown> {
  const now = sql`now()`;
  return and(
    lte(userRoleAssignments.startsAt, now),
    or(isNull(userRoleAssignments.endsAt), gt(userRoleAssignments.endsAt, now)),
  ) as SQL<unknown>;
}

export interface MemberMembership {
  userId: string;
  departmentIds: string[];
  unitIds: string[];
}

/**
 * Current departments and units for the given members. Members with no live
 * assignment come back with empty arrays rather than being omitted, so callers
 * can tell "no current placement" from "not found".
 */
export async function getCurrentMemberships(userIds: string[]): Promise<Map<string, MemberMembership>> {
  const result = new Map<string, MemberMembership>();
  if (userIds.length === 0) return result;

  for (const userId of userIds) {
    result.set(userId, { userId, departmentIds: [], unitIds: [] });
  }

  const rows = await db
    .select({
      userId: userRoleAssignments.userId,
      departmentId: userRoleAssignments.departmentId,
      unitId: userRoleAssignments.unitId,
    })
    .from(userRoleAssignments)
    .where(and(inArray(userRoleAssignments.userId, userIds), currentAssignmentPredicate()));

  for (const row of rows) {
    const entry = result.get(row.userId);
    if (!entry) continue;
    if (row.departmentId && !entry.departmentIds.includes(row.departmentId)) {
      entry.departmentIds.push(row.departmentId);
    }
    if (row.unitId && !entry.unitIds.includes(row.unitId)) {
      entry.unitIds.push(row.unitId);
    }
  }

  return result;
}

export async function getCurrentMembership(userId: string): Promise<MemberMembership> {
  const map = await getCurrentMemberships([userId]);
  return map.get(userId) ?? { userId, departmentIds: [], unitIds: [] };
}

export interface ScopedMemberRow {
  id: string;
  orgId: string;
  isActive: boolean;
  displayName: string | null;
  displayNameHi: string | null;
  responsibility: string | null;
  departmentIds: string[];
  unitIds: string[];
}

/**
 * Active members of `orgId` who currently hold an assignment inside `scope`,
 * returned together with that current placement so authorization rules can be
 * applied to them without a second lookup.
 *
 * Returns every active member of the org when the scope is org-wide.
 */
export async function findMembersInScope(args: {
  orgId: string;
  scope: ScopedAccess;
  /** Extra predicates on `profiles` (a name search, for instance). */
  extraConditions?: SQL<unknown>[];
  limit?: number;
}): Promise<ScopedMemberRow[]> {
  const { orgId, scope, extraConditions = [], limit } = args;

  const conditions: SQL<unknown>[] = [
    eq(profiles.orgId, orgId),
    eq(profiles.isActive, true),
    ...extraConditions,
  ];

  if (!scope.orgWide) {
    const scopeClauses: SQL<unknown>[] = [];
    if (scope.departmentIds.size > 0) {
      scopeClauses.push(inArray(userRoleAssignments.departmentId, [...scope.departmentIds]));
    }
    if (scope.unitIds.size > 0) {
      scopeClauses.push(inArray(userRoleAssignments.unitId, [...scope.unitIds]));
    }
    if (scopeClauses.length === 0) return [];

    const scopeClause = or(...scopeClauses);
    const reachable = db
      .selectDistinct({ userId: userRoleAssignments.userId })
      .from(userRoleAssignments)
      .where(and(scopeClause, currentAssignmentPredicate()));

    conditions.push(inArray(profiles.id, reachable));
  }

  const base = db
    .select({
      id: profiles.id,
      orgId: profiles.orgId,
      isActive: profiles.isActive,
      displayName: profiles.displayName,
      displayNameHi: profiles.displayNameHi,
      responsibility: profiles.responsibility,
    })
    .from(profiles)
    .where(and(...conditions))
    .orderBy(profiles.displayName);

  const rows = limit ? await base.limit(limit) : await base;
  if (rows.length === 0) return [];

  // Attach each member's *current* placement, which the authorization rule
  // needs in order to decide reachability.
  const memberships = await getCurrentMemberships(rows.map((r) => r.id));

  return rows.map((row) => {
    const membership = memberships.get(row.id);
    return {
      ...row,
      departmentIds: membership?.departmentIds ?? [],
      unitIds: membership?.unitIds ?? [],
    };
  });
}
