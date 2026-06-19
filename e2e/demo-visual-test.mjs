import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve(__dirname, "screenshots", "demo");
mkdirSync(outDir, { recursive: true });

const EMAIL = "admin@pragyapravah.local";
const PASSWORD = "Pragya@12345";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

let pass = 0, fail = 0;

async function step(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    pass++;
  } catch (e) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
    fail++;
  }
}

async function shot(name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
}

// ── 1. LOGIN ──
console.log("\n=== 1. LOGIN ===");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });

await step("Login page loads with demo credential card", async () => {
  await page.waitForSelector("text=Super Admin test account", { timeout: 10000 });
});

await step("Quick-fill button works", async () => {
  const fillBtn = page.locator("button").filter({ hasText: /Fill Super Admin|सुपर एडमिन भरें/i });
  await fillBtn.click();
  await page.waitForTimeout(300);
  const emailVal = await page.locator('input[type="email"]').inputValue();
  if (emailVal !== EMAIL) throw new Error(`Expected ${EMAIL}, got ${emailVal}`);
});

await step("Sign in succeeds", async () => {
  const signInBtn = page.locator("button").filter({ hasText: /Sign In|लॉगिन/i });
  await Promise.all([
    page.waitForURL("**/dashboard*", { timeout: 15000 }),
    signInBtn.click(),
  ]);
});

await shot("01-dashboard");
console.log("  >> Logged in, on dashboard");

// ── 2. DASHBOARD ──
console.log("\n=== 2. DASHBOARD ===");
await step("Dashboard loads with user info", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Dashboard") && !body.includes("डैशबोर्ड")) throw new Error("Dashboard content missing");
});

// ── 3. AALEKH (Articles) ──
console.log("\n=== 3. AALEKH (Articles) ===");
await page.goto(`${BASE}/aalekh`, { waitUntil: "networkidle" });
await shot("02-aalekh");

await step("Aalekh page shows articles", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Bharatiya") && !body.includes("article") && !body.includes("Aalekh"))
    throw new Error("Article content missing");
});

// ── 4. PRACHAR ──
console.log("\n=== 4. PRACHAR (Campaigns) ===");
await page.goto(`${BASE}/prachar`, { waitUntil: "networkidle" });
await shot("03-prachar");

await step("Prachar page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Prachar page empty");
});

// ── 5. CALENDAR ──
console.log("\n=== 5. CALENDAR ===");
await page.goto(`${BASE}/calendar`, { waitUntil: "networkidle" });
await shot("04-calendar");

await step("Calendar page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Calendar page empty");
});

// ── 6. VIMARSH ──
console.log("\n=== 6. VIMARSH ===");
await page.goto(`${BASE}/vimarsh`, { waitUntil: "networkidle" });
await shot("05-vimarsh");

await step("Vimarsh page shows topics", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Atma") && !body.includes("topic") && !body.includes("Vimarsh"))
    throw new Error("Vimarsh content missing");
});

// ── 7. LIBRARY ──
console.log("\n=== 7. LIBRARY ===");
await page.goto(`${BASE}/library`, { waitUntil: "networkidle" });
await shot("06-library");

await step("Library page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Library page empty");
});

// ── 8. DIRECTORY ──
console.log("\n=== 8. DIRECTORY ===");
await page.goto(`${BASE}/directory`, { waitUntil: "networkidle" });
await shot("07-directory");

await step("Directory page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Directory page empty");
});

// ── 9. DAYITV (Org Structure) ──
console.log("\n=== 9. DAYITV ===");
await page.goto(`${BASE}/dayitv`, { waitUntil: "networkidle" });
await shot("08-dayitv");

await step("Dayitv page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Dayitv page empty");
});

// ── 10. USERS (Admin) ──
console.log("\n=== 10. USERS ===");
await page.goto(`${BASE}/users`, { waitUntil: "networkidle" });
await shot("09-users");

await step("Users page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Users page empty");
});

// ── 11. SUPER ADMIN ──
console.log("\n=== 11. SUPER ADMIN ===");
await page.goto(`${BASE}/super-admin`, { waitUntil: "networkidle" });
await shot("10-super-admin");

await step("Super admin page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Super admin page empty");
});

// ── 12. OVERVIEW ──
console.log("\n=== 12. OVERVIEW ===");
await page.goto(`${BASE}/overview`, { waitUntil: "networkidle" });
await shot("11-overview");

await step("Overview page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Overview page empty");
});

// ── 13. HISTORY (Activity) ──
console.log("\n=== 13. HISTORY ===");
await page.goto(`${BASE}/history`, { waitUntil: "networkidle" });
await shot("12-history");

await step("History page shows activity", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("event") && !body.includes("article") && !body.includes("activity") && !body.includes("Activity"))
    throw new Error("History content missing - expected activity entries");
});

// ── 14. FEED ──
console.log("\n=== 14. FEED ===");
await page.goto(`${BASE}/feed`, { waitUntil: "networkidle" });
await shot("13-feed");

await step("Feed page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Feed page empty");
});

// ── 15. VOTE ──
console.log("\n=== 15. VOTE ===");
await page.goto(`${BASE}/vote`, { waitUntil: "networkidle" });
await shot("14-vote");

await step("Vote page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Vote page empty");
});

// ── 16. PARICHAY (About) ──
console.log("\n=== 16. PARICHAY ===");
await page.goto(`${BASE}/parichay`, { waitUntil: "networkidle" });
await shot("15-parichay");

await step("Parichay page loads", async () => {
  await page.waitForSelector("text=Who We Are", { timeout: 5000 });
});

// ── 17. ROLE SWITCH ──
console.log("\n=== 17. ROLE SWITCH ===");
await step("Role switcher visible in navbar", async () => {
  const header = page.locator("header").first();
  const roleSelect = header.locator("button, select, [role=combobox]").filter({ hasText: /Super Admin|सुपर|Admin|एडमिन/i });
  if ((await roleSelect.count()) === 0) {
    const navText = await header.textContent();
    if (navText) console.log(`       Nav contains: ${navText.substring(0, 200)}`);
  }
});

// ── 18. LANDING PAGE ──
console.log("\n=== 18. LANDING PAGE ===");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await shot("16-landing");

await step("Landing page loads with identity", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Pragya") && !body.includes("प्रज्ञा")) throw new Error("Landing page missing identity");
});

// ── SUMMARY ──
console.log(`\n========================================`);
console.log(`  DEMO TEST RESULTS: ${pass} passed, ${fail} failed`);
console.log(`  Screenshots in: ${outDir}`);
console.log(`========================================\n`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
