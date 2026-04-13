/**
 * src/db/seed.ts
 * Seeds: org, all 9 roles, and demo users across super-admin and workflow lanes
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
  console.error("âŒ  DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

const DEMO_PASSWORD = process.env.APP_DEMO_PASSWORD ?? "Password123!";
const ORG_CODE = process.env.APP_ORG_CODE ?? "bhopal_vibhag";

async function seed() {
  console.log("ðŸŒ±  Seeding Pragya Pravah DBâ€¦\n");

  // â”€â”€ 1. Org â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("  [1/5] Org settingsâ€¦");
  const [org] = await db
    .insert(schema.orgSettings)
    .values({
      orgCode: ORG_CODE,
      name: "Pragya Pravah â€“ Bhopal Vibhag",
      nameHi: "à¤ªà¥à¤°à¤œà¥à¤žà¤¾ à¤ªà¥à¤°à¤µà¤¾à¤¹ â€“ à¤­à¥‹à¤ªà¤¾à¤² à¤µà¤¿à¤­à¤¾à¤—",
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

  // â”€â”€ 2. Roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("  [2/5] Rolesâ€¦");
  const roleDefs = [
    { code: "super_admin",        priority: "0", name: "Super Admin",         nameHi: "à¤¸à¥à¤ªà¤° à¤µà¥à¤¯à¤µà¤¸à¥à¤¥à¤¾à¤ªà¤•" },
    { code: "org_admin",          priority: "1", name: "Org Admin",           nameHi: "à¤¸à¤‚à¤¸à¥à¤¥à¤¾ à¤µà¥à¤¯à¤µà¤¸à¥à¤¥à¤¾à¤ªà¤•" },
    { code: "kshetra_reviewer",   priority: "2", name: "Kshetra Reviewer",    nameHi: "à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤¸à¤®à¥€à¤•à¥à¤·à¤•" },
    { code: "prant_sanyojak",     priority: "3", name: "Prant Sanyojak",      nameHi: "à¤ªà¥à¤°à¤¾à¤¨à¥à¤¤ à¤¸à¤‚à¤¯à¥‹à¤œà¤•" },
    { code: "prant_aayam_pramukh",priority: "4", name: "Prant Aayam Pramukh",nameHi: "à¤ªà¥à¤°à¤¾à¤¨à¥à¤¤ à¤†à¤¯à¤¾à¤® à¤ªà¥à¤°à¤®à¥à¤–" },
    { code: "vibhag_pramukh",     priority: "5", name: "Vibhag Pramukh",      nameHi: "à¤µà¤¿à¤­à¤¾à¤— à¤ªà¥à¤°à¤®à¥à¤–" },
    { code: "aayam_pramukh",      priority: "6", name: "Aayam Pramukh",       nameHi: "à¤†à¤¯à¤¾à¤® à¤ªà¥à¤°à¤®à¥à¤–" },
    { code: "unit_head",          priority: "7", name: "Unit Head",            nameHi: "à¤‡à¤•à¤¾à¤ˆ à¤ªà¥à¤°à¤®à¥à¤–" },
    { code: "karyakarta",         priority: "8", name: "Karyakarta",           nameHi: "à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾" },
  ] as const;

  for (const r of roleDefs) {
    await db
      .insert(schema.roles)
      .values({ code: r.code, name: r.name, nameHi: r.nameHi, priority: r.priority, description: `${r.name} role` })
      .onConflictDoNothing();
  }

  // Load role IDs
  const allRoles = await db.query.roles.findMany();
  const roleByCode = Object.fromEntries(allRoles.map((r) => [r.code, r.id]));
  console.log(`     seeded ${allRoles.length} roles`);

  // â”€â”€ 3. Root unit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("  [3/5] Root unitâ€¦");
  const [unit] = await db
    .insert(schema.units)
    .values({
      orgId,
      code: "bhopal_vibhag_root",
      name: "Bhopal Vibhag",
      nameHi: "à¤­à¥‹à¤ªà¤¾à¤² à¤µà¤¿à¤­à¤¾à¤—",
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
    select id
    from public.units
    where org_id = ${orgId}
      and code = ${"bhopal_vibhag_root"}
  `;
  const duplicateRootUnitIds = (duplicateRootUnits as Array<{ id: string }>).map((row) => row.id);

  if (duplicateRootUnitIds.length > 1) {
    for (const duplicateUnitId of duplicateRootUnitIds) {
      if (duplicateUnitId === canonicalUnitId) continue;
      await sql`
        update public.departments_or_aayams
        set unit_id = ${canonicalUnitId}
        where org_id = ${orgId}
          and unit_id = ${duplicateUnitId}
      `;
      await sql`
        update public.events
        set unit_id = ${canonicalUnitId}
        where org_id = ${orgId}
          and unit_id = ${duplicateUnitId}
      `;
      await sql`
        update public.articles
        set unit_id = ${canonicalUnitId}
        where org_id = ${orgId}
          and unit_id = ${duplicateUnitId}
      `;
      await sql`
        update public.user_role_assignments
        set unit_id = ${canonicalUnitId}
        where org_id = ${orgId}
          and unit_id = ${duplicateUnitId}
      `;
    }
  }

  const existingAayams = await db.query.departmentsOrAayams.findMany({
    where: eq(schema.departmentsOrAayams.orgId, orgId),
  });

  if (existingAayams.length === 0) {
    const aayamDefs = [
      { code: "yuva", name: "Yuva Aayam", nameHi: "युवा आयाम", departmentKind: "yuva" as const },
      { code: "mahila", name: "Mahila Aayam", nameHi: "महिला आयाम", departmentKind: "mahila" as const },
      { code: "shodh", name: "Shodh Aayam", nameHi: "शोध आयाम", departmentKind: "shodh" as const },
      { code: "prachar", name: "Prachar Aayam", nameHi: "प्रचार आयाम", departmentKind: "prachar" as const },
      { code: "vimarsh", name: "Vimarsh Aayam", nameHi: "विमर्श आयाम", departmentKind: "vimarsh" as const },
    ];

    for (const aayam of aayamDefs) {
      await db.insert(schema.departmentsOrAayams).values({
        orgId,
        unitId,
        code: aayam.code,
        name: aayam.name,
        nameHi: aayam.nameHi,
        departmentKind: aayam.departmentKind,
        isActive: true,
      });
    }
  }

  const aayams = await db.query.departmentsOrAayams.findMany({
    where: eq(schema.departmentsOrAayams.orgId, orgId),
  });

  const prantAayamId =
    aayams.find((aayam) => aayam.code === "vimarsh")?.id ??
    aayams.find((aayam) => aayam.code === "yuva")?.id ??
    aayams[0]?.id ??
    null;
  const localAayamId =
    aayams.find((aayam) => aayam.code === "yuva")?.id ??
    aayams.find((aayam) => aayam.code === "prachar")?.id ??
    aayams[0]?.id ??
    null;

  const pendingAayamEvents = await sql`
    select id
    from public.events
    where org_id = ${orgId}
      and status::text = 'pending_aayam_review'
    order by created_at asc
  `;
  const pendingAayamArticles = await sql`
    select id
    from public.articles
    where org_id = ${orgId}
      and status::text = 'pending_aayam_review'
    order by created_at asc
  `;

  const distributeDepartmentIds = (rows: Array<{ id: string }>) =>
    rows.map((row, index) => ({
      id: row.id,
      departmentId: index % 2 === 0 ? localAayamId : prantAayamId ?? localAayamId,
    }));

  const eventDepartmentAssignments = distributeDepartmentIds(pendingAayamEvents as Array<{ id: string }>);
  for (const row of eventDepartmentAssignments) {
    if (!row.departmentId) continue;
    await sql`
      update public.events
      set department_id = ${row.departmentId}
      where id = ${row.id}
    `;
  }

  const articleDepartmentAssignments = distributeDepartmentIds(pendingAayamArticles as Array<{ id: string }>);
  for (const row of articleDepartmentAssignments) {
    if (!row.departmentId) continue;
    await sql`
      update public.articles
      set department_id = ${row.departmentId}
      where id = ${row.id}
    `;
  }

  // â”€â”€ 4. Demo users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("  [4/5] Demo usersâ€¦");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const demoUsers = [
    {
      email: "demo.superadmin@example.com",
      displayName: "Demo Super Admin",
      displayNameHi: "डेमो सुपर एडमिन",
      roleCode: "super_admin" as const,
      scopeType: "org" as const,
    },
    {
      email: "demo.kshetra@example.com",
      displayName: "Demo Kshetra Reviewer",
      displayNameHi: "डेमो क्षेत्र समीक्षक",
      roleCode: "kshetra_reviewer" as const,
      scopeType: "org" as const,
    },
    {
      email: "demo.prant@example.com",
      displayName: "Demo Prant Sanyojak",
      displayNameHi: "डेमो प्रान्त संयोजक",
      roleCode: "prant_sanyojak" as const,
      scopeType: "org" as const,
    },
    {
      email: "demo.prant.aayam@example.com",
      displayName: "Demo Prant Aayam Pramukh",
      displayNameHi: "डेमो प्रान्त आयाम प्रमुख",
      roleCode: "prant_aayam_pramukh" as const,
      scopeType: "department" as const,
      departmentId: prantAayamId,
    },
    {
      email: "demo.vibhag@example.com",
      displayName: "Demo Vibhag Pramukh",
      displayNameHi: "à¤¡à¥‡à¤®à¥‹ à¤µà¤¿à¤­à¤¾à¤— à¤ªà¥à¤°à¤®à¥à¤–",
      roleCode: "vibhag_pramukh" as const,
      scopeType: "unit" as const,
      unitId: canonicalUnitId,
    },
    {
      email: "demo.aayam@example.com",
      displayName: "Demo Aayam Pramukh",
      displayNameHi: "à¤¡à¥‡à¤®à¥‹ à¤†à¤¯à¤¾à¤® à¤ªà¥à¤°à¤®à¥à¤–",
      roleCode: "aayam_pramukh" as const,
      scopeType: "department" as const,
      departmentId: localAayamId,
    },
    {
      email: "demo.unithead@example.com",
      displayName: "Demo Unit Head",
      displayNameHi: "à¤¡à¥‡à¤®à¥‹ à¤‡à¤•à¤¾à¤ˆ à¤ªà¥à¤°à¤®à¥à¤–",
      roleCode: "unit_head" as const,
      scopeType: "unit" as const,
      unitId: canonicalUnitId,
    },
    {
      email: "demo.karyakarta@example.com",
      displayName: "Demo Karyakarta",
      displayNameHi: "à¤¡à¥‡à¤®à¥‹ à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾",
      roleCode: "karyakarta" as const,
      scopeType: "unit" as const,
      unitId: canonicalUnitId,
    },
  ];

  for (const u of demoUsers) {
    const existing = await db.query.profiles.findFirst({
      where: eq(schema.profiles.email, u.email),
    });

    let userId: string;

    if (existing) {
      userId = existing.id;
      console.log(`     ${u.email} already exists`);
    } else {
      const [profile] = await db
        .insert(schema.profiles)
        .values({
          orgId,
          email: u.email,
          passwordHash,
          displayName: u.displayName,
          displayNameHi: u.displayNameHi,
          isActive: true,
          isEmailVerified: true,
        })
        .returning();
      userId = profile.id;
      console.log(`     created ${u.email} (${userId})`);
    }

    // Assign role (skip if exists)
    const roleId = roleByCode[u.roleCode];
    const existingAssignment = await db.query.userRoleAssignments.findFirst({
      where: (t, { and, eq: eq2 }) =>
        and(eq2(t.userId, userId), eq2(t.roleId, roleId)),
    });

    const assignmentValues = {
      scopeType: u.scopeType,
      orgId,
      unitId: u.unitId ?? canonicalUnitId,
      departmentId: u.departmentId ?? null,
      isPrimary: true,
    };

    if (!existingAssignment) {
      await db.insert(schema.userRoleAssignments).values({
        userId,
        roleId,
        ...assignmentValues,
      });
    } else {
      await db
        .update(schema.userRoleAssignments)
        .set(assignmentValues)
        .where(eq(schema.userRoleAssignments.id, existingAssignment.id));
    }
  }

  // â”€â”€ 5. Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log("\nâœ…  Seed complete!\n");
  console.log("  Demo credentials (all share the same password):");
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  for (const u of demoUsers) {
    console.log(`  ${u.roleCode.padEnd(20)} â†’ ${u.email}`);
  }
  console.log("");
}

seed().catch((err) => {
  console.error("âŒ  Seed failed:", err);
  process.exit(1);
});

