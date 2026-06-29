/**
 * src/db/seed-demo.ts
 * Seeds demo data across all modules so the demo account has content to interact with.
 * Run AFTER the base seed: npx tsx src/db/seed.ts && npx tsx src/db/seed-demo.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.js";
import { eq, and } from "drizzle-orm";

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

async function seedDemo() {
  console.log("Seeding demo data...\n");

  // --- Resolve existing entities ---
  const org = await db.query.orgSettings.findFirst({
    where: eq(schema.orgSettings.orgCode, process.env.APP_ORG_CODE ?? "bhopal_vibhag"),
  });
  if (!org) throw new Error("Org not found. Run base seed first.");
  const orgId = org.id;

  const admin = await db.query.profiles.findFirst({
    where: eq(schema.profiles.email, process.env.APP_LOCAL_ADMIN_EMAIL ?? "admin@pragyapravah.local"),
  });
  if (!admin) throw new Error("Admin not found. Run base seed first.");
  const adminId = admin.id;

  const unit = await db.query.units.findFirst({ where: eq(schema.units.orgId, orgId) });
  if (!unit) throw new Error("No unit found. Run base seed first.");
  const unitId = unit.id;

  const aayams = await db.query.departmentsOrAayams.findMany({ where: eq(schema.departmentsOrAayams.orgId, orgId) });
  const aayamByCode = Object.fromEntries(aayams.map((a) => [a.code, a.id]));

  const superAdminRole = await db.query.roles.findFirst({ where: eq(schema.roles.code, "super_admin") });
  if (!superAdminRole) throw new Error("super_admin role not found");

  // ── 1. Locations ──
  console.log("  [1/9] Locations...");
  const locationDefs = [
    { name: "Pragya Bhavan", nameHi: "प्रज्ञा भवन", address: "123, Civil Lines", city: "Bhopal", state: "Madhya Pradesh" },
    { name: "Bharat Mandapam", nameHi: "भारत मंडपम", address: "Pragati Maidan", city: "New Delhi", state: "Delhi" },
    { name: "Vidya Vikas Kendra", nameHi: "विद्या विकास केन्द्र", address: "45, Arera Colony", city: "Bhopal", state: "Madhya Pradesh" },
    { name: "Gyan Sarovar", nameHi: "ज्ञान सरोवर", address: "Mount Abu", city: "Sirohi", state: "Rajasthan" },
  ];
  const locationIds: string[] = [];
  for (const loc of locationDefs) {
    const existing = await db.query.locations.findFirst({ where: and(eq(schema.locations.orgId, orgId), eq(schema.locations.name, loc.name)) });
    if (!existing) {
      const [inserted] = await db.insert(schema.locations).values({ orgId, ...loc }).returning();
      locationIds.push(inserted.id);
    } else {
      locationIds.push(existing.id);
    }
  }

  // ── 2. Events ──
  console.log("  [2/9] Events...");
  const eventDefs = [
    { title: "Bharatiya Chintan Shivir", titleHi: "भारतीय चिंतन शिविर", status: "authorized_public" as const, startsAt: new Date("2026-07-15T09:00:00Z"), endsAt: new Date("2026-07-17T17:00:00Z"), locationId: locationIds[3], description: "Three-day residential camp on Bharatiya intellectual traditions and their contemporary relevance.", departmentId: aayamByCode["vimarsh"] },
    { title: "Yuva Samvad Karyakram", titleHi: "युवा संवाद कार्यक्रम", status: "pending_aayam_review" as const, startsAt: new Date("2026-08-05T10:00:00Z"), endsAt: new Date("2026-08-05T16:00:00Z"), locationId: locationIds[0], description: "Dialogue session with youth on the theme of cultural identity and nation-building.", departmentId: aayamByCode["yuva"] },
    { title: "Shodh Prakashan Samaroh", titleHi: "शोध प्रकाशन समारोह", status: "draft" as const, startsAt: new Date("2026-09-10T11:00:00Z"), endsAt: new Date("2026-09-10T14:00:00Z"), locationId: locationIds[1], description: "Publication ceremony for research papers on Indian knowledge systems.", departmentId: aayamByCode["shodh"] },
    { title: "Mahila Sashaktikaran Sammelan", titleHi: "महिला सशक्तिकरण सम्मेलन", status: "submitted_by_unit" as const, startsAt: new Date("2026-10-01T09:00:00Z"), endsAt: new Date("2026-10-01T17:00:00Z"), locationId: locationIds[2], description: "Conference on women empowerment through Bharatiya values.", departmentId: aayamByCode["mahila"] },
    { title: "Prachar Abhiyan Baithak", titleHi: "प्रचार अभियान बैठक", status: "draft" as const, startsAt: new Date("2026-06-20T15:00:00Z"), endsAt: new Date("2026-06-20T18:00:00Z"), locationId: locationIds[0], description: "Planning meeting for the upcoming outreach campaign across Bhopal Vibhag.", departmentId: aayamByCode["prachar"] },
  ];
  const eventIds: string[] = [];
  for (const evt of eventDefs) {
    const existingEvent = await db.query.events.findFirst({
      where: and(eq(schema.events.orgId, orgId), eq(schema.events.title, evt.title)),
    });
    if (existingEvent) {
      eventIds.push(existingEvent.id);
      continue;
    }

    const [event] = await db.insert(schema.events).values({
      orgId, unitId, departmentId: evt.departmentId, locationId: evt.locationId,
      title: evt.title, description: evt.description, status: evt.status,
      startsAt: evt.startsAt, endsAt: evt.endsAt,
      createdBy: adminId, submittedByNameSnapshot: admin.displayName,
      checklist: { designing: true, food: false, seating: true, transport: false, accommodation: false, soundMic: true, camera: true, screen: true, lights: false },
    }).returning();
    eventIds.push(event.id);

    await db.insert(schema.eventStatusHistory).values({ eventId: event.id, fromStatus: null, toStatus: evt.status, actorUserId: adminId, actorNameSnapshot: admin.displayName });

    if (evt.status === "authorized_public") {
      await db.insert(schema.eventFormConfigs).values({ eventId: event.id, isEnabled: true, isPublic: true, collectPhone: true, collectCity: true, collectAttendingCount: true });
      await db.insert(schema.eventFormQuestions).values({ eventId: event.id, questionKey: "expectations", label: "What do you hope to learn?", questionType: "textarea", isRequired: false, displayOrder: 1 });

      await db.insert(schema.eventRegistrations).values({ eventId: event.id, name: "Ravi Sharma", phone: "+91-9876543210", email: "ravi@example.com", city: "Bhopal", attendingCount: 2 });
      await db.insert(schema.eventRegistrations).values({ eventId: event.id, name: "Sita Verma", phone: "+91-9876543211", email: "sita@example.com", city: "Indore", attendingCount: 1 });

      const [poll] = await db.insert(schema.eventPolls).values({ eventId: event.id, question: "Best time for next camp?", pollType: "general", createdBy: adminId }).returning();
      const [opt1] = await db.insert(schema.eventPollOptions).values({ pollId: poll.id, label: "January 2027", displayOrder: 0 }).returning();
      const [opt2] = await db.insert(schema.eventPollOptions).values({ pollId: poll.id, label: "June 2027", displayOrder: 1 }).returning();
      await db.insert(schema.eventPollVotes).values({ pollId: poll.id, optionId: opt1.id, submittedBy: adminId });
      await db.insert(schema.eventPollVotes).values({ pollId: poll.id, optionId: opt2.id });

      await db.insert(schema.eventVritt).values({ eventId: event.id, attendanceCount: 45, checkedInCount: 42, content: "The camp was a great success with participants from 5 states joining discussions on Bharatiya intellectual traditions.", status: "submitted", submittedBy: adminId });
    }
  }

  // ── 3. Articles ──
  console.log("  [3/9] Articles...");
  const articleDefs = [
    { title: "Bharatiya Jagran aur Samkaleen Chunautiyan", titleHi: "भारतीय जागरण और समकालीन चुनौतियाँ", summary: "An analysis of contemporary challenges facing Bharatiya renaissance.", content: "Bharat today stands at a unique crossroads...", category: "vimarsh", status: "authorized_public" as const, departmentId: aayamByCode["vimarsh"] },
    { title: "Yuva Pidi ka Kartavya", titleHi: "युवा पीढ़ी का कर्तव्य", summary: "The role and responsibilities of the youth in nation-building.", content: "The youth of Bharat must recognise their historical responsibility...", category: "yuva", status: "pending_unit_head_review" as const, departmentId: aayamByCode["yuva"] },
    { title: "Prachin Gyan Parampara", titleHi: "प्राचीन ज्ञान परम्परा", summary: "Exploring ancient Bharatiya knowledge systems.", content: "From the Vedas to the Upanishads, Bharat's intellectual heritage...", category: "shodh", status: "authorized_public" as const, departmentId: aayamByCode["shodh"] },
    { title: "Nari Shakti: Bharat ki Pragati mein Yogdan", titleHi: "नारी शक्ति: भारत की प्रगति में योगदान", summary: "The contribution of women power in Bharat's progress.", content: "Bharatiya women have always been at the forefront of social progress...", category: "mahila", status: "draft" as const, departmentId: aayamByCode["mahila"] },
    { title: "Prachar Kaushal Vikas", titleHi: "प्रचार कौशल विकास", summary: "Developing effective outreach skills for Prachar.", content: "Effective prachar requires understanding both the message and the medium...", category: "prachar", status: "returned_for_revision" as const, departmentId: aayamByCode["prachar"] },
  ];
  const articleIds: string[] = [];
  for (const art of articleDefs) {
    const [article] = await db.insert(schema.articles).values({
      orgId, unitId, departmentId: art.departmentId,
      title: art.title, summary: art.summary, content: art.content,
      category: art.category, status: art.status,
      authorUserId: adminId, authorNameSnapshot: admin.displayName,
      createdBy: adminId,
      valuesChecklist: { rashtraPratham: true, culturallyGrounded: true, balancedTone: true, noDivisiveContent: true },
      publishedAt: art.status === "authorized_public" ? new Date() : null,
    }).returning();
    articleIds.push(article.id);

    if (art.status === "authorized_public") {
      await db.insert(schema.articlePublications).values({ articleId: article.id, channel: "website", publishedBy: adminId, publishedUrl: `https://pragyapravah.org/aalekh/${article.id}` });
    }
    if (art.status === "returned_for_revision") {
      await db.insert(schema.articleReviews).values({ articleId: article.id, reviewStep: "pending_unit_head_review", reviewerUserId: adminId, reviewerNameSnapshot: admin.displayName, decision: "returned_for_revision", edits: "Please expand the section on outreach metrics.", reviewNotes: "Good draft but needs more data on campaign reach.", valuesChecklistSnapshot: { rashtraPratham: true, culturallyGrounded: true, balancedTone: true, noDivisiveContent: false } });
    }
    if (art.status === "pending_unit_head_review") {
      await db.insert(schema.articleReviews).values({ articleId: article.id, reviewStep: "pending_unit_head_review", reviewerUserId: adminId, reviewerNameSnapshot: admin.displayName, decision: "approved", reviewNotes: "Well written. Forwarding for aayam review." });
    }
  }

  // ── 4. Vimarsh Topics ──
  console.log("  [4/9] Vimarsh topics...");
  const topicDefs = [
    { title: "Atma Bodh aur Rashtra Chetna", titleHi: "आत्मबोध और राष्ट्र चेतना", description: "Self-awareness and national consciousness in Bharatiya thought.", group: "atma_bodh", resources: [{ title: "Swami Vivekananda on Nation Building", url: "https://example.com/vivekananda-nation" }, { title: "Bharatiya Darshan aur Adhunik Bharat", url: "https://example.com/bharatiya-darshan" }] },
    { title: "Samkaleen Bharat mein Vibhajanvad", titleHi: "समकालीन भारत में विभाजनवाद", description: "Understanding divisive forces in contemporary Bharat.", group: "forces_of_division", resources: [{ title: "Forces of Division: A Historical Analysis", url: "https://example.com/forces-division" }] },
    { title: "Yuva Vargon mein Jagrukta", titleHi: "युवा वर्गों में जागरुकता", description: "Awareness and engagement strategies for youth demographics.", group: "targeted_groups", resources: [] },
    { title: "Bharatiya Shiksha Paddhati", titleHi: "भारतीय शिक्षा पद्धति", description: "Exploring indigenous education systems and their relevance today.", group: "other", resources: [{ title: "Gurukul to Modern Education", url: "https://example.com/gurukul-modern" }, { title: "NEP 2020: A Bharatiya Vision", url: "https://example.com/nep-2020" }] },
    { title: "Paryavaran aur Sanskriti", titleHi: "पर्यावरण और संस्कृति", description: "The deep connection between environmental consciousness and Bharatiya culture.", group: "other", resources: [{ title: "Ecology in Ancient Indian Texts", url: "https://example.com/ecology-ancient" }] },
  ];
  for (const topic of topicDefs) {
    const existing = await db.query.vimarshTopics.findFirst({ where: and(eq(schema.vimarshTopics.orgId, orgId), eq(schema.vimarshTopics.title, topic.title)) });
    if (existing) continue;
    const [inserted] = await db.insert(schema.vimarshTopics).values({ orgId, title: topic.title, titleHi: topic.titleHi, description: topic.description, descriptionHi: topic.description, group: topic.group, sortOrder: 0, isActive: true }).returning();
    for (const res of topic.resources) {
      await db.insert(schema.vimarshResources).values({ orgId, topicId: inserted.id, title: res.title, url: res.url, resourceType: "external_link", isActive: true, sortOrder: 0 });
    }
  }

  // ── 5. Circulars ──
  console.log("  [5/9] Circulars...");
  const existingCirculars = await db.query.circulars.findMany({ where: eq(schema.circulars.orgId, orgId) });
  if (existingCirculars.length === 0) {
    await db.insert(schema.circulars).values({ orgId, title: "Vibhag Sanyojan Baithak", titleHi: "विभाग संयोजन बैठक", body: "All aayam pramukhs are requested to attend the monthly coordination meeting on 25th June.", bodyHi: "सभी आयाम प्रमुखों से अनुरोध है कि 25 जून को मासिक समन्वय बैठक में उपस्थित हों।", priority: "high", scope: "org", authorUserId: adminId, publishedAt: new Date() });
    await db.insert(schema.circulars).values({ orgId, title: "Prachar Abhiyan Guidelines", titleHi: "प्रचार अभियान दिशानिर्देश", body: "Updated guidelines for the upcoming outreach campaign have been published.", bodyHi: "आगामी प्रचार अभियान के लिए अद्यतन दिशानिर्देश प्रकाशित किए गए हैं।", priority: "urgent", scope: "org", authorUserId: adminId, publishedAt: new Date() });
    await db.insert(schema.circulars).values({ orgId, title: "Quarterly Progress Report", titleHi: "त्रैमासिक प्रगति रिपोर्ट", body: "All unit heads must submit their quarterly progress reports by 30th June.", bodyHi: "सभी इकाई प्रमुख 30 जून तक अपनी त्रैमासिक प्रगति रिपोर्ट प्रस्तुत करें।", priority: "normal", scope: "unit", scopeEntityId: unitId, authorUserId: adminId, publishedAt: new Date() });

    const firstCircular = await db.query.circulars.findFirst({
      where: and(eq(schema.circulars.orgId, orgId), eq(schema.circulars.title, "Vibhag Sanyojan Baithak")),
    });
    if (!firstCircular) throw new Error("Failed to seed the initial circular");

    await db.insert(schema.circularReads).values({ circularId: firstCircular.id, userId: adminId });
  }

  // ── 6. Projects & Tasks ──
  console.log("  [6/9] Projects & tasks...");
  const existingProjects = await db.query.projects.findMany({ where: eq(schema.projects.orgId, orgId) });
  if (existingProjects.length === 0) {
    const [project1] = await db.insert(schema.projects).values({ orgId, name: "Vibhag Sanyojan Abhiyan 2026", nameHi: "विभाग संयोजन अभियान 2026", description: "Coordinate all aayams for the annual outreach and discourse programs.", status: "active", departmentId: aayamByCode["prachar"], ownerUserId: adminId, createdBy: adminId, deadline: new Date("2026-12-31") }).returning();
    const [project2] = await db.insert(schema.projects).values({ orgId, name: "Shodh Prakashan Yojana", nameHi: "शोध प्रकाशन योजना", description: "Publish research papers on Bharatiya knowledge systems.", status: "planned", departmentId: aayamByCode["shodh"], ownerUserId: adminId, createdBy: adminId, deadline: new Date("2026-11-30") }).returning();

    await db.insert(schema.projectTasks).values({ projectId: project1.id, title: "Baithak ka Aayojan", titleHi: "बैठक का आयोजन", description: "Schedule and plan the monthly coordination meeting.", status: "done", priority: "high", assigneeUserId: adminId, createdBy: adminId, sortOrder: 0 });
    await db.insert(schema.projectTasks).values({ projectId: project1.id, title: "Aayamvad Karyakram", titleHi: "आयामवाद कार्यक्रम", description: "Plan aayam-level programs across yuva, mahila, shodh, prachar.", status: "in_progress", priority: "high", assigneeUserId: adminId, createdBy: adminId, sortOrder: 1 });
    await db.insert(schema.projectTasks).values({ projectId: project1.id, title: "Pracharnam Rekha", titleHi: "प्रचारणम रेखा", description: "Prepare outreach timeline for all major events.", status: "todo", priority: "medium", assigneeUserId: adminId, createdBy: adminId, sortOrder: 2 });

    await db.insert(schema.projectTasks).values({ projectId: project2.id, title: "Shodh Patra Sankalan", titleHi: "शोध पत्र संकलन", description: "Collect research papers from contributors.", status: "todo", priority: "high", assigneeUserId: adminId, createdBy: adminId, sortOrder: 0 });
    await db.insert(schema.projectTasks).values({ projectId: project2.id, title: "Sampadan Karya", titleHi: "सम्पादन कार्य", description: "Editorial review of submitted papers.", status: "todo", priority: "medium", assigneeUserId: adminId, createdBy: adminId, sortOrder: 1 });
    await db.insert(schema.projectTasks).values({ projectId: project2.id, title: "Prakashan Mudran", titleHi: "प्रकाशन मुद्रण", description: "Print and distribute the research volume.", status: "todo", priority: "low", assigneeUserId: adminId, createdBy: adminId, sortOrder: 2 });
  }

  // ── 7. Surveys ──
  console.log("  [7/9] Surveys...");
  const existingSurveys = await db.query.surveys.findMany({ where: eq(schema.surveys.orgId, orgId) });
  if (existingSurveys.length === 0) {
    const [survey1] = await db.insert(schema.surveys).values({ orgId, title: "Vibhag Karya Pradarshan Sarvekshan", titleHi: "विभाग कार्य प्रदर्शन सर्वेक्षण", description: "Feedback survey on vibhag-level program effectiveness.", status: "published", isPublic: true, createdBy: adminId, opensAt: new Date("2026-06-01"), closesAt: new Date("2026-08-31") }).returning();
    const [survey2] = await db.insert(schema.surveys).values({ orgId, title: "Yuva Vargon ki Jarurat", titleHi: "युवा वर्गों की ज़रूरत", description: "Understand needs and interests of youth in the vibhag.", status: "draft", isPublic: false, createdBy: adminId }).returning();

    await db.insert(schema.surveyQuestions).values({ surveyId: survey1.id, questionKey: "satisfaction", label: "Overall satisfaction with programs", questionType: "rating", isRequired: true, displayOrder: 0 });
    await db.insert(schema.surveyQuestions).values({ surveyId: survey1.id, questionKey: "improvements", label: "Suggestions for improvement", questionType: "textarea", isRequired: false, displayOrder: 1 });
    await db.insert(schema.surveyQuestions).values({ surveyId: survey1.id, questionKey: "aayam", label: "Which aayam are you associated with?", questionType: "select", isRequired: true, displayOrder: 2, optionsJson: { options: ["Yuva", "Mahila", "Shodh", "Prachar", "Vimarsh"] } });

    await db.insert(schema.surveyQuestions).values({ surveyId: survey2.id, questionKey: "interest_area", label: "Area of interest", questionType: "select", isRequired: true, displayOrder: 0, optionsJson: { options: ["Education", "Culture", "Social Work", "Research", "Outreach"] } });

    const [submission] = await db.insert(schema.surveySubmissions).values({ surveyId: survey1.id, respondentName: "Demo User", respondentEmail: "demo@example.com", submittedBy: adminId }).returning();
    await db.insert(schema.surveyAnswers).values({ submissionId: submission.id, questionKey: "satisfaction", value: "4" });
    await db.insert(schema.surveyAnswers).values({ submissionId: submission.id, questionKey: "aayam", value: "Vimarsh" });
  }

  // ── 8. Prachar Statuses ──
  console.log("  [8/9] Prachar statuses...");
  const platforms = ["whatsapp", "facebook", "instagram", "telegram"] as const;
  for (const eventId of eventIds) {
    const existing = await db.query.pracharStatuses.findFirst({ where: and(eq(schema.pracharStatuses.entityId, eventId), eq(schema.pracharStatuses.platform, "whatsapp")) });
    if (existing) continue;
    await db.insert(schema.pracharStatuses).values({ orgId, entityType: "event", entityId: eventId, platform: "whatsapp", isDone: true, doneAt: new Date(), doneBy: adminId });
    await db.insert(schema.pracharStatuses).values({ orgId, entityType: "event", entityId: eventId, platform: "facebook", isDone: false });
    await db.insert(schema.pracharStatuses).values({ orgId, entityType: "event", entityId: eventId, platform: "telegram", isDone: false });
  }
  for (const articleId of articleIds) {
    await db.insert(schema.pracharStatuses).values({ orgId, entityType: "article", entityId: articleId, platform: "whatsapp", isDone: true, doneAt: new Date(), doneBy: adminId });
    await db.insert(schema.pracharStatuses).values({ orgId, entityType: "article", entityId: articleId, platform: "instagram", isDone: false });
  }

  // ── 9. Activity Stream & Notifications ──
  console.log("  [9/9] Activity stream & notifications...");
  const existingActivities = await db.query.activityStream.findMany({ where: eq(schema.activityStream.orgId, orgId) });
  if (existingActivities.length === 0) {
    await db.insert(schema.activityStream).values({ orgId, action: "event.created", actorUserId: adminId, actorNameSnapshot: admin.displayName, entityType: "event", entityId: eventIds[0], summary: `Created event "${eventDefs[0].title}"` });
    await db.insert(schema.activityStream).values({ orgId, action: "article.published", actorUserId: adminId, actorNameSnapshot: admin.displayName, entityType: "article", entityId: articleIds[0], summary: `Published article "${articleDefs[0].title}"` });
    await db.insert(schema.activityStream).values({ orgId, action: "event.registration_received", actorUserId: adminId, actorNameSnapshot: admin.displayName, entityType: "event", entityId: eventIds[0], summary: "New registration received for Bharatiya Chintan Shivir from Ravi Sharma" });
    await db.insert(schema.activityStream).values({ orgId, action: "project.created", actorUserId: adminId, actorNameSnapshot: admin.displayName, entityType: "project", summary: "Created project 'Vibhag Sanyojan Abhiyan 2026'" });
    await db.insert(schema.activityStream).values({ orgId, action: "circular.published", actorUserId: adminId, actorNameSnapshot: admin.displayName, entityType: "circular", summary: "Published urgent circular 'Prachar Abhiyan Guidelines'" });

    await db.insert(schema.notifications).values({ orgId, recipientUserId: adminId, kind: "system", title: "Seed complete", body: "Demo data has been seeded successfully.", isRead: false });
    await db.insert(schema.notifications).values({ orgId, recipientUserId: adminId, kind: "event_status_change", title: "Event status changed", body: `Bharatiya Chintan Shivir was authorized for public view.`, entityType: "event", entityId: eventIds[0], isRead: false });
    await db.insert(schema.notifications).values({ orgId, recipientUserId: adminId, kind: "review_assigned", title: "Article review needed", body: "Yuva Pidi ka Kartavya is pending unit head review.", entityType: "article", entityId: articleIds[1], isRead: false });
  }

  console.log("\nDemo seed complete.\n");
  console.log("  Login with: admin@pragyapravah.local / Pragya@12345");
  console.log("  Demo data created for: Events, Articles, Vimarsh, Circulars, Projects, Surveys, Prachar, Activity");
  console.log("");
}

seedDemo().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
