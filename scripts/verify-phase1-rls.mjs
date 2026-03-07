import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(filePath) {
  const out = {};
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function ids(rows) {
  return new Set((rows ?? []).map((r) => r.id));
}

function includesOnly(actualRows, expectedIds, label) {
  const actual = new Set((actualRows ?? []).map((r) => r.id));
  const expected = new Set(expectedIds);
  const missing = [...expected].filter((id) => !actual.has(id));
  const extra = [...actual].filter((id) => !expected.has(id));
  assert(missing.length === 0 && extra.length === 0, `${label} mismatch. Missing=${missing.join(",") || "-"} Extra=${extra.join(",") || "-"}`);
}

function randomPassword(len = 20) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  const buf = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
  return out;
}

function getLinkedProjectRef() {
  const p = path.resolve(process.cwd(), "supabase/.temp/project-ref");
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8").trim() || null;
}

function getApiKeysFromCli(projectRef) {
  const raw = execFileSync("supabase", ["projects", "api-keys", "--project-ref", projectRef, "-o", "json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const rows = JSON.parse(raw);
  const anon = rows.find((r) => r.id === "anon" || r.name === "anon");
  const serviceRole = rows.find((r) => r.id === "service_role" || r.name === "service_role");
  return {
    anonKey: anon?.api_key ?? null,
    serviceRoleKey: serviceRole?.api_key ?? null,
  };
}

async function createAuthUser(admin, email, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function signInAs(url, anonKey, email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function main() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  const env = readEnvFile(envPath);
  const projectRef = env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_REF || getLinkedProjectRef();
  let url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : null);
  let anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
  let serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  if ((!anonKey || !serviceRoleKey) && projectRef) {
    const keys = getApiKeysFromCli(projectRef);
    anonKey ||= keys.anonKey;
    serviceRoleKey ||= keys.serviceRoleKey;
  }

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY and could not resolve them from linked project");
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const runId = `rls_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const log = (...args) => console.log("[verify-phase1-rls]", ...args);

  const cleanup = {
    userIds: [],
    eventIds: [],
    articleIds: [],
    unitIds: [],
    deptIds: [],
    roleAssignmentIds: [],
  };

  log("runId", runId);

  try {
    // Base org
    const { data: orgs, error: orgErr } = await admin.from("org_settings").select("id,org_name").limit(1);
    if (orgErr) throw orgErr;
    const org = orgs?.[0];
    assert(org?.id, "No org_settings row found");
    log("Using org", org.id);

    // Role lookup (includes roles added by the RLS hardening migration)
    const { data: roles, error: rolesErr } = await admin
      .from("roles")
      .select("id,code")
      .in("code", ["unit_head", "aayam_pramukh", "karyakarta", "prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]);
    if (rolesErr) throw rolesErr;
    const roleIdByCode = new Map((roles ?? []).map((r) => [r.code, r.id]));
    for (const code of ["unit_head", "aayam_pramukh", "karyakarta", "prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]) {
      assert(roleIdByCode.has(code), `Role missing after migration: ${code}`);
    }

    // Scoped org structure for tests (vibhag + two units, yuva + mahila departments)
    const unitCodeV = `${runId}_vibhag`;
    const unitCodeA = `${runId}_u1`;
    const unitCodeB = `${runId}_u2`;
    const deptCodeY = `${runId}_yuva`;
    const deptCodeM = `${runId}_mahila`;

    const { data: vibhagUnit, error: vErr } = await admin
      .from("units")
      .insert({
        org_id: org.id,
        code: unitCodeV,
        name: `RLS Verify Vibhag ${runId}`,
        unit_kind: "vibhag",
        is_active: true,
        metadata: { verification_run: runId },
      })
      .select("id")
      .single();
    if (vErr) throw vErr;
    cleanup.unitIds.push(vibhagUnit.id);

    const { data: childUnits, error: cuErr } = await admin
      .from("units")
      .insert([
        {
          org_id: org.id,
          parent_unit_id: vibhagUnit.id,
          code: unitCodeA,
          name: `RLS Verify Unit A ${runId}`,
          unit_kind: "unit",
          is_active: true,
          metadata: { verification_run: runId },
        },
        {
          org_id: org.id,
          parent_unit_id: vibhagUnit.id,
          code: unitCodeB,
          name: `RLS Verify Unit B ${runId}`,
          unit_kind: "unit",
          is_active: true,
          metadata: { verification_run: runId },
        },
      ])
      .select("id,code")
      .order("code");
    if (cuErr) throw cuErr;
    const unitA = childUnits.find((u) => u.code === unitCodeA);
    const unitB = childUnits.find((u) => u.code === unitCodeB);
    assert(unitA?.id && unitB?.id, "Failed to create child units");
    cleanup.unitIds.push(unitA.id, unitB.id);

    const { data: departments, error: dErr } = await admin
      .from("departments_or_aayams")
      .insert([
        {
          org_id: org.id,
          unit_id: vibhagUnit.id,
          code: deptCodeY,
          name: `Yuva ${runId}`,
          department_kind: "aayam",
          is_active: true,
          metadata: { verification_run: runId },
        },
        {
          org_id: org.id,
          unit_id: vibhagUnit.id,
          code: deptCodeM,
          name: `Mahila ${runId}`,
          department_kind: "aayam",
          is_active: true,
          metadata: { verification_run: runId },
        },
      ])
      .select("id,code");
    if (dErr) throw dErr;
    const deptY = departments.find((d) => d.code === deptCodeY);
    const deptM = departments.find((d) => d.code === deptCodeM);
    assert(deptY?.id && deptM?.id, "Failed to create departments");
    cleanup.deptIds.push(deptY.id, deptM.id);

    // Auth users
    const pwUnitHead = randomPassword();
    const pwAayam = randomPassword();
    const pwKaryakarta = randomPassword();
    const pwOutsider = randomPassword();

    const userUnitHead = await createAuthUser(admin, `${runId}.unithead@example.test`, pwUnitHead);
    const userAayam = await createAuthUser(admin, `${runId}.aayam@example.test`, pwAayam);
    const userKaryakarta = await createAuthUser(admin, `${runId}.karyakarta@example.test`, pwKaryakarta);
    const userOutsider = await createAuthUser(admin, `${runId}.outsider@example.test`, pwOutsider);
    cleanup.userIds.push(userUnitHead.id, userAayam.id, userKaryakarta.id, userOutsider.id);

    // Ensure profiles are populated with org/scope defaults
    const profileUpdates = [
      { id: userUnitHead.id, org_id: org.id, default_unit_id: unitA.id, default_department_id: deptY.id, display_name: `Unit Head ${runId}` },
      { id: userAayam.id, org_id: org.id, default_unit_id: vibhagUnit.id, default_department_id: deptY.id, display_name: `Aayam Pramukh ${runId}` },
      { id: userKaryakarta.id, org_id: org.id, default_unit_id: unitB.id, default_department_id: deptM.id, display_name: `Karyakarta ${runId}` },
      { id: userOutsider.id, org_id: org.id, default_unit_id: unitB.id, default_department_id: deptM.id, display_name: `Outsider ${runId}` },
    ];
    for (const p of profileUpdates) {
      const { error } = await admin.from("profiles").update(p).eq("id", p.id);
      if (error) throw error;
    }

    // Scoped role assignments
    const { data: assignments, error: aErr } = await admin
      .from("user_role_assignments")
      .insert([
        {
          user_id: userUnitHead.id,
          role_id: roleIdByCode.get("unit_head"),
          scope_type: "unit",
          org_id: org.id,
          unit_id: unitA.id,
          is_primary: true,
        },
        {
          user_id: userAayam.id,
          role_id: roleIdByCode.get("aayam_pramukh"),
          scope_type: "department",
          org_id: org.id,
          unit_id: vibhagUnit.id,
          department_id: deptY.id,
          is_primary: true,
        },
        {
          user_id: userKaryakarta.id,
          role_id: roleIdByCode.get("karyakarta"),
          scope_type: "unit",
          org_id: org.id,
          unit_id: unitB.id,
          is_primary: true,
        },
      ])
      .select("id");
    if (aErr) throw aErr;
    cleanup.roleAssignmentIds.push(...(assignments ?? []).map((a) => a.id));

    // Test events
    const now = new Date();
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const in5h = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString();

    const { data: events, error: eErr } = await admin
      .from("events")
      .insert([
        {
          org_id: org.id,
          unit_id: unitA.id,
          department_id: deptY.id,
          title: `[${runId}] Event U1 Yuva Draft`,
          status: "draft",
          starts_at: in2h,
          submitted_by_user_id: userUnitHead.id,
          submitted_by_name_snapshot: `Unit Head ${runId}`,
          public_page_enabled: false,
          registration_public_enabled: false,
          voting_public_enabled: false,
          metadata: { verification_run: runId },
          created_by: userUnitHead.id,
          updated_by: userUnitHead.id,
        },
        {
          org_id: org.id,
          unit_id: unitB.id,
          department_id: deptM.id,
          title: `[${runId}] Event U2 Mahila Draft`,
          status: "draft",
          starts_at: in3h,
          submitted_by_user_id: userKaryakarta.id,
          submitted_by_name_snapshot: `Karyakarta ${runId}`,
          public_page_enabled: false,
          registration_public_enabled: false,
          voting_public_enabled: false,
          metadata: { verification_run: runId },
          created_by: userKaryakarta.id,
          updated_by: userKaryakarta.id,
        },
        {
          org_id: org.id,
          unit_id: unitA.id,
          department_id: deptY.id,
          title: `[${runId}] Event U1 Yuva Published Public`,
          status: "published",
          starts_at: in4h,
          submitted_by_user_id: userUnitHead.id,
          submitted_by_name_snapshot: `Unit Head ${runId}`,
          public_page_enabled: true,
          registration_public_enabled: false,
          voting_public_enabled: false,
          metadata: { verification_run: runId },
          created_by: userUnitHead.id,
          updated_by: userUnitHead.id,
        },
        {
          org_id: org.id,
          unit_id: unitB.id,
          department_id: deptM.id,
          title: `[${runId}] Event U2 Mahila Published Public`,
          status: "published",
          starts_at: in5h,
          submitted_by_user_id: userKaryakarta.id,
          submitted_by_name_snapshot: `Karyakarta ${runId}`,
          public_page_enabled: true,
          registration_public_enabled: false,
          voting_public_enabled: false,
          metadata: { verification_run: runId },
          created_by: userKaryakarta.id,
          updated_by: userKaryakarta.id,
        },
      ])
      .select("id,title,status,unit_id,department_id");
    if (eErr) throw eErr;
    cleanup.eventIds.push(...(events ?? []).map((e) => e.id));
    const eventByTitle = Object.fromEntries((events ?? []).map((e) => [e.title, e]));
    const e1 = eventByTitle[`[${runId}] Event U1 Yuva Draft`];
    const e2 = eventByTitle[`[${runId}] Event U2 Mahila Draft`];
    const e3 = eventByTitle[`[${runId}] Event U1 Yuva Published Public`];
    const e4 = eventByTitle[`[${runId}] Event U2 Mahila Published Public`];

    // Prachar rows for scoped write tests
    const { error: psErr } = await admin.from("prachar_statuses").insert([
      { event_id: e1.id },
      { event_id: e2.id },
    ]);
    if (psErr) throw psErr;

    // Test articles
    const { data: articles, error: arErr } = await admin
      .from("articles")
      .insert([
        {
          org_id: org.id,
          unit_id: unitA.id,
          department_id: deptY.id,
          title: `[${runId}] Article U1 Yuva Draft`,
          content: "Draft content U1 Yuva",
          summary: "Draft",
          category: "Yuva",
          status: "draft",
          author_user_id: userUnitHead.id,
          author_name_snapshot: `Unit Head ${runId}`,
          created_by: userUnitHead.id,
          updated_by: userUnitHead.id,
        },
        {
          org_id: org.id,
          unit_id: unitB.id,
          department_id: deptM.id,
          title: `[${runId}] Article U2 Mahila Draft (Own)`,
          content: "Draft content U2 Mahila own",
          summary: "Draft own",
          category: "Mahila",
          status: "draft",
          author_user_id: userKaryakarta.id,
          author_name_snapshot: `Karyakarta ${runId}`,
          created_by: userKaryakarta.id,
          updated_by: userKaryakarta.id,
        },
        {
          org_id: org.id,
          unit_id: unitA.id,
          department_id: deptY.id,
          title: `[${runId}] Article U1 Yuva Published`,
          content: "Published content U1 Yuva",
          summary: "Published",
          category: "Yuva",
          status: "published",
          author_user_id: userUnitHead.id,
          author_name_snapshot: `Unit Head ${runId}`,
          created_by: userUnitHead.id,
          updated_by: userUnitHead.id,
        },
        {
          org_id: org.id,
          unit_id: unitB.id,
          department_id: deptM.id,
          title: `[${runId}] Article U2 Mahila Published`,
          content: "Published content U2 Mahila",
          summary: "Published",
          category: "Mahila",
          status: "published",
          author_user_id: userKaryakarta.id,
          author_name_snapshot: `Karyakarta ${runId}`,
          created_by: userKaryakarta.id,
          updated_by: userKaryakarta.id,
        },
      ])
      .select("id,title,status,unit_id,department_id,author_user_id");
    if (arErr) throw arErr;
    cleanup.articleIds.push(...(articles ?? []).map((a) => a.id));
    const articleByTitle = Object.fromEntries((articles ?? []).map((a) => [a.title, a]));
    const a1 = articleByTitle[`[${runId}] Article U1 Yuva Draft`];
    const a2 = articleByTitle[`[${runId}] Article U2 Mahila Draft (Own)`];
    const a3 = articleByTitle[`[${runId}] Article U1 Yuva Published`];
    const a4 = articleByTitle[`[${runId}] Article U2 Mahila Published`];

    // Clients as different actors
    const clientUnitHead = await signInAs(url, anonKey, userUnitHead.email, pwUnitHead);
    const clientAayam = await signInAs(url, anonKey, userAayam.email, pwAayam);
    const clientKaryakarta = await signInAs(url, anonKey, userKaryakarta.email, pwKaryakarta);
    const clientOutsider = await signInAs(url, anonKey, userOutsider.email, pwOutsider);

    // 1) unit_head cannot read/write outside scope
    {
      const { data, error } = await clientUnitHead.from("events").select("id,title").in("id", [e1.id, e2.id, e3.id, e4.id]);
      if (error) throw error;
      includesOnly(data, [e1.id, e3.id], "unit_head visible events");

      const { data: deniedUpdate, error: deniedError } = await clientUnitHead
        .from("events")
        .update({ title: `[${runId}] SHOULD-NOT-WRITE` })
        .eq("id", e2.id)
        .select("id");
      if (deniedError) throw deniedError;
      assert((deniedUpdate ?? []).length === 0, "unit_head should not update out-of-scope event");

      const { data: allowedUpdate, error: allowedError } = await clientUnitHead
        .from("events")
        .update({ title: `[${runId}] Event U1 Yuva Draft (updated by unit_head)` })
        .eq("id", e1.id)
        .select("id,title");
      if (allowedError) throw allowedError;
      assert((allowedUpdate ?? []).length === 1, "unit_head should update in-scope event");
      log("PASS unit_head scope read/write");
    }

    // 2) aayam_pramukh cannot manage unrelated aayam data
    {
      const { data, error } = await clientAayam.from("events").select("id").in("id", [e1.id, e2.id, e3.id, e4.id]);
      if (error) throw error;
      includesOnly(data, [e1.id, e3.id], "aayam_pramukh visible events");

      const { data: denyEventUpdate, error: denyEventErr } = await clientAayam
        .from("events")
        .update({ title: `[${runId}] SHOULD-NOT-WRITE-AAYAM` })
        .eq("id", e2.id)
        .select("id");
      if (denyEventErr) throw denyEventErr;
      assert((denyEventUpdate ?? []).length === 0, "aayam_pramukh should not update unrelated-aayam event");

      const { data: denyArticleUpdate, error: denyArticleErr } = await clientAayam
        .from("articles")
        .update({ title: `[${runId}] SHOULD-NOT-WRITE-ARTICLE` })
        .eq("id", a2.id)
        .select("id");
      if (denyArticleErr) throw denyArticleErr;
      assert((denyArticleUpdate ?? []).length === 0, "aayam_pramukh should not update unrelated-aayam article");

      const { data: allowPrachar, error: allowPracharErr } = await clientAayam
        .from("prachar_statuses")
        .update({ whatsapp_done: true })
        .eq("event_id", e1.id)
        .select("id,event_id,whatsapp_done");
      if (allowPracharErr) throw allowPracharErr;
      assert((allowPrachar ?? []).length === 1 && allowPrachar[0].whatsapp_done === true, "aayam_pramukh should update related prachar");

      const { data: denyPrachar, error: denyPracharErr } = await clientAayam
        .from("prachar_statuses")
        .update({ whatsapp_done: true })
        .eq("event_id", e2.id)
        .select("id");
      if (denyPracharErr) throw denyPracharErr;
      assert((denyPrachar ?? []).length === 0, "aayam_pramukh should not update unrelated prachar");
      log("PASS aayam_pramukh unrelated aayam enforcement + prachar scope");
    }

    // 3) authenticated users cannot globally read all events/articles if scope disallows
    {
      const { data: kEvents, error: kEventsErr } = await clientKaryakarta.from("events").select("id").in("id", [e1.id, e2.id, e3.id, e4.id]);
      if (kEventsErr) throw kEventsErr;
      includesOnly(kEvents, [e2.id, e4.id], "karyakarta visible events");

      const { data: kArticles, error: kArticlesErr } = await clientKaryakarta
        .from("articles")
        .select("id")
        .in("id", [a1.id, a2.id, a3.id, a4.id]);
      if (kArticlesErr) throw kArticlesErr;
      includesOnly(kArticles, [a2.id, a4.id], "karyakarta visible articles");

      const { data: outsiderEvents, error: outsiderEventsErr } = await clientOutsider.from("events").select("id").in("id", [e1.id, e2.id, e3.id, e4.id]);
      if (outsiderEventsErr) throw outsiderEventsErr;
      assert((outsiderEvents ?? []).length === 0, "authenticated user with no assignments should not see internal events");
      log("PASS authenticated non-manager/global-read restrictions");
    }

    // 4) public rules for published content still work
    {
      const { data: publicEvents, error: pubEventsErr } = await anon.from("events").select("id").in("id", [e1.id, e2.id, e3.id, e4.id]);
      if (pubEventsErr) throw pubEventsErr;
      includesOnly(publicEvents, [e3.id, e4.id], "anon visible events");

      const { data: publicArticles, error: pubArticlesErr } = await anon
        .from("articles")
        .select("id")
        .in("id", [a1.id, a2.id, a3.id, a4.id]);
      if (pubArticlesErr) throw pubArticlesErr;
      includesOnly(publicArticles, [a3.id, a4.id], "anon visible articles");
      log("PASS public published-content rules");
    }

    // 5) Helper rows seeded by migration are active (new roles)
    {
      const { data, error } = await admin
        .from("roles")
        .select("code")
        .in("code", ["prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]);
      if (error) throw error;
      const codes = new Set((data ?? []).map((r) => r.code));
      for (const code of ["prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]) {
        assert(codes.has(code), `Missing seeded role after migration: ${code}`);
      }
      log("PASS migration-seeded roles present");
    }

    console.log("");
    console.log("RESULT: PASS");
  } finally {
    // Cleanup best-effort; don't hide original failures if cleanup fails
    const errors = [];
    const safe = async (label, fn) => {
      try { await fn(); } catch (e) { errors.push(`${label}: ${e.message ?? e}`); }
    };

    if (cleanup.eventIds.length) {
      await safe("delete prachar_statuses", async () => {
        const { error } = await admin.from("prachar_statuses").delete().in("event_id", cleanup.eventIds);
        if (error) throw error;
      });
    }
    if (cleanup.articleIds.length) {
      await safe("delete article_publications", async () => {
        const { error } = await admin.from("article_publications").delete().in("article_id", cleanup.articleIds);
        if (error) throw error;
      });
      await safe("delete article_reviews", async () => {
        const { error } = await admin.from("article_reviews").delete().in("article_id", cleanup.articleIds);
        if (error) throw error;
      });
    }
    if (cleanup.eventIds.length) {
      await safe("delete events", async () => {
        const { error } = await admin.from("events").delete().in("id", cleanup.eventIds);
        if (error) throw error;
      });
    }
    if (cleanup.articleIds.length) {
      await safe("delete articles", async () => {
        const { error } = await admin.from("articles").delete().in("id", cleanup.articleIds);
        if (error) throw error;
      });
    }
    if (cleanup.roleAssignmentIds.length) {
      await safe("delete user_role_assignments", async () => {
        const { error } = await admin.from("user_role_assignments").delete().in("id", cleanup.roleAssignmentIds);
        if (error) throw error;
      });
    }
    for (const userId of cleanup.userIds) {
      await safe(`delete auth user ${userId}`, async () => {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw error;
      });
    }
    if (cleanup.deptIds.length) {
      await safe("delete departments", async () => {
        const { error } = await admin.from("departments_or_aayams").delete().in("id", cleanup.deptIds);
        if (error) throw error;
      });
    }
    if (cleanup.unitIds.length) {
      // Delete child units first (reverse order)
      const reversed = [...cleanup.unitIds].reverse();
      await safe("delete units", async () => {
        const { error } = await admin.from("units").delete().in("id", reversed);
        if (error) throw error;
      });
    }

    if (errors.length) {
      console.error("Cleanup warnings:");
      for (const err of errors) console.error(" -", err);
    }
  }
}

main().catch((err) => {
  console.error("RESULT: FAIL");
  console.error(err?.stack || err?.message || err);
  process.exitCode = 1;
});
