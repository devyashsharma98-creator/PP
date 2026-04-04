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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      LIMIT 1` as any[];
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