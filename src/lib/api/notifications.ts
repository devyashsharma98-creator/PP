import { fetchApi } from './events';

export interface Notification {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  link_path: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
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
  const notifications = await fetchNotifications({ is_read: false });
  return notifications.length;
}