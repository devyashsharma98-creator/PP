# Pragya Pravah UI — GAPFIX IMPLEMENTATION PLAN

> **Purpose**: Align the application with Prajna Pravah's actual intellectual mission.
> **Approach**: Incremental — each module can be built and shipped independently.
> **Tech Stack**: Next.js 16 + React + TypeScript + Tailwind + Drizzle + Neon (already in use)

---

## TABLE OF CONTENTS

1. [GAP 1: Prachar Redesign](#1-replace-prachar--prachar-vishleshan)
2. [GAP 2: Publications Editorial Module](#2-add-publications-editorial-module)
3. [GAP 3: Research Project Module](#3-add-research-project-management)
4. [GAP 4: Enhanced Calendar/Events](#4-replace-generic-calendar-with-intellectual-events)
5. [GAP 5: Campus Ikai Workflows](#5-add-campus-ikai-workflows)
6. [GAP 6: Task Board & Dashboard Enhancements](#6-enhance-dashboard--task-board)
7. [GAP 7: Content Taxonomy / Vishay](#7-add-content-taxonomy-vishay-system)
8. [GAP 8: Dashboard + Analytics Restructure](#8-restructure-dashboard-metrics)

---

## 1. REPLACE PRACHAR + PRACHAR VISHLESHAN

### Why
Current prachar tracks WhatsApp/Facebook/Instagram/Telegram — social media campaigning. Prajna Pravah's "prachar" is academic outreach: journals, conferences, newsletters, campus programs. Social media post completion has no connection to the org's intellectual mission.

### What to build
Replace the campaign + 4-platform tracker with a **Publication Outreach** workflow.

```
New Module: /prachar  (same URL, new page)
├── Pending Outreach tab
│   ├── Publication distribution cards
│   ├── Journal issue tracking
│   ├── Conference/seminar outreach
│   └── Campus program follow-up
├── Create Outreach tab
│   ├── Outreach type selector (Journal / Conference / Campus / Newsletter)
│   ├── Form per type
│   └── Template-based creation
└── Analytics tab (replaces Prachar Vishleshan)
    ├── Outreach completion rate
    ├── Per-type statistics
    └── Pending items count
```

### DB schema changes

```typescript
// New tables
export const outreachItems = pgTable("outreach_items", {
  id: text("id").primaryKey(),
  relatedType: text("related_type").notNull(), // 'event' | 'article' | 'publication' | 'conference'
  relatedId: text("related_id").notNull(),
  outreachType: text("outreach_type").notNull(), // 'journal' | 'conference' | 'campus' | 'newsletter' | 'seminar'
  title: text("title").notNull(),
  description: text("description"),
  unitId: text("unit_id"),
  departmentId: text("department_id"),
  status: text("status").default("pending"), // pending | in_progress | completed | skipped
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  skipReason: text("skip_reason"),
  templateReference: text("template_reference"),
  metadata: jsonb("metadata"), // flexible: distribution list, venue details, etc.
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const outreachTypeConfig = pgTable("outreach_type_config", {
  type: text("type").primaryKey(),
  labelEn: text("label_en").notNull(),
  labelHi: text("label_hi").notNull(),
  icon: text("icon"),
  color: text("color"),
  fields: jsonb("fields").notNull(), // defines required fields per type
});
```

### API routes to create

```
POST   /api/v1/outreach            → create outreach item
GET    /api/v1/outreach            → list with filters
PATCH  /api/v1/outreach/[id]      → update status/progress
DELETE /api/v1/outreach/[id]      → soft delete
GET    /api/v1/outreach/analytics  → completion stats
GET    /api/v1/outreach/types      → available outreach types with config
```

### New page component structure

```
src/components/pages/Prachar.tsx       (rewrite, keep file same)
src/components/pages/PracharVishleshan.tsx  (rewrite as Outreach Analytics)

New sub-files:
src/components/pages/prachar/
├── PracharCommandCenter.tsx    (masthead + context cards)
├── OutreachQueue.tsx           (pending/in-progress list)
├── OutreachCard.tsx            (individual outreach item card)
├── CreateOutreachDialog.tsx    (create/edit dialog)
├── OutreachTypeSelector.tsx    (type picker: Journal / Conf / Campus / Newsletter)
├── OutreachFormFields.tsx      (dynamic fields based on type)
├── OutreachAnalytics.tsx       (completion analytics)
└── hooks/
    └── use-outreach.ts         (API hooks)
```

### Outreach type definitions

```typescript
// src/lib/app/outreach-types.ts
export const OUTREACH_TYPES = {
  journal: {
    labelEn: "Journal Issue",
    labelHi: "पत्रिका अंक",
    icon: BookOpen,
    color: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    fields: [
      { key: "issueName", labelEn: "Issue Name", labelHi: "अंक का नाम", type: "text", required: true },
      { key: "issn", labelEn: "ISSN/Reference", labelHi: "ISSN/संदर्भ", type: "text", required: false },
      { key: "distributionList", labelEn: "Distribution List URL", labelHi: "वितरण सूची लिंक", type: "url", required: false },
      { key: "printCopies", labelEn: "Print Copies", labelHi: "मुद्रित प्रति", type: "number", required: false },
      { key: "digitalCopies", labelEn: "Digital Reach Target", labelHi: "डिजिटल पहुँच लक्ष्य", type: "number", required: false },
    ]
  },
  conference: {
    labelEn: "Conference / Seminar",
    labelHi: "सम्मेलन / संगोष्ठी",
    icon: Presentation,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    fields: [
      { key: "venue", labelEn: "Venue", labelHi: "स्थान", type: "text", required: true },
      { key: "dates", labelEn: "Dates", labelHi: "तिथियाँ", type: "daterange", required: true },
      { key: "speakers", labelEn: "Speakers Count", labelHi: "वक्ता संख्या", type: "number", required: false },
      { key: "participantsTarget", labelEn: "Participant Target", labelHi: "प्रतिभागी लक्ष्य", type: "number", required: false },
      { key: "proceedingsUrl", labelEn: "Proceedings URL", labelHi: "कार्यवृत्त लिंक", type: "url", required: false },
    ]
  },
  campus: {
    labelEn: "Campus Outreach",
    labelHi: "परिसर प्रसार",
    icon: GraduationCap,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    fields: [
      { key: "unitId", labelEn: "Campus Unit", labelHi: "परिसर इकाई", type: "select", required: true, source: "campus-units" },
      { key: "programType", labelEn: "Program Type", labelHi: "कार्यक्रम प्रकार", type: "select", required: true,
        options: ["Study Circle", "Workshop", "Guest Lecture", "Book Discussion", "Faculty Meet"] },
      { key: "contactPerson", labelEn: "Contact Person", labelHi: "सम्पर्क व्यक्ति", type: "text", required: false },
      { key: "followUpDate", labelEn: "Next Follow-up", labelHi: "अगला अनुवर्ती", type: "date", required: false },
    ]
  },
  newsletter: {
    labelEn: "Newsletter / Circular",
    labelHi: "समाचार पत्र / परिपत्र",
    icon: Newspaper,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    fields: [
      { key: "subject", labelEn: "Subject / Topic", labelHi: "विषय", type: "text", required: true },
      { key: "recipientGroup", labelEn: "Recipient Group", labelHi: "प्राप्तकर्ता समूह", type: "select", required: true,
        options: ["All Karyakartas", "Vibhag Level", "Unit Level", "Scholars", "Campus Units"] },
      { key: "medium", labelEn: "Medium", labelHi: "माध्यम", type: "multiselect", required: false,
        options: ["Email", "WhatsApp Group", "Physical Copy", "Website Post"] },
    ]
  },
  seminar: {
    labelEn: "Workshop / Shivir",
    labelHi: "कार्यशाला / शिविर",
    icon: FlaskConical,
    color: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    fields: [
      { key: "theme", labelEn: "Theme", labelHi: "विषय", type: "text", required: true },
      { key: "duration", labelEn: "Duration", labelHi: "अवधि", type: "select", required: true,
        options: ["1 day", "2 days", "3 days", "5 days", "7 days"] },
      { key: "participantsCount", labelEn: "Expected Participants", labelHi: "अपेक्षित प्रतिभागी", type: "number", required: false },
      { key: "resourcePersons", labelEn: "Resource Persons", labelHi: "स्रोत व्यक्ति", type: "text", required: false },
    ]
  },
};
```

### Outreach card UI contract

```
OutreachCard shows:
  - Type icon + color coding
  - Title (related event/article name)
  - Outreach type badge (Journal / Conference / Campus / Newsletter / Seminar)
  - Status chip (Pending / In Progress / Completed / Skipped)
  - Progress bar per type if multiple sub-items
  - Due date + relative time
  - Assigned to (if any)
  - Action buttons:
      [Mark Complete] [Skip (with reason)] [Edit] [View Details]
  - Skip reason shown inline if skipped
  - Expandable detail panel with type-specific fields
```

### Analytics page (replaces Prachar Vishleshan)

```
Outreach Analytics shows:
  - Overall completion rate %
  - Per-type breakdown (pie or bar chart):
      Journal: X/Y completed
      Conference: X/Y completed
      Campus: X/Y completed
      Newsletter: X/Y completed
      Seminar: X/Y completed
  - Trend over last 6 months
  - Top units/depts by outreach completion
  - Pending items count with warning chip
  - Open Prachar button → goes to Prachar pending tab
```

---

## 2. ADD PUBLICATIONS EDITORIAL MODULE

### Why
Aalekh is built as a role-chain approval workflow (Karyakarta → Unit → Aayam → Vibhag → Published). This is administrative, not editorial. Real scholarly publishing needs editorial boards, peer review, version control, and issue-based organization.

### What to build
New top-level module: **/prakashan** (Publications)

```
/prakashan
├── Publications Dashboard
│   ├── Issues in progress count
│   ├── Articles awaiting review count
│   ├── Upcoming issue deadlines
│   └── Recent publications
│
├── Publications Feed (public)
│   ├── Published issues
│   ├── Individual articles
│   └── Read / Download PDF
│
├── Editorial Board tab (admin/editor role)
│   ├── Active issues list
│   ├── Create new issue
│   ├── Invite articles to issue
│   └── Publish issue
│
│   ├── Article Queue tab (peer review)
│   │   ├── Submitted articles
│   │   ├── Under review
│   │   ├── Revision requested
│   │   └── Accepted / Rejected
│   │
│   ├── Create Article tab
│   │   ├── Title (EN + HI)
│   │   ├── Abstract (EN + HI)
│   │   ├── Full text (rich text or markdown)
│   │   ├── Vishay (subject) selector
│   │   ├── Co-authors selector
│   │   ├── References/Bibliography
│   │   ├── Attachment (PDF, DOC)
│   │   └── Submit for review
│   │
│   └── My Submissions tab (karyakarta view)
│       ├── Draft articles
│       ├── Under review
│       ├── Revision needed
│       └── Published
│
└── Settings tab (editorial board config)
    ├── Issue naming convention
    ├── Review process (single-blind / double-blind / open)
    └── Notification settings
```

### DB schema

```typescript
// Tables
export const publications = pgTable("publications", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  titleHi: text("title_hi").notNull(),
  subtitle: text("subtitle"),
  subtitleHi: text("subtitle_hi"),
  issueNumber: text("issue_number"), // e.g. "Vol.1 No.1" or "आइस্যू ०१"
  publishDate: text("publish_date"),
  coverImageUrl: text("cover_image_url"),
  description: text("description"),
  descriptionHi: text("description_hi"),
  status: text("status").notNull().default("draft"), // draft | preparing | reviewing | published
  visibility: text("visibility").default("public"), // public | restricted | internal
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const publicationArticles = pgTable("publication_articles", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").references(() => publications.id),
  title: text("title").notNull(),
  titleHi: text("title_hi").notNull(),
  abstract: text("abstract"),
  abstractHi: text("abstract_hi"),
  body: text("body").notNull(), // markdown or HTML
  bodyHi: text("body_hi"),
  authorIds: jsonb("author_ids").$type<string[]>(),
  vishay: text("vishay").array(),
  references: text("references"), // bibliography
  attachments: jsonb("attachments"), // {url, filename, type}
  status: text("status").notNull().default("submitted"), // submitted | under_review | revision_requested | accepted | rejected | published | withdrawn
  submittedBy: text("submitted_by").notNull(),
  submittedAt: text("submitted_at").notNull(),
  reviewerId: text("reviewer_id"),
  reviewDueDate: text("review_due_date"),
  reviewComment: text("review_comment"),
  reviewCommentHi: text("review_comment_hi"),
  reviewedAt: text("reviewed_at"),
  version: integer("version").default(1),
  previousVersionId: text("previous_version_id"),
  sortOrder: integer("sort_order"),
});

export const publicationReviewers = pgTable("publication_reviewers", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").references(() => publications.id),
  reviewerUserId: text("reviewer_user_id").notNull(),
  assignedAt: text("assigned_at").notNull(),
  status: text("status").default("pending"), // pending | completed | declined
});
```

### New page component structure

```
src/components/pages/
├── Publications.tsx               (main pagina)
├── prakashan/
│   ├── PublicationsDashboard.tsx
│   ├── PublicationFeed.tsx
│   ├── EditorialBoard.tsx
│   ├── ArticleQueue.tsx
│   ├── CreateArticleDialog.tsx
│   ├── CreateIssueDialog.tsx
│   ├── ArticleReviewPanel.tsx    (peer review interface)
│   ├── ArticleDetail.tsx
│   ├── ArticleCard.tsx
│   └── hooks/
│       └── use-publications.ts
```

### Peer review UI

```
ArticleReviewPanel:
  - Left: Article content (title, abstract, body, references)
  - Right: Review form
      ├── Overall rating (1-5 stars)
      ├── Recommendation: Accept / Minor Revision / Major Revision / Reject
      ├── Private notes to editor
      ├── Comments for author (shown after decision)
      ├── [Submit Review] button
  - If revision requested:
      ├── Author sees review comments
      ├── Revises and resubmits
      ├── Version increments
      └── New review cycle optional
```

### Navigation addition

Add to `src/lib/app/navigation.ts` reference group:
```typescript
{ label: "Publications", sublabel: "प्रकाशन", icon: BookOpen, path: "/prakashan", description: "Editorial & publishing", descriptionHi: "संपादकीय एवं प्रकाशन" }
```

---

## 3. ADD RESEARCH PROJECT MANAGEMENT

### Why
Prajna Pravah undertakes research projects: Indian civilization studies, geopolitics, history, philosophy, Sanskrit sciences. Currently NO module tracks research work. Everything is either an "event" or "article" — neither captures the research lifecycle.

### What to build
New module: **/shodh** (Research)

```
/shodh
├── Research Dashboard
│   ├── Active projects count
│   ├── Pending milestones count
│   ├── Publications output count
│   └── Team capacity view
│
├── Projects tab
│   ├── Project cards (expandable)
│   │   ├── Title + Vishay
│   │   ├── Status (Proposed | Active | Under Review | Completed | Published)
│   │   ├── Lead researcher
│   │   ├── Team members
│   │   ├── Start date + Expected completion
│   │   ├── Progress bar (milestone-based)
│   │   ├── Linked outputs (articles, publications)
│   │   └── Actions: [Add Milestone] [Add Output] [Edit] [Submit for Review]
│   │
│   ├── Create Project dialog
│   │   ├── Title (EN + HI)
│   │   ├── Vishay (subject area)
│   │   ├── Research question / objective
│   │   ├── Methodology brief
│   │   ├── Lead researcher (dropdown from scholars)
│   │   ├── Team (multi-select from scholars/directory)
│   │   ├── Start date / End date
│   │   ├── Budget (if applicable)
│   │   └── Expected outputs (article types, events)
│   │
│   └── Project detail view (expanded card)
│       ├── Overview tab
│       ├── Milestones tab
│       │   ├── Milestone list with status
│       │   ├── Add milestone form
│       │   │   ├── Title
│       │   │   ├── Description
│       │   │   ├── Due date
│       │   │   ├── Weight (% of project)
│       │   │   └── Deliverable type (report / article / presentation)
│       │   └── Mark complete / Upload deliverable
│       │
│       ├── Team tab (members, roles)
│       ├── Outputs tab (articles, publications linked to project)
│       └── Timeline tab (chronological log)
│
├── Milestones tab (global view)
│   ├── Kanban or list view
│   ├── Filter by project / person / status
│   └── Calendar view
│
└── Scholars tab (for research)
    └── Available scholars with expertise matching filters
```

### DB schema

```typescript
export const researchProjects = pgTable("research_projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  titleHi: text("title_hi"),
  objective: text("objective"),
  objectiveHi: text("objective_hi"),
  methodology: text("methodology"),
  methodologyHi: text("methodology_hi"),
  vishay: text("vishay").array().notNull().default([]),
  status: text("status").notNull().default("proposed"), // proposed | active | under_review | completed | published
  leadResearcherId: text("lead_researcher_id").references(() => scholars.id),
  teamIds: jsonb("team_ids").$type<string[]>(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  budget: text("budget"),
  expectedOutputs: jsonb("expected_outputs"), // array of output types
  actualOutputs: jsonb("actual_outputs"), // linked IDs
  progress: integer("progress").default(0), // 0-100
  submittedBy: text("submitted_by").notNull(),
  submittedAt: text("submitted_at").notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  reviewComment: text("review_comment"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const researchMilestones = pgTable("research_milestones", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => researchProjects.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  weight: integer("weight").default(0), // percentage of project
  deliverableType: text("deliverable_type"), // report | article | presentation | data
  deliverableUrl: text("deliverable_url"),
  status: text("status").notNull().default("pending"), // pending | in_progress | completed | overdue
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
});
```

### New page component structure

```
src/components/pages/
├── Shodh.tsx                    (main research page)
├── shodh/
│   ├── ResearchDashboard.tsx
│   ├── ProjectList.tsx
│   ├── ProjectCard.tsx
│   ├── CreateProjectDialog.tsx
│   ├── ProjectDetail.tsx
│   ├── MilestoneBoard.tsx
│   ├── MilestoneForm.tsx
│   ├── TeamView.tsx
│   └── hooks/
│       └── use-research.ts
```

### Navigation addition

Add to `src/lib/app/navigation.ts` workflow group:
```typescript
{ label: "Shodh", sublabel: "शोध", icon: FlaskConical, path: "/shodh", description: "Research projects", descriptionHi: "शोध परियोजनाएँ" }
```

---

## 4. REPLACE GENERIC CALENDAR WITH INTELLECTUAL EVENTS

### Why
Current calendar uses generic statuses and a food/seating/transport checklist. Prajna Pravah events include: shivirs (1-7 day camps), faculty development programs, Lokmanthan-scale conferences, book discussion sessions, guest lectures. They need different metadata per type.

### What to keep
- Calendar grid UI (month/week views)
- Search + filter architecture
- Deep linking (?event=)
- Role-based filtering

### What to change

#### Event type system
```typescript
// src/lib/app/event-types.ts
export const EVENT_TYPES = {
  study_circle: {
    labelEn: "Study Circle / Adhyayan Kendra",
    labelHi: "अध्ययन केंद्र",
    icon: BookOpen,
    defaultChecklist: ["reading_assigned", "discussion_held", "attendance_marked", "next_session_planned"],
    requiredFields: ["subject", "reading_material"],
  },
  shivir: {
    labelEn: "Shivir / Camp",
    labelHi: "शिविर",
    icon: Tent,
    defaultChecklist: ["venue_confirmed", "resource_persons", "participants_registered", "materials_ready", "food_arranged", "certificates_ready"],
    requiredFields: ["duration", "theme", "resource_persons"],
  },
  faculty_program: {
    labelEn: "Faculty Development Program",
    labelHi: "अध्यापक विकास कार्यक्रम",
    icon: GraduationCap,
    defaultChecklist: ["venue_confirmed", "speakers_confirmed", "participants_registered", "materials_ready", "certificates_ready", "feedback_collected"],
    requiredFields: ["duration", "subject", "resource_persons"],
  },
  conference: {
    labelEn: "Conference / Sammelan",
    labelHi: "सम्मेलन",
    icon: Users,
    defaultChecklist: ["venue_confirmed", "speakers_confirmed", "sessions_planned", "registration_open", "proceedings_planned"],
    requiredFields: ["venue", "dates", "sessions_count", "speakers"],
  },
  lecture: {
    labelEn: "Guest Lecture / Pravachan",
    labelHi: "अतिथि व्याख्यान / प्रवचन",
    icon: Mic,
    defaultChecklist: ["venue_confirmed", "speaker_confirmed", "publicity_done", "attendance_marked"],
    requiredFields: ["speaker", "topic", "venue"],
  },
  book_discussion: {
    labelEn: "Book Discussion / Granth Charcha",
    labelHi: "पुस्तक चर्चा",
    icon: BookOpen,
    defaultChecklist: ["book_selected", "discussion_led", "notes_taken", "next_session_planned"],
    requiredFields: ["book_title", "author", "discussion_leader"],
  },
};
```

#### Updated event form (inside UnitDashboardView)

Replace generic checklist with type-based:

```
Event Form tabs:
  Tab 1: "Basic Info" / मूल जानकारी
    - Title (EN + HI)
    - Event type selector (Study Circle / Shivir / FDP / Conference / Lecture / Book Discussion)
    - Date/Time
    - Location/Venue
    - Aayam selector
    - Unit selector
    - Description (EN + HI)

  Tab 2: "Program Details" / कार्यक्रम विवरण
    - Dynamic fields based on event type:
        Study Circle: subject, reading_material, session_number
        Shivir: theme, duration, resource_persons (multi), participants_target
        FDP: subject, resource_persons, participants_target, certification
        Conference: venue, dates (range), sessions_count, speakers, proceedings
        Lecture: speaker, topic, organizing_unit
        Book Discussion: book_title, author, discussion_leader, page_range
    - Attachments (syllabus, schedule PDF, speaker bios)

  Tab 3: "Arrangements" / व्यवस्थाएँ
    - Generic checklist (venue, food, transport, seating, sound, accommodation)
    - OR type-specific checklist auto-populated
    - Custom items can be added

  Tab 4: "Registration" / पंजीकरण
    - Form fields toggle (phone, city, attending_count, special_needs)
    - Custom questions (up to 10)
    - Poll for dates/venue (if needed)
    - Registration link copy/paste
```

### Calendar event detail modal enhancement

```
Enhanced EventDetailModal:
  - Event type badge (colored by type)
  - Status chip (role-dependent actions)
  - Program details section (type-specific)
  - Speaker/resource persons list (linked to scholars)
  - Attendance summary (from registrations)
  - Vritt section (post-event report)
  - Action buttons (role-dependent):
      Karyakarta: Submit for Review
      Unit Head: Edit Draft | Submit for Review
      Aayam Pramukh: Review | Forward to Vibhag
      Vibhag Pramukh: Forward to Prant | Publish
      Prant: Authorize | Escalate
```

---

## 5. ADD CAMPUS IKAI WORKFLOWS

### Why
Currently Campus Ikai is a **registry only** — you can add/edit/delete units but there's no actual campus engagement workflow. This is the most-used feature in real campus-based intellectual organizations and it's the most underdeveloped.

### What to build

#### 5a. Study Circle Scheduling

```
Campus Unit detail view → "Study Circles" tab
  - Calendar of upcoming study circles
  - Each circle:
      ├── Title (e.g., "Introduction to Indian Economics")
      ├── Date / Time
      ├── Frequency (weekly / bi-weekly / monthly)
      ├── Assigned resource person (from Scholars)
      ├── Topic/Reading assigned
      ├── Expected attendance
      ├── Completed? checkbox
      └── Notes / Feedback
  - Create new study circle form
  - Attendance log per session
  - Reading material attachment
```

#### 5b. Campus Outreach Tracker

```
Campus Unit detail view → "Outreach" tab
  - Timeline of all outreach to this unit:
      ├── Event type (Seminar / Lecture / Workshop)
      ├── Date
      ├── Conducted by (person/team)
      ├── Attendance
      ├── Follow-up needed?
      └── Next planned date
  - Add outreach entry form
  - Filter by date / type
```

#### 5c. Resource Distribution Tracker

```
Campus Unit detail view → "Resources" tab
  - List of resources given to unit:
      ├── Books (from ELibrary)
      ├── Journals (from Publications)
      ├── Study material
      ├── Digital content (links, videos)
      └── Date distributed
  - Add distribution form
  - Track utilization (optional feedback)
```

#### 5d. Unit Activation Score

```
Add to Campus Ikai dashboard:
  - Combined activation score per unit:
      ├── Study circles held this quarter (count)
      ├── Events organized (count)
      ├── Member growth (change %)
      ├── Outreach received (count)
      └── Overall score: 0-100 with color coding
  - Sort/filter by activation score
  - Flag dormant units (score < threshold)
```

### DB additions

```typescript
export const campusStudyCircles = pgTable("campus_study_circles", {
  id: text("id").primaryKey(),
  unitId: text("unit_id").references(() => campusUnits.id).notNull(),
  title: text("title").notNull(),
  titleHi: text("title_hi"),
  description: text("description"),
  descriptionHi: text("description_hi"),
  frequency: text("frequency").notNull(), // weekly | biweekly | monthly | one_time
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time"),
  assignedTo: text("assigned_to"), // scholar/user id
  readingMaterial: text("reading_material"),
  topic: text("topic"),
  completed: integer("completed").default(0), // 0=no, 1=yes
  attendance: integer("attendance"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const campusOutreachLog = pgTable("campus_outreach_log", {
  id: text("id").primaryKey(),
  unitId: text("unit_id").references(() => campusUnits.id).notNull(),
  outreachType: text("outreach_type").notNull(), // seminar | lecture | workshop | book_discussion
  title: text("title").notNull(),
  conductedBy: text("conducted_by"),
  conductedDate: text("conducted_date").notNull(),
  attendance: integer("attendance"),
  followUpNeeded: integer("follow_up_needed").default(0),
  nextPlannedDate: text("next_planned_date"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const campusResourceDistribution = pgTable("campus_resource_distribution", {
  id: text("id").primaryKey(),
  unitId: text("unit_id").references(() => campusUnits.id).notNull(),
  resourceType: text("resource_type").notNull(), // book | journal | digital | study_material
  resourceRefId: text("resource_ref_id"), // linked to library/publication/article
  resourceName: text("resource_name").notNull(),
  quantity: integer("quantity").default(1),
  distributedBy: text("distributed_by").notNull(),
  distributedAt: text("distributed_at").notNull(),
  feedbackReceived: integer("feedback_received").default(0),
  feedbackNotes: text("feedback_notes"),
});
```

### UI additions to Campus Units

```
Campus Unit detail panel tabs:
  [ Profile ] [ Study Circles ] [ Outreach ] [ Resources ] [ Activation ]

Each new tab gets:
  - List view of existing records
  - [Add New] button (role-gated: canManageUsers or assigned coordinator)
  - Expandable detail on click
  - Filter + search
```

---

## 6. ENHANCE DASHBOARD + TASK BOARD

### 6a. Dashboard — Role-Specific Intelligence

#### Current problem
Dashboard shows the same 3 action cards for most roles. No deep intelligence.

#### Proposed restructure

```
Dashboard layout per role:
  Role: karyakarta
  ├── Card 1: My pending articles (aalekh count)
  ├── Card 2: My upcoming study circles / events
  ├── Card 3: My outreach tasks pending
  ├── Card 4: My deadlines this week
  └── Quick actions: [Write Article] [Submit Event] [My Contributions]

  Role: unit_head
  ├── Card 1: Unit drafts to review
  ├── Card 2: Unit events pending approval
  ├── Card 3: Unit study circles this month
  ├── Card 4: Unit campus outreach done / pending
  ├── Card 5: Unit member count
  └── Quick actions: [Review Drafts] [Create Event] [Schedule Study Circle]

  Role: aayam_pramukh
  ├── Card 1: Pending Aayam reviews (articles + events + research)
  ├── Card 2: Unit submissions awaiting my review
  ├── Card 3: Aayam-level conferences/shivirs planned
  ├── Card 4: Campus outreach status
  └── Quick actions: [Review Queue] [Forward to Vibhag] [Schedule Event]

  Role: vibhag_pramukh
  ├── Card 1: Prant-level approvals pending
  ├── Card 2: Vibhag publications pipeline
  ├── Card 3: All units' outreach summary
  ├── Card 4: Pending prachar (outreach) items
  └── Quick actions: [Approve] [Publish] [View Analytics]

  Role: prant_sanyojak / super_admin
  ├── Card 1: System-wide pending items
  ├── Card 2: Kshetra-level escalations
  ├── Card 3: All Vibhag activation status
  └── Quick actions: [View Overview] [Users] [Audit Log]
```

### 6b. Task Board — Project-Based Research Tasks

#### Current problem
Generic kanban: Todo → In Progress → Done. No grouping by research project or conference.

#### Proposed enhancement

```
Task Board restructure:
  Left sidebar: Project/Workstream selector
    - All tasks (no filter)
    - Lokmanthan 2025 (project)
    - Faculty Development Program (project)
    - Journal Issue Vol.3 (project)
    - Campus Activation Drive (project)
    - Research: Indian Knowledge Systems (project)

  Main area: Kanban columns (per selected project)
    | To Do | In Progress | Under Review | Done |

  Task card expanded:
    ├── Title + description
    ├── Assigned to (person)
    ├── Priority (High/Medium/Low)
    ├── Due date
    ├── Linked to (article / event / project milestone)
    ├── Tags (vishay)
    └── Subtasks (checklist)

  Create task form additions:
    - Project selector (dropdown)
    - Linked item selector (article/event/publication/milestone)
    - Tag input (vishay)
    - Subtask list
```

### DB additions for tasks

```typescript
export const taskProjects = pgTable("task_projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameHi: text("name_hi"),
  description: text("description"),
  type: text("type").notNull(), // event | publication | research | outreach | general
  relatedId: text("related_id"), // links to event/publication/research project
  status: text("status").default("active"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => taskProjects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo | in_progress | review | done
  priority: text("priority").default("medium"), // high | medium | low
  assignedTo: text("assigned_to"),
  tags: text("tags").array(),
  linkedType: text("linked_type"), // article | event | milestone | publication
  linkedId: text("linked_id"),
  dueDate: text("due_date"),
  subtasks: jsonb("subtasks"), // [{id, title, done}]
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
```

---

## 7. ADD CONTENT TAXONOMY (VISHY) SYSTEM

### Why
Vimarsh topics exist but are static seed data. Real work needs a living tagging system that connects articles, events, scholars, research projects, campus units, and publications.

### What to build

#### Vishay Master Table

```typescript
export const vishayas = pgTable("vishayas", {
  id: text("id").primaryKey(),
  nameEn: text("name_en").notNull().unique(),
  nameHi: text("name_hi").notNull().unique(),
  description: text("description"),
  descriptionHi: text("description_hi"),
  parentVishayId: text("parent_vishay_id"), // hierarchical: sub-vishayas
  color: text("color"), // UI accent color
  icon: text("icon"), // lucide icon name
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").notNull(),
});

// Pre-seeded Vishay list (expanded from current list):
const SEED_VISHYAS = [
  "सामाजिक विज्ञान / Social Sciences",
  "राजनीति शास्त्र / Political Science",
  "अर्थशास्त्र / Economics",
  "इतिहास / History",
  "दर्शन / Philosophy",
  "मतपंथ अध्ययन / Sectarian Studies",
  "विधि / Law",
  "भूगोल / Geography",
  "पर्यावरण / Environment",
  "मीडिया एवं पत्रकारिता / Media & Journalism",
  "अंतरराष्ट्रीय संबंध / International Relations",
  "सामाजिक सहकार / Social Cooperation",
  "भारतीय भाषाएँ / Indian Languages",
  "वैश्विक भाषाएँ / World Languages",
  "अनुवाद / Translation",
  "वैदिक ज्ञान / Vedic Knowledge",
  "संस्कृति एवं कला / Culture & Arts",
  "शिक्षा / Education",
  "वैज्ञानिक विज्ञान / Scientific Temper",
  "युवा विकास / Youth Development",
  "महिला सशक्तिकरण / Women Empowerment",
  "स्थानीय स्वराज / Local Self-Governance",
];
```

#### Vishay tagging across all content types

```typescript
// Add vishay field to existing tables:
alter table gatividhi_events add column vishayas text[] default '{}';
alter table articles add column vishayas text[] default '{}';
alter table scholars add column vishayas text[] default '{}';
alter table research_projects add column vishayas text[] default '{}';
alter table campus_units add column vishayas text[] default '{}';
alter table publication_articles add column vishayas text[] default '{}';

// New cross-reference table for many-to-many (if needed for flexibility):
export const contentVishayaMap = pgTable("content_vishaya_map", {
  id: text("id").primaryKey(),
  vishayId: text("vishay_id").references(() => vishayas.id).notNull(),
  contentType: text("content_type").notNull(), // 'event' | 'article' | 'scholar' | 'project' | 'unit' | 'publication'
  contentId: text("content_id").notNull(),
  createdAt: text("created_at").notNull(),
});
```

#### UI integration

```
Every page with taggable content gets:
  - Vishay selector (multi-select with search)
  - Vishay filter chips (at top of list, like current Aayam filters)
  - Vishay detail page (click any vishay to see all linked content)

New page: /vimarsh (enhanced)
  - Current vimarsh topics stay
  - Add Vishay taxonomy section
  - Cross-linking: "Related articles", "Related scholars", "Related events"
```

#### Vishay detail page (`/vimarsh/[vishayId]`)

```
Shows:
  - Related articles (Aalekh)
  - Related events (Calendar)
  - Related scholars (Vidvat Mandal)
  - Related campus units (Ikai)
  - Related research projects (Shodh)
  - Related publications (Prakashan)
  - Related discussions (Charcha)
```

---

## 8. RESTRUCTURE DASHBOARD + ADD ANALYTICS

### What to change in `/dashboard`

#### Current tabs: Today | Queue | Create | Published | Follow-up
#### Proposed tabs: Today | Pipeline | Published | Vritt | Outreach

Keep "Today" for action cards. Keep "Queue" (rename to "Review Queue").

#### New Dashboard KPI cards (role-specific, comprehensive)

```
Common across roles:
  - Upcoming events this week
  - Pending approvals
  - Published count

Karyakarta:
  - My articles: drafts | submitted | published
  - My events: drafts | submitted | published
  - My study circles this month
  - My deadlines this week

Unit Head:
  - Unit article review queue
  - Unit event queue
  - Unit campus status
  - Unit member count

Aayam Pramukh:
  - Aayam review queue (articles + events)
  - Unit-wise submission summary
  - Aayam outreach completion %

Vibhag Pramukh:
  - Vibhag approval queue
  - All units activation summary
  - Published + pending outreach

Admin:
  - System-wide pending items
  - User growth
  - Org structure completeness
```

### New global analytics: /overview (enhance existing)

```
Overview page additions:
  - Org-wide contribution heatmap (calendar-style)
  - Aayam-wise activity comparison
  - Publication pipeline velocity (time per stage)
  - Campus unit activation trends
  - Scholar engagement metrics
  - Research project completion rate
  - Outreach completion trends
```

---

## IMPLEMENTATION ORDER (RECOMMENDED)

### Phase 1 — Fix Critical Mismatches (4-6 weeks)
1. **Prachar Redesign** — highest priority, currently misleading
2. **Enhanced Event Types** — unlock correct event workflows
3. **Vishay Taxonomy** — foundational for all other modules

### Phase 2 — Add Missing Core Modules (6-8 weeks)
4. **Publications Module** — addresses most gap in scholarly workflow
5. **Research Project Module** — fills the largest feature gap
6. **Campus Ikai Workflows** — unlocks real campus engagement

### Phase 3 — Polish & Integrate (3-4 weeks)
7. **Dashboard Restructure** — tie all modules together
8. **Task Board Enhancement** — project grouping
9. **Overview Analytics** — cross-module insights

### Phase 4 — Nice to Have (2-3 weeks)
10. Vimarsh → Article conversion
11. Scholar availability calendar
12. Certificate generation for events
13. Mobile app optimization

---

## FILES STRUCTURE SUMMARY

```
src/
├── app/
│   ├── prachar/              (rewrite page.tsx)
│   ├── prakar-vishleshan/    (rewrite page.tsx → outreach analytics)
│   ├── prakashan/            (NEW page)
│   ├── shodh/                (NEW page)
│   ├── calendar/             (enhance existing)
│   ├── dashboard/            (enhance existing)
│   └── users/                (keep as-is)
│
├── components/pages/
│   ├── Prachar.tsx           (rewrite)
│   ├── PracharVishleshan.tsx (rewrite)
│   ├── AnnualCalendar.tsx    (enhance)
│   ├── scholars/             (enhance existing)
│   ├── CampusUnits.tsx       (enhance)
│   ├── Dashboard.tsx         (enhance)
│   ├── prakashan/            (NEW)
│   │   ├── Publications.tsx
│   │   ├── EditorialBoard.tsx
│   │   ├── ArticleQueue.tsx
│   │   └── ArticleReviewPanel.tsx
│   ├── shodh/                (NEW)
│   │   ├── Shodh.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetail.tsx
│   │   └── MilestoneBoard.tsx
│   └── prachar/              (enhance)
│       ├── OutreachQueue.tsx
│       ├── OutreachCard.tsx
│       └── OutreachAnalytics.tsx
│
├── lib/
│   ├── app/
│   │   ├── navigation.ts     (update)
│   │   ├── event-types.ts    (NEW)
│   │   ├── outreach-types.ts (NEW)
│   │   └── vishayas.ts       (enhance/expand)
│   ├── schema.ts             (add all new tables)
│   └── contracts.ts          (add new types)
│
└── hooks/api/
    ├── use-outreach.ts       (NEW)
    ├── use-publications.ts   (NEW)
    ├── use-research.ts       (NEW)
    └── use-calendar.ts       (enhance with event types)
```

---

## DB MIGRATION APPROACH

Use Drizzle migrations:

```bash
# Generate new migrations
npx drizzle-kit generate:pg

# Apply to local and production
npx drizzle-kit push:pg
```

Each migration file should be numbered sequentially:
- `001_add_outreach.sql` — prachar tables
- `002_add_publications.sql` — publication tables
- `003_add_research.sql` — research tables
- `004_add_campus_workflows.sql` — study circle, outreach log, resource distribution
- `005_add_vishay_tags.sql` — vishay system + content tagging
- `006_add_task_projects.sql` — task board enhancement

---

## ROLE CHANGES SUMMARY

```
Additions to role model:
  - Editorial Board role (can manage publications, assign reviewers)
  - Reviewer role (can review assigned articles)
  - Researcher role (can create research projects)
  - Campus Coordinator role (can manage campus workflows)

These can be derived from existing roles:
  - org_admin → gets all new capabilities
  - vibhag_pramukh → gets editorial + research oversight
  - aayam_pramukh → gets reviewer + project lead
  - unit_head → gets campus coordinator for their units
```

---

## SUCCESS METRICS

Track these post-implementation:

| Metric | How to Measure | Target |
|--------|---------------|--------|
| Publications per quarter | Prakashan module count | 4+ issues/year |
| Research projects active | Shodh module count | 10+ active |
| Campus units activated | % units with ≥1 activity/quarter | >80% |
| Study circle frequency | Avg sessions/unit/month | ≥2 |
| Outreach completion rate | Prachar analytics | >75% |
| Article review cycle time | Prakashan analytics | <14 days |
| User engagement | Daily active users | >60% of karyakartas |
| Scholar participation | Publications with scholar co-authors | >50% |

---

*Document generated: 2026-06-26 — Phase 1-4 implementation plan*
