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

export interface TaskboardProject {
  id: string;
  name: string;
  nameHi?: string | null;
  status: string;
  ownerUserId?: string | null;
  deadline?: string | null;
  taskCounts: { todo: number; in_progress: number; done: number; blocked: number };
}

export interface TaskboardData {
  projects: TaskboardProject[];
  unassignedTasks: Array<{
    id: string;
    projectId: string;
    projectName?: string;
    title: string;
    titleHi?: string | null;
    description?: string | null;
    assigneeUserId?: string | null;
    assigneeName?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    sortOrder: number;
    completedAt?: string | null;
    createdAt: string;
  }>;
}

export async function fetchTaskboard(): Promise<TaskboardData> {
  return fetchApi<TaskboardData>('/taskboard');
}

export async function fetchProjects(filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<Array<{
    id: string;
    name: string;
    nameHi?: string | null;
    description?: string | null;
    departmentId?: string | null;
    status: string;
    ownerUserId?: string | null;
    deadline?: string | null;
    taskCount: number;
    createdAt: string;
  }>>('/projects' + params);
}

export async function createProject(input: { name: string; nameHi?: string; description?: string; departmentId?: string; deadline?: string }) {
  return fetchApi<{ id: string; name: string; status: string; createdAt: string }>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProject(projectId: string, input: {
  name?: string; nameHi?: string; description?: string; status?: string;
  departmentId?: string; deadline?: string; metadata?: Record<string, unknown>;
}) {
  return fetchApi<{ id: string; name: string; status: string }>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteProject(projectId: string) {
  await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
}

export async function fetchTasks(projectId: string, filters?: Record<string, string>) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return fetchApi<Array<{
    id: string;
    projectId: string;
    title: string;
    titleHi?: string | null;
    description?: string | null;
    assigneeUserId?: string | null;
    assigneeName?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    sortOrder: number;
    completedAt?: string | null;
    createdAt: string;
  }>>(`/projects/${projectId}/tasks${params}`);
}

export async function createTask(projectId: string, input: {
  title: string; titleHi?: string; description?: string; assigneeUserId?: string;
  priority?: string; dueDate?: string;
}) {
  return fetchApi<{ id: string; title: string; status: string }>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTask(projectId: string, taskId: string, input: {
  title?: string; titleHi?: string; description?: string; status?: string;
  priority?: string; assigneeUserId?: string; dueDate?: string; sortOrder?: number;
  completedAt?: string | null; metadata?: Record<string, unknown>;
}) {
  return fetchApi<{ id: string; title: string; status: string }>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteTask(projectId: string, taskId: string) {
  await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
}
