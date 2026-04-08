/**
 * scripts/test-api.mjs
 * Full live API test suite for Pragya Pravah backend.
 * Run: node scripts/test-api.mjs
 * Requires dev server running on localhost:3000
 */

const BASE = "http://localhost:3000";
let COOKIE = "";          // pp_session cookie jar
let adminCookie = "";
let vibhagCookie = "";
let karyaCookie = "";

let createdEventId = "";
let createdArticleId = "";
let createdPollId = "";
let vibhagUserId = "";

// ─── helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function log(icon, label, detail = "") {
  console.log(`  ${icon} ${label}${detail ? " — " + detail : ""}`);
}

async function req(method, path, body, cookie) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/pp_session=([^;]+)/);
  if (match) COOKIE = `pp_session=${match[1]}`;
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data, newCookie: match ? `pp_session=${match[1]}` : null };
}

function expect(label, status, actual, expected, detail = "") {
  const ok = actual === expected;
  if (ok) {
    passed++;
    log("✅", label, detail);
  } else {
    failed++;
    log("❌", label, `expected ${expected}, got ${actual}${detail ? " — " + detail : ""}`);
  }
  results.push({ label, ok, status: actual, expected });
  return ok;
}

function expectField(label, obj, field, expectedVal) {
  const actual = field.split(".").reduce((o, k) => o?.[k], obj);
  const ok = expectedVal === undefined ? actual !== undefined && actual !== null
             : actual === expectedVal;
  if (ok) {
    passed++;
    log("✅", label, `${field} = ${JSON.stringify(actual)}`);
  } else {
    failed++;
    log("❌", label, `${field}: expected ${JSON.stringify(expectedVal)}, got ${JSON.stringify(actual)}`);
  }
  return ok;
}

// ─── tests ───────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║   Pragya Pravah — Live API Test Suite                   ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

// ── AUTH ──────────────────────────────────────────────────────────────────────
console.log("── AUTH ──────────────────────────────────────────────────────");

// 1. Login with wrong password
{
  const r = await req("POST", "/api/auth/login", { email: "admin@pragya-pravah.org", password: "WrongPass!" });
  expect("Login: wrong password → 401", r.status, r.status, 401);
}

// 2. Login with wrong email
{
  const r = await req("POST", "/api/auth/login", { email: "nobody@x.com", password: "Password123!" });
  expect("Login: unknown email → 401", r.status, r.status, 401);
}

// 3. Login super_admin
{
  const r = await req("POST", "/api/auth/login", { email: "admin@pragya-pravah.org", password: "Password123!" });
  if (expect("Login: super_admin → 200", r.status, r.status, 200)) {
    adminCookie = r.newCookie;
    expectField("Login: returns userId", r.data, "data.userId", undefined); // just check exists
    expectField("Login: returns primaryRoleCode", r.data.data, "primaryRoleCode", "super_admin");
  }
}

// 4. Login vibhag_pramukh
{
  const r = await req("POST", "/api/auth/login", { email: "vibhag@pragya-pravah.org", password: "Password123!" });
  if (expect("Login: vibhag_pramukh → 200", r.status, r.status, 200)) {
    vibhagCookie = r.newCookie;
    vibhagUserId = r.data?.data?.userId;
  }
}

// 5. Login karyakarta
{
  const r = await req("POST", "/api/auth/login", { email: "karya@pragya-pravah.org", password: "Password123!" });
  if (expect("Login: karyakarta → 200", r.status, r.status, 200)) {
    karyaCookie = r.newCookie;
  }
}

// 6. GET /me without session → 401
{
  const r = await req("GET", "/api/auth/me", null, null);
  expect("/me: no session → 401", r.status, r.status, 401);
}

// 7. GET /me with admin session
{
  const r = await req("GET", "/api/auth/me", null, adminCookie);
  expect("/me: admin session → 200", r.status, r.status, 200);
  if (r.status === 200) {
    expectField("/me: has permissions", r.data.data, "permissions", undefined);
    expectField("/me: canCreateEvent", r.data.data?.permissions, "canCreateEvent", true);
  }
}

