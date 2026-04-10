import "server-only";
import { sql } from "./repository";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  orgId: string;
  actorUserId: string;
  /** e.g. "event.created", "event.status_changed", "article.reviewed" */
  action: string;
  /** e.g. "event", "article", "poll", "prachar" */
  entityType: string;
  entityId: string | null;
  changeSummary?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

/**
 * Write an immutable audit log entry.
 * Failures are logged to console but never block the calling operation.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await sql`
      insert into public.audit_logs
        (org_id, actor_user_id, action, entity_type, entity_id, change_summary, payload)
      values (
        ${entry.orgId},
        ${entry.actorUserId},
        ${entry.action},
        ${entry.entityType},
        ${entry.entityId},
        ${JSON.stringify(entry.changeSummary ?? {})}::jsonb,
        ${JSON.stringify(entry.payload ?? {})}::jsonb
      )
    `;
  } catch (err) {
    console.error("[audit] writeAuditLog failed:", err);
  }
}

// ── Event status history ──────────────────────────────────────────────────────

/**
 * Write an event status transition record to event_status_history.
 *
 * This may fail if the event_status enum hasn't been extended to include
 * all workflow statuses yet. The audit_logs entry (written separately via
 * writeAuditLog) serves as a reliable fallback since it uses text columns.
 */
export async function writeEventStatusHistory(
  eventId: string,
  oldStatus: string | null,
  newStatus: string,
  changedBy: string,
  reason?: string | null,
): Promise<void> {
  try {
    await sql`
      insert into public.event_status_history
        (event_id, old_status, new_status, changed_by, reason)
      values (${eventId}, ${oldStatus}, ${newStatus}, ${changedBy}, ${reason ?? null})
    `;
  } catch (err) {
    // Expected failure path: event_status enum may not have all values yet.
    // The audit_logs entry covers this gap until the enum migration runs.
    console.error("[audit] writeEventStatusHistory failed (enum mismatch?):", err);
  }
}
