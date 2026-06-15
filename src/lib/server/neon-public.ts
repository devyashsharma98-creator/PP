import { neon } from "@neondatabase/serverless";

let sqlClient: ReturnType<typeof neon> | null = null;

/**
 * Time: O(1) — singleton lazy init.
 * Space: O(1).
 */
export function getPublicSql(): ReturnType<typeof neon> | null {
  const url = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return null;
  sqlClient ??= neon(url);
  return sqlClient;
}

/**
 * Time: O(1) — regex test.
 * Space: O(1).
 */
export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Time: O(1).
 * Space: O(1).
 */
export function firstRow<T>(rows: unknown): T | undefined {
  return Array.isArray(rows) ? (rows[0] as T | undefined) : undefined;
}

/**
 * Time: O(1).
 * Space: O(1).
 */
export function firstReturnedRow(rows: unknown): unknown {
  return Array.isArray(rows) ? rows[0] : undefined;
}
