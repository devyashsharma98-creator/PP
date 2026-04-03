import type { ApiResponse } from '../server/api/response';

const API_BASE = '/api/v1';

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json() as ApiResponse<T>;
  
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'API request failed');
  }
  
  return data.data as T;
}

export interface EventFilters {
  status?: string;
  unit_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  unit_id: string | null;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  unit_id?: string;
  department_id?: string;
}

export async function fetchEvents(filters?: EventFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.unit_id) params.set('unit_id', filters.unit_id);
  if (filters?.from_date) params.set('from_date', filters.from_date);
  if (filters?.to_date) params.set('to_date', filters.to_date);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  
  const query = params.toString() ? `?${params}` : '';
  return fetchApi<Event[]>(`/events${query}`);
}

export async function fetchEvent(id: string) {
  return fetchApi<Event>(`/events/${id}`);
}

export async function createEvent(input: CreateEventInput) {
  return fetchApi<Event>('/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateEvent(id: string, input: Partial<CreateEventInput>) {
  return fetchApi<Event>(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteEvent(id: string) {
  return fetchApi<{ success: boolean }>(`/events/${id}`, {
    method: 'DELETE',
  });
}

export async function submitEventForReview(id: string) {
  return fetchApi<Event>(`/events/${id}/submit`, {
    method: 'POST',
  });
}

export async function publishEvent(id: string) {
  return fetchApi<Event>(`/events/${id}/publish`, {
    method: 'POST',
  });
}