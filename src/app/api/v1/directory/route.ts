/**
 * GET /api/v1/directory — List active org members with roles and primary assignment info.
 * Accessible to any authenticated user.
 */
import "server-only";

import { NextRequest } from "next/server";
import { and, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";

import { db } from "@/db/client";
import {
  profiles,
  roles,
  userRoleAssignments,
  units,
  departmentsOrAayams,
} from "@/db/schema/index";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess } from "@/lib/response";
import { getPrimaryRole } from "@/lib/permissions";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const now = new Date();

  // 1. Active profiles in this org
  const profileRows = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      displayNameHi: profiles.displayNameHi,
      email: profiles.email,
      phone: profiles.phone,
    })
    .from(profiles)
    .where(and(eq(profiles.orgId, orgId), eq(profiles.isActive, true)))
    .orderBy(profiles.displayName);

  const userIds = profileRows.map((p) => p.id);
  if (userIds.length === 0) {
    return apiSuccess([]);
  }

  // 2. Active assignments joined with roles, units, and departments
  const assignmentRows = await db
    .select({
      userId: userRoleAssignments.userId,
      roleCode: roles.code,
      roleName: roles.name,
      roleNameHi: roles.nameHi,
      isPrimary: userRoleAssignments.isPrimary,
      unitId: userRoleAssignments.unitId,
      departmentId: userRoleAssignments.departmentId,
      unitName: units.name,
      unitNameHi: units.nameHi,
      departmentName: departmentsOrAayams.name,
      departmentNameHi: departmentsOrAayams.nameHi,
      departmentCode: departmentsOrAayams.code,
    })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .leftJoin(units, eq(userRoleAssignments.unitId, units.id))
    .leftJoin(
      departmentsOrAayams,
      eq(userRoleAssignments.departmentId, departmentsOrAayams.id)
    )
    .where(
      and(
        inArray(userRoleAssignments.userId, userIds),
        lte(userRoleAssignments.startsAt, now),
        or(isNull(userRoleAssignments.endsAt), gt(userRoleAssignments.endsAt, now))
      )
    );

  // 3. Group assignments by user
  const assignmentsByUser = new Map<string, typeof assignmentRows>();
  for (const row of assignmentRows) {
    const list = assignmentsByUser.get(row.userId) ?? [];
    list.push(row);
    assignmentsByUser.set(row.userId, list);
  }

  // 4. Build clean payload
  const payload = profileRows.map((profile) => {
    const userAssignments = assignmentsByUser.get(profile.id) ?? [];
    const activeRoles = userAssignments.map((a) => ({
      code: a.roleCode,
      name: a.roleName,
      nameHi: a.roleNameHi,
    }));

    const primaryAssignment =
      userAssignments.find((a) => a.isPrimary) ?? userAssignments[0];

    const roleCodes = activeRoles.map(
      (r) => r.code
    ) as Parameters<typeof getPrimaryRole>[0];
    const primaryRoleCode = activeRoles.length ? getPrimaryRole(roleCodes) : null;
    const primaryRole = activeRoles.find((r) => r.code === primaryRoleCode) ?? activeRoles[0];

    return {
      id: profile.id,
      displayName: profile.displayName,
      displayNameHi: profile.displayNameHi,
      email: profile.email,
      phone: profile.phone,
      primaryRoleCode: primaryRoleCode ?? null,
      primaryRoleName: primaryRole?.name ?? null,
      primaryRoleNameHi: primaryRole?.nameHi ?? null,
      roles: activeRoles,
      unitName: primaryAssignment?.unitName ?? null,
      departmentName: primaryAssignment?.departmentName ?? null,
      departmentCode: primaryAssignment?.departmentCode ?? null,
    };
  });

  return apiSuccess(payload);
});
