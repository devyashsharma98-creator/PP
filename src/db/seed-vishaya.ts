/**
 * src/db/seed-vishaya.ts
 * Idempotently creates `vishayas` and `content_vishaya_map` tables and seeds
 * the Pragya Pravah subject-area taxonomy (vishay).
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-vishaya.ts
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

type VishaySeed = {
  slug: string;
  nameEn: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  color: string;
  icon: string;
};

// Curated subject areas reflecting Pragya Pravah's intellectual mission.
const vishayas: VishaySeed[] = [
  { slug: "social-sciences", nameEn: "Social Sciences", nameHi: "सामाजिक विज्ञान", description: "Study of society, institutions, and human behaviour.", descriptionHi: "समाज, संस्थाओं एवं मानव व्यवहार का अध्ययन।", color: "blue", icon: "Users" },
  { slug: "political-science", nameEn: "Political Science", nameHi: "राजनीति शास्त्र", description: "Governance, statecraft, and political thought.", descriptionHi: "शासन, राज्यनीति एवं राजनीतिक चिंतन।", color: "indigo", icon: "Landmark" },
  { slug: "economics", nameEn: "Economics", nameHi: "अर्थशास्त्र", description: "Indigenous and contemporary economic thought.", descriptionHi: "स्वदेशी एवं समकालीन आर्थिक चिंतन।", color: "amber", icon: "TrendingUp" },
  { slug: "history", nameEn: "History", nameHi: "इतिहास", description: "Civilisational history and indigenous periodisation.", descriptionHi: "सभ्यतागत इतिहास एवं स्वदेशी कालविभाजन।", color: "orange", icon: "Scroll" },
  { slug: "philosophy", nameEn: "Philosophy", nameHi: "दर्शन", description: "Darshanic traditions and schools of thought.", descriptionHi: "दार्शनिक परंपराएँ एवं विचार-धाराएँ।", color: "violet", icon: "BrainCircuit" },
  { slug: "sectarian-studies", nameEn: "Sectarian Studies", nameHi: "मतपंथ अध्ययन", description: "Comparative study of sects and belief systems.", descriptionHi: "मत-पंथ एवं विश्वास प्रणालियों का तुलनात्मक अध्ययन।", color: "rose", icon: "BookMarked" },
  { slug: "law", nameEn: "Law", nameHi: "विधि", description: "Jurisprudence, constitution, and dharmic law.", descriptionHi: "न्यायशास्त्र, संविधान एवं धर्मिक विधि।", color: "slate", icon: "Scale" },
  { slug: "geography", nameEn: "Geography", nameHi: "भूगोल", description: "Bharat's sacred and physical geography.", descriptionHi: "भारत का सांस्कृतिक एवं भौतिक भूगोल।", color: "emerald", icon: "Map" },
  { slug: "environment", nameEn: "Environment", nameHi: "पर्यावरण", description: "Ecology, sustainability, and traditional practices.", descriptionHi: "पारिस्थितिकी, धारणीयता एवं पारंपरिक व्यवहार।", color: "green", icon: "Leaf" },
  { slug: "media-journalism", nameEn: "Media & Journalism", nameHi: "मीडिया एवं पत्रकारिता", description: "Narrative, communication, and public discourse.", descriptionHi: "कथ्य, संचार एवं सार्वजनिक विमर्श।", color: "red", icon: "Newspaper" },
  { slug: "international-relations", nameEn: "International Relations", nameHi: "अंतरराष्ट्रीय संबंध", description: "Geopolitics and Bharat's place in the world.", descriptionHi: "भू-राजनीति एवं विश्व में भारत का स्थान।", color: "cyan", icon: "Globe" },
  { slug: "social-cooperation", nameEn: "Social Cooperation", nameHi: "सामाजिक सहकार", description: "Community, samajik samrasta, and cooperation.", descriptionHi: "समुदाय, सामाजिक समरसता एवं सहकार।", color: "teal", icon: "HeartHandshake" },
  { slug: "indian-languages", nameEn: "Indian Languages", nameHi: "भारतीय भाषाएँ", description: "Bharatiya languages and their literatures.", descriptionHi: "भारतीय भाषाएँ एवं उनका साहित्य।", color: "fuchsia", icon: "Languages" },
  { slug: "world-languages", nameEn: "World Languages", nameHi: "वैश्विक भाषाएँ", description: "Global languages for engagement and outreach.", descriptionHi: "संवाद एवं प्रसार हेतु वैश्विक भाषाएँ।", color: "sky", icon: "Languages" },
  { slug: "translation", nameEn: "Translation", nameHi: "अनुवाद", description: "Translation of texts and scholarly works.", descriptionHi: "ग्रंथों एवं विद्वत कार्यों का अनुवाद।", color: "purple", icon: "ArrowLeftRight" },
  { slug: "vedic-knowledge", nameEn: "Vedic Knowledge", nameHi: "वैदिक ज्ञान", description: "Vedic sciences and knowledge systems.", descriptionHi: "वैदिक विज्ञान एवं ज्ञान प्रणालियाँ।", color: "amber", icon: "Flame" },
  { slug: "culture-arts", nameEn: "Culture & Arts", nameHi: "संस्कृति एवं कला", description: "Performing, visual, and literary arts.", descriptionHi: "प्रदर्शन, दृश्य एवं साहित्यिक कलाएँ।", color: "pink", icon: "Palette" },
  { slug: "education", nameEn: "Education", nameHi: "शिक्षा", description: "Bharatiya pedagogy and education reform.", descriptionHi: "भारतीय शिक्षण-पद्धति एवं शिक्षा सुधार।", color: "blue", icon: "GraduationCap" },
  { slug: "scientific-temper", nameEn: "Scientific Temper", nameHi: "वैज्ञानिक दृष्टि", description: "Science, technology, and indigenous innovation.", descriptionHi: "विज्ञान, प्रौद्योगिकी एवं स्वदेशी नवाचार।", color: "indigo", icon: "FlaskConical" },
  { slug: "youth-development", nameEn: "Youth Development", nameHi: "युवा विकास", description: "Engaging and developing young karyakartas.", descriptionHi: "युवा कार्यकर्ताओं का संलग्नता एवं विकास।", color: "orange", icon: "Sparkles" },
  { slug: "women-empowerment", nameEn: "Women Empowerment", nameHi: "महिला सशक्तिकरण", description: "Matri shakti and women's leadership.", descriptionHi: "मातृशक्ति एवं महिला नेतृत्व।", color: "rose", icon: "Heart" },
  { slug: "local-self-governance", nameEn: "Local Self-Governance", nameHi: "स्थानीय स्वराज", description: "Gram swaraj and decentralised governance.", descriptionHi: "ग्राम स्वराज एवं विकेंद्रित शासन।", color: "emerald", icon: "Building2" },
];

async function main() {
  console.log("Seeding Vishay taxonomy…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "vishayas" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "slug" varchar(160) NOT NULL,
      "name_en" varchar(256) NOT NULL,
      "name_hi" varchar(256) NOT NULL,
      "description" text,
      "description_hi" text,
      "parent_vishay_id" uuid,
      "color" varchar(32) DEFAULT 'slate' NOT NULL,
      "icon" varchar(48) DEFAULT 'Hash' NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "vishayas_org_slug_uq" UNIQUE ("org_id", "slug")
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "vishayas_org_idx" ON "vishayas" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "vishayas_parent_idx" ON "vishayas" ("parent_vishay_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "vishayas_sort_idx" ON "vishayas" ("sort_order")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "content_vishaya_map" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "vishay_id" uuid NOT NULL REFERENCES "vishayas"("id") ON DELETE cascade,
      "content_type" varchar(32) NOT NULL,
      "content_id" uuid NOT NULL,
      "created_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "cvm_unique_link" UNIQUE ("vishay_id", "content_type", "content_id")
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "cvm_content_idx" ON "content_vishaya_map" ("content_type", "content_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "cvm_vishay_idx" ON "content_vishaya_map" ("vishay_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "cvm_org_idx" ON "content_vishaya_map" ("org_id")`;

  console.log("  [1/2] Tables ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  let count = 0;
  for (let i = 0; i < vishayas.length; i++) {
    const v = vishayas[i];
    await sql`
      INSERT INTO "vishayas"
        ("org_id", "slug", "name_en", "name_hi", "description", "description_hi",
         "color", "icon", "is_active", "sort_order")
      VALUES
        (${orgId}, ${v.slug}, ${v.nameEn}, ${v.nameHi}, ${v.description}, ${v.descriptionHi},
         ${v.color}, ${v.icon}, true, ${i})
      ON CONFLICT ("org_id", "slug") DO UPDATE SET
        "name_en" = EXCLUDED."name_en",
        "name_hi" = EXCLUDED."name_hi",
        "description" = EXCLUDED."description",
        "description_hi" = EXCLUDED."description_hi",
        "color" = EXCLUDED."color",
        "icon" = EXCLUDED."icon",
        "sort_order" = EXCLUDED."sort_order",
        "updated_at" = now()
    `;
    count += 1;
  }

  console.log(`  [2/2] Seeded ${count} vishayas.`);
  console.log("\nVishay taxonomy seed complete.\n");
}

main().catch((err) => {
  console.error("Vishay seed failed:", err);
  process.exit(1);
});
