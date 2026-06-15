/**
 * User Service — DB and business logic for user management.
 */
import "server-only";

import { and, count, eq, gt, ilike, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles, roles, userRoleAssignments } from "@/db/schema/index";
import { getPrimaryRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth/password";
import { auditAndActivity } from "@/lib/audit";
import { badRequest, conflict, notFound, serverError } from "@/lib/response";
import type {
  ListUsersQuery,
  CreateUserInput,
  UpdateUserInput,
  AssignRoleInput,
} from "@/lib/validators/users";
import type { RoleCode } from "@/lib/permissions/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoleInfo = {
  code: string;
  name: string;
  nameHi: string | null;
  isPrimary: boolean;
};

export type UserListItem = {
  id: string;
  email: string;
  displayName: string | null;
  displayNameHi: string | null;
  phone: string | null;
  responsibility: string | null;
  responsibilityHi: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: RoleInfo[];
  primaryRoleCode: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  displayNameHi: string | null;
  phone: string | null;
  responsibility: string | null;
  responsibilityHi: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleAssignment = {
  id: string;
  roleCode: string;
  roleName: string;
  roleNameHi: string | null;
  scopeType: string;
  unitId: string | null;
  departmentId: string | null;
  isPrimary: boolean;
  startsAt: Date;
  endsAt: Date | null;
  createdAt?: Date;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildWhereClause(orgId: string, q: ListUsersQuery) {
  const conditions = [eq(profiles.orgId, orgId)];
  if (q.isActive !== undefined) conditions.push(eq(profiles.isActive, q.isActive));

  const searchCondition = q.search
    ? or(
        ilike(profiles.displayName, `%${q.search}%`),
        ilike(profiles.email, `%${q.search}%`)
      )
    : undefined;

  return searchCondition ? and(...conditions, searchCondition) : and(...conditions);
}

function isAssignmentActive(startsAt: Date, endsAt: Date | null, now: Date): boolean {
  return startsAt <= now && (!endsAt || endsAt > now);
}

// ── List Users ────────────────────────────────────────────────────────────────

/**
 * Cyclomatic: 5 | Cognitive: 8
 * Lists users with pagination, search, filters, and active role assignments.
 */
export async function listUsers(
  orgId: string,
  q: ListUsersQuery,
  limit: number,
  offset: number
): Promise<{ users: UserListItem[]; total: number }> {
  const whereClause = buildWhereClause(orgId, q);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: profiles.id,
        email: profiles.email,
        displayName: profiles.displayName,
        displayNameHi: profiles.displayNameHi,
        phone: profiles.phone,
        responsibility: profiles.responsibility,
        responsibilityHi: profiles.responsibilityHi,
        isActive: profiles.isActive,
        lastLoginAt: profiles.lastLoginAt,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(profiles.createdAt),

    db.select({ value: count() }).from(profiles).where(whereClause),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  const userIds = rows.map((r) => r.id);
  const now = new Date();

  const assignmentRows = userIds.length
    ? await db
        .select({
          userId: userRoleAssignments.userId,
          roleCode: roles.code,
          roleName: roles.name,
          roleNameHi: roles.nameHi,
          isPrimary: userRoleAssignments.isPrimary,
        })
        .from(userRoleAssignments)
        .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
        .where(
          and(
            inArray(userRoleAssignments.userId, userIds),
            lte(userRoleAssignments.startsAt, now),
            or(isNull(userRoleAssignments.endsAt), gt(userRoleAssignments.endsAt, now))
          )
        )
    : [];

  const rolesByUser = new Map<string, RoleInfo[]>();
  for (const a of assignmentRows) {
    const list = rolesByUser.get(a.userId) ?? [];
    list.push({
      code: a.roleCode,
      name: a.roleName,
      nameHi: a.roleNameHi,
      isPrimary: a.isPrimary,
    });
    rolesByUser.set(a.userId, list);
  }

  const users: UserListItem[] = rows.map((row) => {
    const activeRoles = rolesByUser.get(row.id) ?? [];
    const roleCodes = activeRoles.map((r) => r.code) as RoleCode[];
    return {
      ...row,
      roles: activeRoles,
      primaryRoleCode: activeRoles.length ? getPrimaryRole(roleCodes) : null,
    };
  });

  return { users, total };
}

// ── Create User ───────────────────────────────────────────────────────────────

/**
 * Cyclomatic: 5 | Cognitive: 7
 * Creates a new user with an initial role and audit trail.
 */
export async function createUser(
  input: CreateUserInput,
  orgId: string,
  actorUserId: string,
  actorEmail: string,
  actorDisplayName: string | null,
  ip: string
): Promise<{ id: string; email: string; displayName: string | null; isActive: boolean; createdAt: Date; roleCode: string } | Response> {
  const existing = await db.query.profiles.findFirst({
    where: and(eq(profiles.email, input.email), eq(profiles.orgId, orgId)),
    columns: { id: true },
  });
  if (existing) return conflict("A user with this email already exists in this organisation.");

  const passwordHash = await hashPassword(input.password);

  const roleRecord = await db.query.roles.findFirst({
    where: eq(roles.code, input.roleCode),
    columns: { id: true },
  });
  if (!roleRecord) return badRequest(`Role '${input.roleCode}' is not recognised.`);

  const [newProfile] = await db
    .insert(profiles)
    .values({
      orgId,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      displayNameHi: input.displayNameHi,
      phone: input.phone,
      responsibility: input.responsibility,
      responsibilityHi: input.responsibilityHi,
    })
    .returning({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      isActive: profiles.isActive,
      createdAt: profiles.createdAt,
    });

  if (!newProfile) return serverError("Failed to create user.");

  await db.insert(userRoleAssignments).values({
    userId: newProfile.id,
    roleId: roleRecord.id,
    scopeType: "org",
    orgId,
    unitId: input.unitId ?? null,
    departmentId: input.departmentId ?? null,
    isPrimary: true,
    assignedBy: actorUserId,
  });

  await auditAndActivity(
    {
      orgId,
      action: "user.created",
      actorUserId,
      actorEmail,
      actorIp: ip,
      entityType: "profile",
      entityId: newProfile.id,
      changeSummary: `User created: ${input.email} with role ${input.roleCode}.`,
    },
    {
      summary: `${actorDisplayName ?? actorEmail} added new member: ${input.displayName ?? input.email}.`,
      actorNameSnapshot: actorDisplayName ?? actorEmail,
    }
  );

  return { ...newProfile, roleCode: input.roleCode };
}

// ── Get User Profile ──────────────────────────────────────────────────────────

/**
 * Cyclomatic: 2 | Cognitive: 3
 * Fetches a user profile and all role assignments.
 */
export async function getUserProfile(
  userId: string,
  orgId: string
): Promise<{ profile: UserProfile; roleAssignments: RoleAssignment[] } | Response> {
  const profileRow = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, orgId)),
    columns: {
      id: true,
      email: true,
      displayName: true,
      displayNameHi: true,
      phone: true,
      responsibility: true,
      responsibilityHi: true,
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!profileRow) return notFound("User not found.");

  const assignments = await db
    .select({
      id: userRoleAssignments.id,
      roleCode: roles.code,
      roleName: roles.name,
      roleNameHi: roles.nameHi,
      scopeType: userRoleAssignments.scopeType,
      unitId: userRoleAssignments.unitId,
      departmentId: userRoleAssignments.departmentId,
      isPrimary: userRoleAssignments.isPrimary,
      startsAt: userRoleAssignments.startsAt,
      endsAt: userRoleAssignments.endsAt,
    })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, userId));

  return { profile: profileRow as UserProfile, roleAssignments: assignments };
}

