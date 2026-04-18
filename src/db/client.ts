/**
 * Pragya Pravah — Drizzle ORM + Neon Serverless Client
 *
 * Uses @neondatabase/serverless HTTP driver, which works in both
 * Node.js (API routes) and edge runtimes (Cloudflare Workers).
 */
import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema/index";
import { getDatabaseUrl } from "@/lib/neon/env";

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  throw new Error(
    "Database URL is not set. Set DATABASE_URL (preferred) or NEON_DATABASE_URL in the server environment.",
  );
}

const sql = neon(databaseUrl);

/** Drizzle DB instance. Import this everywhere you need DB access. */
export const db = drizzle(sql, { schema });

export type DB = typeof db;
