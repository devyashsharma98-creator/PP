"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext, type AalekhArticle } from '@/context/AppContext';

const API_BASE = '/api/v1';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || 'API request failed');
  return data.data as T;
}

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      return fetchApi<AalekhArticle[]>('/articles');
    },
    staleTime: 60000,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async (input: { title: string; excerpt: string; content: string; category: string; authorId?: string }) => {
      return fetchApi<AalekhArticle>('/articles', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-articles'] });
      await refreshWorkspace();
    },
  });
}

export function useUpdateArticleStatus() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AalekhArticle['status'] }) => {
      return fetchApi<AalekhArticle>(`/articles/${id}/workflow`, {
        method: 'POST',
        body: JSON.stringify({ toStatus: status }),
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-articles'] });
      await refreshWorkspace();
    },
  });
}
