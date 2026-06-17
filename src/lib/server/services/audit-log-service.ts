import "server-only";

import { and, eq, gte, lte, ilike, desc, count, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs } from "@/db/schema/index";
import { serverError } from "@/lib/response";
import type { ListAuditLogsQuery } from "@/lib/validators/audit-logs";

type Result<T> = { ok: true; data: T } | { ok: false; response: Response };

function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function fail(response: Response): Result<never> { return { ok: false, response }; }

export async function listAuditLogs(
  q: ListAuditLogsQuery,
  orgId: string,
) {
  try {
    const conditions: SQL<unknown>[] = [eq(auditLogs.orgId, orgId)];
    if (q.action) conditions.push(eq(auditLogs.action, q.action));
    if (q.entityType) conditions.push(eq(auditLogs.entityType, q.entityType));
    if (q.entityId) conditions.push(eq(auditLogs.entityId, q.entityId));
    if (q.actorUserId) conditions.push(eq(auditLogs.actorUserId, q.actorUserId));
    if (q.fromDate) conditions.push(gte(auditLogs.createdAt, new Date(q.fromDate)));
    if (q.toDate) conditions.push(lte(auditLogs.createdAt, new Date(q.toDate)));

    const where = and(...conditions);
    const [total] = await db.select({ count: count() }).from(auditLogs).where(where);

    const rows = await db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);

    return ok({ rows, total: total.count, page: q.page, limit: q.limit });
  } catch (err) {
    console.error("audit-log-service.listAuditLogs:", err);
    return fail(serverError("Failed to fetch audit logs."));
  }
}
