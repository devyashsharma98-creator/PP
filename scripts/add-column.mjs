import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

try {
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requires_password_change boolean DEFAULT false NOT NULL`;
  console.log("Column 'requires_password_change' added to profiles table.");
} catch (err) {
  console.error("Failed to add column:", err.message);
  process.exit(1);
}
