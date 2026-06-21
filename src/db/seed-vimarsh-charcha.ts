/**
 * src/db/seed-vimarsh-charcha.ts
 * Idempotently creates `vimarsh_threads` and `vimarsh_thread_replies` tables
 * and seeds sample discussion threads with replies.
 *
 * Run: npx dotenv -e .env.local -- npx tsx src/db/seed-vimarsh-charcha.ts
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

type ThreadSeed = {
  slug: string;
  title: string;
  titleHi: string;
  body: string;
  bodyHi: string;
  category: string;
  isPinned: boolean;
  replies: { body: string; bodyHi?: string }[];
};

const threads: ThreadSeed[] = [
  {
    slug: "bharatiya-shiksha-ki-prasangikta",
    title: "Bharatiya Shiksha ki Prasangikta",
    titleHi: "भारतीय शिक्षा की प्रासंगिकता",
    body: "What does it mean to reclaim an Indian approach to education in the 21st century? How do we move beyond colonial frameworks while staying globally competitive? Let's discuss concrete ideas for curriculum reform, pedagogy, and institutional culture.",
    bodyHi: "21वीं सदी में शिक्षा के प्रति भारतीय दृष्टिकोण को पुनः स्थापित करने का क्या अर्थ है? औपनिवेशिक ढाँचों से आगे बढ़ते हुए वैश्विक स्तर पर प्रतिस्पर्धी कैसे रहें? पाठ्यक्रम सुधार, शिक्षण विधि और संस्थागत संस्कृति के लिए ठोस विचारों पर चर्चा करें।",
    category: "Education",
    isPinned: true,
    replies: [
      {
        body: "I think the first step is to re-centre Indian languages in higher education. English dominance creates a barrier for students from rural backgrounds who have brilliant ideas but cannot express them fluently in English. We need a genuine bilingual model.",
      },
      {
        body: "Agreed. But we also need to re-examine what we teach in history and social sciences. The current textbooks still follow a colonial periodisation and framing. We need indigenous frameworks that take our civilisational experience seriously.",
      },
    ],
  },
  {
    slug: "grameen-vikas-ke-naye-aayam",
    title: "Gramin Vikas ke Naye Aayam",
    titleHi: "ग्रामीण विकास के नए आयाम",
    body: "Rural development in India cannot be a top-down government programme alone. What role can volunteer networks and intellectual circles play in catalysing sustainable change at the village level? Share your experiences and ideas.",
    bodyHi: "भारत में ग्रामीण विकास केवल सरकारी कार्यक्रम नहीं हो सकता। गाँव स्तर पर सतत परिवर्तन को उत्प्रेरित करने में स्वयंसेवी नेटवर्क और बौद्धिक मंडल क्या भूमिका निभा सकते हैं? अपने अनुभव और विचार साझा करें।",
    category: "Social Development",
    isPinned: false,
    replies: [
      {
        body: "I've seen that study circles in villages work remarkably well. When young people gather to discuss local issues through the lens of Indian thinkers, they naturally start taking ownership of solutions. The key is consistent mentorship.",
      },
    ],
  },
  {
    slug: "virasat-aur-vigyan-samvaad",
    title: "Virasat aur Vigyan: Samvaad",
    titleHi: "विरासत और विज्ञान : संवाद",
    body: "Is there a genuine conflict between traditional Indian knowledge systems and modern science? Or can they complement each other? Let's explore examples from mathematics, astronomy, medicine, and ecology where ancient insights align with or anticipate modern discoveries.",
    bodyHi: "क्या पारंपरिक भारतीय ज्ञान प्रणालियों और आधुनिक विज्ञान के बीच वास्तविक विरोध है? या वे एक-दूसरे की पूरक हो सकती हैं? गणित, खगोल विज्ञान, चिकित्सा और पारिस्थितिकी के उदाहरणों का अन्वेषण करें जहाँ प्राचीन अंतर्दृष्टियाँ आधुनिक खोजों से मेल खाती हैं या उनका पूर्वानुमान करती हैं।",
    category: "Science & Culture",
    isPinned: false,
    replies: [
      {
        body: "The work on ancient Indian mathematics is very promising. From the Sulba Sutras to Ramanujan, there's a continuous thread. But we need more rigorous academic work to bridge traditional and modern mathematical frameworks.",
      },
      {
        body: "I'd add that in ecology and sustainable living, traditional Indian practices like water harvesting, forest management, and organic farming have a lot to teach modern sustainability science. It's not just historical — it's practical.",
      },
    ],
  },
  {
    slug: "yuvakon-ka-desh-nirmaan-mein-yogdan",
    title: "Yuvakon ka Desh Nirmaan mein Yogdan",
    titleHi: "युवकों का देश निर्माण में योगदान",
    body: "How can young karyakartas meaningfully contribute to national reconstruction beyond electoral politics? What skills, knowledge, and networks should they build? This thread is for young members to share their journeys and seek guidance.",
    bodyHi: "युवा कार्यकर्ता चुनावी राजनीति से परे राष्ट्र निर्माण में सार्थक योगदान कैसे दे सकते हैं? उन्हें कौन-से कौशल, ज्ञान और नेटवर्क विकसित करने चाहिए? यह सूत्र युवा सदस्यों के लिए है कि वे अपनी यात्राएँ साझा करें और मार्गदर्शन प्राप्त करें।",
    category: "Youth",
    isPinned: false,
    replies: [],
  },
];

async function main() {
  console.log("Seeding Vimarsh Charcha…\n");

  await sql`
    CREATE TABLE IF NOT EXISTS "vimarsh_threads" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "slug" varchar(180) NOT NULL UNIQUE,
      "title" varchar(300) NOT NULL,
      "title_hi" varchar(300) NOT NULL,
      "body" text DEFAULT '' NOT NULL,
      "body_hi" text DEFAULT '' NOT NULL,
      "category" varchar(64) DEFAULT 'General' NOT NULL,
      "author_user_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "is_pinned" boolean DEFAULT false NOT NULL,
      "is_closed" boolean DEFAULT false NOT NULL,
      "reply_count" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "vimarsh_threads_org_idx" ON "vimarsh_threads" ("org_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "vimarsh_threads_category_idx" ON "vimarsh_threads" ("category")`;
  await sql`CREATE INDEX IF NOT EXISTS "vimarsh_threads_created_at_idx" ON "vimarsh_threads" ("created_at")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "vimarsh_thread_replies" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "org_id" uuid NOT NULL REFERENCES "org_settings"("id") ON DELETE cascade,
      "thread_id" uuid NOT NULL REFERENCES "vimarsh_threads"("id") ON DELETE cascade,
      "author_user_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
      "body" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "vimarsh_replies_thread_idx" ON "vimarsh_thread_replies" ("thread_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "vimarsh_replies_org_idx" ON "vimarsh_thread_replies" ("org_id")`;

  console.log("  [1/3] Tables ready.");

  const orgRows = (await sql`SELECT id FROM "org_settings" WHERE "org_code" = ${ORG_CODE} LIMIT 1`) as { id: string }[];
  const orgId = orgRows[0]?.id;
  if (!orgId) {
    console.error(`  Org "${ORG_CODE}" not found. Run the base seed first.`);
    process.exit(1);
  }

  const profileRows = (await sql`
    SELECT id FROM "profiles" WHERE "email" = 'admin@pragyapravah.local' AND "org_id" = ${orgId} LIMIT 1
  `) as { id: string }[];
  const authorId = profileRows[0]?.id ?? null;
  if (!authorId) {
    console.warn("  Admin profile not found; threads will have NULL author.");
  }

  let threadCount = 0;
  let replyCount = 0;

  for (const t of threads) {
    const replyTotal = t.replies.length;

    await sql`
      INSERT INTO "vimarsh_threads"
        ("org_id", "slug", "title", "title_hi", "body", "body_hi", "category",
         "author_user_id", "is_pinned", "is_closed", "reply_count")
      VALUES
        (${orgId}, ${t.slug}, ${t.title}, ${t.titleHi}, ${t.body}, ${t.bodyHi}, ${t.category},
         ${authorId}, ${t.isPinned}, false, ${replyTotal})
      ON CONFLICT ("slug") DO UPDATE SET
        "title" = EXCLUDED."title",
        "title_hi" = EXCLUDED."title_hi",
        "body" = EXCLUDED."body",
        "body_hi" = EXCLUDED."body_hi",
        "category" = EXCLUDED."category",
        "is_pinned" = EXCLUDED."is_pinned",
        "reply_count" = EXCLUDED."reply_count",
        "updated_at" = now()
    `;
    threadCount += 1;

    if (replyTotal > 0) {
      const threadRows = (await sql`
        SELECT id FROM "vimarsh_threads" WHERE "slug" = ${t.slug} AND "org_id" = ${orgId} LIMIT 1
      `) as { id: string }[];
      const threadId = threadRows[0]?.id;
      if (!threadId) continue;

      for (const r of t.replies) {
        await sql`
          INSERT INTO "vimarsh_thread_replies"
            ("org_id", "thread_id", "author_user_id", "body")
          VALUES
            (${orgId}, ${threadId}, ${authorId}, ${r.body})
          ON CONFLICT DO NOTHING
        `;
        replyCount += 1;
      }
    }
  }

  console.log(`  [2/3] Seeded ${threadCount} threads.`);
  console.log(`  [3/3] Seeded ${replyCount} replies.`);
  console.log("\nVimarsh Charcha seed complete.\n");
}

main().catch((err) => {
  console.error("Vimarsh Charcha seed failed:", err);
  process.exit(1);
});
