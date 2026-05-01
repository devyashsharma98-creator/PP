/**
 * GET /api/v1/org/structure — Org, units, departments, and head mappings.
 * Accessible to any authenticated user.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

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

  // 4. Simplified heads query — aayam pramukhs mapped to departments
  const headRows = await db
    .select({
      userId: profiles.id,
      displayName: profiles.displayName,
      departmentId: userRoleAssignments.departmentId,
    })
    .from(userRoleAssignments)
    .innerJoin(profiles, eq(userRoleAssignments.userId, profiles.id))
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(
      and(
        eq(profiles.orgId, orgId),
        eq(profiles.isActive, true),
        eq(roles.code, "aayam_pramukh")
      )
    );

  const headsByDepartment = new Map<string, string>();
  for (const row of headRows) {
    if (row.departmentId) {
      headsByDepartment.set(row.departmentId, row.displayName ?? "[Name]");
    }
  }

  return apiSuccess({
    org: org ?? { name: null, nameHi: null, orgCode: null },
    units: unitRows,
    departments: deptRows,
    heads: Object.fromEntries(headsByDepartment),
  });
});
