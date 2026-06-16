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

export async function fetchConferences(filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<Array<{
    id: string;
    title: string;
    titleHi?: string | null;
    theme?: string | null;
    venue?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    status: string;
    departmentId?: string | null;
    unitId?: string | null;
    registrationEnabled: boolean;
    sessionCount: number;
    registrationCount: number;
    createdBy?: string | null;
    createdAt: string;
  }>>('/conferences' + params);
}

export async function getConference(id: string) {
  return fetchApi<{
    id: string;
    orgId: string;
    title: string;
    titleHi?: string | null;
    theme?: string | null;
    themeHi?: string | null;
    description?: string | null;
    descriptionHi?: string | null;
    venue?: string | null;
    venueHi?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    status: string;
    unitId?: string | null;
    departmentId?: string | null;
    locationId?: string | null;
    registrationEnabled: boolean;
    maxRegistrations?: number | null;
    metadata?: Record<string, unknown>;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
  }>(`/conferences/${id}`);
}

export async function createConference(input: {
  title: string; titleHi?: string; theme?: string; description?: string;
  venue?: string; startsAt?: string; endsAt?: string;
  unitId?: string; departmentId?: string; registrationEnabled?: boolean;
  maxRegistrations?: number;
}) {
  return fetchApi<{ id: string }>('/conferences', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateConference(id: string, input: {
  title?: string; titleHi?: string; theme?: string; themeHi?: string;
  description?: string; descriptionHi?: string; venue?: string; venueHi?: string;
  startsAt?: string; endsAt?: string; unitId?: string; departmentId?: string;
  locationId?: string; status?: string; registrationEnabled?: boolean;
  maxRegistrations?: number; metadata?: Record<string, unknown>;
}) {
  return fetchApi<{ id: string }>(`/conferences/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteConference(id: string) {
  await fetch(`${API_BASE}/conferences/${id}`, { method: 'DELETE' });
}

export async function fetchSessions(conferenceId: string) {
  return fetchApi<Array<{
    id: string;
    conferenceId: string;
    title: string;
    titleHi?: string | null;
    description?: string | null;
    sessionType: string;
    startsAt?: string | null;
    endsAt?: string | null;
    venue?: string | null;
    chairpersonName?: string | null;
    sortOrder: number;
    speakerCount: number;
  }>>(`/conferences/${conferenceId}/sessions`);
}

export async function getSession(conferenceId: string, sessionId: string) {
  return fetchApi<{
    id: string;
    conferenceId: string;
    title: string;
    titleHi?: string | null;
    description?: string | null;
    descriptionHi?: string | null;
    sessionType: string;
    startsAt?: string | null;
    endsAt?: string | null;
    venue?: string | null;
    venueHi?: string | null;
    chairpersonName?: string | null;
    chairpersonNameHi?: string | null;
    sortOrder: number;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>(`/conferences/${conferenceId}/sessions/${sessionId}`);
}

export async function createSession(conferenceId: string, input: {
  title: string; titleHi?: string; description?: string; sessionType?: string;
  startsAt?: string; endsAt?: string; venue?: string; chairpersonName?: string;
  sortOrder?: number;
}) {
  return fetchApi<{ id: string }>(`/conferences/${conferenceId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSession(conferenceId: string, sessionId: string, input: {
  title?: string; titleHi?: string; description?: string; descriptionHi?: string;
  sessionType?: string; startsAt?: string; endsAt?: string; venue?: string;
  venueHi?: string; chairpersonName?: string; chairpersonNameHi?: string;
  sortOrder?: number; metadata?: Record<string, unknown>;
}) {
  return fetchApi<{ id: string }>(`/conferences/${conferenceId}/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteSession(conferenceId: string, sessionId: string) {
  await fetch(`${API_BASE}/conferences/${conferenceId}/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function fetchSpeakers(conferenceId: string, sessionId: string) {
  return fetchApi<Array<{
    id: string;
    sessionId: string;
    profileId?: string | null;
    name: string;
    nameHi?: string | null;
    bio?: string | null;
    photoUrl?: string | null;
    topic?: string | null;
    affiliation?: string | null;
    sortOrder: number;
  }>>(`/conferences/${conferenceId}/sessions/${sessionId}/speakers`);
}

export async function createSpeaker(conferenceId: string, sessionId: string, input: {
  name: string; nameHi?: string; bio?: string; photoUrl?: string;
  topic?: string; affiliation?: string; profileId?: string | null; sortOrder?: number;
}) {
  return fetchApi<{ id: string }>(`/conferences/${conferenceId}/sessions/${sessionId}/speakers`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSpeaker(conferenceId: string, sessionId: string, speakerId: string, input: {
  name?: string; nameHi?: string; bio?: string; bioHi?: string;
  photoUrl?: string; topic?: string; topicHi?: string;
  affiliation?: string; affiliationHi?: string; sortOrder?: number;
}) {
  return fetchApi<{ id: string }>(`/conferences/${conferenceId}/sessions/${sessionId}/speakers/${speakerId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteSpeaker(conferenceId: string, sessionId: string, speakerId: string) {
  await fetch(`${API_BASE}/conferences/${conferenceId}/sessions/${sessionId}/speakers/${speakerId}`, { method: 'DELETE' });
}

export async function fetchRegistrations(conferenceId: string) {
  return fetchApi<Array<{
    id: string;
    conferenceId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    organization?: string | null;
    category: string;
    isAttended: boolean;
    notes?: string | null;
    submittedAt: string;
  }>>(`/conferences/${conferenceId}/registrations`);
}

export async function createRegistration(conferenceId: string, input: {
  name: string; email?: string; phone?: string; organization?: string;
  category?: string; notes?: string;
}) {
  return fetchApi<{ id: string }>(`/conferences/${conferenceId}/registrations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function markAttendance(conferenceId: string, registrationId: string, isAttended: boolean) {
  return fetchApi<{ id: string }>(`/conferences/${conferenceId}/registrations/${registrationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isAttended }),
  });
}
