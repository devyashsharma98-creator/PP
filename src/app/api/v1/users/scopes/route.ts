import "server-only";

import { NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { departmentsOrAayams, orgSettings, units } from "@/db/schema";
import { getClientIp, withPermission } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { apiSuccess } from "@/lib/response";

export const GET = withPermission("canManageUsers", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req);
  const rateRes = withApiRateLimit(ip);
  if (rateRes) return rateRes;

  const [org, unitRows, departmentRows] = await Promise.all([
    db
      .select({
        id: orgSettings.id,
        code: orgSettings.orgCode,
        name: orgSettings.name,
        nameHi: orgSettings.nameHi,
      })
      .from(orgSettings)
      .where(eq(orgSettings.id, ctx.session.orgId))
      .limit(1),
    db
      .select({
        id: units.id,
        code: units.code,
        name: units.name,
        nameHi: units.nameHi,
        unitKind: units.unitKind,
        parentUnitId: units.parentUnitId,
      })
      .from(units)
      .where(and(eq(units.orgId, ctx.session.orgId), eq(units.isActive, true)))
      .orderBy(asc(units.unitKind), asc(units.name)),
    db
      .select({
        id: departmentsOrAayams.id,
        code: departmentsOrAayams.code,
        name: departmentsOrAayams.name,
        nameHi: departmentsOrAayams.nameHi,
        departmentKind: departmentsOrAayams.departmentKind,
        unitId: departmentsOrAayams.unitId,
      })
      .from(departmentsOrAayams)
      .where(and(eq(departmentsOrAayams.orgId, ctx.session.orgId), eq(departmentsOrAayams.isActive, true)))
      .orderBy(asc(departmentsOrAayams.departmentKind), asc(departmentsOrAayams.name)),
  ]);

  return apiSuccess({
    org: org[0] ?? null,
    units: unitRows,
    departments: departmentRows,
  });
});
