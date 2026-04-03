import { sql } from '@/lib/neon/client';
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

    let conditions: string[] = [`recipient_user_id = '${userId}'`];
    if (filters.is_read !== undefined) conditions.push(`is_read = ${filters.is_read}`);
    if (filters.kind) conditions.push(`kind = '${filters.kind}'`);
    
    const whereClause = conditions.join(' AND ');
    const query = `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`${query}`;
    
    // Get total unread count
    const unreadResult = await sql`
      SELECT COUNT(*) as total FROM notifications 
      WHERE recipient_user_id = ${userId} AND is_read = false
    ` as unknown as { total: number }[];
    const total = Number(unreadResult[0]?.total ?? 0);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`SELECT * FROM notifications WHERE id = ${id} LIMIT 1`;
    return rows[0] as Notification | null;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`
      INSERT INTO notifications (recipient_user_id, kind, title, body, link_path, entity_type, entity_id)
      VALUES (${input.recipient_user_id}, ${input.kind}, ${input.title}, ${input.body ?? null}, ${input.link_path ?? null}, ${input.entity_type ?? null}, ${input.entity_id ?? null})
      RETURNING *`;

    if (!rows[0]) {
      throw new AppError(500, 'DB_ERROR', 'Failed to create notification');
    }

    return rows[0] as Notification;
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.getById(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`
      UPDATE notifications SET is_read = true, read_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *`;

    return rows[0] as Notification;
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