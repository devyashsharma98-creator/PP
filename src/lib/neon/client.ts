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

function requireSql(): NeonQueryFunction<boolean, boolean> {
  const conn = getSql();
  if (!conn) throw new Error("Database URL is not set. Define DATABASE_URL (preferred) or NEON_DATABASE_URL.");
  return conn;
}

export const sql: NeonQueryFunction<boolean, boolean> = ((...args: Parameters<NeonQueryFunction<boolean, boolean>>) => {
  return requireSql()(...args);
}) as NeonQueryFunction<boolean, boolean>;

// Forward property access to the real sql instance
const _handler: ProxyHandler<NeonQueryFunction<boolean, boolean>> = {
  get(_target, prop) {
    return Reflect.get(requireSql(), prop);
  },
};

Object.keys(requireSql() || {}).forEach((key) => {
  try {
    (sql as any)[key] = (requireSql() as any)[key];
  } catch {
    // ignore
  }
});

export function getNeonConnection() {
  return getSql();
}
