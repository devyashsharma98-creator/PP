/**
 * src/db/seed.ts
 * Seeds: org, all 9 roles, org structure, and a single local admin.
 * Run: npx tsx src/db/seed.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

const ORG_CODE = process.env.APP_ORG_CODE ?? "bhopal_vibhag";

async function seed() {
  console.log("Seeding Pragya Pravah DB...\n");

  // --- 1. Org ---
  console.log("  [1/5] Org settings...");
  const [org] = await db
    .insert(schema.orgSettings)
    .values({
      orgCode: ORG_CODE,
      name: "Pragya Pravah – Bhopal Vibhag",
      nameHi: "प्रज्ञा प्रवाह – भोपाल विभाग",
      isActive: true,
      metadata: {},
    })
    .onConflictDoNothing()
    .returning();

  const orgId = org?.id ?? (
    await db.query.orgSettings.findFirst({
      where: eq(schema.orgSettings.orgCode, ORG_CODE),
    })
  )!.id;

  console.log(`     org_id = ${orgId}`);

  // --- 2. Roles ---
  console.log("  [2/5] Roles...");
  const roleDefs = [
    { code: "super_admin",         priority: "0", name: "Super Admin",          nameHi: "सुपर व्यवस्थापक" },
    { code: "org_admin",           priority: "1", name: "Org Admin",            nameHi: "संस्था व्यवस्थापक" },
    { code: "kshetra_reviewer",    priority: "2", name: "Kshetra Reviewer",     nameHi: "क्षेत्र समीक्षक" },
    { code: "prant_sanyojak",      priority: "3", name: "Prant Sanyojak",       nameHi: "प्रान्त संयोजक" },
    { code: "prant_aayam_pramukh", priority: "4", name: "Prant Aayam Pramukh",  nameHi: "प्रान्त आयाम प्रमुख" },
    { code: "vibhag_pramukh",      priority: "5", name: "Vibhag Pramukh",       nameHi: "विभाग प्रमुख" },
    { code: "aayam_pramukh",       priority: "6", name: "Aayam Pramukh",        nameHi: "आयाम प्रमुख" },
    { code: "unit_head",           priority: "7", name: "Unit Head",            nameHi: "इकाई प्रमुख" },
    { code: "karyakarta",          priority: "8", name: "Karyakarta",           nameHi: "कार्यकर्ता" },
  ] as const;

  for (const r of roleDefs) {
    await db
      .insert(schema.roles)
      .values({ code: r.code, name: r.name, nameHi: r.nameHi, priority: r.priority, description: `${r.name} role` })
      .onConflictDoNothing();
  }

  const allRoles = await db.query.roles.findMany();
  const roleByCode = Object.fromEntries(allRoles.map((r) => [r.code, r.id]));
  console.log(`     seeded ${allRoles.length} roles`);

  // --- 3. Root unit + aayams ---
  console.log("  [3/5] Org structure...");
  const [unit] = await db
    .insert(schema.units)
    .values({
      orgId,
      code: "bhopal_vibhag_root",
      name: "Bhopal Vibhag",
      nameHi: "भोपाल विभाग",
      unitKind: "vibhag",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const unitId = unit?.id ?? (
    await db.query.units.findFirst({
      where: eq(schema.units.code, "bhopal_vibhag_root"),
    })
  )!.id;

  const canonicalUnitRow = await sql`
    with referenced_units as (
      select unit_id, count(*)::int as total
      from (
        select unit_id from public.events where org_id = ${orgId}
        union all
        select unit_id from public.articles where org_id = ${orgId}
      ) scoped
      where unit_id is not null
      group by unit_id
    )
    select u.id
    from public.units u
    left join referenced_units ru on ru.unit_id = u.id
    where u.org_id = ${orgId}
      and u.code = ${"bhopal_vibhag_root"}
    order by coalesce(ru.total, 0) desc, u.created_at asc
    limit 1
  `;

  const canonicalUnitId = (canonicalUnitRow as Array<{ id: string }>)[0]?.id ?? unitId;

  const duplicateRootUnits = await sql`
    select id from public.units where org_id = ${orgId} and code = ${"bhopal_vibhag_root"}
  `;
  const duplicateRootUnitIds = (duplicateRootUnits as Array<{ id: string }>).map((row) => row.id);

  if (duplicateRootUnitIds.length > 1) {
    for (const duplicateUnitId of duplicateRootUnitIds) {
      if (duplicateUnitId === canonicalUnitId) continue;
      await sql`update public.departments_or_aayams set unit_id = ${canonicalUnitId} where org_id = ${orgId} and unit_id = ${duplicateUnitId}`;
      await sql`update public.events set unit_id = ${canonicalUnitId} where org_id = ${orgId} and unit_id = ${duplicateUnitId}`;
      await sql`update public.articles set unit_id = ${canonicalUnitId} where org_id = ${orgId} and unit_id = ${duplicateUnitId}`;
      await sql`update public.user_role_assignments set unit_id = ${canonicalUnitId} where org_id = ${orgId} and unit_id = ${duplicateUnitId}`;
    }
  }

  const existingAayams = await db.query.departmentsOrAayams.findMany({
    where: eq(schema.departmentsOrAayams.orgId, orgId),
  });

  if (existingAayams.length === 0) {
    const aayamDefs = [
      { code: "yuva",   name: "Yuva Aayam",   nameHi: "युवा आयाम",   departmentKind: "yuva"   as const },
      { code: "mahila", name: "Mahila Aayam", nameHi: "महिला आयाम", departmentKind: "mahila" as const },
      { code: "shodh",  name: "Shodh Aayam",  nameHi: "शोध आयाम",   departmentKind: "shodh"  as const },
      { code: "prachar",name: "Prachar Aayam", nameHi: "प्रचार आयाम",departmentKind: "prachar" as const },
      { code: "vimarsh",name: "Vimarsh Aayam", nameHi: "विमर्श आयाम",departmentKind: "vimarsh" as const },
    ];
    for (const aayam of aayamDefs) {
      await db.insert(schema.departmentsOrAayams).values({ orgId, unitId, code: aayam.code, name: aayam.name, nameHi: aayam.nameHi, departmentKind: aayam.departmentKind, isActive: true });
    }
  }

  // Re-balance pending aayam-review items across departments
  const aayams = await db.query.departmentsOrAayams.findMany({ where: eq(schema.departmentsOrAayams.orgId, orgId) });
  const prantAayamId  = aayams.find(a => a.code === "vimarsh")?.id ?? aayams.find(a => a.code === "yuva")?.id ?? aayams[0]?.id ?? null;
  const localAayamId  = aayams.find(a => a.code === "yuva")?.id ?? aayams.find(a => a.code === "prachar")?.id ?? aayams[0]?.id ?? null;

  const distributeDepartmentIds = (rows: Array<{ id: string }>) =>
    rows.map((row, i) => ({ id: row.id, departmentId: i % 2 === 0 ? localAayamId : prantAayamId ?? localAayamId }));

  const pendingEvents = await sql`select id from public.events where org_id = ${orgId} and status::text = 'pending_aayam_review' order by created_at asc` as Array<{ id: string }>;
  const pendingArticles = await sql`select id from public.articles where org_id = ${orgId} and status::text = 'pending_aayam_review' order by created_at asc` as Array<{ id: string }>;

  for (const row of distributeDepartmentIds(pendingEvents))    { if (row.departmentId) await sql`update public.events        set department_id = ${row.departmentId} where id = ${row.id}`; }
  for (const row of distributeDepartmentIds(pendingArticles))   { if (row.departmentId) await sql`update public.articles       set department_id = ${row.departmentId} where id = ${row.id}`; }

  // --- 4. Local admin ---
  console.log("  [4/5] Local admin...");
  const localAdminEmail = process.env.APP_LOCAL_ADMIN_EMAIL ?? "admin@pragyapravah.local";
  const localAdminPassword = process.env.APP_LOCAL_ADMIN_PASSWORD ?? "Pragya@12345";
  const localAdminName = process.env.APP_LOCAL_ADMIN_NAME ?? "Local Admin";
  const localAdminHash = await bcrypt.hash(localAdminPassword, 12);
  const superAdminRoleId = roleByCode["super_admin"];
  if (!superAdminRoleId) {
    throw new Error("Missing super_admin role after role seed.");
  }

  const existingLocalAdmin = await db.query.profiles.findFirst({
    where: eq(schema.profiles.email, localAdminEmail),
  });

  const localAdminId = existingLocalAdmin
    ? existingLocalAdmin.id
    : (await db.insert(schema.profiles).values({
        orgId,
        email: localAdminEmail,
        passwordHash: localAdminHash,
        displayName: localAdminName,
        isActive: true,
        isEmailVerified: true,
        requiresPasswordChange: false,
      }).returning())[0].id;

  if (existingLocalAdmin) {
    await db
      .update(schema.profiles)
      .set({
        orgId,
        passwordHash: localAdminHash,
        displayName: localAdminName,
        isActive: true,
        isEmailVerified: true,
        requiresPasswordChange: false,
      })
      .where(eq(schema.profiles.id, localAdminId));
  }

  await sql`delete from public.user_role_assignments where user_id = ${localAdminId}`;
  await db.insert(schema.userRoleAssignments).values({
    userId: localAdminId,
    roleId: superAdminRoleId,
    scopeType: "org",
    orgId,
    unitId: canonicalUnitId,
    isPrimary: true,
  });

  // --- 5. Summary ---
  console.log("\nSeed complete.\n");
  console.log(`  Local admin: ${localAdminEmail}`);
  console.log("");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
