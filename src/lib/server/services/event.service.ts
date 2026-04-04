import { sql } from '@/lib/neon/client';
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

    let conditions: string[] = [];
    if (filters.status) conditions.push(`status = '${filters.status}'`);
    if (filters.unit_id) conditions.push(`unit_id = '${filters.unit_id}'`);
    if (filters.from_date) conditions.push(`starts_at >= '${filters.from_date}'`);
    if (filters.to_date) conditions.push(`starts_at <= '${filters.to_date}'`);
    
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '';
    const query = whereClause 
      ? `SELECT * FROM events WHERE ${whereClause} ORDER BY starts_at DESC LIMIT ${limit} OFFSET ${offset}`
      : `SELECT * FROM events ORDER BY starts_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await sql`${query}` as any[];
    const total = rows.length;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await sql`SELECT * FROM events WHERE id = ${id} LIMIT 1` as any[];
    return rows[0] as Event | null;
  }

  async create(input: CreateEventInput): Promise<Event> {
    if (!input.title?.trim()) {
      throw new ValidationError('Title is required');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await sql`
      INSERT INTO events (title, description, starts_at, ends_at, unit_id, department_id, status)
      VALUES (${input.title}, ${input.description ?? null}, ${input.starts_at}, ${input.ends_at ?? null}, ${input.unit_id ?? null}, ${input.department_id ?? null}, 'draft')
      RETURNING *` as any[];

    if (!rows[0]) {
      throw new AppError(500, 'DB_ERROR', 'Failed to create event');
    }

    return rows[0] as Event;
  }

  async updateStatus(id: string, status: string): Promise<Event> {
    const event = await this.getById(id);
    if (!event) {
      throw new NotFoundError('Event', id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await sql`
      UPDATE events SET status = ${status}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *` as any[];

    return rows[0] as Event;
  }
}