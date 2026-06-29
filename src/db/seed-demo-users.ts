/**
 * src/db/seed-demo-users.ts
 * Creates one demo user per designation (role) with a shared demo password and
 * a primary role assignment, so the login page can offer one-click demo logins.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-demo-users.ts
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../lib/auth/dev-quick-fill";

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const ORG_CODE = process.env.APP_ORG_CODE ?? "bhopal_vibhag";

// Roles that operate at an aayam/department level get a department scope hint.
const AAYAM_ROLES = new Set(["aayam_pramukh", "prant_aayam_pramukh"]);

async function main() {
  console.log("Seeding demo designation users…\n");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  const unitRows = (await sql`SELECT id FROM "units" WHERE "org_id" = ${orgId} ORDER BY "created_at" LIMIT 1`) as { id: string }[];
  const unitId = unitRows[0]?.id ?? null;

  const deptRows = (await sql`SELECT id FROM "departments_or_aayams" WHERE "org_id" = ${orgId} ORDER BY "created_at" LIMIT 1`) as { id: string }[];
  const deptId = deptRows[0]?.id ?? null;

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  let created = 0;
  let updated = 0;

  for (const acct of DEMO_ACCOUNTS) {
    const roleRows = (await sql`SELECT id FROM "roles" WHERE "code" = ${acct.roleCode} LIMIT 1`) as { id: string }[];
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      console.warn(`  ! role "${acct.roleCode}" not found — skipping ${acct.email}`);
      continue;
    }

    const existing = (await sql`SELECT id FROM "profiles" WHERE "email" = ${acct.email} LIMIT 1`) as { id: string }[];
    let userId: string;

    if (existing.length > 0) {
      userId = existing[0].id;
      await sql`
        UPDATE "profiles" SET
          "org_id" = ${orgId},
          "password_hash" = ${passwordHash},
          "display_name" = ${acct.displayName},
          "display_name_hi" = ${acct.displayNameHi},
          "is_active" = true,
          "is_email_verified" = true,
          "requires_password_change" = false,
          "updated_at" = now()
        WHERE "id" = ${userId}
      `;
      updated += 1;
    } else {
      const inserted = (await sql`
        INSERT INTO "profiles"
          ("org_id", "email", "password_hash", "display_name", "display_name_hi",
           "is_active", "is_email_verified", "requires_password_change")
        VALUES
          (${orgId}, ${acct.email}, ${passwordHash}, ${acct.displayName}, ${acct.displayNameHi},
           true, true, false)
        RETURNING id
      `) as { id: string }[];
      userId = inserted[0].id;
      created += 1;
    }

    // Replace role assignments so the demo user has exactly one primary role.
    const departmentId = AAYAM_ROLES.has(acct.roleCode) ? deptId : null;
    await sql`DELETE FROM "user_role_assignments" WHERE "user_id" = ${userId}`;
    await sql`
      INSERT INTO "user_role_assignments"
        ("user_id", "role_id", "scope_type", "org_id", "unit_id", "department_id", "is_primary")
      VALUES
        (${userId}, ${roleId}, 'org', ${orgId}, ${unitId}, ${departmentId}, true)
    `;
  }

  console.log(`  Created ${created}, updated ${updated} demo users.`);
  console.log(`  Password for all: ${DEMO_PASSWORD}`);
  console.log("\nDemo designation users seed complete.\n");
}

main().catch((err) => {
  console.error("Demo users seed failed:", err);
  process.exit(1);
});
