"use client";

import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/v1';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  date?: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

async function fetchSearch(q: string): Promise<SearchResult[]> {
  if (q.length < 2) return [];
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json() as SearchResponse;
  return data.results ?? [];
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => fetchSearch(q),
    enabled: q.length >= 2,
    staleTime: 30000,
  });
}
