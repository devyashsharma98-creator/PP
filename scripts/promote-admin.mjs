import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(DATABASE_URL);

async function promote() {
  const email = "dheerendrachaturvedi@pragyapravah.in";

  // Get user ID
  const userRows = await sql`SELECT id, display_name FROM profiles WHERE email = ${email}`;
  const user = userRows[0];
  if (!user) { console.error("User not found:", email); process.exit(1); }

  // Get super_admin role ID
  const roleRows = await sql`SELECT id, code FROM roles WHERE code = 'super_admin'`;
  const role = roleRows[0];
  if (!role) { console.error("super_admin role not found"); process.exit(1); }

  // Get org ID
  const orgRows = await sql`SELECT id FROM org_settings LIMIT 1`;
  const orgId = orgRows[0]?.id;
  if (!orgId) { console.error("Org not found"); process.exit(1); }

  // Get canonical unit ID
  const unitRows = await sql`SELECT id FROM units WHERE code = 'bhopal_vibhag_root' LIMIT 1`;
  const unitId = unitRows[0]?.id;

  console.log(`Promoting ${user.display_name} (${user.id}) to super_admin...`);

  // Make existing assignments non-primary
  await sql`UPDATE user_role_assignments SET is_primary = false WHERE user_id = ${user.id}`;

  // Insert super_admin assignment
  await sql`
    INSERT INTO user_role_assignments (
      user_id, role_id, scope_type, org_id, unit_id, is_primary, starts_at
    ) VALUES (
      ${user.id}, ${role.id}, 'org', ${orgId}, ${unitId ?? null}, true, now()
    )
  `;

  console.log(`✅ ${user.display_name} is now super_admin (org-wide).`);

  // Verify
  const verify = await sql`
    SELECT r.code, r.name, ura.scope_type, ura.is_primary
    FROM user_role_assignments ura
    JOIN roles r ON r.id = ura.role_id
    WHERE ura.user_id = ${user.id}
    ORDER BY ura.is_primary DESC
  `;
  console.log("\nCurrent roles:");
  console.table(verify);
}

promote().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
