/**
 * src/db/seed-research.ts
 * Idempotently creates `research_projects` and `research_milestones` tables and
 * seeds a few projects with milestones.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-research.ts
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

type Milestone = { title: string; weight: number; status: string; deliverableType: string };
type ProjectSeed = {
  title: string;
  titleHi: string;
  objective: string;
  status: string;
  milestones: Milestone[];
};

const projects: ProjectSeed[] = [
  {
    title: "Indigenous Knowledge Systems in Indian Agriculture",
    titleHi: "भारतीय कृषि में स्वदेशी ज्ञान प्रणालियाँ",
    objective: "Document traditional agricultural practices and assess their relevance to sustainable farming.",
    status: "active",
    milestones: [
      { title: "Literature review of classical agronomy texts", weight: 25, status: "completed", deliverableType: "report" },
      { title: "Field interviews across three districts", weight: 35, status: "in_progress", deliverableType: "data" },
      { title: "Draft monograph", weight: 25, status: "pending", deliverableType: "article" },
      { title: "Symposium presentation", weight: 15, status: "pending", deliverableType: "presentation" },
    ],
  },
  {
    title: "Geopolitics of the Indian Ocean: A Civilisational View",
    titleHi: "हिंद महासागर की भू-राजनीति: एक सभ्यतागत दृष्टि",
    objective: "Re-read maritime history of the Indian Ocean through indigenous strategic frameworks.",
    status: "proposed",
    milestones: [
      { title: "Scoping study and source mapping", weight: 40, status: "pending", deliverableType: "report" },
      { title: "Working paper", weight: 60, status: "pending", deliverableType: "article" },
    ],
  },
];

function progressFrom(ms: Milestone[]) {
  const total = ms.reduce((s, m) => s + m.weight, 0) || 1;
  const done = ms.filter((m) => m.status === "completed").reduce((s, m) => s + m.weight, 0);
  return Math.round((done / total) * 100);
}

async function main() {
  console.log("Seeding Shodh research…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "research_projects" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "title" varchar(512) NOT NULL,
      "title_hi" varchar(512),
      "objective" text,
      "objective_hi" text,
      "methodology" text,
      "methodology_hi" text,
      "status" varchar(24) DEFAULT 'proposed' NOT NULL,
      "lead_researcher_id" uuid REFERENCES "scholars"("id") ON DELETE SET NULL,
      "team_ids" jsonb,
      "start_date" timestamp with time zone,
      "end_date" timestamp with time zone,
      "budget" varchar(128),
      "expected_outputs" jsonb,
      "actual_outputs" jsonb,
      "progress" integer DEFAULT 0 NOT NULL,
      "submitted_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
      "reviewed_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "reviewed_at" timestamp with time zone,
      "review_comment" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "research_org_idx" ON "research_projects" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "research_status_idx" ON "research_projects" ("status")`;
  await sql`CREATE INDEX IF NOT EXISTS "research_lead_idx" ON "research_projects" ("lead_researcher_id")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "research_milestones" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "project_id" uuid NOT NULL REFERENCES "research_projects"("id") ON DELETE cascade,
      "title" varchar(512) NOT NULL,
      "description" text,
      "due_date" timestamp with time zone,
      "weight" integer DEFAULT 0 NOT NULL,
      "deliverable_type" varchar(24),
      "deliverable_url" varchar(2048),
      "status" varchar(24) DEFAULT 'pending' NOT NULL,
      "completed_at" timestamp with time zone,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "milestones_project_idx" ON "research_milestones" ("project_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "milestones_org_idx" ON "research_milestones" ("org_id")`;

  console.log("  [1/3] Tables ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  const adminRows = (await sql`SELECT id FROM "profiles" WHERE "email" = 'admin@pragyapravah.local' AND "org_id" = ${orgId} LIMIT 1`) as { id: string }[];
  const adminId = adminRows[0]?.id ?? null;

  const leadRows = (await sql`SELECT id FROM "scholars" WHERE "org_id" = ${orgId} ORDER BY "sort_order" LIMIT 1`) as { id: string }[];
  const leadId = leadRows[0]?.id ?? null;

  let projectCount = 0;
  let milestoneCount = 0;

  for (const p of projects) {
    const existing = (await sql`SELECT id FROM "research_projects" WHERE "org_id" = ${orgId} AND "title" = ${p.title} LIMIT 1`) as { id: string }[];
    if (existing.length > 0) continue;

    const progress = progressFrom(p.milestones);
    const inserted = (await sql`
      INSERT INTO "research_projects" ("org_id", "title", "title_hi", "objective", "status", "lead_researcher_id", "progress", "submitted_by")
      VALUES (${orgId}, ${p.title}, ${p.titleHi}, ${p.objective}, ${p.status}, ${leadId}, ${progress}, ${adminId})
      RETURNING id
    `) as { id: string }[];
    const projectId = inserted[0].id;
    projectCount += 1;

    for (let i = 0; i < p.milestones.length; i++) {
      const m = p.milestones[i];
      const completedAt = m.status === "completed" ? new Date().toISOString() : null;
      await sql`
        INSERT INTO "research_milestones" ("org_id", "project_id", "title", "weight", "deliverable_type", "status", "completed_at", "sort_order")
        VALUES (${orgId}, ${projectId}, ${m.title}, ${m.weight}, ${m.deliverableType}, ${m.status}, ${completedAt}, ${i})
      `;
      milestoneCount += 1;
    }
  }

  console.log(`  [2/3] Seeded ${projectCount} projects.`);
  console.log(`  [3/3] Seeded ${milestoneCount} milestones.`);
  console.log("\nShodh research seed complete.\n");
}

main().catch((err) => {
  console.error("Research seed failed:", err);
  process.exit(1);
});
