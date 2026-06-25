/**
 * POST /api/v1/library  — Add a curated text to the institutional E-Library.
 * Gated by canManageUsers (org_admin). Inserts into library_texts.
 */
import "server-only";

import { NextRequest } from "next/server";
import { eq, asc } from "drizzle-orm";

import { withAuth, withPermission } from "@/lib/middleware/with-auth";
import { apiSuccess, apiCreated, badRequest, serverError } from "@/lib/response";
import { db } from "@/db/client";
import { libraryTexts } from "@/db/schema/index";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const orgId = ctx.session.orgId;
  const rows = await db
    .select()
    .from(libraryTexts)
    .where(eq(libraryTexts.orgId, orgId))
    .orderBy(asc(libraryTexts.sortOrder), asc(libraryTexts.title));
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

  const slug = String(body.slug ?? body.title ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!slug) return badRequest("slug is required.");

  const title = String(body.title ?? "").trim();
  const titleHi = String(body.titleHi ?? "").trim();
  const author = String(body.author ?? "").trim();
  if (!title || !titleHi || !author) return badRequest("title, titleHi and author are required.");

  try {
    const [inserted] = await db
      .insert(libraryTexts)
      .values({
        orgId,
        slug,
        title,
        titleHi,
        author,
        category: String(body.category ?? "General").trim(),
        pages: Number(body.pages ?? 0),
        year: String(body.year ?? "").trim(),
        rating: Number(body.rating ?? 0),
        description: String(body.description ?? "").trim(),
        descriptionHi: String(body.descriptionHi ?? "").trim(),
        coverColor: String(body.coverColor ?? "from-amber-600 to-orange-700").trim(),
        readUrl: body.readUrl ? String(body.readUrl) : null,
        downloadUrl: body.downloadUrl ? String(body.downloadUrl) : null,
        isPublished: body.isPublished !== false,
        sortOrder: Number(body.sortOrder ?? 0),
      })
      .returning();
    return apiCreated(inserted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Insert failed";
    if (message.includes("duplicate key") || message.includes("unique")) {
      return badRequest("A library text with this slug already exists.");
    }
    return serverError(message);
  }
});
