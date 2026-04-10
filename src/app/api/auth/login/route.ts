/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * Issues a signed JWT stored in an httpOnly session cookie.
 *
 * Success: { success: true, data: { userId, email, displayName, primaryRoleCode, effectiveRoleCodes, permissions } }
 * Error:   { success: false, error: { code, message } }
 */
import "server-only";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, userRoleAssignments } from "@/db/schema/index";
import { verifyPassword } from "@/lib/auth/password";
import { signJwt } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { setNeonSessionCookie } from "@/lib/neon/session";
import { resolvePermissions, getPrimaryRole } from "@/lib/permissions";
import { loginSchema } from "@/lib/validators/auth";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess, apiError, badRequest } from "@/lib/response";
import { writeAuditLog } from "@/lib/audit";
import type { RoleCode } from "@/lib/permissions/types";

export async function POST(req: NextRequest): Promise<Response> {
  // ── Rate limiting ───────────────────────────────────────────────────────────
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rateRes = withPublicRateLimit(ip);
  if (rateRes) return rateRes;

  // ── Parse + validate ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  }

  const { email, password } = parsed.data;

  // ── Load user ───────────────────────────────────────────────────────────────
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.email, email),
  });

  if (!profile || !profile.isActive) {
    // Constant-time delay prevents user enumeration
    await new Promise((r) => setTimeout(r, 200));
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  // ── Verify password ─────────────────────────────────────────────────────────
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
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  // ── Load active role assignments ────────────────────────────────────────────
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

  // Find primary assignment for scope context (unit/dept)
  const primaryAssignment =
    activeAssignments.find((a) => a.isPrimary) ?? activeAssignments[0];

  // ── Sign JWT + set cookie ───────────────────────────────────────────────────
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

  // Update lastLoginAt
  await db
    .update(profiles)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(profiles.id, profile.id));

  // ── Audit ───────────────────────────────────────────────────────────────────
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

  return apiSuccess({
    userId: profile.id,
    email: profile.email,
    displayName: profile.displayName ?? null,
    primaryRoleCode,
    effectiveRoleCodes,
    permissions,
  });
}
