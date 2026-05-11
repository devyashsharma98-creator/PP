import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Check audit_logs schema
const cols = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'audit_logs'
  ORDER BY ordinal_position
`;
console.log("\n📋 audit_logs TABLE SCHEMA:");
cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) - nullable: ${c.is_nullable}`));

// Try inserting a test row to see what fails
try {
  await sql`
    INSERT INTO public.audit_logs (
      org_id, action, actor_user_id, actor_email, actor_ip,
      entity_type, entity_id, payload, change_summary
    ) VALUES (
      '2121eceb-1e2b-459f-acbe-cb6ed38c0ec6',
      'audit.test',
      '00000000-0000-4000-b000-000000000001',
      'test@audit.com',
      '127.0.0.1',
      'system',
      'test-id',
      '{"test": true}'::jsonb,
      'Audit schema test'
    )
  `;
  console.log("\n✅ Test audit row inserted successfully — schema is fine.");
  // Clean up
  await sql`DELETE FROM public.audit_logs WHERE action = 'audit.test'`;
  console.log("   (test row cleaned up)");
} catch (err) {
  console.error("\n❌ Audit insert failed:", err.message);
}
