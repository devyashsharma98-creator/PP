import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(DATABASE_URL);

const NEW_PASSWORD = "Pragya@123";

async function fix() {
  console.log("=== FIXING ONBOARDING PASSWORDS ===\n");

  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  const emails = [
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
  ];

  for (const email of emails) {
    await sql`UPDATE profiles SET password_hash = ${hash}, requires_password_change = true WHERE email = ${email}`;
    console.log(`   Updated ${email}`);
  }

  console.log(`\n✅ All 10 users now have password: ${NEW_PASSWORD}`);
}

fix().catch(console.error);
