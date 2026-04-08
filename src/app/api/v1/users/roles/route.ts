import "server-only";

import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { roles } from "@/db/schema";
import { apiSuccess, serverError } from "@/lib/response";
import { getClientIp, withPermission } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";

export const GET = withPermission("canManageUsers", async (req: NextRequest) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  try {
    const rows = await db
      .select({
        id: roles.id,
        code: roles.code,
        name: roles.name,
        nameHi: roles.nameHi,
        description: roles.description,
        priority: roles.priority,
        isActive: roles.isActive,
      })
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(asc(roles.priority), asc(roles.name));

    return apiSuccess(rows);
  } catch (error) {
    console.error("Roles list error:", error);
    return serverError("Failed to fetch roles.");
  }
});
