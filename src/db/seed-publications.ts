/**
 * src/db/seed-publications.ts
 * Idempotently creates `publications` and `publication_articles` tables and
 * seeds a couple of issues with articles across the review lifecycle.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-publications.ts
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

type IssueSeed = {
  title: string;
  titleHi: string;
  subtitle: string;
  issueNumber: string;
  status: string;
  description: string;
  articles: {
    title: string;
    titleHi: string;
    abstract: string;
    status: string;
    recommendation?: string;
    rating?: number;
  }[];
};

const issues: IssueSeed[] = [
  {
    title: "Prajna Patrika",
    titleHi: "प्रज्ञा पत्रिका",
    subtitle: "Studies in Indian Knowledge Systems",
    issueNumber: "Vol.3 No.1",
    status: "reviewing",
    description: "The flagship quarterly on Bharatiya intellectual traditions and their contemporary relevance.",
    articles: [
      { title: "Dharmic Foundations of Indian Polity", titleHi: "भारतीय राज्यनीति के धार्मिक आधार", abstract: "Examines the dharmic basis of statecraft in classical Indian thought.", status: "under_review", recommendation: undefined },
      { title: "Reclaiming Indigenous Economic Models", titleHi: "स्वदेशी आर्थिक प्रतिमानों की पुनर्स्थापना", abstract: "A study of pre-colonial economic organisation and its lessons.", status: "accepted", recommendation: "accept", rating: 5 },
      { title: "Sanskrit and the Sciences", titleHi: "संस्कृत एवं विज्ञान", abstract: "On the scientific vocabulary preserved in Sanskrit texts.", status: "revision_requested", recommendation: "minor_revision", rating: 4 },
    ],
  },
  {
    title: "Itihasa Drishti",
    titleHi: "इतिहास दृष्टि",
    subtitle: "Perspectives on Civilisational History",
    issueNumber: "Vol.1 No.2",
    status: "preparing",
    description: "Indigenous periodisation and historiography of Bharat.",
    articles: [
      { title: "Beyond Colonial Periodisation", titleHi: "औपनिवेशिक कालविभाजन से परे", abstract: "Argues for an indigenous framework of historical periodisation.", status: "submitted" },
    ],
  },
];

async function main() {
  console.log("Seeding Prakashan publications…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "publications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "title" varchar(512) NOT NULL,
      "title_hi" varchar(512) NOT NULL,
      "subtitle" varchar(512),
      "subtitle_hi" varchar(512),
      "issue_number" varchar(64),
      "publish_date" timestamp with time zone,
      "cover_image_url" varchar(2048),
      "description" text,
      "description_hi" text,
      "status" varchar(24) DEFAULT 'draft' NOT NULL,
      "visibility" varchar(24) DEFAULT 'public' NOT NULL,
      "created_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "publications_org_idx" ON "publications" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "publications_status_idx" ON "publications" ("status")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "publication_articles" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "publication_id" uuid REFERENCES "publications"("id") ON DELETE SET NULL,
      "title" varchar(512) NOT NULL,
      "title_hi" varchar(512),
      "abstract" text,
      "abstract_hi" text,
      "body" text DEFAULT '' NOT NULL,
      "body_hi" text,
      "author_ids" jsonb,
      "references" text,
      "attachments" jsonb,
      "status" varchar(32) DEFAULT 'submitted' NOT NULL,
      "submitted_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
      "reviewer_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "review_due_date" timestamp with time zone,
      "review_comment" text,
      "review_comment_hi" text,
      "recommendation" varchar(24),
      "rating" integer,
      "reviewed_at" timestamp with time zone,
      "version" integer DEFAULT 1 NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "pub_articles_org_idx" ON "publication_articles" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "pub_articles_pub_idx" ON "publication_articles" ("publication_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "pub_articles_status_idx" ON "publication_articles" ("status")`;
  await sql`CREATE INDEX IF NOT EXISTS "pub_articles_submitter_idx" ON "publication_articles" ("submitted_by")`;

  console.log("  [1/3] Tables ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  const adminRows = (await sql`
    SELECT id FROM "profiles" WHERE "email" = 'admin@pragyapravah.local' AND "org_id" = ${orgId} LIMIT 1
  `) as { id: string }[];
  const adminId = adminRows[0]?.id ?? null;

  let issueCount = 0;
  let articleCount = 0;

  for (const issue of issues) {
    const existing = (await sql`
      SELECT id FROM "publications" WHERE "org_id" = ${orgId} AND "issue_number" = ${issue.issueNumber} AND "title" = ${issue.title} LIMIT 1
    `) as { id: string }[];

    let pubId = existing[0]?.id;
    if (!pubId) {
      const inserted = (await sql`
        INSERT INTO "publications" ("org_id", "title", "title_hi", "subtitle", "issue_number", "status", "description", "created_by")
        VALUES (${orgId}, ${issue.title}, ${issue.titleHi}, ${issue.subtitle}, ${issue.issueNumber}, ${issue.status}, ${issue.description}, ${adminId})
        RETURNING id
      `) as { id: string }[];
      pubId = inserted[0].id;
      issueCount += 1;
    }

    for (let i = 0; i < issue.articles.length; i++) {
      const a = issue.articles[i];
      const exists = (await sql`
        SELECT id FROM "publication_articles" WHERE "org_id" = ${orgId} AND "title" = ${a.title} LIMIT 1
      `) as { id: string }[];
      if (exists.length > 0) continue;

      const reviewedAt = a.recommendation ? new Date().toISOString() : null;
      const reviewerId = a.recommendation ? adminId : null;
      await sql`
        INSERT INTO "publication_articles"
          ("org_id", "publication_id", "title", "title_hi", "abstract", "status",
           "submitted_by", "reviewer_id", "recommendation", "rating", "reviewed_at", "sort_order")
        VALUES
          (${orgId}, ${pubId}, ${a.title}, ${a.titleHi}, ${a.abstract}, ${a.status},
           ${adminId}, ${reviewerId}, ${a.recommendation ?? null}, ${a.rating ?? null}, ${reviewedAt}, ${i})
      `;
      articleCount += 1;
    }
  }

  console.log(`  [2/3] Seeded ${issueCount} issues.`);
  console.log(`  [3/3] Seeded ${articleCount} articles.`);
  console.log("\nPrakashan seed complete.\n");
}

main().catch((err) => {
  console.error("Publications seed failed:", err);
  process.exit(1);
});
