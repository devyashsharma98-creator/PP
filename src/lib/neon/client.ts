import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getDatabaseUrl } from "./env";

let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    const url = getDatabaseUrl();
    if (!url) return null;
    _sql = neon(url);
  }
  return _sql;
}

function requireSql(): NeonQueryFunction<false, false> {
  const conn = getSql();
  if (!conn) throw new Error("Database URL is not set. Define DATABASE_URL (preferred) or NEON_DATABASE_URL.");
  return conn as NeonQueryFunction<false, false>;
}

// Lazy sql - only throws when actually called, not at module load time
export const sql = ((...args: Parameters<NeonQueryFunction<false, false>>) => {
  return requireSql()(...args);
}) as NeonQueryFunction<false, false>;

export function getNeonConnection() {
  return getSql();
}

type SqlExecutor = <T = Record<string, unknown>>(query: string, params?: unknown[]) => Promise<T[]>;

export function executeSqlQuery<T = Record<string, unknown>>(query: string, params: unknown[] = []) {
  const conn = requireSql() as NeonQueryFunction<false, false> & { query: SqlExecutor };
  return conn.query<T>(query, params);
}
