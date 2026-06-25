import { describe, it, expect } from "vitest";
import { resolveNotificationLink, type Notification } from "./notifications";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    orgId: "org1",
    recipientUserId: "u1",
    kind: "system",
    title: "Test",
    body: null,
    entityType: null,
    entityId: null,
    isRead: false,
    readAt: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("resolveNotificationLink", () => {
  it("returns metadata.link_path when present (highest priority)", () => {
    const n = makeNotification({
      kind: "event_status_change",
      metadata: { link_path: "/calendar?event=abc" },
    });
    expect(resolveNotificationLink(n)).toBe("/calendar?event=abc");
  });

  it("falls back to kind-based route when no link_path", () => {
    expect(resolveNotificationLink(makeNotification({ kind: "event_status_change" }))).toBe("/calendar");
    expect(resolveNotificationLink(makeNotification({ kind: "registration_received" }))).toBe("/calendar");
    expect(resolveNotificationLink(makeNotification({ kind: "article_status_change" }))).toBe("/aalekh");
    expect(resolveNotificationLink(makeNotification({ kind: "review_assigned" }))).toBe("/aalekh");
    expect(resolveNotificationLink(makeNotification({ kind: "review_completed" }))).toBe("/aalekh");
    expect(resolveNotificationLink(makeNotification({ kind: "poll_finalized" }))).toBe("/vimarsh");
    expect(resolveNotificationLink(makeNotification({ kind: "mention" }))).toBe("/prachar");
    expect(resolveNotificationLink(makeNotification({ kind: "system" }))).toBe("/dashboard");
  });

  it("returns null for unknown kinds with no link_path", () => {
    expect(resolveNotificationLink(makeNotification({ kind: "unknown_kind" }))).toBeNull();
  });

  it("returns null when metadata exists but has no link_path and kind is unknown", () => {
    const n = makeNotification({ kind: "unknown_kind", metadata: { body: "hi" } });
    expect(resolveNotificationLink(n)).toBeNull();
  });

  it("prefers metadata link_path over kind fallback", () => {
    const n = makeNotification({
      kind: "article_status_change",
      metadata: { link_path: "/aalekh/123" },
    });
    expect(resolveNotificationLink(n)).toBe("/aalekh/123");
  });
});
