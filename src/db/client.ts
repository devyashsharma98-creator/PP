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

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const sql = neon(process.env.DATABASE_URL);

/** Drizzle DB instance. Import this everywhere you need DB access. */
export const db = drizzle(sql, { schema });

export type DB = typeof db;
