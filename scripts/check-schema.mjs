import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// Check org_settings table
const orgCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='org_settings' ORDER BY ordinal_position`;
console.log("org_settings columns:");
for (const c of orgCols) console.log(`  ${c.column_name} (${c.data_type})`);

const existing = await sql`SELECT * FROM public.org_settings LIMIT 5`;
console.log("\nExisting org_settings rows:", JSON.stringify(existing, null, 2));
