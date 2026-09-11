/**
 * Points the Neon HTTP driver at a local proxy instead of Neon's servers, so
 * the database-backed suite can run against a disposable Postgres container.
 *
 * Opt-in via NEON_LOCAL_HTTP_PROXY=true, matching src/db/client.ts: against a
 * real Neon database this does nothing and the driver keeps using HTTPS.
 *
 * Loaded as a vitest setup file by vitest.integration.config.ts, and usable as
 * a `--import` preload for seed scripts. Contains no credentials: the
 * connection string still comes from DATABASE_URL.
 */
import { neonConfig } from "@neondatabase/serverless";

if (process.env.NEON_LOCAL_HTTP_PROXY === "true") {
  neonConfig.fetchEndpoint = (host, port) => `http://${host}:${port}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}
