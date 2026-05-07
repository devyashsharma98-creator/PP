/**
 * POST /api/auth/setup-profile
 *
 * First-time profile setup for users created with requiresPasswordChange=true.
 * Validates current password, updates display name / phone, sets new password,
 * and clears the requiresPasswordChange flag.
 */
import "server-only";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles } from "@/db/schema/index";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { apiSuccess, apiError, badRequest, unauthorized } from "@/lib/response";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const setupProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(256).trim(),
  displayNameHi: z.string().max(256).trim().optional(),
  phone: z.string().max(24).optional(),
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized("Not authenticated.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = setupProfileSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  }

  const { displayName, displayNameHi, phone, currentPassword, newPassword } = parsed.data;

  // Load profile
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.userId),
  });

  if (!profile || !profile.isActive) {
    return apiError("UNAUTHORIZED", "Account not found or inactive.", 401);
  }

  if (!profile.requiresPasswordChange) {
    return badRequest("Profile setup is not required.");
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, profile.passwordHash);
  if (!isValid) {
    return apiError("INVALID_CREDENTIALS", "Current password is incorrect.", 401);
  }

  // Prevent reusing the same password
  const sameAsOld = await verifyPassword(newPassword, profile.passwordHash);
  if (sameAsOld) {
    return badRequest("New password must be different from the current password.");
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date();

  await db
    .update(profiles)
    .set({
      displayName,
      displayNameHi: displayNameHi ?? null,
      phone: phone ?? null,
      passwordHash: newHash,
      requiresPasswordChange: false,
      updatedAt: now,
    })
    .where(eq(profiles.id, profile.id));

  await writeAuditLog({
    orgId: profile.orgId,
    action: "auth.profile_setup_complete",
    actorUserId: profile.id,
    actorEmail: profile.email,
    entityType: "profile",
    entityId: profile.id,
    changeSummary: "User completed initial profile setup and changed password.",
  });

  return apiSuccess({
    userId: profile.id,
    displayName,
    requiresPasswordChange: false,
  });
}
