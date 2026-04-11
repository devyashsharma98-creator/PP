import { executeSqlQuery, sql } from '@/lib/neon/client';
import { AppError, NotFoundError, ValidationError } from '../errors/app-errors';
import type { IService, PaginatedResult } from '../services/types';

export interface Notification {
  id: string;
  org_id: string | null;
  recipient_user_id: string;
  actor_user_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  link_path: string | null;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface NotificationFilters {
  is_read?: boolean;
  kind?: string;
  page?: number;
  limit?: number;
}

export class NotificationService implements IService<NotificationFilters, PaginatedResult<Notification>> {
  async execute(filters: NotificationFilters): Promise<PaginatedResult<Notification>> {
    throw new Error('Use listForUser method with userId');
  }

  async list(userId: string, filters: NotificationFilters): Promise<PaginatedResult<Notification>> {
    return this.listForUser(userId, filters);
  }

  async listForUser(userId: string, filters: NotificationFilters): Promise<PaginatedResult<Notification>> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const whereParts = [`recipient_user_id = $1`];
    const values: unknown[] = [userId];

    if (filters.is_read !== undefined) {
      whereParts.push(`is_read = $${values.length + 1}`);
      values.push(filters.is_read);
    }
    if (filters.kind) {
      whereParts.push(`kind = $${values.length + 1}`);
      values.push(filters.kind);
    }

    const whereSql = `WHERE ${whereParts.join(' AND ')}`;
    const v = [...values];

    const countResult = await executeSqlQuery<{ count: string }>(`SELECT COUNT(*) as count FROM notifications ${whereSql}`, v);
    const total = parseInt(countResult?.[0]?.count ?? '0', 10);

    const rows = await executeSqlQuery<Notification>(`SELECT * FROM notifications ${whereSql} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, v);

    return {
      data: rows as Notification[],
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  async getById(id: string): Promise<Notification | null> {
    const rows = await sql`SELECT * FROM notifications WHERE id = ${id} LIMIT 1` as unknown as Notification[];
    return rows[0] ?? null;
  }

  async create(input: {
    recipient_user_id: string;
    kind: string;
    title: string;
    body?: string;
    link_path?: string;
    entity_type?: string;
    entity_id?: string;
  }): Promise<Notification> {
    if (!input.title?.trim()) {
      throw new ValidationError('Title is required');
    }

    const rows = await sql`
      INSERT INTO notifications (recipient_user_id, kind, title, body, link_path, entity_type, entity_id)
      VALUES (${input.recipient_user_id}, ${input.kind}, ${input.title}, ${input.body ?? null}, ${input.link_path ?? null}, ${input.entity_type ?? null}, ${input.entity_id ?? null})
      RETURNING *` as unknown as Notification[];

    if (!rows[0]) {
      throw new AppError(500, 'DB_ERROR', 'Failed to create notification');
    }

    return rows[0];
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.getById(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    const rows = await sql`
      UPDATE notifications SET is_read = true, read_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *` as unknown as Notification[];

    return rows[0];
  }

  async markAllAsRead(userId: string): Promise<void> {
    await sql`
      UPDATE notifications SET is_read = true, read_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
      WHERE recipient_user_id = ${userId} AND is_read = false
    `;
  }

  async delete(id: string): Promise<void> {
    const notification = await this.getById(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    await sql`DELETE FROM notifications WHERE id = ${id}`;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as total FROM notifications 
      WHERE recipient_user_id = ${userId} AND is_read = false
    ` as unknown as { total: number }[];
    return Number(result[0]?.total ?? 0);
  }
}
