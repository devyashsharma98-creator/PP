import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const rows = await sql`SELECT email, responsibility, responsibility_hi FROM profiles WHERE email LIKE '%@pragyapravah.in' ORDER BY display_name`;
console.table(rows);
