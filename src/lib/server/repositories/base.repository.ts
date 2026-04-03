import { sql } from '@/lib/neon/client';
import { AppError } from '../errors/app-errors';

export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  abstract mapToEntity(row: unknown): T;

  async findById(id: string): Promise<T | null> {
    // @ts-expect-error - neon serverless types issue
    const rows = await sql`SELECT * FROM ${sql(this.tableName)} WHERE id = ${id} LIMIT 1`;
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
    // @ts-expect-error - neon serverless types issue
    const rows = await sql`SELECT * FROM ${sql(this.tableName)} ${whereClause ? sql(whereClause) : sql``}`;
    return rows.map(this.mapToEntity.bind(this));
  }

  async create(input: Partial<T>): Promise<T> {
    const keys = Object.keys(input);
    const values = Object.values(input);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    // @ts-expect-error - neon serverless types issue
    const rows = await sql`INSERT INTO ${sql(this.tableName)} (${sql(keys.join(', '))}) VALUES (${sql(placeholders)}) RETURNING *`;
    
    return this.mapToEntity(rows[0]);
  }

  async update(id: string, input: Partial<T>): Promise<T> {
    const keys = Object.keys(input);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    // @ts-expect-error - neon serverless types issue
    const rows = await sql`UPDATE ${sql(this.tableName)} SET ${sql(setClause)} WHERE id = $1 RETURNING *`;
    
    return this.mapToEntity(rows[0]);
  }

  async delete(id: string): Promise<void> {
    // @ts-expect-error - neon serverless types issue
    await sql`DELETE FROM ${sql(this.tableName)} WHERE id = ${id}`;
  }

  async softDelete(id: string): Promise<T> {
    return this.update(id, { is_deleted: true, deleted_at: new Date().toISOString() } as unknown as Partial<T>);
  }
}