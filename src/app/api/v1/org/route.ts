import "server-only";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { orgSettings } from "@/db/schema/index";
import { withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, badRequest, notFound, serverError } from "@/lib/response";
import { updateOrgSchema } from "@/lib/validators/org";
import { auditAndActivity } from "@/lib/audit";

export const GET = withPermission("canManageOrg", async (_req: NextRequest, ctx) => {
  const org = await db.query.orgSettings.findFirst({
    where: eq(orgSettings.id, ctx.session.orgId),
  });
  if (!org) return notFound("Org not found.");
  return apiSuccess({
    id: org.id,
    orgCode: org.orgCode,
    name: org.name,
    nameHi: org.nameHi,
    isActive: org.isActive,
    metadata: org.metadata,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  });
});

export const PATCH = withPermission("canManageOrg", async (req: NextRequest, ctx) => {
  let body; try { body = await req.json(); } catch { return badRequest("Invalid JSON body."); }
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");

  try {
    const org = await db.query.orgSettings.findFirst({
      where: eq(orgSettings.id, ctx.session.orgId),
    });
    if (!org) return notFound("Org not found.");

    await db
      .update(orgSettings)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(orgSettings.id, ctx.session.orgId));

    await auditAndActivity(
      {
        orgId: ctx.session.orgId,
        action: "org.updated",
        actorUserId: ctx.session.userId,
        actorEmail: ctx.session.email,
        entityType: "org_settings",
        entityId: ctx.session.orgId,
        payload: {
          before: { name: org.name, nameHi: org.nameHi },
          after: parsed.data,
        },
        changeSummary: "Organization settings updated.",
      },
      {
        summary: "Organization settings updated.",
        actorNameSnapshot: ctx.session.displayName ?? undefined,
      },
    );

    return apiSuccess({ id: ctx.session.orgId });
  } catch (err) {
    console.error("org PATCH error:", err);
    return serverError("Failed to update org settings.");
  }
});
