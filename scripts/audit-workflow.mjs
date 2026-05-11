// Workflow Audit Script for Pragya Pravah
// Run: $env:DATABASE_URL = "your-neon-url"; node scripts/audit-workflow.mjs

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function auditWorkflow() {
  console.log("=".repeat(70));
  console.log("  PRAGYA PRAVAH — WORKFLOW AUDIT REPORT");
  console.log(`  Generated: ${new Date().toISOString()}`);
  console.log("=".repeat(70));

  // ── 1. Recent Audit Logs ─────────────────────────────────────────────────
  console.log("\n📋 RECENT AUDIT LOGS (last 20)\n");
  const auditLogs = await sql`
    SELECT action, actor_email, entity_type, change_summary, created_at
    FROM public.audit_logs
    ORDER BY created_at DESC
    LIMIT 20
  `;

  if (auditLogs.length === 0) {
    console.log("  (no audit logs found)");
  } else {
    for (const row of auditLogs) {
      console.log(`  [${new Date(row.created_at).toLocaleString("en-IN")}]`);
      console.log(`  Actor   : ${row.actor_email}`);
      console.log(`  Action  : ${row.action}`);
      console.log(`  Entity  : ${row.entity_type}`);
      console.log(`  Summary : ${row.change_summary}`);
      console.log("  " + "-".repeat(60));
    }
  }

  // ── 2. Event Status History ───────────────────────────────────────────────
  console.log("\n🔄 EVENT STATUS TRANSITIONS (last 15)\n");
  const eventHistory = await sql`
    SELECT
      esh.from_status,
      esh.to_status,
      esh.actor_name_snapshot,
      esh.notes,
      esh.created_at,
      e.title as event_title
    FROM public.event_status_history esh
    JOIN public.events e ON e.id = esh.event_id
    ORDER BY esh.created_at DESC
    LIMIT 15
  `;

  if (eventHistory.length === 0) {
    console.log("  (no event transitions found)");
  } else {
    for (const row of eventHistory) {
      console.log(`  Event   : ${row.event_title}`);
      console.log(`  By      : ${row.actor_name_snapshot}`);
      console.log(`  Change  : ${row.from_status} → ${row.to_status}`);
      if (row.notes) console.log(`  Notes   : ${row.notes}`);
      console.log(`  At      : ${new Date(row.created_at).toLocaleString("en-IN")}`);
      console.log("  " + "-".repeat(60));
    }
  }

  // ── 3. Current Event Status Summary ──────────────────────────────────────
  console.log("\n📊 CURRENT EVENT STATUS SUMMARY\n");
  const eventSummary = await sql`
    SELECT status, COUNT(*) as count
    FROM public.events
    GROUP BY status
    ORDER BY count DESC
  `;
  for (const row of eventSummary) {
    const bar = "█".repeat(Number(row.count));
    console.log(`  ${row.status.padEnd(30)} ${bar} (${row.count})`);
  }

  // ── 4. Current Article Status Summary ────────────────────────────────────
  console.log("\n📄 CURRENT ARTICLE STATUS SUMMARY\n");
  const articleSummary = await sql`
    SELECT status, COUNT(*) as count
    FROM public.articles
    GROUP BY status
    ORDER BY count DESC
  `;
  for (const row of articleSummary) {
    const bar = "█".repeat(Number(row.count));
    console.log(`  ${row.status.padEnd(30)} ${bar} (${row.count})`);
  }

  // ── 5. Notifications Sent ─────────────────────────────────────────────────
  console.log("\n🔔 RECENT NOTIFICATIONS (last 10)\n");
  const notifs = await sql`
    SELECT kind, title, is_read, created_at
    FROM public.notifications
    ORDER BY created_at DESC
    LIMIT 10
  `;
  if (notifs.length === 0) {
    console.log("  (no notifications found)");
  } else {
    for (const n of notifs) {
      const read = n.is_read ? "✓ read" : "● unread";
      console.log(`  [${read}] ${n.kind} — ${n.title}`);
      console.log(`          ${new Date(n.created_at).toLocaleString("en-IN")}`);
    }
  }

  // ── 6. Activity Stream ────────────────────────────────────────────────────
  console.log("\n⚡ ACTIVITY STREAM (last 10)\n");
  const activity = await sql`
    SELECT actor_name_snapshot, summary, created_at
    FROM public.activity_stream
    ORDER BY created_at DESC
    LIMIT 10
  `;
  if (activity.length === 0) {
    console.log("  (no activity found)");
  } else {
    for (const a of activity) {
      console.log(`  [${new Date(a.created_at).toLocaleString("en-IN")}] ${a.actor_name_snapshot}`);
      console.log(`    ${a.summary}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  END OF AUDIT REPORT");
  console.log("=".repeat(70));
}

auditWorkflow().catch((err) => {
  console.error("❌ Audit failed:", err);
  process.exit(1);
});