// ── Update User Profile ───────────────────────────────────────────────────────

/**
 * Cyclomatic: 4 | Cognitive: 5
 * Updates a user profile and writes an audit trail.
 */
export async function updateUserProfile(
  userId: string,
  orgId: string,
  input: UpdateUserInput,
  actorUserId: string,
  actorEmail: string,
  actorDisplayName: string | null,
  ip: string
): Promise<{ id: string; email: string; displayName: string | null; isActive: boolean; updatedAt: Date } | Response> {
  const existing = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, orgId)),
    columns: { id: true },
  });
  if (!existing) return notFound("User not found.");

  const [updated] = await db
    .update(profiles)
    .set({
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.displayNameHi !== undefined && { displayNameHi: input.displayNameHi }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.responsibility !== undefined && { responsibility: input.responsibility }),
      ...(input.responsibilityHi !== undefined && { responsibilityHi: input.responsibilityHi }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      isActive: profiles.isActive,
      updatedAt: profiles.updatedAt,
    });

  if (!updated) return serverError("Failed to update user.");

  await auditAndActivity(
    {
      orgId,
      action: "user.updated",
      actorUserId,
      actorEmail,
      actorIp: ip,
      entityType: "profile",
      entityId: userId,
      payload: input as Record<string, unknown>,
      changeSummary: `Profile updated for ${updated.email}.`,
    },
    {
      summary: `${actorDisplayName ?? actorEmail} updated profile for ${updated.email}.`,
      actorNameSnapshot: actorDisplayName ?? actorEmail,
    }
  );

  return updated;
}

