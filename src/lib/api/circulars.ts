const API_BASE = '/api/v1';

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || 'API request failed');
  return data.data as T;
}

export async function fetchCirculars(filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<Array<{
    id: string;
    title: string;
    titleHi?: string | null;
    body: string;
    bodyHi?: string | null;
    priority: string;
    scope: string;
    authorName?: string | null;
    publishedAt?: string | null;
    expiresAt?: string | null;
    readAt?: string | null;
    createdAt: string;
  }>>('/circulars' + params);
}

export async function fetchUnreadCount() {
  return fetchApi<{ count: number }>('/circulars/unread-count');
}

export async function getCircular(id: string) {
  return fetchApi<{
    id: string;
    orgId: string;
    title: string;
    titleHi?: string | null;
    body: string;
    bodyHi?: string | null;
    priority: string;
    scope: string;
    scopeEntityId?: string | null;
    authorId: string;
    authorName?: string | null;
    publishedAt?: string | null;
    expiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }>(`/circulars/${id}`);
}

export async function createCircular(input: {
  title: string; titleHi?: string; body: string; bodyHi?: string;
  priority?: string; scope?: string; scopeEntityId?: string | null;
  publishedAt?: string | null; expiresAt?: string | null;
}) {
  return fetchApi<{ id: string; title: string; priority: string }>('/circulars', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCircular(id: string, input: {
  title?: string; titleHi?: string; body?: string; bodyHi?: string;
  priority?: string; scope?: string; scopeEntityId?: string | null;
  publishedAt?: string | null; expiresAt?: string | null;
}) {
  return fetchApi<{ id: string; title: string }>(`/circulars/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteCircular(id: string) {
  await fetch(`${API_BASE}/circulars/${id}`, { method: 'DELETE' });
}

export async function acknowledgeCircular(id: string) {
  return fetchApi<{ readAt: string }>(`/circulars/${id}/acknowledge`, { method: 'POST' });
}
