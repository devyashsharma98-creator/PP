/**
 * Pragya Pravah — Audit Log Helper
 *
 * Inserts into audit_logs synchronously on every state-changing operation.
 * Also appends to activity_stream for UI-visible activity feeds.
 */
import "server-only";

import { db } from "../db/client";
import { auditLogs, activityStream } from "../db/schema/index";

// ── UUID validation ──────────────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns the value if it's a valid UUID, otherwise returns undefined.
 * Prevents type errors when non-UUID strings are passed as entity IDs.
 */
function sanitizeUuid(value?: string): string | undefined {
  if (!value) return undefined;
  return UUID_REGEX.test(value) ? value : undefined;
}

export interface AuditEntry {
  orgId: string;
  action: string;           // e.g. "event.status_changed", "article.created"
  actorUserId?: string;
  actorEmail?: string;
  actorIp?: string;
  entityType?: string;      // "event" | "article" | "user" | ...
  entityId?: string;
  payload?: Record<string, unknown>;
  changeSummary?: string;
}

/**
 * Write an audit log entry. Fire-and-forget — errors are swallowed to avoid
 * breaking the main operation. In production, consider a dead-letter queue.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      orgId: entry.orgId,
      action: entry.action,
      actorUserId: sanitizeUuid(entry.actorUserId),
      actorEmail: entry.actorEmail,
      actorIp: entry.actorIp,
      entityType: entry.entityType,
      entityId: sanitizeUuid(entry.entityId),
      payload: entry.payload ?? null,
      changeSummary: entry.changeSummary,
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", { action: entry.action, entityType: entry.entityType, entityId: entry.entityId, err });
  }
}

/**
 * Write an activity stream entry (visible to org members in the activity feed).
 */
export async function writeActivity(entry: {
  orgId: string;
  action: string;
  actorUserId?: string;
  actorNameSnapshot?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  summary?: string;
}): Promise<void> {
  try {
    await db.insert(activityStream).values({
      orgId: entry.orgId,
      action: entry.action,
      actorUserId: sanitizeUuid(entry.actorUserId),
      actorNameSnapshot: entry.actorNameSnapshot,
      entityType: entry.entityType,
      entityId: sanitizeUuid(entry.entityId),
      payload: entry.payload ?? null,
      summary: entry.summary,
    });
  } catch (err) {
    console.error("[activity] Failed to write activity:", { action: entry.action, entityType: entry.entityType, entityId: entry.entityId, err });
  }
}

/**
 * Write both audit log and activity stream in parallel.
 * Use this for state-changing user actions.
 */
export async function auditAndActivity(
  audit: AuditEntry,
  activity: {
    summary: string;
    actorNameSnapshot?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  await Promise.all([
    writeAuditLog(audit),
    writeActivity({
      orgId: audit.orgId,
      action: audit.action,
      actorUserId: audit.actorUserId,
      actorNameSnapshot: activity.actorNameSnapshot,
      entityType: audit.entityType,
      entityId: audit.entityId,
      payload: activity.payload ?? audit.payload,
      summary: activity.summary,
    }),
  ]);
}
