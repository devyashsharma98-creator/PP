import { neon } from "@neondatabase/serverless";
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

export const sql = new Proxy((() => {}) as ReturnType<typeof neon>, {
  get(_target, prop) {
    const conn = getSql();
    if (!conn) throw new Error("Database URL is not set. Define DATABASE_URL (preferred) or NEON_DATABASE_URL.");
    return Reflect.get(conn, prop);
  },
  apply(_target, _thisArg, args) {
    const conn = getSql();
    if (!conn) throw new Error("Database URL is not set. Define DATABASE_URL (preferred) or NEON_DATABASE_URL.");
    return conn(...args);
  },
});

export function getNeonConnection() {
  return getSql();
}
