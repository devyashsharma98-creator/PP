"use client";

import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { dbToUiArticleStatus } from '@/lib/app/status-maps';
import { repairBrokenHindi } from '@/lib/useT';
import type { AalekhArticle } from '@/context/AppContext';

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

function mapApiArticleToAalekh(row: Record<string, unknown>): AalekhArticle {
  const publishedAt = row.published_at ?? row.created_at;
  const dateStr =
    publishedAt instanceof Date
      ? publishedAt.toISOString()
      : typeof publishedAt === 'string'
        ? publishedAt
        : '';
  let dateFormatted = dateStr || 'Date not set';
  try {
    if (dateStr) {
      const d = parseISO(dateStr);
      dateFormatted = format(d, 'yyyy-MM-dd');
    }
  } catch { /* keep raw */ }

  const statusVal = String(row.status ?? '');
  const mappedStatus = dbToUiArticleStatus[statusVal] || (statusVal === 'authorized_public' ? 'Published' : 'Draft');

  return {
    id: row.id as string,
    title: repairBrokenHindi(String(row.title ?? '') || ''),
    content: repairBrokenHindi(String(row.content ?? '') || ''),
    summary: repairBrokenHindi(String(row.summary ?? '') || ''),
    category: repairBrokenHindi(String(row.category ?? '') || ''),
    status: mappedStatus as AalekhArticle['status'],
    date: dateFormatted,
    author: repairBrokenHindi(String(row.author_name_snapshot ?? '') || 'Author'),
    socialUrl: row.social_url as string | undefined,
    documentUrl: row.document_url as string | null,
    latestReviewNotes: row.latest_review_notes as string | null,
    valuesChecklist: {
      rashtraPratham: Boolean((row.values_checklist as Record<string, unknown> | undefined)?.rashtraPratham),
      culturallyGrounded: Boolean((row.values_checklist as Record<string, unknown> | undefined)?.culturallyGrounded),
      balancedTone: Boolean((row.values_checklist as Record<string, unknown> | undefined)?.balancedTone),
      noDivisiveContent: Boolean((row.values_checklist as Record<string, unknown> | undefined)?.noDivisiveContent),
    },
  };
}

export function useDashboardArticles() {
  return useQuery({
    queryKey: ['dashboard-articles'],
    queryFn: async () => {
      const data = await fetchApi<Record<string, unknown>[]>('/articles?limit=100');
      return data.map(mapApiArticleToAalekh);
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
