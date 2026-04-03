import { fetchApi } from './events';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  org_id: string | null;
  default_unit_id: string | null;
  default_department_id: string | null;
  preferred_language: string;
  is_active: boolean;
  roles: string[];
}

export interface UserFilters {
  is_active?: boolean;
  unit_id?: string;
  department_id?: string;
  role_code?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateUserInput {
  display_name?: string;
  phone?: string;
  default_unit_id?: string;
  default_department_id?: string;
  preferred_language?: string;
}

export async function fetchUsers(filters?: UserFilters) {
  const params = new URLSearchParams();
  if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));
  if (filters?.unit_id) params.set('unit_id', filters.unit_id);
  if (filters?.department_id) params.set('department_id', filters.department_id);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  
  const query = params.toString() ? `?${params}` : '';
  return fetchApi<User[]>(`/users${query}`);
}

export async function fetchUser(id: string) {
  return fetchApi<User>(`/users/${id}`);
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return fetchApi<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}