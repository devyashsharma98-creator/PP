/**
 * src/db/seed-campus-workflows.ts
 * Idempotently creates the campus-workflow tables and seeds sample study
 * circles, outreach logs, and resource distributions for existing campus units.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-campus-workflows.ts
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const ORG_CODE = process.env.APP_ORG_CODE ?? "bhopal_vibhag";

const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

async function main() {
  console.log("Seeding Campus Ikai workflows…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "campus_study_circles" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "unit_id" uuid NOT NULL REFERENCES "campus_units"("id") ON DELETE cascade,
      "title" varchar(512) NOT NULL,
      "title_hi" varchar(512),
      "description" text,
      "frequency" varchar(16) DEFAULT 'one_time' NOT NULL,
      "scheduled_date" timestamp with time zone NOT NULL,
      "scheduled_time" varchar(16),
      "assigned_to" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "reading_material" text,
      "topic" varchar(512),
      "completed" boolean DEFAULT false NOT NULL,
      "attendance" integer,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )`;
  await sql`CREATE INDEX IF NOT EXISTS "study_circles_unit_idx" ON "campus_study_circles" ("unit_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "study_circles_org_idx" ON "campus_study_circles" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "study_circles_date_idx" ON "campus_study_circles" ("scheduled_date")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "campus_outreach_log" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "unit_id" uuid NOT NULL REFERENCES "campus_units"("id") ON DELETE cascade,
      "outreach_type" varchar(24) NOT NULL,
      "title" varchar(512) NOT NULL,
      "conducted_by" varchar(256),
      "conducted_date" timestamp with time zone NOT NULL,
      "attendance" integer,
      "follow_up_needed" boolean DEFAULT false NOT NULL,
      "next_planned_date" timestamp with time zone,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )`;
  await sql`CREATE INDEX IF NOT EXISTS "campus_outreach_unit_idx" ON "campus_outreach_log" ("unit_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "campus_outreach_org_idx" ON "campus_outreach_log" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "campus_outreach_date_idx" ON "campus_outreach_log" ("conducted_date")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "campus_resource_distribution" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "unit_id" uuid NOT NULL REFERENCES "campus_units"("id") ON DELETE cascade,
      "resource_type" varchar(24) NOT NULL,
      "resource_ref_id" uuid,
      "resource_name" varchar(512) NOT NULL,
      "quantity" integer DEFAULT 1 NOT NULL,
      "distributed_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "distributed_at" timestamp with time zone DEFAULT now() NOT NULL,
      "feedback_received" boolean DEFAULT false NOT NULL,
      "feedback_notes" text
    )`;
  await sql`CREATE INDEX IF NOT EXISTS "campus_resources_unit_idx" ON "campus_resource_distribution" ("unit_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "campus_resources_org_idx" ON "campus_resource_distribution" ("org_id")`;

  console.log("  [1/2] Tables ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) { console.error(`  Org "${ORG_CODE}" not found.`); process.exit(1); }

  const adminRows = (await sql`SELECT id FROM "profiles" WHERE "email" = 'admin@pragyapravah.local' AND "org_id" = ${orgId} LIMIT 1`) as { id: string }[];
  const adminId = adminRows[0]?.id ?? null;

  const units = (await sql`SELECT id, name FROM "campus_units" WHERE "org_id" = ${orgId} ORDER BY "sort_order" LIMIT 2`) as { id: string; name: string }[];
  if (units.length === 0) { console.error("  No campus units found. Run seed:campus first."); process.exit(1); }

  let sc = 0, ol = 0, rd = 0;
  for (const [idx, unit] of units.entries()) {
    const existing = (await sql`SELECT id FROM "campus_study_circles" WHERE "unit_id" = ${unit.id} LIMIT 1`) as { id: string }[];
    if (existing.length > 0) continue;

    await sql`INSERT INTO "campus_study_circles" ("org_id","unit_id","title","frequency","scheduled_date","scheduled_time","topic","completed","attendance","assigned_to") VALUES
      (${orgId},${unit.id},'Introduction to Indian Economics','weekly',${daysFromNow(3)},'17:30','Swadeshi economic thought',false,null,${adminId})`;
    await sql`INSERT INTO "campus_study_circles" ("org_id","unit_id","title","frequency","scheduled_date","scheduled_time","topic","completed","attendance","assigned_to") VALUES
      (${orgId},${unit.id},'Reading: Integral Humanism','biweekly',${daysFromNow(-7)},'18:00','Deendayal Upadhyaya',true,24,${adminId})`;
    sc += 2;

    await sql`INSERT INTO "campus_outreach_log" ("org_id","unit_id","outreach_type","title","conducted_by","conducted_date","attendance","follow_up_needed","next_planned_date") VALUES
      (${orgId},${unit.id},'lecture','Guest Lecture: Civilisational History','Dr. Ramesh Sharma',${daysFromNow(-14)},85,true,${daysFromNow(20)})`;
    ol += 1;
    if (idx === 0) {
      await sql`INSERT INTO "campus_outreach_log" ("org_id","unit_id","outreach_type","title","conducted_by","conducted_date","attendance","follow_up_needed") VALUES
        (${orgId},${unit.id},'workshop','Workshop: Research Methodology','Faculty Team',${daysFromNow(-30)},42,false)`;
      ol += 1;
    }

    await sql`INSERT INTO "campus_resource_distribution" ("org_id","unit_id","resource_type","resource_name","quantity","distributed_by","feedback_received") VALUES
      (${orgId},${unit.id},'book','Set of foundational readings (10 titles)',10,${adminId},false)`;
    await sql`INSERT INTO "campus_resource_distribution" ("org_id","unit_id","resource_type","resource_name","quantity","distributed_by","feedback_received","feedback_notes") VALUES
      (${orgId},${unit.id},'journal','Prajna Patrika Vol.2 (back issues)',5,${adminId},true,'Well received by the faculty.')`;
    rd += 2;
  }

  console.log(`  [2/2] Seeded ${sc} study circles, ${ol} outreach logs, ${rd} resource records.`);
  console.log("\nCampus Ikai workflows seed complete.\n");
}

main().catch((err) => { console.error("Campus workflows seed failed:", err); process.exit(1); });
