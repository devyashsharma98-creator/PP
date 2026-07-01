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

export async function fetchVolunteers(filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<Array<{
    id: string;
    profileId: string;
    displayName?: string | null;
    email?: string | null;
    skills?: string[];
    joinedAt?: string | null;
    serviceSpanMonths?: number | null;
    totalHours: number;
    activityCount: number;
  }>>('/volunteers' + params);
}

export async function getVolunteer(id: string) {
  return fetchApi<{
    id: string;
    profileId: string;
    displayName?: string | null;
    email?: string | null;
    skills?: string[];
    availability?: Record<string, unknown>;
    joinedAt?: string | null;
    serviceSpanMonths?: number | null;
    emergencyContact?: string | null;
    notes?: string | null;
  }>(`/volunteers/${id}`);
}

export async function updateVolunteer(id: string, input: {
  skills?: string[];
  availability?: Record<string, unknown>;
  joinedAt?: string | null;
  serviceSpanMonths?: number | null;
  emergencyContact?: string | null;
  notes?: string | null;
}) {
  return fetchApi<{ id: string }>(`/volunteers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function fetchActivities(volunteerId: string, filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<Array<{
    id: string;
    volunteerId: string;
    activityType: string;
    description?: string | null;
    hoursLogged?: number | null;
    date: string;
    eventId?: string | null;
  }>>(`/volunteers/${volunteerId}/activities${params}`);
}

export async function createActivity(volunteerId: string, input: {
  activityType?: string; description?: string; hoursLogged?: number; date: string; eventId?: string | null;
}) {
  return fetchApi<{ id: string; activityType: string }>(`/volunteers/${volunteerId}/activities`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteActivity(activityId: string) {
  await fetch(`${API_BASE}/volunteers/activities/${activityId}`, { method: 'DELETE' });
}

export async function fetchVolunteerSummary() {
  return fetchApi<{ total: number; recentActivities: number }>('/volunteers/summary');
}

export async function enrollVolunteer(profileId: string) {
  return fetchApi<{ id: string }>('/volunteers', {
    method: 'POST',
    body: JSON.stringify({ profileId }),
  });
}
