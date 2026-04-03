import { neon } from "@neondatabase/serverless";
import { requireDatabaseUrl } from "./env";

export const sql = neon(requireDatabaseUrl());

export function getNeonConnection() {
  return sql;
}
