import { sql } from '@/lib/neon/client';
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

  mapToEntity(row: Record<string, unknown>): EventEntity {
    return {
      id: String(row.id ?? ''),
      title: String(row.title ?? ''),
      description: typeof row.description === 'string' ? row.description : null,
      starts_at: String(row.starts_at ?? ''),
      ends_at: typeof row.ends_at === 'string' ? row.ends_at : null,
      status: String(row.status ?? ''),
      unit_id: typeof row.unit_id === 'string' ? row.unit_id : null,
      department_id: typeof row.department_id === 'string' ? row.department_id : null,
      location_id: typeof row.location_id === 'string' ? row.location_id : null,
      created_at: String(row.created_at ?? ''),
      updated_at: String(row.updated_at ?? ''),
      is_deleted: typeof row.is_deleted === 'boolean' ? row.is_deleted : false,
      deleted_at: typeof row.deleted_at === 'string' ? row.deleted_at : null,
    };
  }

  async findWithRelations(id: string): Promise<EventEntity | null> {
    const rows = await sql`
      SELECT e.*, 
        u.name as unit_name, 
        d.name as department_name, 
        l.name as location_name, 
        l.city as location_city
      FROM events e
      LEFT JOIN units u ON e.unit_id = u.id
      LEFT JOIN departments_or_aayams d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.id = ${id}
      LIMIT 1` as unknown as Record<string, unknown>[];
    return rows[0] ? this.mapToEntity(rows[0]) : null;
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
