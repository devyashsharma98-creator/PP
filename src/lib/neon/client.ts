import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "NEON_DATABASE_URL is not set. Add it to your .env.local file.",
  );
}

export const sql = neon(connectionString);

export function getNeonConnection() {
  return sql;
}
