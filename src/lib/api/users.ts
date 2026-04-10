import type { CanonicalRoleCode } from "@/lib/app/contracts";
import { fetchApi } from "./events";

export interface UserRolePreview {
  code: CanonicalRoleCode;
  name: string;
  nameHi: string | null;
  isPrimary: boolean;
}

export interface UserRoleAssignment {
  id: string;
  roleCode: CanonicalRoleCode;
  roleName: string;
  roleNameHi: string | null;
  scopeType: "org" | "unit" | "department" | "event" | "article";
  unitId: string | null;
  departmentId: string | null;
  isPrimary: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt?: string;
}

export interface UserSummary {
  id: string;
  email: string | null;
  displayName: string | null;
  displayNameHi: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRolePreview[];
  primaryRoleCode: CanonicalRoleCode | null;
}

export interface UserDetail {
  id: string;
  email: string | null;
  displayName: string | null;
  displayNameHi: string | null;
  phone: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roleAssignments: UserRoleAssignment[];
}

export interface RoleOption {
  id: string;
  code: CanonicalRoleCode;
  name: string;
  nameHi: string | null;
  description: string | null;
  priority: string;
  isActive: boolean;
}

export interface AccessScopeOption {
  id: string;
  code: string;
  name: string;
  nameHi: string | null;
  unitKind?: string;
  departmentKind?: string;
  parentUnitId?: string | null;
  unitId?: string | null;
}

export interface AccessScopePayload {
  org: AccessScopeOption | null;
  units: AccessScopeOption[];
  departments: AccessScopeOption[];
}

export interface UserFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
  displayNameHi?: string;
  phone?: string;
  roleCode: CanonicalRoleCode;
}

export interface UpdateUserInput {
  displayName?: string;
  displayNameHi?: string;
  phone?: string;
  isActive?: boolean;
}

export interface AssignRoleInput {
  roleCode: CanonicalRoleCode;
  scopeType?: "org" | "unit" | "department" | "event" | "article";
  unitId?: string;
  departmentId?: string;
  scopeEntityId?: string;
  startsAt?: string;
  endsAt?: string;
  isPrimary?: boolean;
}

export interface UserRolesPayload {
  all: UserRoleAssignment[];
  active: UserRoleAssignment[];
}

export async function fetchUsers(filters?: UserFilters) {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.set("isActive", String(filters.isActive));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));

  const query = params.toString() ? `?${params}` : "";
  return fetchApi<UserSummary[]>(`/users${query}`);
}

export async function fetchUser(id: string) {
  return fetchApi<UserDetail>(`/users/${id}`);
}

export async function createUser(input: CreateUserInput) {
  return fetchApi<UserSummary>(`/users`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return fetchApi<UserSummary>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function fetchRoles() {
  return fetchApi<RoleOption[]>(`/users/roles`);
}

export async function fetchAccessScopes() {
  return fetchApi<AccessScopePayload>(`/users/scopes`);
}

export async function fetchUserRoles(userId: string) {
  return fetchApi<UserRolesPayload>(`/users/${userId}/roles`);
}

export async function assignRole(userId: string, input: AssignRoleInput) {
  return fetchApi<{ assignmentId?: string; roleCode: CanonicalRoleCode }>(`/users/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function removeRole(userId: string, assignmentId: string) {
  return fetchApi<{ assignmentId: string; removed: boolean }>(`/users/${userId}/roles`, {
    method: "DELETE",
    body: JSON.stringify({ assignmentId }),
  });
}
