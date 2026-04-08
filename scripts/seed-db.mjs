// Database Seed Script for Pragya Pravah
// Run: $env:DATABASE_URL = "your-neon-url"; node scripts/seed-db.mjs

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL or NEON_DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ── Use the existing org from org_settings ─────────────────────────────────
const ORG_ID = "2121eceb-1e2b-459f-acbe-cb6ed38c0ec6";

const UNIT_IDS = {
  bhopal: "00000000-0000-4000-a000-000000000010",
  vidisha: "00000000-0000-4000-a000-000000000011",
  sehore: "00000000-0000-4000-a000-000000000012",
  raisen: "00000000-0000-4000-a000-000000000013",
  hoshangabad: "00000000-0000-4000-a000-000000000014",
};

const USER_IDS = {
  vibhag: "00000000-0000-4000-b000-000000000001",
  aayam: "00000000-0000-4000-b000-000000000002",
  unithead: "00000000-0000-4000-b000-000000000003",
  karyakarta: "00000000-0000-4000-b000-000000000004",
};

const ROLE_IDS = {
  vibhag_pramukh: "00000000-0000-4000-c000-000000000001",
  aayam_pramukh: "00000000-0000-4000-c000-000000000002",
  unit_head: "00000000-0000-4000-c000-000000000003",
  karyakarta: "00000000-0000-4000-c000-000000000004",
};

