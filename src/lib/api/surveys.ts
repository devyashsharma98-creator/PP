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

export async function fetchSurveys(filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<{ rows: Array<{
    id: string; title: string; titleHi?: string | null; description?: string | null;
    status: string; isPublic: boolean; questionCount: number; responseCount: number; createdAt: string;
  }>; total: number; page: number; limit: number }>('/surveys' + params);
}

export async function getSurvey(id: string) {
  return fetchApi<{
    id: string; orgId: string; title: string; titleHi?: string | null;
    description?: string | null; descriptionHi?: string | null; status: string;
    scope: string; scopeEntityId?: string | null; allowMultipleSubmissions: boolean;
    maxSubmissions?: number | null; opensAt?: string | null; closesAt?: string | null;
    isPublic: boolean; createdBy?: string | null; createdAt: string; updatedAt: string;
    questions: Array<{
      id: string; questionKey: string; label: string; labelHi?: string | null;
      questionType: string; isRequired: boolean; displayOrder: number; optionsJson?: string[] | null;
    }>;
  }>(`/surveys/${id}`);
}

export async function createSurvey(input: {
  title: string; titleHi?: string; description?: string; descriptionHi?: string;
  scope?: string; scopeEntityId?: string | null; allowMultipleSubmissions?: boolean;
  maxSubmissions?: number | null; opensAt?: string | null; closesAt?: string | null;
  isPublic?: boolean;
  questions?: Array<{
    questionKey: string; label: string; labelHi?: string; questionType: string;
    isRequired?: boolean; displayOrder?: number; options?: string[];
  }>;
}) {
  return fetchApi<{ id: string }>('/surveys', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSurvey(id: string, input: {
  title?: string; titleHi?: string; description?: string; descriptionHi?: string;
  scope?: string; scopeEntityId?: string | null; status?: string;
  allowMultipleSubmissions?: boolean; maxSubmissions?: number | null;
  opensAt?: string | null; closesAt?: string | null; isPublic?: boolean;
  questions?: Array<{
    questionKey: string; label: string; labelHi?: string; questionType: string;
    isRequired?: boolean; displayOrder?: number; options?: string[];
  }>;
}) {
  return fetchApi<{ id: string }>(`/surveys/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteSurvey(id: string) {
  await fetch(`${API_BASE}/surveys/${id}`, { method: 'DELETE' });
}

export async function submitSurvey(surveyId: string, input: {
  respondentName?: string; respondentEmail?: string; respondentPhone?: string;
  answers: Array<{ questionKey: string; value?: string | null }>;
}) {
  return fetchApi<{ id: string }>(`/surveys/${surveyId}/submit`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchResponses(surveyId: string) {
  return fetchApi<{ rows: Array<{
    id: string; surveyId: string; respondentName?: string | null;
    respondentEmail?: string | null; respondentPhone?: string | null;
    submittedBy?: string | null; submittedAt: string;
    answers: Array<{ id: string; questionKey: string; value?: string | null }>;
  }> }>(`/surveys/${surveyId}/responses`);
}

export async function fetchSurveySummary() {
  return fetchApi<{ total: number; published: number; totalResponses: number }>('/surveys/summary');
}
