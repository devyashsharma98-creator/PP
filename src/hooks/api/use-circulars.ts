"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/circulars';

export function useCirculars(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.circulars(filters as Record<string, unknown>),
    queryFn: () => api.fetchCirculars(filters),
  });
}

export function useCircular(id: string) {
  return useQuery({
    queryKey: queryKeys.circular(id),
    queryFn: () => api.getCircular(id),
    enabled: Boolean(id),
  });
}

export function useUnreadCirculars() {
  return useQuery({
    queryKey: queryKeys.unreadCirculars(),
    queryFn: () => api.fetchUnreadCount(),
    refetchInterval: 60000,
  });
}

export function useCreateCircular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string; titleHi?: string; body: string; bodyHi?: string;
      priority?: string; scope?: string; scopeEntityId?: string | null;
      publishedAt?: string | null; expiresAt?: string | null;
    }) => api.createCircular(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
    },
  });
}

export function useUpdateCircular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      api.updateCircular(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
    },
  });
}

export function useDeleteCircular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCircular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
    },
  });
}

export function useAcknowledgeCircular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.acknowledgeCircular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
      queryClient.invalidateQueries({ queryKey: ['circulars', 'unread-count'] });
    },
  });
}
