/**
 * src/db/seed-scholars.ts
 * Idempotently creates the `scholars` table and seeds curated sample scholars.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-scholars.ts
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

type SeedScholar = {
  slug: string;
  name: string;
  nameHi: string;
  email: string | null;
  phone: string | null;
  expertise: string[];
  affiliation: string | null;
  affiliationHi: string | null;
  designation: string | null;
  city: string | null;
  bio: string;
  bioHi: string;
  availableFor: string[];
  sortOrder: number;
};

const scholarsList: SeedScholar[] = [
  {
    slug: "ramesh-sharma",
    name: "Dr. Ramesh Sharma",
    nameHi: "डॉ. रमेश शर्मा",
    email: "ramesh.sharma@example.com",
    phone: "+91-9876543210",
    expertise: ["History", "Culture", "Philosophy"],
    affiliation: "Bhopal University",
    affiliationHi: "भोपाल विश्वविद्यालय",
    designation: "Professor",
    city: "Bhopal",
    bio: "Eminent historian specialising in ancient Bharatiya civilisation, with over three decades of research in epigraphy and numismatics.",
    bioHi: "प्राचीन भारतीय सभ्यता के विशेषज्ञ प्रसिद्ध इतिहासकार, अभिलेख और मुद्राशास्त्र में तीन दशकों का शोध।",
    availableFor: ["Writing", "Speaking", "Reviewing"],
    sortOrder: 0,
  },
  {
    slug: "anita-deshmukh",
    name: "Dr. Anita Deshmukh",
    nameHi: "डॉ. अनीता देशमुख",
    email: "anita.deshmukh@example.com",
    phone: null,
    expertise: ["Economics", "Education"],
    affiliation: "Indian Institute of Economic Studies",
    affiliationHi: "भारतीय आर्थिक अध्ययन संस्थान",
    designation: "Associate Professor",
    city: "Delhi",
    bio: "Development economist focused on sustainable rural livelihoods and indigenous economic systems.",
    bioHi: "सतत ग्रामीण आजीविका और स्वदेशी आर्थिक प्रणालियों पर केंद्रित विकास अर्थशास्त्री।",
    availableFor: ["Writing", "Mentoring"],
    sortOrder: 1,
  },
  {
    slug: "vikram-singh",
    name: "Vikram Singh",
    nameHi: "विक्रम सिंह",
    email: "vikram.singh@example.com",
    phone: "+91-9988776655",
    expertise: ["Geopolitics", "Science"],
    affiliation: "Centre for Strategic Studies",
    affiliationHi: "सामरिक अध्ययन केंद्र",
    designation: "Senior Fellow",
    city: "New Delhi",
    bio: "Strategic affairs analyst researching geopolitical implications of technology policy and Indo-Pacific security.",
    bioHi: "प्रौद्योगिकी नीति और हिंद-प्रशांत सुरक्षा के भू-राजनीतिक निहितार्थों पर शोध करने वाले सामरिक मामलों के विश्लेषक।",
    availableFor: ["Speaking", "Writing"],
    sortOrder: 2,
  },
  {
    slug: "meera-choudhary",
    name: "Prof. Meera Choudhary",
    nameHi: "प्रो. मीरा चौधरी",
    email: "meera.choudhary@example.com",
    phone: null,
    expertise: ["Philosophy", "Education", "Culture"],
    affiliation: "National Sanskrit University",
    affiliationHi: "राष्ट्रीय संस्कृत विश्वविद्यालय",
    designation: "Professor & Dean",
    city: "Jaipur",
    bio: "Scholar of Indian philosophy and comparative religion, leading curriculum reform for integrating traditional knowledge systems.",
    bioHi: "भारतीय दर्शन और तुलनात्मक धर्म की विद्वान, पारंपरिक ज्ञान प्रणालियों के एकीकरण हेतु पाठ्यक्रम सुधार का नेतृत्व।",
    availableFor: ["Reviewing", "Mentoring", "Speaking"],
    sortOrder: 3,
  },
  {
    slug: "arun-prakash",
    name: "Dr. Arun Prakash",
    nameHi: "डॉ. अरुण प्रकाश",
    email: "arun.prakash@example.com",
    phone: "+91-9876123456",
    expertise: ["Science", "History"],
    affiliation: "Indian Institute of Science",
    affiliationHi: "भारतीय विज्ञान संस्थान",
    designation: "Visiting Scientist",
    city: "Bangalore",
    bio: "Interdisciplinary researcher bridging ancient Bharatiya mathematical traditions with modern computational methods.",
    bioHi: "प्राचीन भारतीय गणितीय परंपराओं को आधुनिक कम्प्यूटेशनल विधियों से जोड़ने वाले अंतर-विषयक शोधकर्ता।",
    availableFor: ["Writing", "Reviewing", "Mentoring"],
    sortOrder: 4,
  },
  {
    slug: "priya-iyengar",
    name: "Priya Iyengar",
    nameHi: "प्रिया अयंगर",
    email: null,
    phone: null,
    expertise: ["Culture", "Education"],
    affiliation: "Bharatiya Kala Kendra",
    affiliationHi: "भारतीय कला केंद्र",
    designation: "Cultural Curator",
    city: "Chennai",
    bio: "Curator and documentation specialist preserving indigenous performing arts traditions through digital archives.",
    bioHi: "डिजिटल अभिलेखों के माध्यम से स्वदेशी प्रदर्शन कला परंपराओं के संरक्षण में संग्रहकर्ता और दस्तावेज़ीकरण विशेषज्ञ।",
    availableFor: ["Speaking", "Mentoring"],
    sortOrder: 5,
  },
];

async function main() {
  console.log("Seeding Vidvat Mandal…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "scholars" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "slug" varchar(160) NOT NULL UNIQUE,
      "name" varchar(256) NOT NULL,
      "name_hi" varchar(256) NOT NULL,
      "email" varchar(320),
      "phone" varchar(32),
      "expertise" text[] DEFAULT '{}'::text[] NOT NULL,
      "affiliation" varchar(256),
      "affiliation_hi" varchar(256),
      "designation" varchar(128),
      "city" varchar(128),
      "bio" text DEFAULT '' NOT NULL,
      "bio_hi" text DEFAULT '' NOT NULL,
      "available_for" text[] DEFAULT '{}'::text[] NOT NULL,
      "photo_url" text,
      "linked_profile_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "is_published" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "scholars_org_idx" ON "scholars" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "scholars_published_idx" ON "scholars" ("is_published")`;
  await sql`CREATE INDEX IF NOT EXISTS "scholars_sort_idx" ON "scholars" ("sort_order")`;
  console.log("  [1/2] Table ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  let i = 0;
  for (const s of scholarsList) {
    await sql`
      INSERT INTO "scholars"
        ("org_id", "slug", "name", "name_hi", "email", "phone", "expertise", "affiliation", "affiliation_hi", "designation", "city", "bio", "bio_hi", "available_for", "sort_order")
      VALUES
        (${orgId}, ${s.slug}, ${s.name}, ${s.nameHi}, ${s.email}, ${s.phone}, ${s.expertise}, ${s.affiliation}, ${s.affiliationHi}, ${s.designation}, ${s.city}, ${s.bio}, ${s.bioHi}, ${s.availableFor}, ${s.sortOrder})
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "name_hi" = EXCLUDED."name_hi",
        "email" = EXCLUDED."email",
        "phone" = EXCLUDED."phone",
        "expertise" = EXCLUDED."expertise",
        "affiliation" = EXCLUDED."affiliation",
        "affiliation_hi" = EXCLUDED."affiliation_hi",
        "designation" = EXCLUDED."designation",
        "city" = EXCLUDED."city",
        "bio" = EXCLUDED."bio",
        "bio_hi" = EXCLUDED."bio_hi",
        "available_for" = EXCLUDED."available_for",
        "sort_order" = EXCLUDED."sort_order",
        "updated_at" = now()
    `;
    i += 1;
  }
  console.log(`  [2/2] Seeded ${scholarsList.length} scholars.`);
  console.log("\nVidvat Mandal seed complete.\n");
}

main().catch((err) => {
  console.error("Vidvat Mandal seed failed:", err);
  process.exit(1);
});
