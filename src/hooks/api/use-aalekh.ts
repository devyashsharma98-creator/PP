"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext, type AalekhArticle } from '@/context/AppContext';
import { dbToUiArticleStatus } from '@/lib/app/status-maps';

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

export function mapApiArticleToAalekh(item: Record<string, unknown>): AalekhArticle {
  return {
    ...item,
    status: (dbToUiArticleStatus[String(item.status ?? '')] ?? 'Draft') as AalekhArticle['status'],
    imageUrl: item.featuredImage as string | undefined,
  } as AalekhArticle;
}

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const data = await fetchApi<Array<Record<string, unknown>>>('/articles');
      return data.map(mapApiArticleToAalekh);
    },
    staleTime: 60000,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async (input: { title: string; excerpt: string; content: string; category: string; authorId?: string; sourceThreadId?: string }) => {
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

export interface ResubmitForm {
  title: string;
  content: string;
  summary: string;
  socialUrl: string;
  documentUrl: string;
  valuesChecklist: { rashtraPratham: boolean; culturallyGrounded: boolean; balancedTone: boolean; noDivisiveContent: boolean };
}

export function useResubmitArticle() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ResubmitForm }) => {
      await fetchApi(`/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          summary: form.summary,
          socialUrl: form.socialUrl || undefined,
          documentUrl: form.documentUrl || undefined,
          valuesChecklist: form.valuesChecklist,
        }),
      });
      return fetchApi<AalekhArticle>(`/articles/${id}/workflow`, {
        method: 'POST',
        body: JSON.stringify({ toStatus: 'pending_unit_head_review', valuesChecklist: form.valuesChecklist }),
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-articles'] });
      await refreshWorkspace();
    },
  });
}
