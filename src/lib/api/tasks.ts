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
  /** False when the project is visible only because a task in it is assigned to you. */
  canManage: boolean;
  taskCounts: { todo: number; in_progress: number; done: number; blocked: number };
}

export interface TaskCapabilities {
  canEditDetails: boolean;
  canChangeStatus: boolean;
  canReassign: boolean;
  canDelete: boolean;
}

export interface MyTask {
  id: string;
  projectId: string;
  projectName: string;
  projectNameHi?: string | null;
  title: string;
  titleHi?: string | null;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  capabilities?: TaskCapabilities;
}

export interface TaskboardData {
  projects: TaskboardProject[];
  myTasks: MyTask[];
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

export interface RemoveProjectResult {
  projectId: string;
  mode: 'archived' | 'deleted';
  affectedTasks: number;
}

/**
 * Archives by default. Permanent deletion must name the exact number of tasks it
 * will destroy; the server answers 409 if that count is stale or missing.
 */
export async function removeProject(
  projectId: string,
  options: { hardDelete?: boolean; expectedTaskCount?: number } = {},
): Promise<RemoveProjectResult> {
  const qs = new URLSearchParams();
  if (options.hardDelete) qs.set('hardDelete', 'true');
  if (options.expectedTaskCount !== undefined) {
    qs.set('expectedTaskCount', String(options.expectedTaskCount));
  }
  const query = qs.toString();
  return fetchApi<RemoveProjectResult>(
    '/projects/' + projectId + (query ? '?' + query : ''),
    { method: 'DELETE' },
  );
}

/** Back-compatible alias — archives the project rather than destroying it. */
export async function deleteProject(projectId: string) {
  return removeProject(projectId);
}

export async function fetchMyTasks(filters: { status?: string; search?: string } = {}): Promise<MyTask[]> {
  const qs = new URLSearchParams();
  if (filters.status) qs.set('status', filters.status);
  if (filters.search) qs.set('search', filters.search);
  const query = qs.toString();
  return fetchApi<MyTask[]>('/tasks/mine' + (query ? '?' + query : ''));
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
    capabilities?: TaskCapabilities;
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
  priority?: string;
  // null clears the field; undefined leaves it untouched.
  assigneeUserId?: string | null; dueDate?: string | null; sortOrder?: number;
  completedAt?: string | null; metadata?: Record<string, unknown>;
}) {
  return fetchApi<{ id: string; title: string; status: string }>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteTask(projectId: string, taskId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
  // A refused delete used to resolve silently, leaving the card on screen with
  // no explanation.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'The task could not be deleted.');
  }
}
