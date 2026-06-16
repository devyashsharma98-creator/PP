import "server-only";

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/with-auth";
import { errorResponse } from "@/lib/server/api/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import {
  exportEventsCsv,
  exportArticlesCsv,
  exportUsersCsv,
} from "@/lib/server/services/export-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity");

  if (!entity || !["events", "articles", "users"].includes(entity)) {
    return errorResponse(400, "VALIDATION_ERROR", "Specify ?entity=events|articles|users");
  }

  try {
    const scopedAccess = resolveScopedAccess(ctx.session.assignments);
    let csv = "";

    if (entity === "events") {
      csv = await exportEventsCsv(ctx.session.orgId, scopedAccess, ctx.session.userId);
    } else if (entity === "articles") {
      csv = await exportArticlesCsv(ctx.session.orgId, scopedAccess, ctx.session.userId);
    } else if (entity === "users") {
      csv = await exportUsersCsv(ctx.session.orgId);
    }

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${entity}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return errorResponse(500, "INTERNAL_ERROR", "Export failed");
  }
});
