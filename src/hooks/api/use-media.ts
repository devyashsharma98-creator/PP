"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/media';

export function useMediaAssets(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.mediaAssets(filters as Record<string, unknown>),
    queryFn: () => api.fetchMediaAssets(filters),
  });
}

export function useMediaAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.mediaAsset(id),
    queryFn: () => api.getMediaAsset(id),
    enabled: Boolean(id),
  });
}

export function useCreateMediaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      filename: string; storageKey: string; mimeType: string; sizeBytes: number;
      bucket?: string; category?: string; altText?: string; altTextHi?: string;
      tags?: string[]; width?: number; height?: number;
    }) => api.createMediaAsset(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'summary'] });
    },
  });
}

export function useUpdateMediaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      api.updateMediaAsset(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMediaAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'summary'] });
    },
  });
}

export function useMediaSummary() {
  return useQuery({
    queryKey: queryKeys.mediaSummary(),
    queryFn: () => api.fetchMediaSummary(),
    staleTime: 60000,
  });
}
