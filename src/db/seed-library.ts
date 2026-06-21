/**
 * src/db/seed-library.ts
 * Idempotently creates the `library_texts` table (this project syncs schema via
 * drizzle-kit push, so we apply the table directly to avoid the stale-snapshot
 * migration conflict) and seeds the curated foundational IKS texts.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-library.ts
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

type SeedBook = {
  slug: string;
  title: string;
  titleHi: string;
  author: string;
  category: string;
  pages: number;
  year: string;
  rating: number;
  description: string;
  descriptionHi: string;
  coverColor: string;
};

const books: SeedBook[] = [
  { slug: "arthashastra", title: "Arthashastra", titleHi: "अर्थशास्त्र", author: "Kautilya", category: "Rajneeti", pages: 320, year: "~300 BCE", rating: 5, description: "Ancient treatise on statecraft, economic policy and military strategy.", descriptionHi: "राजनीति, अर्थनीति और सैन्य रणनीति पर प्राचीन ग्रंथ।", coverColor: "from-amber-600 to-orange-700" },
  { slug: "rasaratna-samucchaya", title: "Rasaratna Samucchaya", titleHi: "रसरत्न समुच्चय", author: "Vagbhata", category: "Rasashastra", pages: 280, year: "13th Century", rating: 4, description: "Classical text on Indian alchemy and medicinal chemistry.", descriptionHi: "भारतीय रसायन शास्त्र और औषधीय रसायन विज्ञान पर शास्त्रीय ग्रंथ।", coverColor: "from-yellow-600 to-amber-700" },
  { slug: "vastu-shastra-vimarsh", title: "Vastu Shastra Vimarsh", titleHi: "वास्तु शास्त्र विमर्श", author: "Various", category: "Vastu", pages: 190, year: "Modern", rating: 4, description: "Comprehensive overview of Vastu science and its modern applications.", descriptionHi: "वास्तु विज्ञान और उसके आधुनिक अनुप्रयोगों का व्यापक अवलोकन।", coverColor: "from-sky-600 to-blue-700" },
  { slug: "brihat-samhita", title: "Brihat Samhita", titleHi: "बृहत्संहिता", author: "Varahamihira", category: "Jyotish", pages: 410, year: "6th Century", rating: 5, description: "Encyclopedic work covering astronomy, astrology, weather, and architecture.", descriptionHi: "खगोल विज्ञान, ज्योतिष, मौसम और वास्तुकला पर विश्वकोशीय रचना।", coverColor: "from-violet-600 to-purple-700" },
  { slug: "charaka-samhita", title: "Charaka Samhita", titleHi: "चरक संहिता", author: "Charaka", category: "Ayurveda", pages: 520, year: "~100 BCE", rating: 5, description: "Foundational text of Ayurveda covering diagnosis, treatment and medicine.", descriptionHi: "आयुर्वेद का मूलभूत ग्रंथ — निदान, चिकित्सा और औषधि।", coverColor: "from-emerald-600 to-green-700" },
  { slug: "shulba-sutras", title: "Shulba Sutras", titleHi: "शुल्ब सूत्र", author: "Various Rishis", category: "Ganit", pages: 140, year: "~800 BCE", rating: 4, description: "Ancient mathematical texts on geometry for altar construction.", descriptionHi: "वेदी निर्माण हेतु ज्यामिति पर प्राचीन गणितीय ग्रंथ।", coverColor: "from-cyan-600 to-teal-700" },
  { slug: "surya-siddhanta", title: "Surya Siddhanta", titleHi: "सूर्य सिद्धांत", author: "Mayasura", category: "Vigyan", pages: 240, year: "~400 CE", rating: 5, description: "Ancient astronomical treatise — planetary positions, eclipses, time calculation.", descriptionHi: "प्राचीन खगोलीय ग्रंथ — ग्रह स्थिति, ग्रहण और काल गणना।", coverColor: "from-orange-500 to-red-600" },
  { slug: "yoga-sutras", title: "Yoga Sutras", titleHi: "योग सूत्र", author: "Patanjali", category: "Darshan", pages: 195, year: "~200 BCE", rating: 5, description: "Foundational text on yoga philosophy — eight limbs of yoga.", descriptionHi: "योग दर्शन का मूल ग्रंथ — अष्टांग योग।", coverColor: "from-indigo-500 to-blue-700" },
  { slug: "natyashastra", title: "Natyashastra", titleHi: "नाट्यशास्त्र", author: "Bharata Muni", category: "Kala", pages: 360, year: "~200 BCE", rating: 4, description: "Comprehensive treatise on performing arts — drama, dance, music.", descriptionHi: "प्रदर्शन कला पर व्यापक ग्रंथ — नाटक, नृत्य, संगीत।", coverColor: "from-rose-500 to-pink-700" },
];

async function main() {
  console.log("Seeding E-Library...\n");

  // 1. Create the table + indexes if not present (mirrors src/db/schema/library.ts).
  await sql`
    CREATE TABLE IF NOT EXISTS "library_texts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "slug" varchar(160) NOT NULL UNIQUE,
      "title" varchar(256) NOT NULL,
      "title_hi" varchar(256) NOT NULL,
      "author" varchar(256) NOT NULL,
      "category" varchar(64) NOT NULL,
      "pages" integer DEFAULT 0 NOT NULL,
      "year" varchar(64) DEFAULT '' NOT NULL,
      "rating" integer DEFAULT 0 NOT NULL,
      "description" text DEFAULT '' NOT NULL,
      "description_hi" text DEFAULT '' NOT NULL,
      "cover_color" varchar(128) DEFAULT 'from-amber-600 to-orange-700' NOT NULL,
      "read_url" text,
      "download_url" text,
      "storage_key" varchar(1024),
      "is_published" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "library_texts_org_idx" ON "library_texts" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "library_texts_category_idx" ON "library_texts" ("category")`;
  await sql`CREATE INDEX IF NOT EXISTS "library_texts_published_idx" ON "library_texts" ("is_published")`;
  await sql`CREATE INDEX IF NOT EXISTS "library_texts_sort_idx" ON "library_texts" ("sort_order")`;
  console.log("  [1/2] Table ready.");

  // 2. Resolve org, then upsert the curated texts (idempotent on slug).
  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  let i = 0;
  for (const b of books) {
    await sql`
      INSERT INTO "library_texts"
        ("org_id", "slug", "title", "title_hi", "author", "category", "pages", "year", "rating", "description", "description_hi", "cover_color", "sort_order")
      VALUES
        (${orgId}, ${b.slug}, ${b.title}, ${b.titleHi}, ${b.author}, ${b.category}, ${b.pages}, ${b.year}, ${b.rating}, ${b.description}, ${b.descriptionHi}, ${b.coverColor}, ${i})
      ON CONFLICT ("slug") DO UPDATE SET
        "title" = EXCLUDED."title",
        "title_hi" = EXCLUDED."title_hi",
        "author" = EXCLUDED."author",
        "category" = EXCLUDED."category",
        "pages" = EXCLUDED."pages",
        "year" = EXCLUDED."year",
        "rating" = EXCLUDED."rating",
        "description" = EXCLUDED."description",
        "description_hi" = EXCLUDED."description_hi",
        "cover_color" = EXCLUDED."cover_color",
        "sort_order" = EXCLUDED."sort_order",
        "updated_at" = now()
    `;
    i += 1;
  }
  console.log(`  [2/2] Seeded ${books.length} texts.`);
  console.log("\nE-Library seed complete.\n");
}

main().catch((err) => {
  console.error("E-Library seed failed:", err);
  process.exit(1);
});