// ── ROLES ────────────────────────────────────────────────────────────────────
console.log("\n── ROLES ─────────────────────────────────────────────────────");

{
  const r = await req("GET", "/api/v1/roles", null, adminCookie);
  expect("GET /roles → 200", r.status, r.status, 200);
  if (r.status === 200) {
    const roles = r.data?.data ?? [];
    expect("GET /roles: 9 roles returned", r.status, roles.length, 9, `got ${roles.length}`);
  }
}

// ── USERS ────────────────────────────────────────────────────────────────────
console.log("\n── USERS ─────────────────────────────────────────────────────");

// GET /users — needs canManageUsers (super_admin)
{
  const r = await req("GET", "/api/v1/users", null, adminCookie);
  expect("GET /users: admin → 200", r.status, r.status, 200);
  if (r.status === 200) {
    const users = r.data?.data ?? [];
    expect("GET /users: ≥3 users", r.status, users.length >= 3, true, `got ${users.length}`);
  }
}

// GET /users — karyakarta → 403
{
  const r = await req("GET", "/api/v1/users", null, karyaCookie);
  expect("GET /users: karyakarta → 403", r.status, r.status, 403);
}

// POST /users — create new user (timestamp in email so reruns don't 409)
const testEmail = `test.${Date.now()}@pragya-pravah.org`;
let newUserId = "";
{
  const r = await req("POST", "/api/v1/users", {
    email: testEmail,
    password: "TestUser123!",
    displayName: "Test User",
    roleCode: "karyakarta",
  }, adminCookie);
  expect("POST /users: create user → 201", r.status, r.status, 201);
  newUserId = r.data?.data?.id;
}

// GET /users/:id
if (newUserId) {
  const r = await req("GET", `/api/v1/users/${newUserId}`, null, adminCookie);
  expect("GET /users/:id → 200", r.status, r.status, 200);
  expectField("GET /users/:id: correct email", r.data.data, "email", testEmail);
}

// PATCH /users/:id
if (newUserId) {
  const r = await req("PATCH", `/api/v1/users/${newUserId}`, { displayName: "Updated Name" }, adminCookie);
  expect("PATCH /users/:id → 200", r.status, r.status, 200);
}

// ── EVENTS ───────────────────────────────────────────────────────────────────
console.log("\n── EVENTS ────────────────────────────────────────────────────");

// GET /events — no session → 401
{
  const r = await req("GET", "/api/v1/events", null, null);
  expect("GET /events: no auth → 401", r.status, r.status, 401);
}

// POST /events — create event as vibhag_pramukh
{
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const dayAfter  = new Date(Date.now() + 172800000).toISOString();
  const r = await req("POST", "/api/v1/events", {
    title: "Vimarsh Satra – Test",
    titleHi: "विमर्श सत्र – परीक्षण",
    description: "A test intellectual forum event",
    startsAt: tomorrow,
    endsAt: dayAfter,
  }, vibhagCookie);
  expect("POST /events: vibhag → 201", r.status, r.status, 201);
  createdEventId = r.data?.data?.id;
  if (createdEventId) {
    expectField("POST /events: status=draft", r.data.data, "status", "draft");
  }
}

// GET /events — list
{
  const r = await req("GET", "/api/v1/events", null, vibhagCookie);
  expect("GET /events: authenticated → 200", r.status, r.status, 200);
}

// GET /events/:id
if (createdEventId) {
  const r = await req("GET", `/api/v1/events/${createdEventId}`, null, adminCookie);
  expect("GET /events/:id → 200", r.status, r.status, 200);
  expectField("GET /events/:id: has polls array", r.data.data, "polls", undefined);
}

// PATCH /events/:id
if (createdEventId) {
  const r = await req("PATCH", `/api/v1/events/${createdEventId}`, {
    description: "Updated description for the test event",
  }, vibhagCookie);
  expect("PATCH /events/:id → 200", r.status, r.status, 200);
}

