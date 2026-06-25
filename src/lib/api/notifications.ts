import { fetchApi } from './events';

export interface NotificationMetadata {
  link_path?: string;
  actor_user_id?: string;
  body?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  orgId: string;
  recipientUserId: string;
  kind: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata: NotificationMetadata | null;
  createdAt: string;
}

const NOTIFICATION_ROUTE_BY_KIND: Record<string, string> = {
  event_status_change: "/calendar",
  registration_received: "/calendar",
  article_status_change: "/aalekh",
  review_assigned: "/aalekh",
  review_completed: "/aalekh",
  poll_finalized: "/vimarsh",
  mention: "/prachar",
  system: "/dashboard",
};

export function resolveNotificationLink(n: Notification): string | null {
  if (n.metadata?.link_path) return n.metadata.link_path;
  return NOTIFICATION_ROUTE_BY_KIND[n.kind] ?? null;
}

export interface NotificationFilters {
  is_read?: boolean;
  kind?: string;
  page?: number;
  limit?: number;
}

export async function fetchNotifications(filters?: NotificationFilters) {
  const params = new URLSearchParams();
  if (filters?.is_read !== undefined) params.set('is_read', String(filters.is_read));
  if (filters?.kind) params.set('kind', filters.kind);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  
  const query = params.toString() ? `?${params}` : '';
  return fetchApi<Notification[]>(`/notifications${query}`);
}

export async function markNotificationRead(id: string) {
  return fetchApi<Notification>(`/notifications/${id}/read`, {
    method: 'POST',
  });
}

export async function markAllNotificationsRead() {
  return fetchApi<{ success: boolean }>('/notifications', {
    method: 'PATCH',
    body: JSON.stringify({ mark_all_read: true }),
  });
}

export async function fetchUnreadCount() {
  const result = await fetchApi<{ unread_count: number }>('/notifications/unread-count');
  return result.unread_count;
}