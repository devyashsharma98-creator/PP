/**
 * src/db/seed-outreach.ts
 * Idempotently creates `outreach_items` and `outreach_type_config` tables,
 * seeds the type configs from OUTREACH_TYPES, and adds a few sample items.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-outreach.ts
 */

import { neon } from "@neondatabase/serverless";
import { OUTREACH_TYPES } from "../lib/app/outreach-types";

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const ORG_CODE = process.env.APP_ORG_CODE ?? "bhopal_vibhag";

type SampleItem = {
  outreachType: string;
  title: string;
  description: string;
  status: string;
  metadata: Record<string, unknown>;
  dueInDays: number | null;
};

const samples: SampleItem[] = [
  {
    outreachType: "journal",
    title: "Distribute Prajna Patrika Vol.3 No.1",
    description: "Send the latest journal issue to subscribing institutions and the scholar network.",
    status: "in_progress",
    metadata: { issueName: "Vol.3 No.1", printCopies: 500, digitalCopies: 2000 },
    dueInDays: 7,
  },
  {
    outreachType: "conference",
    title: "Outreach for National Seminar on Indian Knowledge Systems",
    description: "Invite participants and circulate the call for papers across partner universities.",
    status: "pending",
    metadata: { venue: "Bhopal", dates: "12–13 Aug 2026", speakers: 8, participantsTarget: 200 },
    dueInDays: 21,
  },
  {
    outreachType: "campus",
    title: "Follow-up: Study Circle at Barkatullah University",
    description: "Coordinate the next study-circle session and confirm the resource person.",
    status: "pending",
    metadata: { programType: "Study Circle", contactPerson: "Dr. A. Mishra" },
    dueInDays: 10,
  },
  {
    outreachType: "newsletter",
    title: "Monthly Circular — June Karyakarta Update",
    description: "Compile and send the monthly circular to all karyakartas.",
    status: "completed",
    metadata: { subject: "June Update", recipientGroup: "All Karyakartas", medium: ["Email", "WhatsApp Group"] },
    dueInDays: -3,
  },
];

async function main() {
  console.log("Seeding Prachar outreach…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "outreach_items" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "outreach_type" varchar(32) NOT NULL,
      "related_type" varchar(32),
      "related_id" uuid,
      "title" varchar(512) NOT NULL,
      "description" text,
      "unit_id" uuid REFERENCES "units"("id") ON DELETE SET NULL,
      "department_id" uuid REFERENCES "departments_or_aayams"("id") ON DELETE SET NULL,
      "status" varchar(24) DEFAULT 'pending' NOT NULL,
      "assigned_to" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "due_date" timestamp with time zone,
      "completed_at" timestamp with time zone,
      "skip_reason" varchar(512),
      "template_reference" varchar(256),
      "metadata" jsonb,
      "created_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "outreach_org_idx" ON "outreach_items" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "outreach_type_idx" ON "outreach_items" ("outreach_type")`;
  await sql`CREATE INDEX IF NOT EXISTS "outreach_status_idx" ON "outreach_items" ("status")`;
  await sql`CREATE INDEX IF NOT EXISTS "outreach_related_idx" ON "outreach_items" ("related_type", "related_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "outreach_due_idx" ON "outreach_items" ("due_date")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "outreach_type_config" (
      "type" varchar(32) PRIMARY KEY NOT NULL,
      "org_id" uuid REFERENCES "org_settings"("id") ON DELETE cascade,
      "label_en" varchar(128) NOT NULL,
      "label_hi" varchar(128) NOT NULL,
      "icon" varchar(48),
      "color" varchar(32),
      "fields" jsonb NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;

  console.log("  [1/3] Tables ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  for (const [type, def] of Object.entries(OUTREACH_TYPES)) {
    await sql`
      INSERT INTO "outreach_type_config" ("type", "org_id", "label_en", "label_hi", "icon", "color", "fields")
      VALUES (${type}, ${orgId}, ${def.labelEn}, ${def.labelHi}, ${def.icon}, ${def.color}, ${JSON.stringify(def.fields)})
      ON CONFLICT ("type") DO UPDATE SET
        "label_en" = EXCLUDED."label_en",
        "label_hi" = EXCLUDED."label_hi",
        "icon" = EXCLUDED."icon",
        "color" = EXCLUDED."color",
        "fields" = EXCLUDED."fields"
    `;
  }
  console.log(`  [2/3] Seeded ${Object.keys(OUTREACH_TYPES).length} type configs.`);

  const adminRows = (await sql`
    SELECT id FROM "profiles" WHERE "email" = 'admin@pragyapravah.local' AND "org_id" = ${orgId} LIMIT 1
  `) as { id: string }[];
  const adminId = adminRows[0]?.id ?? null;

  // Only seed sample items once (keyed on title) so re-runs stay idempotent.
  let itemCount = 0;
  for (const s of samples) {
    const existing = (await sql`
      SELECT id FROM "outreach_items" WHERE "org_id" = ${orgId} AND "title" = ${s.title} LIMIT 1
    `) as { id: string }[];
    if (existing.length > 0) continue;

    const dueDate = s.dueInDays == null ? null : new Date(Date.now() + s.dueInDays * 86400000).toISOString();
    const completedAt = s.status === "completed" ? new Date().toISOString() : null;

    await sql`
      INSERT INTO "outreach_items"
        ("org_id", "outreach_type", "title", "description", "status", "due_date", "completed_at", "metadata", "created_by")
      VALUES
        (${orgId}, ${s.outreachType}, ${s.title}, ${s.description}, ${s.status},
         ${dueDate}, ${completedAt}, ${JSON.stringify(s.metadata)}, ${adminId})
    `;
    itemCount += 1;
  }
  console.log(`  [3/3] Seeded ${itemCount} sample outreach items.`);
  console.log("\nPrachar outreach seed complete.\n");
}

main().catch((err) => {
  console.error("Outreach seed failed:", err);
  process.exit(1);
});
