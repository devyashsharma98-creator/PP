import { neon } from '@neondatabase/serverless';
import { BaseRepository } from './base.repository';

export interface EventEntity {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  unit_id: string | null;
  department_id: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

export class EventRepository extends BaseRepository<EventEntity> {
  tableName = 'events';

  mapToEntity(row: any): EventEntity {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      status: row.status,
      unit_id: row.unit_id,
      department_id: row.department_id,
      location_id: row.location_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_deleted: row.is_deleted ?? false,
      deleted_at: row.deleted_at ?? null,
    };
  }

  async findWithRelations(id: string): Promise<EventEntity | null> {
    const { data } = await this.db
      .from('events')
      .select(`
        *,
        unit:units!events_unit_id_fkey(name),
        department:departments_or_aayams!events_department_id_fkey(name),
        location:locations!events_location_id_fkey(name, city)
      `)
      .eq('id', id)
      .single();

    return data ? this.mapToEntity(data) : null;
  }

  async findByUnit(unitId: string): Promise<EventEntity[]> {
    return this.findMany({ unit_id: unitId });
  }

  async findByStatus(status: string): Promise<EventEntity[]> {
    return this.findMany({ status });
  }

  async findActive(date?: string): Promise<EventEntity[]> {
    const filters: Record<string, unknown> = { is_deleted: false };
    if (date) {
      filters.starts_at = date;
    }
    return this.findMany(filters);
  }
}