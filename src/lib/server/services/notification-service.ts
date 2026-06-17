import "server-only";

import { db } from "@/db/client";
import { notifications } from "@/db/schema/index";
import { auditAndActivity } from "@/lib/audit";
import type { CreateNotificationInput, SendNotificationInput } from "@/lib/server/validation/notifications";

export async function sendNotification(input: CreateNotificationInput, orgId: string, actorUserId?: string) {
  const [notification] = await db
    .insert(notifications)
    .values({
      orgId,
      recipientUserId: input.recipient_user_id,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      entityType: input.entity_type ?? null,
      entityId: input.entity_id ?? null,
      metadata: {
        ...(input.payload ?? {}),
        ...(input.link_path ? { link_path: input.link_path } : {}),
        ...(actorUserId ? { actor_user_id: actorUserId } : {}),
        ...(input.body ? { body: input.body } : {}),
      },
    })
    .returning({ id: notifications.id });

  await auditAndActivity(
    { orgId, action: "notification.sent", actorUserId: actorUserId ?? "system", entityType: "notification", entityId: notification?.id ?? "" },
    { summary: `Notification "${input.title}" sent.`, actorNameSnapshot: undefined },
  );

  return notification;
}

export async function sendBulkNotifications(input: SendNotificationInput, orgId: string, actorUserId?: string) {
  const values = input.recipient_user_ids.map((userId) => ({
    orgId,
    recipientUserId: userId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    entityType: input.entity_type ?? null,
    entityId: input.entity_id ?? null,
    metadata: {
      ...(input.link_path ? { link_path: input.link_path } : {}),
      ...(actorUserId ? { actor_user_id: actorUserId } : {}),
    },
  }));

  const inserted = await db.insert(notifications).values(values).returning({ id: notifications.id });

  await auditAndActivity(
    { orgId, action: "notifications.bulk_sent", actorUserId: actorUserId ?? "system", entityType: "notification", entityId: "bulk" },
    { summary: `${inserted.length} notification(s) sent.`, actorNameSnapshot: undefined },
  );

  return inserted;
}
