import "server-only";
import { NextRequest } from "next/server";
import { eq, asc } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";
import { db } from "@/db/client";
import { campusUnits } from "@/db/schema/index";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const rows = await db
    .select()
    .from(campusUnits)
    .where(eq(campusUnits.orgId, orgId))
    .orderBy(asc(campusUnits.sortOrder), asc(campusUnits.name));
  return apiSuccess(rows);
});

export const POST = withPermission("canManageUsers", async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const slug = String(body.slug ?? "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!slug) return badRequest("slug is required.");
  const name = String(body.name ?? "").trim();
  const nameHi = String(body.nameHi ?? "").trim();
  if (!name || !nameHi) return badRequest("name and nameHi are required.");

  try {
    const [inserted] = await db
      .insert(campusUnits)
      .values({
        orgId,
        slug,
        name,
        nameHi,
        unitType: body.unitType ? String(body.unitType) : "College",
        city: body.city ? String(body.city) : null,
        state: body.state ? String(body.state) : null,
        coordinatorName: body.coordinatorName ? String(body.coordinatorName) : null,
        coordinatorNameHi: body.coordinatorNameHi ? String(body.coordinatorNameHi) : null,
        coordinatorEmail: body.coordinatorEmail ? String(body.coordinatorEmail) : null,
        coordinatorPhone: body.coordinatorPhone ? String(body.coordinatorPhone) : null,
        memberCount: Number(body.memberCount ?? 0),
        status: body.status ? String(body.status) : "Active",
        focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas as string[] : [],
        establishedYear: body.establishedYear ? String(body.establishedYear) : null,
        description: String(body.description ?? ""),
        descriptionHi: String(body.descriptionHi ?? ""),
        isPublished: body.isPublished !== false,
        sortOrder: Number(body.sortOrder ?? 0),
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Insert failed";
    if (message.includes("duplicate key") || message.includes("unique")) {
      return badRequest("A campus unit with this slug already exists.");
    }
    return serverError(message);
  }
});