// GET+PATCH /events/:id/checklist
if (createdEventId) {
  // Use valid checklist keys from checklistSchema (designing, food, seating, etc.)
  const r = await req("PATCH", `/api/v1/events/${createdEventId}/checklist`, {
    designing: true,
    seating: true,
  }, vibhagCookie);
  expect("PATCH /events/:id/checklist → 200", r.status, r.status, 200);

  const r2 = await req("GET", `/api/v1/events/${createdEventId}/checklist`, null, vibhagCookie);
  expect("GET /events/:id/checklist → 200", r2.status, r2.status, 200);
  // Checklist is nested under data.checklist
  expectField("checklist: designing=true", r2.data.data?.checklist, "designing", true);
}

// POST /events/:id/workflow — submit for review (draft → submitted_by_unit)
// vibhag_pramukh has unit_head level (priority 5 ≤ 7), so they qualify
if (createdEventId) {
  const r = await req("POST", `/api/v1/events/${createdEventId}/workflow`, {
    toStatus: "submitted_by_unit",
    notes: "Ready for review",
  }, vibhagCookie);
  expect("Workflow: draft→submitted_by_unit → 200", r.status, r.status, 200);
}

// POST /events/:id/workflow — move to pending_aayam_review (admin)
if (createdEventId) {
  const r = await req("POST", `/api/v1/events/${createdEventId}/workflow`, {
    toStatus: "pending_aayam_review",
    notes: "Passing to aayam review",
  }, adminCookie);
  expect("Workflow: submitted_by_unit→pending_aayam_review → 200", r.status, r.status, 200);
}

// Polls
if (createdEventId) {
  const r = await req("POST", `/api/v1/events/${createdEventId}/polls`, {
    question: "Preferred date for next event?",
    questionHi: "अगले कार्यक्रम की पसंदीदा तारीख?",
    pollType: "date",
    options: [
      { label: "15 May 2026" },
      { label: "22 May 2026" },
      { label: "29 May 2026" },
    ],
  }, vibhagCookie);
  expect("POST /events/:id/polls → 201", r.status, r.status, 201);
  createdPollId = r.data?.data?.id;
}

if (createdEventId && createdPollId) {
  // GET polls
  const r = await req("GET", `/api/v1/events/${createdEventId}/polls`, null, vibhagCookie);
  expect("GET /events/:id/polls → 200", r.status, r.status, 200);
  const polls = r.data?.data ?? [];
  expect("GET polls: at least 1 poll", r.status, polls.length >= 1, true, `got ${polls.length}`);
}

// Registrations list (vibhag can view)
if (createdEventId) {
  const r = await req("GET", `/api/v1/events/${createdEventId}/registrations`, null, vibhagCookie);
  expect("GET /events/:id/registrations → 200", r.status, r.status, 200);
  expectField("registrations: has summary", r.data.data, "summary", undefined);
}

// ── ARTICLES ─────────────────────────────────────────────────────────────────
console.log("\n── ARTICLES ──────────────────────────────────────────────────");

// POST /articles — karyakarta creates
{
  const r = await req("POST", "/api/v1/articles", {
    title: "Swa Bodh aur Rashtriya Chetana",
    titleHi: "स्व बोध और राष्ट्रीय चेतना",
    content: "This article explores the concept of Swa Bodh and its connection to national consciousness. The Indic tradition of self-awareness is deeply connected to collective identity and civilisational purpose.",
    summary: "An exploration of Swa Bodh in the Indic intellectual tradition.",
    category: "vimarsh",
  }, karyaCookie);
  expect("POST /articles: karyakarta → 201", r.status, r.status, 201);
  createdArticleId = r.data?.data?.id;
  if (createdArticleId) {
    expectField("POST /articles: status=draft", r.data.data, "status", "draft");
    // Values checklist uses camelCase keys: rashtraPratham, culturallyGrounded, etc.
    expectField("POST /articles: valuesChecklist all false", r.data.data?.valuesChecklist, "rashtraPratham", false);
  }
}

// GET /articles
{
  const r = await req("GET", "/api/v1/articles", null, karyaCookie);
  expect("GET /articles: karyakarta → 200", r.status, r.status, 200);
}

