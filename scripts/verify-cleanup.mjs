import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(DATABASE_URL);

async function verify() {
  console.log("=== CLEANUP VERIFICATION ===\n");

  const users = await sql`SELECT display_name, email, responsibility FROM profiles ORDER BY display_name`;
  console.log("👥 REMAINING USERS:", users.length);
  console.table(users);

  const units = await sql`SELECT code, name, unit_kind FROM units`;
  console.log("\n🏢 REMAINING UNITS:", units.length);
  console.table(units);

  const assignments = await sql`
    SELECT p.display_name, r.code as role_code, ura.scope_type
    FROM user_role_assignments ura
    JOIN profiles p ON p.id = ura.user_id
    JOIN roles r ON r.id = ura.role_id
    ORDER BY p.display_name
  `;
  console.log("\n🔗 ROLE ASSIGNMENTS:", assignments.length);
  console.table(assignments);
}

verify().catch(console.error);
