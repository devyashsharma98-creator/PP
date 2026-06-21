/**
 * src/db/seed-campus.ts
 * Idempotently creates the `campus_units` table and seeds curated sample units.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-campus.ts
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

type SeedCampusUnit = {
  slug: string;
  name: string;
  nameHi: string;
  unitType: string;
  city: string | null;
  state: string | null;
  coordinatorName: string | null;
  coordinatorNameHi: string | null;
  coordinatorEmail: string | null;
  coordinatorPhone: string | null;
  memberCount: number;
  status: string;
  focusAreas: string[];
  establishedYear: string | null;
  description: string;
  descriptionHi: string;
  sortOrder: number;
};

const campusList: SeedCampusUnit[] = [
  {
    slug: "barkatullah-university",
    name: "Barkatullah University",
    nameHi: "बरकतउल्लाह विश्वविद्यालय",
    unitType: "University",
    city: "Bhopal",
    state: "Madhya Pradesh",
    coordinatorName: "Dr. Arvind Tiwari",
    coordinatorNameHi: "डॉ. अरविंद तिवारी",
    coordinatorEmail: "arvind.tiwari@bubhopal.ac.in",
    coordinatorPhone: "+91-9425012345",
    memberCount: 120,
    status: "Active",
    focusAreas: ["Study Circles", "Seminars", "Debates", "Publications"],
    establishedYear: "1970",
    description: "One of the oldest universities in central India with strong humanities and social sciences faculty, hosting active student intellectual circles.",
    descriptionHi: "मध्य भारत के सबसे पुराने विश्वविद्यालयों में से एक, जिसमें मजबूत मानविकी और सामाजिक विज्ञान संकाय है, सक्रिय छात्र बौद्धिक मंडलों का आयोजन।",
    sortOrder: 0,
  },
  {
    slug: "maulana-azad-national-institute-of-technology",
    name: "Maulana Azad National Institute of Technology",
    nameHi: "मौलाना आज़ाद राष्ट्रीय प्रौद्योगिकी संस्थान",
    unitType: "Institute",
    city: "Bhopal",
    state: "Madhya Pradesh",
    coordinatorName: "Prof. Suresh Gupta",
    coordinatorNameHi: "प्रो. सुरेश गुप्ता",
    coordinatorEmail: "suresh.gupta@manit.ac.in",
    coordinatorPhone: "+91-9893012345",
    memberCount: 85,
    status: "Active",
    focusAreas: ["Seminars", "Outreach", "Study Circles"],
    establishedYear: "1960",
    description: "Premier technical institute with an active cultural and intellectual forum engaging students beyond curriculum.",
    descriptionHi: "प्रतिष्ठित तकनीकी संस्थान जिसमें पाठ्यक्रम से परे छात्रों को जोड़ने वाला सक्रिय सांस्कृतिक और बौद्धिक मंच है।",
    sortOrder: 1,
  },
  {
    slug: "govt-science-college-jabalpur",
    name: "Government Science College, Jabalpur",
    nameHi: "शासकीय विज्ञान महाविद्यालय, जबलपुर",
    unitType: "College",
    city: "Jabalpur",
    state: "Madhya Pradesh",
    coordinatorName: "Dr. Meena Chauhan",
    coordinatorNameHi: "डॉ. मीना चौहान",
    coordinatorEmail: "meena.chauhan@gmail.com",
    coordinatorPhone: null,
    memberCount: 55,
    status: "Active",
    focusAreas: ["Debates", "Publications", "Outreach"],
    establishedYear: "1956",
    description: "Leading science college with a vibrant debate and publication culture, producing many national-level thinkers.",
    descriptionHi: "अग्रणी विज्ञान महाविद्यालय जिसमें जीवंत बहस और प्रकाशन संस्कृति है, जो कई राष्ट्रीय स्तर के विचारक तैयार करता है।",
    sortOrder: 2,
  },
  {
    slug: "vikram-university-ujjain",
    name: "Vikram University",
    nameHi: "विक्रम विश्वविद्यालय",
    unitType: "University",
    city: "Ujjain",
    state: "Madhya Pradesh",
    coordinatorName: null,
    coordinatorNameHi: null,
    coordinatorEmail: null,
    coordinatorPhone: null,
    memberCount: 40,
    status: "Forming",
    focusAreas: ["Study Circles", "Seminars"],
    establishedYear: "1957",
    description: "Historic university in the ancient city of Ujjain; a new campus unit is being organised with faculty support.",
    descriptionHi: "प्राचीन उज्जैन शहर में ऐतिहासिक विश्वविद्यालय; संकाय समर्थन के साथ एक नई परिसर इकाई का आयोजन किया जा रहा है।",
    sortOrder: 3,
  },
  {
    slug: "govt-holkar-science-college",
    name: "Government Holkar Science College",
    nameHi: "शासकीय होलकर विज्ञान महाविद्यालय",
    unitType: "College",
    city: "Indore",
    state: "Madhya Pradesh",
    coordinatorName: "Prof. Rajesh Joshi",
    coordinatorNameHi: "प्रो. राजेश जोशी",
    coordinatorEmail: "rajesh.joshi@holkarcollege.edu.in",
    coordinatorPhone: "+91-9826012345",
    memberCount: 70,
    status: "Active",
    focusAreas: ["Seminars", "Debates", "Publications", "Outreach"],
    establishedYear: "1891",
    description: "One of India's oldest science colleges with a storied tradition of intellectual discourse and student-led initiatives.",
    descriptionHi: "भारत के सबसे पुराने विज्ञान महाविद्यालयों में से एक, जिसमें बौद्धिक चर्चा और छात्र-नेतृत्व वाली पहलों की गौरवशाली परंपरा है।",
    sortOrder: 4,
  },
  {
    slug: "govt-engineering-college-gwalior",
    name: "Government Engineering College, Gwalior",
    nameHi: "शासकीय अभियांत्रिकी महाविद्यालय, ग्वालियर",
    unitType: "Institute",
    city: "Gwalior",
    state: "Madhya Pradesh",
    coordinatorName: null,
    coordinatorNameHi: null,
    coordinatorEmail: null,
    coordinatorPhone: null,
    memberCount: 0,
    status: "Dormant",
    focusAreas: [],
    establishedYear: "1998",
    description: "Unit activities currently paused due to coordinator transition; planned for reactivation next academic year.",
    descriptionHi: "समन्वयक परिवर्तन के कारण इकाई गतिविधियाँ वर्तमान में स्थगित; अगले शैक्षणिक वर्ष में पुनः सक्रियण की योजना।",
    sortOrder: 5,
  },
];

async function main() {
  console.log("Seeding Campus Ikai…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "campus_units" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "slug" varchar(160) NOT NULL UNIQUE,
      "name" varchar(256) NOT NULL,
      "name_hi" varchar(256) NOT NULL,
      "unit_type" varchar(48) DEFAULT 'College' NOT NULL,
      "city" varchar(128),
      "state" varchar(128),
      "coordinator_name" varchar(256),
      "coordinator_name_hi" varchar(256),
      "coordinator_email" varchar(320),
      "coordinator_phone" varchar(32),
      "member_count" integer DEFAULT 0 NOT NULL,
      "status" varchar(32) DEFAULT 'Active' NOT NULL,
      "focus_areas" text[] DEFAULT '{}'::text[] NOT NULL,
      "established_year" varchar(16),
      "description" text DEFAULT '' NOT NULL,
      "description_hi" text DEFAULT '' NOT NULL,
      "is_published" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "campus_units_org_idx" ON "campus_units" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "campus_units_status_idx" ON "campus_units" ("status")`;
  await sql`CREATE INDEX IF NOT EXISTS "campus_units_sort_idx" ON "campus_units" ("sort_order")`;
  console.log("  [1/2] Table ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  let i = 0;
  for (const u of campusList) {
    await sql`
      INSERT INTO "campus_units"
        ("org_id", "slug", "name", "name_hi", "unit_type", "city", "state",
         "coordinator_name", "coordinator_name_hi", "coordinator_email", "coordinator_phone",
         "member_count", "status", "focus_areas", "established_year",
         "description", "description_hi", "sort_order")
      VALUES
        (${orgId}, ${u.slug}, ${u.name}, ${u.nameHi}, ${u.unitType}, ${u.city}, ${u.state},
         ${u.coordinatorName}, ${u.coordinatorNameHi}, ${u.coordinatorEmail}, ${u.coordinatorPhone},
         ${u.memberCount}, ${u.status}, ${u.focusAreas}, ${u.establishedYear},
         ${u.description}, ${u.descriptionHi}, ${u.sortOrder})
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "name_hi" = EXCLUDED."name_hi",
        "unit_type" = EXCLUDED."unit_type",
        "city" = EXCLUDED."city",
        "state" = EXCLUDED."state",
        "coordinator_name" = EXCLUDED."coordinator_name",
        "coordinator_name_hi" = EXCLUDED."coordinator_name_hi",
        "coordinator_email" = EXCLUDED."coordinator_email",
        "coordinator_phone" = EXCLUDED."coordinator_phone",
        "member_count" = EXCLUDED."member_count",
        "status" = EXCLUDED."status",
        "focus_areas" = EXCLUDED."focus_areas",
        "established_year" = EXCLUDED."established_year",
        "description" = EXCLUDED."description",
        "description_hi" = EXCLUDED."description_hi",
        "sort_order" = EXCLUDED."sort_order",
        "updated_at" = now()
    `;
    i += 1;
  }
  console.log(`  [2/2] Seeded ${campusList.length} campus units.`);
  console.log("\nCampus Ikai seed complete.\n");
}

main().catch((err) => {
  console.error("Campus Ikai seed failed:", err);
  process.exit(1);
});
