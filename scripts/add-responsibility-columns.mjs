import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(url);

try {
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS responsibility text`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS responsibility_hi text`;
  console.log("✅ Added responsibility and responsibility_hi columns to profiles");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
