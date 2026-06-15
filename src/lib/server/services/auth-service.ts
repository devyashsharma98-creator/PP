/**
 * Auth Service — Authentication and session management.
 */
import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles, userRoleAssignments } from "@/db/schema/index";
import { verifyPassword } from "@/lib/auth/password";
import { signJwt } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { setNeonSessionCookie } from "@/lib/neon/session";
import { resolvePermissions, getPrimaryRole } from "@/lib/permissions";
import { apiError } from "@/lib/response";
import { writeAuditLog } from "@/lib/audit";
import type { RoleCode } from "@/lib/permissions/types";

const MIN_LOGIN_FAILURE_DELAY_MS = Number(process.env.LOGIN_FAILURE_DELAY_MS ?? "250");

async function delayLoginFailure(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  const remaining = MIN_LOGIN_FAILURE_DELAY_MS - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

/**
 * Cyclomatic: 7 | Cognitive: 10
 * Authenticates a user, issues JWT, sets cookies, and writes audit trail.
 */
export async function authenticateUser(
  email: string,
  password: string,
  ip: string,
  authStartedAt: number
): Promise<
  | {
      userId: string;
      email: string;
      displayName: string | null;
      primaryRoleCode: RoleCode;
      effectiveRoleCodes: RoleCode[];
      permissions: ReturnType<typeof resolvePermissions>;
      requiresPasswordChange: boolean;
    }
  | Response
> {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.email, email),
  });

  if (!profile || !profile.isActive) {
    await delayLoginFailure(authStartedAt);
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  const isValid = await verifyPassword(password, profile.passwordHash);
  if (!isValid) {
    await writeAuditLog({
      orgId: profile.orgId,
      action: "auth.login_failed",
      actorEmail: email,
      actorIp: ip,
      entityType: "profile",
      entityId: profile.id,
      changeSummary: "Failed login attempt (wrong password).",
    });
    await delayLoginFailure(authStartedAt);
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  const now = new Date();
  const assignments = await db.query.userRoleAssignments.findMany({
    where: eq(userRoleAssignments.userId, profile.id),
    with: { role: true },
  });

  const activeAssignments = assignments.filter(
    (a) => a.startsAt <= now && (!a.endsAt || a.endsAt > now)
  );

  const effectiveRoleCodes: RoleCode[] = activeAssignments
    .map((a) => a.role?.code as RoleCode)
    .filter(Boolean);

  if (effectiveRoleCodes.length === 0) {
    effectiveRoleCodes.push("karyakarta");
  }

  const primaryRoleCode = getPrimaryRole(effectiveRoleCodes);
  const permissions = resolvePermissions(effectiveRoleCodes);

  const primaryAssignment = activeAssignments.find((a) => a.isPrimary) ?? activeAssignments[0];

  const token = await signJwt({
    userId: profile.id,
    email: profile.email,
    orgId: profile.orgId,
    orgCode: process.env.APP_ORG_CODE ?? "bhopal_vibhag",
    displayName: profile.displayName ?? null,
    primaryRoleCode,
    effectiveRoleCodes,
    unitId: primaryAssignment?.unitId ?? null,
    departmentId: primaryAssignment?.departmentId ?? null,
    assignments: activeAssignments.map((assignment) => ({
      roleCode: assignment.role?.code as RoleCode,
      scopeType: assignment.scopeType,
      orgId: assignment.orgId ?? profile.orgId,
      unitId: assignment.unitId ?? null,
      departmentId: assignment.departmentId ?? null,
      scopeEntityId: assignment.scopeEntityId ?? null,
      isPrimary: assignment.isPrimary,
    })),
  });

  await setSessionCookie(token);
  await setNeonSessionCookie(profile.id, profile.email);

  await db
    .update(profiles)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(profiles.id, profile.id));

  await writeAuditLog({
    orgId: profile.orgId,
    action: "auth.login_success",
    actorUserId: profile.id,
    actorEmail: profile.email,
    actorIp: ip,
    entityType: "profile",
    entityId: profile.id,
    changeSummary: `Login successful. Primary role: ${primaryRoleCode}.`,
  });

  return {
    userId: profile.id,
    email: profile.email,
    displayName: profile.displayName ?? null,
    primaryRoleCode,
    effectiveRoleCodes,
    permissions,
    requiresPasswordChange: profile.requiresPasswordChange,
  };
}
