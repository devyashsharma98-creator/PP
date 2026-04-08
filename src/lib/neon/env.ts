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

export const isDatabaseConfigured = Boolean(getDatabaseUrl());

if (process.env.NODE_ENV === "production") {
  if (!isDatabaseConfigured) {
    console.warn("⚠️ DATABASE_URL not set in production. App actions will fail.");
  } else {
    // Only log the first few characters for security
    const url = getDatabaseUrl() || "";
    console.log(`✅ Database configuration detected (starts with ${url.slice(0, 15)}...)`);
  }
}

