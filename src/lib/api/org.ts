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

export async function fetchOrg() {
  return fetchApi<{
    id: string;
    orgCode: string;
    name: string;
    nameHi?: string | null;
    isActive: boolean;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  }>('/org');
}

export async function updateOrg(input: {
  name?: string;
  nameHi?: string;
  metadata?: Record<string, unknown>;
}) {
  return fetchApi<{ id: string }>('/org', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
