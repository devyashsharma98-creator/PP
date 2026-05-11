import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ── CONFIG ───────────────────────────────────────────────────────────────────
const KEEP_EMAILS = new Set([
  "dheerendrachaturvedi@pragyapravah.in",
  "abhisheksharma@pragyapravah.in",
  "vandanamishra@pragyapravah.in",
  "shashikala@pragyapravah.in",
  "kokilachaturvedi@pragyapravah.in",
  "savitabhadoriya@pragyapravah.in",
  "ayushisahu@pragyapravah.in",
  "sanchitajain@pragyapravah.in",
  "gyaneshwarsinghkushwaha@pragyapravah.in",
  "ambujtiwari@pragyapravah.in",
]);

async function cleanup() {
  console.log("=== DATABASE CLEANUP ===\n");

  // ── 1. Find canonical unit ─────────────────────────────────────────────────
  console.log("[1/5] Finding canonical unit...");
  const unitUsage = await sql`
    WITH usage AS (
      SELECT u.id, u.code, u.name, u.created_at,
        (SELECT COUNT(*)::int FROM public.events WHERE unit_id = u.id) AS event_count,
        (SELECT COUNT(*)::int FROM public.articles WHERE unit_id = u.id) AS article_count,
        (SELECT COUNT(*)::int FROM public.departments_or_aayams WHERE unit_id = u.id) AS dept_count,
        (SELECT COUNT(*)::int FROM public.user_role_assignments WHERE unit_id = u.id) AS assignment_count
      FROM public.units u
      WHERE u.code = 'bhopal_vibhag_root'
    )
    SELECT * FROM usage
    ORDER BY (event_count + article_count + dept_count + assignment_count) DESC, created_at ASC
  `;

  if (unitUsage.length === 0) {
    console.log("   No root units found.");
    return;
  }

  const canonicalUnit = unitUsage[0];
  const duplicateUnits = unitUsage.slice(1);
  console.log(`   Canonical unit: ${canonicalUnit.id}`);
  console.log(`   References: events=${canonicalUnit.event_count}, articles=${canonicalUnit.article_count}, depts=${canonicalUnit.dept_count}, assignments=${canonicalUnit.assignment_count}`);
  console.log(`   Duplicate units to remove: ${duplicateUnits.length}`);

  // ── 2. Reassign all duplicate unit references ──────────────────────────────
  console.log("\n[2/5] Reassigning duplicate unit references...");
  for (const dup of duplicateUnits) {
    console.log(`   ${dup.id} → ${canonicalUnit.id}`);
    await sql`UPDATE public.departments_or_aayams SET unit_id = ${canonicalUnit.id} WHERE unit_id = ${dup.id}`;
    await sql`UPDATE public.events SET unit_id = ${canonicalUnit.id} WHERE unit_id = ${dup.id}`;
    await sql`UPDATE public.articles SET unit_id = ${canonicalUnit.id} WHERE unit_id = ${dup.id}`;
    await sql`UPDATE public.user_role_assignments SET unit_id = ${canonicalUnit.id} WHERE unit_id = ${dup.id}`;
  }

  // ── 3. Delete duplicate units ──────────────────────────────────────────────
  console.log("\n[3/5] Deleting duplicate units...");
  for (const dup of duplicateUnits) {
    await sql`DELETE FROM public.units WHERE id = ${dup.id}`;
    console.log(`   Deleted unit ${dup.id}`);
  }

  // ── 4. Identify demo accounts to delete ────────────────────────────────────
  console.log("\n[4/5] Identifying demo accounts to delete...");
  const allUsers = await sql`SELECT id, email, display_name FROM public.profiles ORDER BY email`;
  const toDelete = allUsers.filter(u => !KEEP_EMAILS.has(u.email));
  const toKeep = allUsers.filter(u => KEEP_EMAILS.has(u.email));

  console.log(`   Keeping: ${toKeep.length} accounts`);
  for (const u of toKeep) console.log(`   ✅ ${u.display_name ?? u.email} (${u.email})`);

  console.log(`\n   Deleting: ${toDelete.length} accounts`);
  for (const u of toDelete) console.log(`   🗑️  ${u.display_name ?? u.email} (${u.email})`);

  // ── 5. Delete demo accounts ────────────────────────────────────────────────
  console.log("\n[5/5] Deleting demo accounts...");
  for (const u of toDelete) {
    try { await sql`DELETE FROM public.audit_logs WHERE actor_user_id = ${u.id}`; } catch { /* ignore */ }
    try { await sql`DELETE FROM public.event_status_history WHERE actor_user_id = ${u.id}`; } catch { /* ignore */ }
    try { await sql`DELETE FROM public.article_reviews WHERE reviewer_user_id = ${u.id}`; } catch { /* ignore */ }
    await sql`DELETE FROM public.profiles WHERE id = ${u.id}`;
    console.log(`   Deleted ${u.email}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n=== CLEANUP COMPLETE ===");
  const remainingUsers = await sql`SELECT COUNT(*)::int AS total FROM public.profiles`;
  const remainingUnits = await sql`SELECT COUNT(*)::int AS total FROM public.units`;
  console.log(`Remaining users: ${remainingUsers[0].total}`);
  console.log(`Remaining units: ${remainingUnits[0].total}`);
}

cleanup().catch(err => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
