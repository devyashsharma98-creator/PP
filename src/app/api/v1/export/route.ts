import "server-only";

import { NextRequest } from "next/server";
import { withAuth, getClientIp } from "@/lib/middleware/with-auth";
import { errorResponse } from "@/lib/server/api/response";
import { resolveScopedAccess } from "@/lib/app/scope";
import {
  buildExportAuditPayload,
  canExportEntity,
  normaliseExportEntity,
} from "@/lib/app/export-access";
import { writeAuditLog } from "@/lib/audit";
import {
  exportEventsCsv,
  exportArticlesCsv,
  exportMembersCsv,
  type ExportFilters,
  type ExportOutcome,
} from "@/lib/server/services/export-service";

export const GET = withAuth(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const entity = normaliseExportEntity(searchParams.get("entity"));

  if (!entity) {
    return errorResponse(400, "VALIDATION_ERROR", "Specify ?entity=events|articles|members");
  }

  const scopedAccess = resolveScopedAccess(ctx.session.assignments);

  const decision = canExportEntity(entity, {
    roleCodes: ctx.session.effectiveRoleCodes,
    scope: scopedAccess,
  });

  if (!decision.allowed) {
    // Refused exports are recorded too — an attempted member export is exactly
    // the thing an audit trail exists to show.
    await writeAuditLog({
      orgId: ctx.session.orgId,
      action: "export.denied",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: getClientIp(req),
      entityType: "export",
      payload: { entity, reason: decision.reason },
      changeSummary: `Export of ${entity} refused: ${decision.reason}`,
    });
    return errorResponse(403, "FORBIDDEN", decision.reason ?? "You may not export this data.");
  }

  const filters: ExportFilters = {
    status: searchParams.get("status") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };

  try {
    let outcome: ExportOutcome;

    if (entity === "events") {
      outcome = await exportEventsCsv(ctx.session.orgId, scopedAccess, ctx.session.userId, filters);
    } else if (entity === "articles") {
      outcome = await exportArticlesCsv(ctx.session.orgId, scopedAccess, ctx.session.userId, filters);
    } else {
      outcome = await exportMembersCsv(ctx.session.orgId, scopedAccess, filters);
    }

    // Records that an export happened, by whom, of what shape and how large —
    // and deliberately not what it contained.
    await writeAuditLog({
      orgId: ctx.session.orgId,
      action: "export.performed",
      actorUserId: ctx.session.userId,
      actorEmail: ctx.session.email,
      actorIp: getClientIp(req),
      entityType: "export",
      payload: buildExportAuditPayload({
        entity,
        rowCount: outcome.rowCount,
        filters: { ...filters },
        orgWide: scopedAccess.orgWide,
        truncated: outcome.truncated,
      }),
      changeSummary: `Exported ${outcome.rowCount} ${entity} record(s).`,
    });

    const headers: Record<string, string> = {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}-${Date.now()}.csv"`,
      "X-Export-Row-Count": String(outcome.rowCount),
    };
    // The caller is told when a ceiling was reached instead of receiving a
    // quietly short file.
    if (outcome.truncated) headers["X-Export-Truncated"] = "true";

    return new Response(outcome.csv, { status: 200, headers });
  } catch (error) {
    console.error("Export error:", error);
    return errorResponse(500, "INTERNAL_ERROR", "Export failed");
  }
});
