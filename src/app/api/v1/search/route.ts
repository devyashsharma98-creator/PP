/**
 * Search across events, articles, and users.
 */
import "server-only";

import { NextRequest } from "next/server";

import { json, errorResponse } from "@/lib/server/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { resolveScopedAccess } from "@/lib/app/scope";
import { performSearch } from "@/lib/server/services/search-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type");

  if (!q || q.length < 2) {
    return errorResponse(400, "VALIDATION_ERROR", "Search query must be at least 2 characters");
  }

  try {
    const scopedAccess = resolveScopedAccess(ctx.session.assignments);
    const results = await performSearch(ctx.session.orgId, q, type, scopedAccess, ctx.session.userId);
    return json({ query: q, results, total: results.length });
  } catch (error) {
    console.error("Search error:", error);
    return errorResponse(500, "INTERNAL_ERROR", "Search failed");
  }
});
