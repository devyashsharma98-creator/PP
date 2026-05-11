import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function check() {
  console.log("=== SYSTEM CONNECTIVITY CHECK ===\n");

  // 1. Org
  const org = await sql`SELECT id, org_code, name FROM org_settings LIMIT 1`;
  console.log("1. ORG:", org[0] ? "✅ OK" : "❌ MISSING", org[0]);

  // 2. Roles
  const roles = await sql`SELECT code, name FROM roles ORDER BY priority`;
  console.log("2. ROLES:", roles.length === 9 ? "✅ OK (9 roles)" : `❌ Found ${roles.length}`, roles.map(r => r.code));

  // 3. Super Admin User
  const users = await sql`SELECT id, email, display_name, is_active, requires_password_change FROM profiles WHERE email LIKE '%demo.superadmin%'`;
  const superAdmin = users[0];
  console.log("3. SUPER ADMIN:", superAdmin ? "✅ OK" : "❌ MISSING", superAdmin);

  // 4. Super Admin Role Assignment
  if (superAdmin) {
    const userRoles = await sql`SELECT r.code, r.name, ura.is_primary, ura.scope_type
      FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE ura.user_id = ${superAdmin.id}`;
    const hasSuperAdmin = userRoles.some(r => r.code === 'super_admin');
    console.log("4. SUPER ADMIN ROLE:", hasSuperAdmin ? "✅ OK" : "❌ MISSING", userRoles);
  }

  // 5. Aayams
  const aayams = await sql`SELECT code, name FROM departments_or_aayams ORDER BY name`;
  console.log("5. AAYAMS:", aayams.length === 5 ? "✅ OK (5 aayams)" : `❌ Found ${aayams.length}`, aayams.map(a => a.code));

  // 6. Units
  const units = await sql`SELECT code, name FROM units LIMIT 3`;
  console.log("6. UNITS:", units.length > 0 ? "✅ OK" : "❌ MISSING", units.map(u => u.code));

  // 7. Events count
  const events = await sql`SELECT COUNT(*)::int as total FROM events`;
  console.log("7. EVENTS:", events[0]?.total ?? 0, "events");

  // 8. Articles count
  const articles = await sql`SELECT COUNT(*)::int as total FROM articles`;
  console.log("8. ARTICLES:", articles[0]?.total ?? 0, "articles");

  // 9. Onboarding users
  const onboarding = await sql`SELECT email, display_name, responsibility, is_active FROM profiles WHERE email LIKE '%@pragyapravah.in' ORDER BY display_name`;
  console.log("9. ONBOARDING USERS:", onboarding.length === 10 ? "✅ OK (10 users)" : `❌ Found ${onboarding.length}`);
  for (const u of onboarding) {
    const hasResp = u.responsibility ? "✅" : "⚠️";
    console.log(`   ${hasResp} ${u.display_name} → ${u.email}`);
  }

  // 10. Check if demo password hash works
  const bcrypt = await import("bcryptjs");
  const sa = await sql`SELECT password_hash FROM profiles WHERE email = 'demo.superadmin@example.com' LIMIT 1`;
  if (sa[0]) {
    const isMatch = await bcrypt.compare("Password123!", sa[0].password_hash);
    console.log("10. DEMO PASSWORD:", isMatch ? "✅ Valid" : "❌ INVALID HASH");
  }

  console.log("\n=== CHECK COMPLETE ===");
}

check().catch(err => {
  console.error("Check failed:", err);
  process.exit(1);
});