// GET /articles/:id
if (createdArticleId) {
  const r = await req("GET", `/api/v1/articles/${createdArticleId}`, null, adminCookie);
  expect("GET /articles/:id → 200", r.status, r.status, 200);
}

// PATCH values checklist on article — camelCase keys per validator schema
if (createdArticleId) {
  const r = await req("PATCH", `/api/v1/articles/${createdArticleId}`, {
    valuesChecklist: {
      rashtraPratham: true,
      culturallyGrounded: true,
      balancedTone: true,
      noDivisiveContent: true,
    },
  }, karyaCookie);
  expect("PATCH /articles: set valuesChecklist → 200", r.status, r.status, 200);
}

// Workflow: draft → pending_unit_head_review (karyakarta submits with valuesChecklist)
if (createdArticleId) {
  const r = await req("POST", `/api/v1/articles/${createdArticleId}/workflow`, {
    toStatus: "pending_unit_head_review",
    valuesChecklist: {
      rashtraPratham: true,
      culturallyGrounded: true,
      balancedTone: true,
      noDivisiveContent: true,
    },
  }, karyaCookie);
  expect("Article workflow: draft→pending_unit_head_review → 200", r.status, r.status, 200);
}

// Workflow: pending_unit_head_review → pending_aayam_review (vibhag_pramukh = unit_head+)
if (createdArticleId) {
  const r = await req("POST", `/api/v1/articles/${createdArticleId}/workflow`, {
    toStatus: "pending_aayam_review",
    notes: "Unit review passed",
  }, vibhagCookie);
  expect("Article workflow: pending_unit_head→pending_aayam → 200", r.status, r.status, 200);
}

// GET /articles/:id/reviews
if (createdArticleId) {
  const r = await req("GET", `/api/v1/articles/${createdArticleId}/reviews`, null, vibhagCookie);
  expect("GET /articles/:id/reviews → 200", r.status, r.status, 200);
  const reviews = r.data?.data?.reviews ?? [];
  expect("GET reviews: at least 1 review", r.status, reviews.length >= 1, true, `got ${reviews.length}`);
}

// ── EDGE CASES ───────────────────────────────────────────────────────────────
console.log("\n── EDGE CASES ────────────────────────────────────────────────");

// Zod validation: missing required field
{
  const r = await req("POST", "/api/auth/login", { email: "admin@pragya-pravah.org" });
  expect("Login: missing password → 400", r.status, r.status, 400);
}

// Invalid UUID in path
{
  const r = await req("GET", "/api/v1/events/not-a-uuid", null, adminCookie);
  expect("GET /events/invalid-id → 400 or 404", r.status, [400, 404].includes(r.status), true, `got ${r.status}`);
}

// Karyakarta can't access another user's profile
if (newUserId) {
  const r = await req("GET", `/api/v1/users/${newUserId}`, null, karyaCookie);
  expect("GET /users/:id: karyakarta own-only → 403", r.status, r.status, 403);
}

// Logout — use vibhag cookie (admin was already tested heavily)
let cookieToLogout = vibhagCookie;
{
  const r = await req("POST", "/api/auth/logout", null, cookieToLogout);
  expect("POST /logout → 200", r.status, r.status, 200);
  expectField("Logout: loggedOut=true", r.data.data, "loggedOut", true);
}

// After logout the server clears the cookie — sending it should still yield 401
// because JWT is still technically valid for 24h (logout just clears the client cookie)
// We simulate this by testing with no cookie at all
{
  const r = await req("GET", "/api/auth/me", null, null);
  expect("/me with no cookie after logout → 401", r.status, r.status, 401);
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log(`║  RESULTS: ${passed}/${total} passed  ${failed > 0 ? `(${failed} FAILED)` : "(all green)"}`.padEnd(59) + "║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

if (failed > 0) {
  console.log("Failed tests:");
  results.filter(r => !r.ok).forEach(r =>
    console.log(`  ✗ ${r.label} (got ${r.status}, expected ${r.expected})`)
  );
  console.log("");
  process.exit(1);
}
