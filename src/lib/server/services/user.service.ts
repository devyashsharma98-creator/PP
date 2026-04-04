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

    let conditions: string[] = [];
    if (filters.is_active !== undefined) conditions.push(`p.is_active = ${filters.is_active}`);
    if (filters.unit_id) conditions.push(`u.id = '${filters.unit_id}'`);
    if (filters.search) conditions.push(`(p.display_name ILIKE '%${filters.search}%' OR p.email ILIKE '%${filters.search}%')`);
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = whereClause 
      ? `SELECT p.* FROM profiles p LEFT JOIN units u ON p.default_unit_id = u.id ${whereClause} ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`
      : `SELECT * FROM profiles ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await sql`${query}` as any[];
    
    // Get roles for each user
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      rows.map(async (row) => {
        const roleRows = await sql`
          SELECT r.code FROM user_role_assignments ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ${row.id} AND (ur.ends_at IS NULL OR ur.ends_at > now())
        ` as unknown as { code: string }[];
        return { ...row as User, roles: roleRows.map(r => r.code) };
      })
    );

    return {
      data: usersWithRoles,
      pagination: {
        page,
        limit,
        total: usersWithRoles.length,
        hasMore: offset + limit < usersWithRoles.length,
      },
    };
  }

  async getById(id: string): Promise<UserWithRoles | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const updates: string[] = [];
    if (input.display_name) updates.push(`display_name = '${input.display_name}'`);
    if (input.phone !== undefined) updates.push(`phone = '${input.phone ?? null}'`);
    if (input.default_unit_id) updates.push(`default_unit_id = '${input.default_unit_id}'`);
    if (input.default_department_id) updates.push(`default_department_id = '${input.default_department_id}'`);
    if (input.preferred_language) updates.push(`preferred_language = '${input.preferred_language}'`);
    updates.push(`updated_at = '${new Date().toISOString()}'`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await sql`
      UPDATE profiles SET ${updates.join(', ')}
      WHERE id = ${id}
      RETURNING *` as any[];

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