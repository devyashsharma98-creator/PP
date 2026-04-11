import { executeSqlQuery, sql } from '@/lib/neon/client';
import { AppError, NotFoundError, ValidationError } from '../errors/app-errors';
import type { IService, PaginatedResult, CreateEventInput, EventFilters } from './types';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  unit_id: string | null;
  created_at: string;
  updated_at: string;
}

export class EventService implements IService<EventFilters, PaginatedResult<Event>> {
  async execute(filters: EventFilters): Promise<PaginatedResult<Event>> {
    return this.list(filters);
  }

  async list(filters: EventFilters): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (filters.status) {
      whereParts.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }
    if (filters.unit_id) {
      whereParts.push(`unit_id = $${values.length + 1}`);
      values.push(filters.unit_id);
    }
    if (filters.from_date) {
      whereParts.push(`starts_at >= $${values.length + 1}`);
      values.push(filters.from_date);
    }
    if (filters.to_date) {
      whereParts.push(`starts_at <= $${values.length + 1}`);
      values.push(filters.to_date);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
    const v = [...values];

    const countResult = await executeSqlQuery<{ count: string }>(`SELECT COUNT(*) as count FROM public.events ${whereSql}`, v);
    const total = parseInt(countResult?.[0]?.count ?? '0', 10);

    const rows = await executeSqlQuery<Event>(`SELECT * FROM public.events ${whereSql} ORDER BY starts_at DESC LIMIT ${limit} OFFSET ${offset}`, v);

    return {
      data: rows as Event[],
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  async getById(id: string): Promise<Event | null> {
    const rows = await sql`SELECT * FROM public.events WHERE id = ${id} LIMIT 1` as unknown as Event[];
    return rows[0] ?? null;
  }

  async create(input: CreateEventInput): Promise<Event> {
    if (!input.title?.trim()) {
      throw new ValidationError('Title is required');
    }

    const rows = await sql`
      INSERT INTO public.events (title, description, starts_at, ends_at, unit_id, department_id, status)
      VALUES (${input.title}, ${input.description ?? null}, ${input.starts_at}, ${input.ends_at ?? null}, ${input.unit_id ?? null}, ${input.department_id ?? null}, 'draft')
      RETURNING *` as unknown as Event[];

    if (!rows[0]) {
      throw new AppError(500, 'DB_ERROR', 'Failed to create event');
    }

    return rows[0];
  }

  async updateStatus(id: string, status: string): Promise<Event> {
    const event = await this.getById(id);
    if (!event) {
      throw new NotFoundError('Event', id);
    }

    const rows = await sql`
      UPDATE public.events SET status = ${status}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *` as unknown as Event[];

    return rows[0];
  }
}
