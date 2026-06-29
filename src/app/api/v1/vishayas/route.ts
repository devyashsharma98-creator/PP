/**
 * /api/v1/vishayas
 *   GET  — list active vishayas for the org, with linked-content counts.
 *   POST — create a vishay (admin only).
 */
import "server-only";
import { NextRequest } from "next/server";
import { and, asc, eq, sql as dsql } from "drizzle-orm";

import { db } from "@/db/client";
import { vishayas, contentVishayaMap } from "@/db/schema/index";
import { withAuth, withRole } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";

  const rows = await db
    .select({
      id: vishayas.id,
      slug: vishayas.slug,
      nameEn: vishayas.nameEn,
      nameHi: vishayas.nameHi,
      description: vishayas.description,
      descriptionHi: vishayas.descriptionHi,
      parentVishayId: vishayas.parentVishayId,
      color: vishayas.color,
      icon: vishayas.icon,
      isActive: vishayas.isActive,
      sortOrder: vishayas.sortOrder,
    })
    .from(vishayas)
    .where(
      includeInactive
        ? eq(vishayas.orgId, orgId)
        : and(eq(vishayas.orgId, orgId), eq(vishayas.isActive, true)),
    )
    .orderBy(asc(vishayas.sortOrder), asc(vishayas.nameEn));

  // Linked-content counts per vishay (single grouped query).
  const counts = await db
    .select({
      vishayId: contentVishayaMap.vishayId,
      count: dsql<number>`count(*)::int`,
    })
    .from(contentVishayaMap)
    .where(eq(contentVishayaMap.orgId, orgId))
    .groupBy(contentVishayaMap.vishayId);

  const countByVishay = new Map(counts.map((c) => [c.vishayId, c.count]));

  const payload = rows.map((v) => ({
    ...v,
    contentCount: countByVishay.get(v.id) ?? 0,
  }));

  return apiSuccess(payload);
});

export const POST = withRole("org_admin", async (req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const nameEn = String(body.nameEn ?? "").trim();
  const nameHi = String(body.nameHi ?? "").trim();
  if (!nameEn || !nameHi) return badRequest("nameEn and nameHi are required.");

  const slug = (String(body.slug ?? "").trim() && slugify(String(body.slug))) || slugify(nameEn);
  if (!slug) return badRequest("Could not derive a slug from the name.");

  try {
    const [inserted] = await db
      .insert(vishayas)
      .values({
        orgId,
        slug,
        nameEn,
        nameHi,
        description: body.description ? String(body.description).trim() : null,
        descriptionHi: body.descriptionHi ? String(body.descriptionHi).trim() : null,
        parentVishayId: body.parentVishayId ? String(body.parentVishayId) : null,
        color: body.color ? String(body.color) : "slate",
        icon: body.icon ? String(body.icon) : "Hash",
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Insert failed";
    if (message.includes("duplicate key") || message.includes("unique")) {
      return badRequest("A vishay with this slug already exists.");
    }
    return serverError(message);
  }
});
