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

const statements = [
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'select'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'multiselect'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'textarea'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'number'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'email'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'rating'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'date'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'checkbox_group'`,
  `ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'radio_group'`,
  `ALTER TABLE event_form_questions ADD COLUMN IF NOT EXISTS options_json jsonb`,
];

for (const stmt of statements) {
  try {
    await sql.query(stmt);
    console.log(`✓ ${stmt}`);
  } catch (err) {
    console.error(`✗ ${stmt}: ${err.message}`);
  }
}

console.log("\nForm migration complete.");
