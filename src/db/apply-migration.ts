/**
 * apply-migration.ts
 * Run this with: npx tsx src/db/apply-migration.ts
 * Uses neon HTTP driver (no TCP/TTY needed).
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "";

if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function run() {
  const migrationPath = join(
    __dirname,
    "migrations",
    "0000_cultured_juggernaut.sql"
  );
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  // Split on drizzle-kit statement separator
  const statements = migrationSQL
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`📦  Applying ${statements.length} SQL statements…\n`);

  let ok = 0;
  let skipped = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql.query(stmt);
      ok++;
      process.stdout.write(`  [${i + 1}/${statements.length}] ✓\r`);
    } catch (err: any) {
      // Ignore "already exists" errors (idempotent re-run)
      if (
        err?.message?.includes("already exists") ||
        err?.code === "42P07" || // duplicate_table
        err?.code === "42710"    // duplicate_object (enum)
      ) {
        skipped++;
        process.stdout.write(`  [${i + 1}/${statements.length}] ~ (skip: already exists)\r`);
      } else {
        console.error(
          `\n❌  Statement ${i + 1} failed:\n${stmt.slice(0, 200)}\n\nError: ${err.message}`
        );
        process.exit(1);
      }
    }
  }

  console.log(`\n\n✅  Done — ${ok} applied, ${skipped} skipped (already existed).`);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