// ── List Role Assignments ─────────────────────────────────────────────────────

/**
 * Cyclomatic: 2 | Cognitive: 3
 * Returns all and active role assignments for a user.
 */
export async function listUserRoleAssignments(
  userId: string
): Promise<{ all: RoleAssignment[]; active: RoleAssignment[] }> {
  const assignments = await db
    .select({
      id: userRoleAssignments.id,
      roleCode: roles.code,
      roleName: roles.name,
      roleNameHi: roles.nameHi,
      scopeType: userRoleAssignments.scopeType,
      unitId: userRoleAssignments.unitId,
      departmentId: userRoleAssignments.departmentId,
      isPrimary: userRoleAssignments.isPrimary,
      startsAt: userRoleAssignments.startsAt,
      endsAt: userRoleAssignments.endsAt,
      createdAt: userRoleAssignments.createdAt,
    })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, userId))
    .orderBy(userRoleAssignments.createdAt);

  const now = new Date();
  const active = assignments.filter((a) => isAssignmentActive(a.startsAt, a.endsAt, now));

  return { all: assignments, active };
}

// ── Assign Role ───────────────────────────────────────────────────────────────

/**
 * Cyclomatic: 4 | Cognitive: 6
 * Assigns a role to a user and writes an audit trail.
 */
export async function assignRoleToUser(
  userId: string,
  orgId: string,
  input: AssignRoleInput,
  actorUserId: string,
  actorEmail: string,
  actorDisplayName: string | null,
  ip: string
): Promise<{ assignmentId: string | undefined; roleCode: string } | Response> {
  const targetUser = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, orgId)),
    columns: { id: true, email: true, displayName: true },
  });
  if (!targetUser) return notFound("User not found.");

  const roleRecord = await db.query.roles.findFirst({
    where: eq(roles.code, input.roleCode),
    columns: { id: true },
  });
  if (!roleRecord) return badRequest(`Role '${input.roleCode}' is not recognised.`);

  const [assignment] = await db
    .insert(userRoleAssignments)
    .values({
      userId,
      roleId: roleRecord.id,
      scopeType: input.scopeType,
      orgId,
      unitId: input.unitId ?? null,
      departmentId: input.departmentId ?? null,
      scopeEntityId: null,
      startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      isPrimary: input.isPrimary,
      assignedBy: actorUserId,
    })
    .returning({ id: userRoleAssignments.id });

  await auditAndActivity(
    {
      orgId,
      action: "user.role_assigned",
      actorUserId,
      actorEmail,
      actorIp: ip,
      entityType: "profile",
      entityId: userId,
      payload: input as Record<string, unknown>,
      changeSummary: `Role '${input.roleCode}' assigned to ${targetUser.email}.`,
    },
    {
      summary: `${actorDisplayName ?? actorEmail} assigned role '${input.roleCode}' to ${targetUser.displayName ?? targetUser.email}.`,
      actorNameSnapshot: actorDisplayName ?? actorEmail,
    }
  );

  return { assignmentId: assignment?.id, roleCode: input.roleCode };
}

