"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/notifications';
import type { NotificationFilters } from '@/lib/api/notifications';

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: queryKeys.notifications(filters as Record<string, unknown>),
    queryFn: () => api.fetchNotifications(filters),
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.unreadCount(),
    queryFn: () => api.fetchUnreadCount(),
    enabled,
    refetchInterval: enabled ? 30000 : false, // Poll every 30 seconds only after auth is ready
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
    },
  });
}
