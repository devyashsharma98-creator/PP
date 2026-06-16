const API_BASE = '/api/v1';

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (options?.method === 'DELETE') {
    if (res.ok) return {} as T;
    const data = await res.json();
    throw new Error(data.error?.message || 'API request failed');
  }
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || 'API request failed');
  return data.data as T;
}

export async function fetchMediaAssets(filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<Array<{
    id: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    bucket: string;
    category: string;
    altText?: string | null;
    altTextHi?: string | null;
    tags?: string[];
    width?: number | null;
    height?: number | null;
    uploadedByName?: string | null;
    createdAt: string;
  }>>('/media' + params);
}

export async function getMediaAsset(id: string) {
  return fetchApi<{
    id: string;
    orgId: string;
    uploadedBy: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    bucket: string;
    category: string;
    altText?: string | null;
    altTextHi?: string | null;
    tags?: string[];
    width?: number | null;
    height?: number | null;
    createdAt: string;
    updatedAt: string;
  }>(`/media/${id}`);
}

export async function createMediaAsset(input: {
  filename: string; storageKey: string; mimeType: string; sizeBytes: number;
  bucket?: string; category?: string; altText?: string; altTextHi?: string;
  tags?: string[]; width?: number; height?: number;
}) {
  return fetchApi<{ id: string }>('/media', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMediaAsset(id: string, input: {
  altText?: string; altTextHi?: string; tags?: string[]; category?: string;
}) {
  return fetchApi<{ id: string }>(`/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteMediaAsset(id: string) {
  await fetch(`${API_BASE}/media/${id}`, { method: 'DELETE' });
}

export async function fetchMediaSummary() {
  return fetchApi<{
    totalAssets: number; totalSizeBytes: number; categoryCounts: Record<string, number>;
  }>('/media/summary');
}
