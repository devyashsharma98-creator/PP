/**
 * GET /api/v1/org/structure — Org, units, departments, and head mappings.
 * Accessible to any authenticated user.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, inArray, or, isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import {
  orgSettings,
  units,
  departmentsOrAayams,
  profiles,
  roles,
  userRoleAssignments,
} from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  // 1. Org info
  const org = await db.query.orgSettings.findFirst({
    where: eq(orgSettings.id, orgId),
    columns: { name: true, nameHi: true, orgCode: true },
  });

  // 2. Active units
  const unitRows = await db
    .select({
      id: units.id,
      name: units.name,
      nameHi: units.nameHi,
      code: units.code,
      unitKind: units.unitKind,
    })
    .from(units)
    .where(and(eq(units.orgId, orgId), eq(units.isActive, true)))
    .orderBy(units.name);

  // 3. Active departments / aayams
  const deptRows = await db
    .select({
      id: departmentsOrAayams.id,
      name: departmentsOrAayams.name,
      nameHi: departmentsOrAayams.nameHi,
      code: departmentsOrAayams.code,
      departmentKind: departmentsOrAayams.departmentKind,
      unitId: departmentsOrAayams.unitId,
    })
    .from(departmentsOrAayams)
    .where(
      and(
        eq(departmentsOrAayams.orgId, orgId),
        eq(departmentsOrAayams.isActive, true)
      )
    )
    .orderBy(departmentsOrAayams.name);

  // 4. Unified heads query — covers all unit-scoped and dept-scoped head roles
  const HEAD_ROLE_CODES = [
    "aayam_pramukh",
    "vibhag_pramukh",
    "prant_sanyojak",
    "kshetra_reviewer",
    "prant_aayam_pramukh",
    "unit_head",
  ];

  const headRows = await db
    .select({
      displayName: profiles.displayName,
      unitId: userRoleAssignments.unitId,
      departmentId: userRoleAssignments.departmentId,
    })
    .from(userRoleAssignments)
    .innerJoin(profiles, eq(userRoleAssignments.userId, profiles.id))
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(
      and(
        eq(profiles.orgId, orgId),
        eq(profiles.isActive, true),
        inArray(roles.code, HEAD_ROLE_CODES),
        or(isNotNull(userRoleAssignments.unitId), isNotNull(userRoleAssignments.departmentId))
      )
    );

  // Single heads map: unitId → name  and  departmentId → name
  const headsMap = new Map<string, string>();
  for (const row of headRows) {
    const name = row.displayName ?? "[Name]";
    if (row.unitId && !headsMap.has(row.unitId)) {
      headsMap.set(row.unitId, name);
    }
    if (row.departmentId && !headsMap.has(row.departmentId)) {
      headsMap.set(row.departmentId, name);
    }
  }

  return apiSuccess({
    org: org ?? { name: null, nameHi: null, orgCode: null },
    units: unitRows,
    departments: deptRows,
    heads: Object.fromEntries(headsMap),
  });
});
