import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_DpuA4BbyTzC0@ep-ancient-night-aehdo40b.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function test() {
  await client.connect();

  // Test: list all tables
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log('\nTables in Neon:');
  tables.rows.forEach(r => console.log('  -', r.table_name));

  // Test: check org_settings
  const org = await client.query('SELECT org_code, org_name FROM public.org_settings');
  console.log('\nOrg:', org.rows);

  // Test: check roles
  const roles = await client.query('SELECT code, name FROM public.roles ORDER BY code');
  console.log('\nRoles:', roles.rows.map(r => r.code));

  // Test: check units
  const units = await client.query('SELECT code, name, unit_kind FROM public.units');
  console.log('\nUnits:', units.rows.map(r => `${r.code} (${r.unit_kind})`));

  // Test: check departments
  const depts = await client.query('SELECT code, name FROM public.departments_or_aayams');
  console.log('\nDepartments/Aayams:', depts.rows.map(r => r.code));

  console.log('\nAll tests passed!');
  await client.end();
}

test().catch(e => { console.error('Test failed:', e.message); process.exit(1); });
