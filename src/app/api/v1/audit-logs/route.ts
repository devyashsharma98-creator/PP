import "server-only";
import { NextRequest } from "next/server";
import { withPermission, getClientIp } from "@/lib/middleware/with-auth";
import { withApiRateLimit } from "@/lib/middleware/rate-limit";
import { badRequest, parsePagination } from "@/lib/response";
import { listAuditLogsQuerySchema } from "@/lib/validators/audit-logs";
import * as auditLogService from "@/lib/server/services/audit-log-service";

export const GET = withPermission("canViewAuditLogs", async (req: NextRequest, ctx) => {
  const ip = getClientIp(req); const rateRes = withApiRateLimit(ip); if (rateRes) return rateRes;
  const url = new URL(req.url);
  const q = listAuditLogsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!q.success) return badRequest(q.error.errors[0]?.message ?? "Invalid query.");
  const { page, limit, offset } = parsePagination(url.searchParams, { page: q.data.page, limit: q.data.limit });
  const result = await auditLogService.listAuditLogs(q.data, ctx.session.orgId);
  if (!result.ok) return result.response;
  return Response.json({ success: true, data: { rows: result.data.rows, total: result.data.total, page, limit } });
});
