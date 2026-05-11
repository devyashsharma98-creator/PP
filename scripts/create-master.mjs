import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(DATABASE_URL);

async function create() {
  const email = "master@pragyapravah.in";
  const password = "Master@2025";
  const displayName = "Master Admin";

  // Check if exists
  const existing = await sql`SELECT id FROM profiles WHERE email = ${email}`;
  if (existing.length > 0) {
    console.log("Master account already exists. Updating password and role...");
  }

  const hash = await bcrypt.hash(password, 12);

  // Get org ID
  const orgRows = await sql`SELECT id FROM org_settings LIMIT 1`;
  const orgId = orgRows[0]?.id;
  if (!orgId) { console.error("Org not found"); process.exit(1); }

  // Get super_admin role ID
  const roleRows = await sql`SELECT id FROM roles WHERE code = 'super_admin'`;
  const roleId = roleRows[0]?.id;
  if (!roleId) { console.error("super_admin role not found"); process.exit(1); }

  // Get canonical unit ID
  const unitRows = await sql`SELECT id FROM units WHERE code = 'bhopal_vibhag_root' LIMIT 1`;
  const unitId = unitRows[0]?.id;

  let userId;
  if (existing.length > 0) {
    userId = existing[0].id;
    await sql`UPDATE profiles SET password_hash = ${hash}, is_active = true, requires_password_change = false WHERE id = ${userId}`;
    console.log("Updated password for existing master account.");
  } else {
    const insert = await sql`
      INSERT INTO profiles (org_id, email, password_hash, display_name, is_active, is_email_verified, requires_password_change)
      VALUES (${orgId}, ${email}, ${hash}, ${displayName}, true, true, false)
      RETURNING id
    `;
    userId = insert[0].id;
    console.log("Created master account:", userId);
  }

  // Remove existing assignments for this user
  await sql`DELETE FROM user_role_assignments WHERE user_id = ${userId}`;

  // Assign super_admin as primary
  await sql`
    INSERT INTO user_role_assignments (user_id, role_id, scope_type, org_id, unit_id, is_primary, starts_at)
    VALUES (${userId}, ${roleId}, 'org', ${orgId}, ${unitId ?? null}, true, now())
  `;

  console.log("\n=== MASTER ACCOUNT READY ===");
  console.log("Email:    ", email);
  console.log("Password: ", password);
  console.log("Role:     super_admin (org-wide)");
  console.log("Access:   EVERYTHING — no password change required on first login");
}

create().catch(console.error);