// ── Remove Role Assignment ────────────────────────────────────────────────────

/**
 * Cyclomatic: 6 | Cognitive: 8
 * Removes a role assignment, enforcing at least one active role.
 */
export async function removeRoleAssignment(
  userId: string,
  orgId: string,
  assignmentId: string,
  actorUserId: string,
  actorEmail: string,
  actorDisplayName: string | null,
  ip: string
): Promise<{ assignmentId: string; removed: true } | Response> {
  const targetUser = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, orgId)),
    columns: { id: true, email: true, displayName: true },
  });
  if (!targetUser) return notFound("User not found.");

  const assignments = await db
    .select({
      id: userRoleAssignments.id,
      roleCode: roles.code,
      startsAt: userRoleAssignments.startsAt,
      endsAt: userRoleAssignments.endsAt,
    })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, userId));

  const assignment = assignments.find((row) => row.id === assignmentId);
  if (!assignment) return notFound("Role assignment not found.");

  const now = new Date();
  const activeAssignments = assignments.filter((row) =>
    isAssignmentActive(row.startsAt, row.endsAt, now)
  );

  if (activeAssignments.some((row) => row.id === assignmentId) && activeAssignments.length <= 1) {
    return conflict(
      "A user must retain at least one active role. Deactivate the account to revoke access completely."
    );
  }

  await db
    .delete(userRoleAssignments)
    .where(and(eq(userRoleAssignments.id, assignmentId), eq(userRoleAssignments.userId, userId)));

  await auditAndActivity(
    {
      orgId,
      action: "user.role_removed",
      actorUserId,
      actorEmail,
      actorIp: ip,
      entityType: "profile",
      entityId: userId,
      payload: { assignmentId, roleCode: assignment.roleCode },
      changeSummary: `Role '${assignment.roleCode}' removed from ${targetUser.email}.`,
    },
    {
      summary: `${actorDisplayName ?? actorEmail} removed role '${assignment.roleCode}' from ${targetUser.displayName ?? targetUser.email}.`,
      actorNameSnapshot: actorDisplayName ?? actorEmail,
    }
  );

  return { assignmentId, removed: true };
}

// ── Delete User Account ─────────────────────────────────────────────────────────

/**
 * Cyclomatic: 3 | Cognitive: 4
 * Permanently hard-deletes a user profile and all their role assignments.
 * Cannot delete own account (guarded at route level).
 */
export async function deleteUser(
  userId: string,
  orgId: string,
  actorUserId: string,
  actorEmail: string,
  actorDisplayName: string | null,
  ip: string,
): Promise<{ id: string; email: string; displayName: string | null } | Response> {
  const targetUser = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), eq(profiles.orgId, orgId)),
    columns: { id: true, email: true, displayName: true },
  });
  if (!targetUser) return notFound("User not found.");

  // Collect role assignment IDs for audit summary
  const assignments = await db
    .select({ id: userRoleAssignments.id, roleCode: roles.code })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
    .where(eq(userRoleAssignments.userId, userId));
  const roleSummary = assignments.map((a) => a.roleCode).join(", ") || "none";

  // Hard-delete: role assignments first (parent), then profile
  await db.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, userId));
  await db.delete(profiles).where(eq(profiles.id, userId));

  await auditAndActivity(
    {
      orgId,
      action: "user.deleted",
      actorUserId,
      actorEmail,
      actorIp: ip,
      entityType: "profile",
      entityId: userId,
      changeSummary: `Account deleted: ${targetUser.email} (roles: ${roleSummary}).`,
    },
    {
      summary: `${actorDisplayName ?? actorEmail} permanently removed account: ${targetUser.displayName ?? targetUser.email}.`,
      actorNameSnapshot: actorDisplayName ?? actorEmail,
    }
  );

  return { id: targetUser.id, email: targetUser.email, displayName: targetUser.displayName };
}
