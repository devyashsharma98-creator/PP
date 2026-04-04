import { sql } from '@/lib/neon/client';
import { AppError, NotFoundError, ValidationError } from '../errors/app-errors';
import type { IService, PaginatedResult } from '../services/types';

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
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles extends User {
  roles: string[];
}

interface UserFilters {
  is_active?: boolean;
  unit_id?: string;
  department_id?: string;
  role_code?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class UserService implements IService<UserFilters, PaginatedResult<UserWithRoles>> {
  async execute(filters: UserFilters): Promise<PaginatedResult<UserWithRoles>> {
    return this.list(filters);
  }

  async list(filters: UserFilters): Promise<PaginatedResult<UserWithRoles>> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (filters.is_active !== undefined) {
      whereParts.push(`p.is_active = $${values.length + 1}`);
      values.push(filters.is_active);
    }
    if (filters.unit_id) {
      whereParts.push(`u.id = $${values.length + 1}`);
      values.push(filters.unit_id);
    }
    if (filters.search) {
      whereParts.push(`(p.display_name ILIKE $${values.length + 1} OR p.email ILIKE $${values.length + 1})`);
      values.push(`%${filters.search}%`);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
    const joinSql = filters.unit_id ? `LEFT JOIN units u ON p.default_unit_id = u.id` : '';
    const v = [...values];

    const countResult = await (sql as any)(`SELECT COUNT(*) as count FROM profiles p ${joinSql} ${whereSql}`, v);
    const total = parseInt(countResult?.[0]?.count ?? '0', 10);

    const rows = await (sql as any)(`SELECT p.* FROM profiles p ${joinSql} ${whereSql} ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`, v);

    const userIds = rows.map((r: User) => r.id);
    const roleRows = userIds.length > 0
      ? await (sql as any)(`SELECT ur.user_id, r.code FROM user_role_assignments ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ANY($1) AND (ur.ends_at IS NULL OR ur.ends_at > now())`, [userIds]) as { user_id: string; code: string }[]
      : [];

    const rolesByUser = new Map<string, string[]>();
    for (const rr of roleRows) {
      if (!rolesByUser.has(rr.user_id)) rolesByUser.set(rr.user_id, []);
      rolesByUser.get(rr.user_id)!.push(rr.code);
    }

    const usersWithRoles: UserWithRoles[] = rows.map((row: User) => ({
      ...row,
      roles: rolesByUser.get(row.id) ?? [],
    }));

    return {
      data: usersWithRoles,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  async getById(id: string): Promise<UserWithRoles | null> {
    const rows = await sql`SELECT * FROM profiles WHERE id = ${id} LIMIT 1` as any[];
    if (!rows[0]) return null;

    const roleRows = await sql`
      SELECT r.code FROM user_role_assignments ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${id} AND (ur.ends_at IS NULL OR ur.ends_at > now())
    ` as unknown as { code: string }[];

    return { ...rows[0] as User, roles: roleRows.map(r => r.code) };
  }

  async create(input: {
    email: string;
    display_name: string;
    phone?: string;
    default_unit_id?: string;
    default_department_id?: string;
  }): Promise<User> {
    const rows = await sql`
      INSERT INTO profiles (email, display_name, phone, default_unit_id, default_department_id, preferred_language)
      VALUES (${input.email}, ${input.display_name}, ${input.phone ?? null}, ${input.default_unit_id ?? null}, ${input.default_department_id ?? null}, 'en')
      RETURNING *` as any[];

    if (!rows[0]) {
      throw new AppError(500, 'DB_ERROR', 'Failed to create user');
    }

    return rows[0] as User;
  }

  async update(id: string, input: Partial<User>): Promise<User> {
    const user = await this.getById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    const setParts: string[] = [];
    const values: unknown[] = [];

    if (input.display_name) {
      setParts.push(`display_name = $${values.length + 1}`);
      values.push(input.display_name);
    }
    if (input.phone !== undefined) {
      setParts.push(`phone = $${values.length + 1}`);
      values.push(input.phone);
    }
    if (input.default_unit_id) {
      setParts.push(`default_unit_id = $${values.length + 1}`);
      values.push(input.default_unit_id);
    }
    if (input.default_department_id) {
      setParts.push(`default_department_id = $${values.length + 1}`);
      values.push(input.default_department_id);
    }
    if (input.preferred_language) {
      setParts.push(`preferred_language = $${values.length + 1}`);
      values.push(input.preferred_language);
    }
    setParts.push(`updated_at = $${values.length + 1}`);
    values.push(new Date().toISOString());

    const whereIdx = values.length + 1;
    const rows = await (sql as any)(`UPDATE profiles SET ${setParts.join(', ')} WHERE id = $${whereIdx} RETURNING *`, [...values, id]);

    return rows[0] as User;
  }

  async assignRole(userId: string, roleId: string, scopeType: string = 'org'): Promise<void> {
    const roleRows = await sql`SELECT id FROM roles WHERE id = ${roleId}` as unknown as { id: string }[];
    if (!roleRows[0]) {
      throw new NotFoundError('Role', roleId);
    }

    await sql`
      INSERT INTO user_role_assignments (user_id, role_id, scope_type, is_primary)
      VALUES (${userId}, ${roleId}, ${scopeType}, true)
      ON CONFLICT DO NOTHING
    `;
  }

  async removeRole(userId: string, assignmentId: string): Promise<void> {
    await sql`DELETE FROM user_role_assignments WHERE id = ${assignmentId} AND user_id = ${userId}`;
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { is_active: false } as User);
  }
}
