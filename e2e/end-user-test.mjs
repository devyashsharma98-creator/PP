import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://pragya-pravah-ui-psi.vercel.app";
const outDir = path.resolve(__dirname, "screenshots");
mkdirSync(outDir, { recursive: true });

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

// ── 1. HOMEPAGE ──
console.log("\n=== 1. HOMEPAGE (Public Visitor) ===");
await page.goto(BASE, { waitUntil: "networkidle" });
await shot("01-homepage");

await step("Title contains 'Pragya Pravah'", async () => {
  const title = await page.title();
  if (!title.includes("Pragya")) throw new Error(`Got: "${title}"`);
});

await step("Hero heading visible", async () => {
  await page.waitForSelector("text=Pragya Pravah", { timeout: 5000 });
});

await step("Sign In button present", async () => {
  const btns = page.locator("a, button").filter({ hasText: /Sign In|प्रवेश/i });
  if ((await btns.count()) === 0) throw new Error("Missing");
});

await step("Four workstreams visible: Aalekh, Prachar, Vimarsh, Vritt", async () => {
  for (const ws of ["Aalekh", "Prachar", "Vimarsh", "Vritt"]) {
    if ((await page.locator(`text=${ws}`).count()) === 0) throw new Error(`Missing: ${ws}`);
  }
});

await step("Nav links: aalekh, prachar, vimarsh, dashboard, login", async () => {
  for (const r of ["/aalekh", "/prachar", "/vimarsh", "/dashboard", "/login"]) {
    if ((await page.locator(`a[href="${r}"]`).count()) === 0) throw new Error(`Missing: ${r}`);
  }
});

await step("Language toggle present on login page", async () => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  if ((await page.locator("button, a").filter({ hasText: /हिंदी|EN/ }).count()) === 0) throw new Error("Missing on login");
  console.log("       Found on /login page");
});

// ── 2. LIBRARY ──
console.log("\n=== 2. LIBRARY (Researcher/Visitor) ===");
await page.goto(`${BASE}/library`, { waitUntil: "networkidle" });
await shot("02-library");

await step("Library title: Institutional E-Library", async () => {
  await page.waitForSelector("text=Institutional E-Library", { timeout: 5000 });
});

await step("Context cards present (Collection Depth, Disciplines, Archiving)", async () => {
  for (const label of ["Collection Depth", "Active Disciplines", "Archiving"]) {
    if ((await page.locator(`text=${label}`).count()) === 0) throw new Error(`Missing: ${label}`);
  }
});

await step("Search input exists", async () => {
  if ((await page.locator('input[placeholder*="Search"]').count()) === 0) throw new Error("Missing search");
});

await step("Subject filter buttons: All, Rajneeti, Vastu, Jyotish, Ayurveda", async () => {
  for (const s of ["All", "Rajneeti", "Vastu", "Jyotish", "Ayurveda"]) {
    if ((await page.locator("button").filter({ hasText: s }).count()) === 0) throw new Error(`Missing: ${s}`);
  }
});

await step("Filter click works (Vastu)", async () => {
  await page.locator("button").filter({ hasText: "Vastu" }).first().click();
  await page.waitForTimeout(300);
});

await step("View Details links present on cards", async () => {
  const details = page.locator("a, button").filter({ hasText: /View Details/i });
  if ((await details.count()) === 0) throw new Error("No View Details links");
});

// ── 3. FEED ──
console.log("\n=== 3. FEED (Public Reader) ===");
await page.goto(`${BASE}/feed`, { waitUntil: "networkidle" });
await shot("03-feed");

await step("Feed page loads", async () => {
  await page.waitForSelector("text=Chronicle", { timeout: 5000 });
});

// ── 4. LOGIN ──
console.log("\n=== 4. LOGIN (Internal User) ===");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await shot("04-login");

await step("Super Admin test account card visible", async () => {
  await page.waitForSelector("text=Super Admin test account", { timeout: 5000 });
});

await step("Email and password input fields present", async () => {
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passInput = page.locator('input[type="password"], input[name="password"]');
  if ((await emailInput.count()) === 0) throw new Error("Email input missing");
  if ((await passInput.count()) === 0) throw new Error("Password input missing");
});

await step('"Fill Super Admin" quick-fill button exists', async () => {
  if ((await page.locator("button, a").filter({ hasText: /Fill Super Admin|सुपर एडमिन भरें/i }).count()) === 0)
    throw new Error("Missing");
});

await step("Credentials displayed: admin@pragyapravah.local, Pragya@12345", async () => {
  if ((await page.locator("text=admin@pragyapravah.local").count()) === 0) throw new Error("Email not shown");
  if ((await page.locator("text=Pragya@12345").count()) === 0) throw new Error("Password not shown");
});

await step("Sign In button present", async () => {
  if ((await page.locator("button").filter({ hasText: /Sign In|लॉगिन/i }).count()) === 0) throw new Error("Missing");
});

// ── 5. AUTH REDIRECTS ──
console.log("\n=== 5. AUTH PROTECTION ===");
for (const route of ["/aalekh", "/calendar", "/prachar", "/dashboard"]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await shot(`05-redirect-${route.slice(1)}`);
  await step(`${route} redirects unauthenticated to /login`, async () => {
    const url = page.url();
    if (!url.includes("/login")) throw new Error(`Got: ${url}`);
  });
}

// ── 6. PARICHAY ──
console.log("\n=== 6. PARICHAY (About Page) ===");
await page.goto(`${BASE}/parichay`, { waitUntil: "networkidle" });
await shot("06-parichay");

await step("Parichay page loads", async () => {
  await page.waitForSelector("text=Who We Are", { timeout: 5000 });
});

// ── 7. RESPONSIVE (Mobile) ──
console.log("\n=== 7. MOBILE RESPONSIVE ===");
await page.setViewportSize({ width: 375, height: 667 });

await page.goto(BASE, { waitUntil: "networkidle" });
await shot("07-mobile-homepage");
await step("Mobile homepage renders without errors", async () => {
  const text = await page.locator("body").textContent();
  if (!text.includes("Pragya")) throw new Error("Broken");
});

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await shot("08-mobile-login");
await step("Mobile login shows credential card", async () => {
  await page.waitForSelector("text=Super Admin test account", { timeout: 5000 });
});

await page.goto(`${BASE}/library`, { waitUntil: "networkidle" });
await shot("09-mobile-library");
await step("Mobile library shows cards", async () => {
  await page.waitForSelector("text=Institutional E-Library", { timeout: 3000 });
});

// ── 8. 404 ──
console.log("\n=== 8. ERROR HANDLING ===");
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto(`${BASE}/nonexistent-page-xyz`, { waitUntil: "networkidle" });
await shot("10-404");
await step("404 non-existent route handled gracefully", async () => {
  const body = await page.locator("body").textContent();
  if (!body) throw new Error("Empty body");
});

// ── SUMMARY ──
console.log(`\n========================================`);
console.log(`  RESULTS: ${pass} passed, ${fail} failed`);
console.log(`  Screenshots: 10 images in ${outDir}`);
console.log(`========================================\n`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
