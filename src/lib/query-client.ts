"use client";

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export { queryClient as default }; 

export const queryKeys = {
  events: (filters?: Record<string, unknown>) => ['events', filters] as const,
  event: (id: string) => ['event', id] as const,
  articles: (filters?: Record<string, unknown>) => ['articles', filters] as const,
  article: (id: string) => ['article', id] as const,
  users: (filters?: Record<string, unknown>) => ['users', filters] as const,
  user: (id: string) => ['user', id] as const,
  notifications: (filters?: Record<string, unknown>) => ['notifications', filters] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
  overview: () => ['app', 'overview'] as const,
};
