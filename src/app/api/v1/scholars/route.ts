import "server-only";
import { NextRequest } from "next/server";
import { eq, asc } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";
import { db } from "@/db/client";
import { scholars } from "@/db/schema/index";
import { weeklyAvailabilitySchema } from "@/lib/validators/scholars";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const rows = await db
    .select()
    .from(scholars)
    .where(eq(scholars.orgId, orgId))
    .orderBy(asc(scholars.sortOrder), asc(scholars.name));
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
      .insert(scholars)
      .values({
        orgId,
        slug,
        name,
        nameHi,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        expertise: Array.isArray(body.expertise) ? body.expertise as string[] : [],
        affiliation: body.affiliation ? String(body.affiliation) : null,
        affiliationHi: body.affiliationHi ? String(body.affiliationHi) : null,
        designation: body.designation ? String(body.designation) : null,
        city: body.city ? String(body.city) : null,
        bio: String(body.bio ?? ""),
        bioHi: String(body.bioHi ?? ""),
        availableFor: Array.isArray(body.availableFor) ? body.availableFor as string[] : [],
        availability: body.availability ? weeklyAvailabilitySchema.parse(body.availability) : {},
        photoUrl: body.photoUrl ? String(body.photoUrl) : null,
        isPublished: body.isPublished !== false,
        sortOrder: Number(body.sortOrder ?? 0),
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Insert failed";
    if (message.includes("duplicate key") || message.includes("unique")) {
      return badRequest("A scholar with this slug already exists.");
    }
    return serverError(message);
  }
});
