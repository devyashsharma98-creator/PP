import { sql } from '@/lib/neon/client';

type DatabaseRow = Record<string, unknown>;

export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  abstract mapToEntity(row: DatabaseRow): T;

  async findById(id: string): Promise<T | null> {
    const rows = await sql`SELECT * FROM ${this.tableName} WHERE id = ${id} LIMIT 1` as unknown as DatabaseRow[];
    return rows[0] ? this.mapToEntity(rows[0]) : null;
  }

  async findMany(filters: Record<string, unknown> = {}): Promise<T[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    
    let idx = 1;
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        conditions.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await sql`SELECT * FROM ${this.tableName} ${whereClause}` as unknown as DatabaseRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  async create(input: Partial<T>): Promise<T> {
    const keys = Object.keys(input);
    const values = Object.values(input);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const rows = await sql`INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *` as unknown as DatabaseRow[];
    
    return this.mapToEntity(rows[0]);
  }

  async update(id: string, input: Partial<T>): Promise<T> {
    const keys = Object.keys(input);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const rows = await sql`UPDATE ${this.tableName} SET ${setClause} WHERE id = $1 RETURNING *` as unknown as DatabaseRow[];
    
    return this.mapToEntity(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM ${this.tableName} WHERE id = ${id}`;
  }

  async softDelete(id: string): Promise<T> {
    return this.update(id, { is_deleted: true, deleted_at: new Date().toISOString() } as unknown as Partial<T>);
  }
}
