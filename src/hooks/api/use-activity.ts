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

export interface ActivityItem {
  id: string;
  action: string;
  actorUserId: string | null;
  actorNameSnapshot: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  createdAt: Date | string;
}

export function useActivity(mineOnly = true) {
  return useQuery({
    queryKey: ['activity', { mine: mineOnly }],
    queryFn: async () => {
      const data = await fetchApi<ActivityItem[]>(`/activity?mine=${mineOnly ? 'true' : 'false'}`);
      return data;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
