/**
 * GET /api/v1/roles
 *
 * Returns all canonical role definitions.
 * Requires authentication. Any role can view this.
 */
import "server-only";

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/with-auth";
import { db } from "@/db/client";
import { roles } from "@/db/schema/index";
import { eq } from "drizzle-orm";
import { apiSuccess } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest) => {
  const allRoles = await db
    .select({
      id: roles.id,
      code: roles.code,
      name: roles.name,
      nameHi: roles.nameHi,
      description: roles.description,
      priority: roles.priority,
    })
    .from(roles)
    .where(eq(roles.isActive, true))
    .orderBy(roles.priority);

  return apiSuccess(allRoles);
});