async function seed() {
  console.log("🌱 Seeding Pragya Pravah database...\n");

  // ── 1. Units ───────────────────────────────────────────────────────────
  console.log("  → Creating units...");
  const units = [
    { id: UNIT_IDS.bhopal, code: "BPL", name: "Bhopal Shahar", kind: "unit" },
    { id: UNIT_IDS.vidisha, code: "VDS", name: "Vidisha", kind: "zila" },
    { id: UNIT_IDS.sehore, code: "SEH", name: "Sehore", kind: "zila" },
    { id: UNIT_IDS.raisen, code: "RSN", name: "Raisen", kind: "zila" },
    { id: UNIT_IDS.hoshangabad, code: "HSB", name: "Hoshangabad", kind: "zila" },
  ];
  for (const u of units) {
    await sql`
      INSERT INTO public.units (id, org_id, code, name, unit_kind)
      VALUES (${u.id}, ${ORG_ID}, ${u.code}, ${u.name}, ${u.kind})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, unit_kind = EXCLUDED.unit_kind, code = EXCLUDED.code
    `;
  }

  // ── 2. Roles ───────────────────────────────────────────────────────────
  console.log("  → Creating roles...");
  const roles = [
    { id: ROLE_IDS.vibhag_pramukh, code: "vibhag_pramukh", name: "Vibhag Pramukh", nameHi: "विभाग प्रमुख" },
    { id: ROLE_IDS.aayam_pramukh, code: "aayam_pramukh", name: "Aayam Pramukh", nameHi: "आयाम प्रमुख" },
    { id: ROLE_IDS.unit_head, code: "unit_head", name: "Unit Head", nameHi: "इकाई प्रमुख" },
    { id: ROLE_IDS.karyakarta, code: "karyakarta", name: "Karyakarta", nameHi: "कार्यकर्ता" },
  ];
  for (const r of roles) {
    await sql`
      INSERT INTO public.roles (id, code, name, name_hi)
      VALUES (${r.id}, ${r.code}, ${r.name}, ${r.nameHi})
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, name_hi = EXCLUDED.name_hi
    `;
  }

  // Fetch the actual role IDs (they may differ from our seed IDs if roles pre-existed)
  const dbRoles = await sql`SELECT id, code FROM public.roles WHERE code IN ('vibhag_pramukh','aayam_pramukh','unit_head','karyakarta')`;
  const roleIdByCode = {};
  for (const r of dbRoles) roleIdByCode[r.code] = r.id;

  // ── 3. User Profiles ──────────────────────────────────────────────────
  console.log("  → Creating user profiles...");
  const users = [
    { id: USER_IDS.vibhag, email: "demo.vibhag@example.com", name: "Dr. Ramesh Shukla" },
    { id: USER_IDS.aayam, email: "demo.aayam@example.com", name: "Sunita Sharma" },
    { id: USER_IDS.unithead, email: "demo.unithead@example.com", name: "Vikram Patel" },
    { id: USER_IDS.karyakarta, email: "demo.karyakarta@example.com", name: "Priya Mishra" },
  ];
  for (const u of users) {
    await sql`
      INSERT INTO public.profiles (id, org_id, email, display_name, is_active)
      VALUES (${u.id}, ${ORG_ID}, ${u.email}, ${u.name}, true)
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, is_active = true
    `;
  }

  // ── 4. Role Assignments ────────────────────────────────────────────────
  console.log("  → Assigning roles...");
  const assignments = [
    { userId: USER_IDS.vibhag, roleId: roleIdByCode["vibhag_pramukh"], scopeType: "org", orgId: ORG_ID, unitId: null, isPrimary: true },
    { userId: USER_IDS.aayam, roleId: roleIdByCode["aayam_pramukh"], scopeType: "org", orgId: ORG_ID, unitId: null, isPrimary: true },
    { userId: USER_IDS.unithead, roleId: roleIdByCode["unit_head"], scopeType: "unit", orgId: ORG_ID, unitId: UNIT_IDS.bhopal, isPrimary: true },
    { userId: USER_IDS.karyakarta, roleId: roleIdByCode["karyakarta"], scopeType: "unit", orgId: ORG_ID, unitId: UNIT_IDS.bhopal, isPrimary: true },
  ];
  for (const a of assignments) {
    // Delete existing assignments for this user first to avoid duplicates
    await sql`DELETE FROM public.user_role_assignments WHERE user_id = ${a.userId} AND role_id = ${a.roleId}`;
    await sql`
      INSERT INTO public.user_role_assignments (user_id, role_id, scope_type, org_id, unit_id, is_primary)
      VALUES (${a.userId}, ${a.roleId}, ${a.scopeType}, ${a.orgId}, ${a.unitId}, ${a.isPrimary})
    `;
  }

  // ── 5. Sample Events ──────────────────────────────────────────────────
  console.log("  → Creating sample events...");
  // Check if events already exist
  const existingEvents = await sql`SELECT count(*) as cnt FROM public.events`;
  if (parseInt(existingEvents[0].cnt) === 0) {
    const events = [
      {
        title: "Yuva Sangam - Youth Leadership Summit",
        desc: "Annual youth leadership and skill development summit for college students across Bhopal division.",
        unitId: UNIT_IDS.bhopal, status: "authorized_public", date: "2026-02-15T10:00:00+05:30",
        submittedBy: USER_IDS.unithead, submittedByName: "Vikram Patel",
      },
      {
        title: "Vaidik Ganit Karyashala",
        desc: "Workshop on ancient Indian mathematics - Vedic Maths techniques for competitive exams.",
        unitId: UNIT_IDS.vidisha, status: "pending_aayam_review", date: "2026-03-01T09:00:00+05:30",
        submittedBy: USER_IDS.karyakarta, submittedByName: "Priya Mishra",
      },
      {
        title: "Samajik Samarasta Sammelan",
        desc: "Community harmony conference promoting social cohesion and cultural integration.",
        unitId: UNIT_IDS.sehore, status: "pending_vibhag_review", date: "2026-03-10T11:00:00+05:30",
        submittedBy: USER_IDS.karyakarta, submittedByName: "Priya Mishra",
      },
      {
        title: "Bharatiya Vigyan Pradarshani",
        desc: "Exhibition showcasing contributions of ancient India to science, metallurgy, and architecture.",
        unitId: UNIT_IDS.raisen, status: "authorized_public", date: "2026-03-20T10:00:00+05:30",
        submittedBy: USER_IDS.unithead, submittedByName: "Vikram Patel",
      },
      {
        title: "Gram Vikas Charcha",
        desc: "Rural development dialogue focusing on self-reliance and sustainable village economy.",
        unitId: UNIT_IDS.hoshangabad, status: "draft", date: "2026-02-28T14:00:00+05:30",
        submittedBy: USER_IDS.karyakarta, submittedByName: "Priya Mishra",
      },
    ];
    for (const ev of events) {
      await sql`
        INSERT INTO public.events (
          org_id, unit_id, title, description, status, starts_at,
          submitted_by_user_id, submitted_by_name_snapshot,
          checklist, created_by, updated_by
        ) VALUES (
          ${ORG_ID}, ${ev.unitId}, ${ev.title}, ${ev.desc}, ${ev.status}, ${ev.date},
          ${ev.submittedBy}, ${ev.submittedByName},
          '{"designing":true,"food":true,"seating":true,"transport":false,"accommodation":false,"soundMic":true,"camera":true,"screen":true,"lights":true}'::jsonb,
          ${ev.submittedBy}, ${ev.submittedBy}
        )
      `;
    }
    console.log("    ✓ 5 events created");
  } else {
    console.log(`    ⏭ Skipped (${existingEvents[0].cnt} events already exist)`);
  }

  // ── 6. Sample Articles ─────────────────────────────────────────────────
  console.log("  → Creating sample articles...");
  const existingArticles = await sql`SELECT count(*) as cnt FROM public.articles`;
  if (parseInt(existingArticles[0].cnt) === 0) {
    const articles = [
      {
        title: "भारतीय ज्ञान परंपरा और आधुनिक शिक्षा",
        content: "भारत की प्राचीन ज्ञान परंपरा — गुरुकुल, वेद, उपनिषद — आधुनिक शिक्षा को एक नई दिशा दे सकती है।",
        summary: "How ancient Indian knowledge systems can inform modern educational practices.",
        author: USER_IDS.aayam, authorName: "Sunita Sharma", category: "Shodh", status: "authorized_public",
      },
      {
        title: "Swadeshi Movement: Lessons for Atmanirbhar Bharat",
        content: "The historical Swadeshi movement carries profound lessons for modern India.",
        summary: "Drawing parallels between the Swadeshi movement and modern self-reliance.",
        author: USER_IDS.karyakarta, authorName: "Priya Mishra", category: "Vimarsh", status: "pending_unit_head_review",
      },
      {
        title: "Vedic Mathematics in Competitive Exams",
        content: "Vedic Math sutras provide powerful shortcuts for competitive exams.",
        summary: "Practical application of Vedic Math sutras for faster calculation.",
        author: USER_IDS.unithead, authorName: "Vikram Patel", category: "Shodh", status: "pending_aayam_review",
      },
    ];
    for (const art of articles) {
      await sql`
        INSERT INTO public.articles (
          org_id, title, content, summary, category, status,
          author_user_id, author_name_snapshot,
          values_checklist, created_by, updated_by
        ) VALUES (
          ${ORG_ID}, ${art.title}, ${art.content}, ${art.summary}, ${art.category}, ${art.status},
          ${art.author}, ${art.authorName},
          '{"rashtraPratham":true,"culturallyGrounded":true,"balancedTone":true,"noDivisiveContent":true}'::jsonb,
          ${art.author}, ${art.author}
        )
      `;
    }
    console.log("    ✓ 3 articles created");
  } else {
    console.log(`    ⏭ Skipped (${existingArticles[0].cnt} articles already exist)`);
  }

  // ── 7. Vimarsh Topics ──────────────────────────────────────────────────
  console.log("  → Creating vimarsh topics...");
  const existingTopics = await sql`SELECT count(*) as cnt FROM public.vimarsh_topics`;
  if (parseInt(existingTopics[0].cnt) === 0) {
    const vimarshTopics = [
      { title: "राष्ट्रीय शिक्षा नीति 2020", desc: "NEP 2020 के भारतीय ज्ञान परंपरा से जुड़े प्रावधानों पर विमर्श।", order: 1 },
      { title: "Decolonising the Indian Mind", desc: "Critical examination of colonial frameworks in modern Indian thought.", order: 2 },
      { title: "भारतीय अर्थव्यवस्था और स्वदेशी", desc: "Atmanirbhar Bharat and the economics of self-reliance.", order: 3 },
      { title: "Environmental Dharma", desc: "Exploring Bharatiya perspectives on ecological stewardship.", order: 4 },
    ];
    for (const t of vimarshTopics) {
      await sql`
        INSERT INTO public.vimarsh_topics (title, description, sort_order)
        VALUES (${t.title}, ${t.desc}, ${t.order})
      `;
    }
    console.log("    ✓ 4 vimarsh topics created");
  } else {
    console.log(`    ⏭ Skipped (${existingTopics[0].cnt} topics already exist)`);
  }

  console.log("\n✅ Seed complete! Demo accounts:");
  console.log("   Email                           Password         Role");
  console.log("   ─────────────────────────────── ──────────────── ─────────────────");
  console.log("   demo.vibhag@example.com         Password123!     Vibhag Pramukh");
  console.log("   demo.aayam@example.com          Password123!     Aayam Pramukh");
  console.log("   demo.unithead@example.com       Password123!     Unit Head");
  console.log("   demo.karyakarta@example.com     Password123!     Karyakarta");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
