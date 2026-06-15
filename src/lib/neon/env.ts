import "server-only";

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
}

export function requireDatabaseUrl() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("Database URL is not set. Define DATABASE_URL (preferred) or NEON_DATABASE_URL.");
  }
  return url;
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}
