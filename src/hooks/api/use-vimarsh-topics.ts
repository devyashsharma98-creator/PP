"use client";

import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/v1';

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || 'API request failed');
  return data.data as T;
}

export interface VimarshTopicResource {
  id: string;
  topicId: string;
  title: string;
  titleHi: string | null;
  url: string;
  resourceType: string;
  sortOrder: number;
}

export interface VimarshTopicItem {
  id: string;
  title: string;
  titleHi: string | null;
  description: string | null;
  descriptionHi: string | null;
  group: string;
  sortOrder: number;
  resources: VimarshTopicResource[];
}

export interface VimarshTopicGroup {
  group: string;
  topics: VimarshTopicItem[];
}

export function useVimarshTopics() {
  return useQuery({
    queryKey: ['vimarsh-topics'],
    queryFn: async () => {
      const data = await fetchApi<VimarshTopicGroup[]>('/vimarsh/topics');
      return data;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
