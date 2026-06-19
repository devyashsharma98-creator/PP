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

export async function fetchAuditLogs(filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<{
    rows: Array<{
      id: string;
      orgId: string;
      action: string;
      actorUserId?: string | null;
      actorEmail?: string | null;
      actorIp?: string | null;
      entityType?: string | null;
      entityId?: string | null;
      payload?: Record<string, unknown> | null;
      changeSummary?: string | null;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }>(`/audit-logs${params}`);
}
