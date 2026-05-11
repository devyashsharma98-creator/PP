import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function show() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                   ALL IDs IN THE SYSTEM                       ");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // 1. Org
  const orgs = await sql`SELECT id, org_code, name FROM org_settings`;
  console.log("🏛️  ORG SETTINGS");
  console.log("───────────────────────────────────────────────────────────────");
  for (const o of orgs) {
    console.log(`   ID:        ${o.id}`);
    console.log(`   Code:      ${o.org_code}`);
    console.log(`   Name:      ${o.name}`);
  }
  console.log();

  // 2. Roles
  const roles = await sql`SELECT id, code, name, priority FROM roles ORDER BY priority`;
  console.log("🛡️  ROLES (9 canonical)");
  console.log("───────────────────────────────────────────────────────────────");
  for (const r of roles) {
    console.log(`   ID:        ${r.id}`);
    console.log(`   Code:      ${r.code}`);
    console.log(`   Name:      ${r.name}`);
    console.log(`   Priority:  ${r.priority}`);
    console.log();
  }

  // 3. Units
  const units = await sql`SELECT id, code, name, unit_kind FROM units ORDER BY name`;
  console.log("🏢 UNITS");
  console.log("───────────────────────────────────────────────────────────────");
  for (const u of units) {
    console.log(`   ID:        ${u.id}`);
    console.log(`   Code:      ${u.code ?? "N/A"}`);
    console.log(`   Name:      ${u.name}`);
    console.log(`   Kind:      ${u.unit_kind}`);
    console.log();
  }

  // 4. Aayams / Departments
  const aayams = await sql`SELECT id, code, name, department_kind FROM departments_or_aayams ORDER BY name`;
  console.log("📐 AAYAMS / DEPARTMENTS");
  console.log("───────────────────────────────────────────────────────────────");
  for (const a of aayams) {
    console.log(`   ID:        ${a.id}`);
    console.log(`   Code:      ${a.code ?? "N/A"}`);
    console.log(`   Name:      ${a.name}`);
    console.log(`   Kind:      ${a.department_kind}`);
    console.log();
  }

  // 5. Users (Profiles)
  const users = await sql`SELECT id, email, display_name, is_active, responsibility FROM profiles ORDER BY display_name, email`;
  console.log("👥 USERS / PROFILES");
  console.log("───────────────────────────────────────────────────────────────");
  for (const u of users) {
    console.log(`   ID:           ${u.id}`);
    console.log(`   Name:         ${u.display_name ?? "N/A"}`);
    console.log(`   Email:        ${u.email}`);
    console.log(`   Active:       ${u.is_active}`);
    console.log(`   Responsibility: ${u.responsibility ?? "N/A"}`);
    console.log();
  }

  // 6. User Role Assignments
  const assignments = await sql`
    SELECT ura.id, p.display_name, p.email, r.code as role_code, ura.scope_type, ura.is_primary
    FROM user_role_assignments ura
    JOIN profiles p ON p.id = ura.user_id
    JOIN roles r ON r.id = ura.role_id
    ORDER BY p.display_name, r.code
  `;
  console.log("🔗 USER ROLE ASSIGNMENTS");
  console.log("───────────────────────────────────────────────────────────────");
  for (const a of assignments) {
    console.log(`   Assignment ID: ${a.id}`);
    console.log(`   User:          ${a.display_name ?? a.email}`);
    console.log(`   Role:          ${a.role_code}`);
    console.log(`   Scope:         ${a.scope_type}`);
    console.log(`   Primary:       ${a.is_primary}`);
    console.log();
  }

  // 7. Events
  const events = await sql`SELECT id, title, status, starts_at FROM events ORDER BY created_at DESC`;
  console.log("📅 EVENTS");
  console.log("───────────────────────────────────────────────────────────────");
  for (const e of events) {
    console.log(`   ID:        ${e.id}`);
    console.log(`   Title:     ${e.title}`);
    console.log(`   Status:    ${e.status}`);
    console.log(`   Date:      ${e.starts_at ?? "N/A"}`);
    console.log();
  }

  // 8. Articles
  const articles = await sql`SELECT id, title, status, created_at FROM articles ORDER BY created_at DESC LIMIT 10`;
  console.log("📰 ARTICLES (last 10)");
  console.log("───────────────────────────────────────────────────────────────");
  for (const a of articles) {
    console.log(`   ID:        ${a.id}`);
    console.log(`   Title:     ${a.title}`);
    console.log(`   Status:    ${a.status}`);
    console.log();
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                         END OF LIST                           ");
  console.log("═══════════════════════════════════════════════════════════════");
}

show().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
