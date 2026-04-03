import { neon } from '@neondatabase/serverless';
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
  private db = neon(process.env.DATABASE_URL!);

  async execute(filters: EventFilters): Promise<PaginatedResult<Event>> {
    return this.list(filters);
  }

  async list(filters: EventFilters): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = this.db.from('events').select('*', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.unit_id) {
      query = query.eq('unit_id', filters.unit_id);
    }
    if (filters.from_date) {
      query = query.gte('starts_at', filters.from_date);
    }
    if (filters.to_date) {
      query = query.lte('starts_at', filters.to_date);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1)
      .order('starts_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false,
      },
    };
  }

  async getById(id: string): Promise<Event | null> {
    const { data } = await this.db
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    return data as Event | null;
  }

  async create(input: CreateEventInput): Promise<Event> {
    if (!input.title?.trim()) {
      throw new ValidationError('Title is required');
    }

    const { data, error } = await this.db
      .from('events')
      .insert({
        title: input.title,
        description: input.description,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        unit_id: input.unit_id,
        department_id: input.department_id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return data as Event;
  }

  async updateStatus(id: string, status: string): Promise<Event> {
    const event = await this.getById(id);
    if (!event) {
      throw new NotFoundError('Event', id);
    }

    const { data, error } = await this.db
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'DB_ERROR', error.message);
    }

    return data as Event;
  }
}