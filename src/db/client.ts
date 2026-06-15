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
import { requireDatabaseUrl } from "@/lib/neon/env";

function createDb() {
  return drizzle(neon(requireDatabaseUrl()), { schema });
}

let dbInstance: ReturnType<typeof createDb> | null = null;

export function getDb() {
  dbInstance ??= createDb();
  return dbInstance;
}

/** Drizzle DB instance. Import this everywhere you need DB access. */
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type DB = typeof db;
