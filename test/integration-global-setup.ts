/**
 * Prepares the database for the integration suite, starting from nothing.
 *
 * A fresh disposable Postgres has no tables and no reference data. This runs
 * once before the suite and:
 *
 *   1. pushes the Drizzle schema, but only to a database on this machine —
 *      it refuses to touch any remote host, so pointing DATABASE_URL at a shared
 *      Neon branch by mistake cannot rewrite its schema;
 *   2. inserts the nine canonical roles, which the schema treats as seeded
 *      reference data rather than something the app creates.
 *
 * Everything else a test needs (org, units, people, events) the test creates
 * for itself under random ids and deletes afterwards.
 *
 * Without DATABASE_URL this does nothing and the suites skip.
 */
import { execFileSync } from "node:child_process";
import { neon, neonConfig } from "@neondatabase/serverless";

import { ROLE_CODES, ROLE_PRIORITY } from "../src/lib/permissions/types";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);

function isLocal(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function titleCase(code: string): string {
  return code.split("_").map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ");
}

export default async function setup(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  if (process.env.NEON_LOCAL_HTTP_PROXY === "true") {
    neonConfig.fetchEndpoint = (host, port) => `http://${host}:${port}/sql`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.poolQueryViaFetch = true;
  }

  const sql = neon(url);

  // ── 1. Schema ─────────────────────────────────────────────────────────────
  // drizzle-kit speaks the Postgres wire protocol, not Neon's HTTP one, so it
  // needs the direct connection string.
  const direct = process.env.DATABASE_URL_UNPOOLED;

  if (direct && isLocal(direct)) {
    execFileSync("npx", ["drizzle-kit", "push", "--force"], {
      stdio: ["ignore", "ignore", "inherit"],
      env: { ...process.env, DATABASE_URL_UNPOOLED: direct },
      shell: process.platform === "win32",
    });
  } else {
    const [row] = (await sql`SELECT to_regclass('public.event_vritt') AS t`) as Array<{ t: string | null }>;
    if (!row?.t) {
      throw new Error(
        direct
          ? `Refusing to push schema to non-local host ${new URL(direct).hostname}. ` +
            "Integration tests create and push schema only on a disposable local database."
          : "The database has no schema. Set DATABASE_URL_UNPOOLED to the direct (non-HTTP) " +
            "connection string of a local disposable database; see test/README.md.",
      );
    }
  }

  // ── 2. Reference data ─────────────────────────────────────────────────────
  for (const code of ROLE_CODES) {
    await sql`
      INSERT INTO roles (code, name, priority, description)
      VALUES (${code}, ${titleCase(code)}, ${String(ROLE_PRIORITY[code])}, ${`${titleCase(code)} role`})
      ON CONFLICT (code) DO NOTHING
    `;
  }
}
