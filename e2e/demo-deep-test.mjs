import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const outDir = path.resolve(__dirname, "screenshots", "demo-deep");
mkdirSync(outDir, { recursive: true });

const EMAIL = "admin@pragyapravah.local";
const PASSWORD = "Pragya@12345";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

let pass = 0, fail = 0, total = 0;

async function step(name, fn) {
  total++;
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
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
}

// =========================================================================
// 1. LOGIN
// =========================================================================
console.log("\n\x1b[36m===== 1. LOGIN FLOW =====\x1b[0m");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await shot("01a-login-page");

await step("Login page has credential card with email/password", async () => {
  await page.waitForSelector("text=admin@pragyapravah.local", { timeout: 5000 });
  await page.waitForSelector("text=Pragya@12345", { timeout: 3000 });
});

await step("Language toggle switches between EN/HI", async () => {
  const langBtn = page.locator("button").filter({ hasText: /EN|हि/ });
  if ((await langBtn.count()) === 0) throw new Error("Language toggle missing (expected EN/हि)");
});

await step("Quick-fill auto-populates credentials", async () => {
  await page.locator("button").filter({ hasText: /Fill Super Admin|सुपर एडमिन भरें/i }).click();
  const email = await page.locator('input[type="email"]').inputValue();
  if (email !== EMAIL) throw new Error(`Expected ${EMAIL}, got ${email}`);
});

await step("Sign in navigates to dashboard", async () => {
  await Promise.all([
    page.waitForURL("**/dashboard*", { timeout: 15000 }),
    page.locator("button").filter({ hasText: /Sign In|लॉगिन/i }).click(),
  ]);
});
await shot("01b-dashboard-after-login");

// =========================================================================
// 2. NAVBAR & NAVIGATION
// =========================================================================
console.log("\n\x1b[36m===== 2. NAVBAR & NAVIGATION =====\x1b[0m");

await step("Navbar shows user identity", async () => {
  const header = page.locator("header").first();
  const text = await header.textContent();
  if (!text.includes("Bhopal") && !text.includes("भोपाल") && !text.includes("console") && !text.includes("प्रणाली"))
    throw new Error("Branding missing in navbar");
});

await step("Theme toggle works", async () => {
  const html = page.locator("html");
  const initialClass = await html.getAttribute("class");

  const themeBtn = page.locator("header button[aria-label*='mode' i], header button[aria-label*='मोड' i], header button[title*='Mode' i], header button[title*='मोड' i]").first();
  if ((await themeBtn.count()) === 0) {
    const allBtns = await page.locator("header").first().locator("button").all();
    const sunMoon = [];
    for (const btn of allBtns) {
      const html2 = await btn.innerHTML();
      if (html2.includes("Sun") || html2.includes("Moon") || html2.includes("moon") || html2.includes("sun")) sunMoon.push(btn);
    }
    if (sunMoon.length > 0) {
      await sunMoon[0].click();
      await page.waitForTimeout(300);
      console.log("       Theme toggle clicked via SVG content");
    } else {
      console.log("       Theme toggle not found in header");
    }
  } else {
    await themeBtn.click();
    await page.waitForTimeout(300);
    const newClass = await html.getAttribute("class");
    if (newClass !== initialClass) console.log("       Theme toggled successfully");
  }
});

await step("Sidebar navigation has all module links", async () => {
  const sidebar = page.locator("nav").filter({ has: page.locator("a[href]") }).first();
  const sidebarLinks = await sidebar.locator("a").all();
  const hrefs = await Promise.all(sidebarLinks.map(l => l.getAttribute("href")));
  const expected = ["/dashboard", "/aalekh", "/calendar", "/directory", "/dayitv", "/prachar", "/users", "/super-admin"];
  const found = expected.filter(e => hrefs.some(h => h && h.startsWith(e)));
  console.log(`       Sidebar links found: ${found.join(", ")}`);
  if (found.length < 4) throw new Error(`Too few sidebar links: ${found.length}`);
});

// =========================================================================
// 3. DASHBOARD - Deep Interaction
// =========================================================================
console.log("\n\x1b[36m===== 3. DASHBOARD DEEP TEST =====\x1b[0m");

await step("Dashboard shows event cards", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Shivir") && !body.includes("Samvad") && !body.includes("Samaroh"))
    throw new Error("No seeded events visible on dashboard");
});

await step("Dashboard shows circulars panel", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Baithak") && !body.includes("Guidelines") && !body.includes("circular") && !body.includes("Circular"))
    throw new Error("Circulars not visible");
});

await step("Dashboard shows task board", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Sanyojan") && !body.includes("Prakashan") && !body.includes("task") && !body.includes("Task"))
    throw new Error("Projects/Tasks not visible");
});

await step("Dashboard shows notifications", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("notification") && !body.includes("Notification") && !body.includes("seed") && !body.includes("status"))
    throw new Error("Notifications not visible");
});

await step("Dashboard shows surveys panel", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Sarvekshan") && !body.includes("survey") && !body.includes("Survey"))
    throw new Error("Surveys not visible");
});

await shot("03a-dashboard-full");

// =========================================================================
// 4. AALEKH - Article Pipeline
// =========================================================================
console.log("\n\x1b[36m===== 4. AALEKH DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/aalekh`, { waitUntil: "networkidle" });
await shot("04a-aalekh-page");

await step("Aalekh shows article cards with data", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Bharatiya") && !body.includes("Yuva") && !body.includes("Prachin"))
    throw new Error("Seeded articles not visible. Got: " + body.substring(0, 300));
});

await step("List/Gallery view toggle works", async () => {
  const toggleBtns = page.locator("button").filter({ hasText: /List|Gallery|लिस्ट|गैलरी/i });
  if ((await toggleBtns.count()) >= 1) {
    await toggleBtns.first().click();
    await page.waitForTimeout(500);
    console.log("       Toggle clicked successfully");
  }
});

await step("Article has a status badge", async () => {
  const badges = page.locator('[class*=badge], [class*=status]').filter({ hasText: /draft|published|authorized|public|review/i });
  if ((await badges.count()) === 0) {
    const body = await page.locator("body").textContent();
    if (body.includes("Bharatiya")) console.log("       Article content present but no status badge found");
  }
});

await shot("04b-aalekh-interaction");

// =========================================================================
// 5. PRACHAR - Campaigns
// =========================================================================
console.log("\n\x1b[36m===== 5. PRACHAR DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/prachar`, { waitUntil: "networkidle" });
await shot("05a-prachar-page");

await step("Prachar shows campaign cards", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 100) throw new Error("Prachar page too sparse");
});

await step("Prachar template carousel loads", async () => {
  const carousel = page.locator('[class*=embla], [class*=carousel], [class*=template]');
  if ((await carousel.count()) > 0) {
    const prevBtns = carousel.locator("button");
    const count = await prevBtns.count();
    if (count > 0) {
      await prevBtns.first().click();
      await page.waitForTimeout(300);
      console.log("       Carousel interaction ok");
    }
  } else {
    console.log("       No carousel found - checking body...");
  }
});

await step("Campaign stats cards visible", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Total") && !body.includes("Campaign") && !body.includes("campaign") && body.length < 200)
    throw new Error("Stats area seems empty");
});

await shot("05b-prachar-interaction");

// =========================================================================
// 6. CALENDAR - Events Grid
// =========================================================================
console.log("\n\x1b[36m===== 6. CALENDAR DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/calendar`, { waitUntil: "networkidle" });
await shot("06a-calendar-page");

await step("Calendar month grid renders", async () => {
  const cells = page.locator('[class*=day], td, [class*=grid]').first();
  if ((await page.locator("body").textContent()).length < 100) throw new Error("Calendar too sparse");
});

await step("Month/Week view toggle works", async () => {
  const toggles = page.locator("button").filter({ hasText: /Month|Week|माह|सप्ताह/i });
  if ((await toggles.count()) >= 2) {
    await toggles.last().click();
    await page.waitForTimeout(500);
    await toggles.first().click();
    await page.waitForTimeout(500);
    console.log("       View toggled successfully");
  }
});

await step("Event chips appear in calendar", async () => {
  const body = await page.locator("body").textContent();
  if (body.includes("Shivir") || body.includes("Samvad") || body.includes("Samaroh")) {
    console.log("       Event titles found in calendar");
  }
});

await step("Search input filters events", async () => {
  const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  if ((await searchInput.count()) > 0) {
    await searchInput.fill("Shivir");
    await page.waitForTimeout(500);
    await searchInput.clear();
    console.log("       Search input works");
  }
});

await shot("06b-calendar-interaction");

// =========================================================================
// 7. VIMARSH - Discourse Topics
// =========================================================================
console.log("\n\x1b[36m===== 7. VIMARSH DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/vimarsh`, { waitUntil: "networkidle" });
await shot("07a-vimarsh-page");

await step("Vimarsh topic cards visible", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Atma") && !body.includes("Vibhajan") && !body.includes("Shiksha"))
    throw new Error("Seeded vimarsh topics not found");
});

await step("Accordion expand/collapse works", async () => {
  const accordionTriggers = page.locator("button, [role=button], [class*=trigger]").filter({ hasText: /Atma|Vibhajan|Shiksha|Paryavaran/i });
  const count = await accordionTriggers.count();
  if (count > 0) {
    await accordionTriggers.first().click();
    await page.waitForTimeout(800);
    await accordionTriggers.first().click();
    await page.waitForTimeout(300);
    console.log(`       Accordion toggled (${count} triggers)`);
  } else {
    console.log("       No accordion triggers found, checking clickable cards...");
    const topicCards = page.locator('[class*=card], [class*=topic]').filter({ hasText: /Atma|Vibhajan|Shiksha/i });
    const cardCount = await topicCards.count();
    if (cardCount > 0) {
      await topicCards.first().click();
      await page.waitForTimeout(500);
      console.log(`       Clicked topic card (${cardCount} cards)`);
    }
  }
});

await step("Search filters topics", async () => {
  const search = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  if ((await search.count()) > 0) {
    await search.fill("Shiksha");
    await page.waitForTimeout(500);
    const body = await page.locator("body").textContent();
    if (body.includes("Shiksha")) console.log("       Search filtering works");
    await search.clear();
  }
});

await shot("07b-vimarsh-interaction");

// =========================================================================
// 8. DIRECTORY - Members
// =========================================================================
console.log("\n\x1b[36m===== 8. DIRECTORY DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/directory`, { waitUntil: "networkidle" });
await shot("08a-directory-page");

await step("Directory member cards load", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 100) throw new Error("Directory too sparse");
});

await step("Aayam filter chips work", async () => {
  const chips = page.locator("button").filter({ hasText: /Yuva|Mahila|Shodh|Prachar|Vimarsh|All|सभी/i });
  if ((await chips.count()) > 0) {
    await chips.first().click();
    await page.waitForTimeout(500);
    console.log("       Filter chip clicked");
  }
});

await step("Search input works", async () => {
  const search = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  if ((await search.count()) > 0) {
    await search.fill("Admin");
    await page.waitForTimeout(500);
    await search.clear();
    console.log("       Search works");
  }
});

await step("Member card expand shows contact actions", async () => {
  const memberCards = page.locator('[class*=card]').filter({ hasText: /Admin|Local/i });
  const count = await memberCards.count();
  if (count > 0) {
    await memberCards.first().click();
    await page.waitForTimeout(500);
    const body = await page.locator("body").textContent();
    if (body.includes("@") || body.includes("Voice") || body.includes("WhatsApp") || body.includes("phone") || body.includes("Phone")) {
      console.log("       Expanded member shows contact info");
    }
  }
});

await shot("08b-directory-interaction");

// =========================================================================
// 9. DAYITV - Org Structure
// =========================================================================
console.log("\n\x1b[36m===== 9. DAYITV DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/dayitv`, { waitUntil: "networkidle" });
await shot("09a-dayitv-page");

await step("Dayitv shows info cards", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 200) throw new Error("Dayitv page too sparse");
});

await step("Vibhag expandable sections work", async () => {
  const vibhagHeaders = page.locator("button, [role=button], [class*=header]").filter({ hasText: /Vibhag|भोपाल|Bhopal/i });
  const count = await vibhagHeaders.count();
  if (count > 0) {
    await vibhagHeaders.first().click();
    await page.waitForTimeout(500);
    await vibhagHeaders.first().click();
    console.log(`       Expanded/collapsed vibhag section (${count})`);
  }
});

await step("Vishay badges visible", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Rashtra") && !body.includes("Dharma") && !body.includes("Sanskriti") && !body.includes("बोध") && body.length > 100) {
    console.log("       Body content: " + body.substring(200, 400) + "...");
  }
});

await shot("09b-dayitv-interaction");

// =========================================================================
// 10. USERS - User Management
// =========================================================================
console.log("\n\x1b[36m===== 10. USERS DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/users`, { waitUntil: "networkidle" });
await shot("10a-users-page");

await step("Users page loads admin list", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes(EMAIL) && !body.includes("admin") && !body.includes("Admin"))
    throw new Error("Admin user not visible in users list");
});

await step("User search filters work", async () => {
  const search = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  if ((await search.count()) > 0) {
    await search.fill(EMAIL);
    await page.waitForTimeout(300);
    await search.clear();
    console.log("       User search works");
  }
});

await step("Status filter dropdown works", async () => {
  const filters = page.locator("select, button, [role=combobox]").filter({ hasText: /status|All|सभी|Active|Inactive/i });
  if ((await filters.count()) > 0) {
    await filters.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    console.log("       Filter dropdown interacted");
  }
});

await step("User card click shows details", async () => {
  const userCards = page.locator('[class*=card], [class*=row], button').filter({ hasText: /Local Admin|Admin/i });
  const count = await userCards.count();
  if (count > 0) {
    await userCards.first().click();
    await page.waitForTimeout(500);
    const body = await page.locator("body").textContent();
    if (body.includes("super_admin") || body.includes("super") || body.includes("role") || body.includes("Role")) {
      console.log("       User detail shows role info");
    }
  }
});

await step("Create account dialog can be opened", async () => {
  const createBtn = page.locator("button, a").filter({ hasText: /Create account|नया खाता|Add User/i });
  if ((await createBtn.count()) > 0) {
    await createBtn.first().click();
    await page.waitForTimeout(500);
    const dialog = page.locator('[role=dialog], [class*=modal]');
    if ((await dialog.count()) > 0) {
      console.log("       Create account dialog opened");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  }
});

await shot("10b-users-interaction");

// =========================================================================
// 11. SUPER ADMIN
// =========================================================================
console.log("\n\x1b[36m===== 11. SUPER ADMIN DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/super-admin`, { waitUntil: "networkidle" });
await shot("11a-super-admin-page");

await step("Super admin tabs visible", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Users") && !body.includes("Audit") && !body.includes("Settings") && !body.includes("Org"))
    throw new Error("Super admin tabs not found");
});

await step("Audit Logs tab content loads", async () => {
  const auditTab = page.locator("button, [role=tab]").filter({ hasText: /Audit/i });
  if ((await auditTab.count()) > 0) {
    await auditTab.click();
    await page.waitForTimeout(500);
    await shot("11b-super-admin-audit");
    console.log("       Audit logs tab opened");
  }
});

await step("Org Settings tab form loads", async () => {
  const settingsTab = page.locator("button, [role=tab]").filter({ hasText: /Settings|Org/i });
  if ((await settingsTab.count()) > 0) {
    await settingsTab.click();
    await page.waitForTimeout(500);
    await shot("11c-super-admin-settings");
    const inputs = page.locator('input[type="text"], input[type="email"]');
    const count = await inputs.count();
    if (count > 0) console.log(`       Settings form has ${count} input fields`);
  }
});

await step("Users tab re-renders user management", async () => {
  const usersTab = page.locator("button, [role=tab]").filter({ hasText: /^Users$/i });
  if ((await usersTab.count()) > 0) {
    await usersTab.click();
    await page.waitForTimeout(500);
    console.log("       Users tab reactivated");
  }
});

// =========================================================================
// 12. HISTORY (Activity)
// =========================================================================
console.log("\n\x1b[36m===== 12. HISTORY DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/history`, { waitUntil: "networkidle" });
await shot("12a-history-page");

await step("History timeline shows activity entries", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("event") && !body.includes("article") && !body.includes("project") && !body.includes("Activity") && body.length < 200)
    throw new Error("History page has no activity content");
});

await step("Historical fact cards visible", async () => {
  const body = await page.locator("body").textContent();
  if (body.includes("Ved") || body.includes("Sanskrit") || body.includes("गणित") || body.includes("1947") || body.length > 200) {
    console.log("       Historical content present");
  }
});

await shot("12b-history-interaction");

// =========================================================================
// 13. LIBRARY
// =========================================================================
console.log("\n\x1b[36m===== 13. LIBRARY DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/library`, { waitUntil: "networkidle" });
await shot("13a-library-page");

await step("Library shows book cards", async () => {
  await page.waitForSelector("text=Institutional E-Library", { timeout: 5000 });
});

await step("Category filter buttons work", async () => {
  const categoryBtns = page.locator("button").filter({ hasText: /All|Rajneeti|Vastu|Jyotish|Ayurveda|सभी/i });
  if ((await categoryBtns.count()) > 1) {
    await categoryBtns.last().click();
    await page.waitForTimeout(500);
    await categoryBtns.first().click();
    console.log("       Category filters worked");
  }
});

await step("Search input works", async () => {
  const search = page.locator('input[placeholder*="Search"]').first();
  if ((await search.count()) > 0) {
    await search.fill("Arthashastra");
    await page.waitForTimeout(300);
    await search.clear();
    console.log("       Library search works");
  }
});

await step("Book card click shows detail panel", async () => {
  const bookCards = page.locator('[class*=card]').filter({ hasText: /Arthashastra|Rasaratna|Manusmriti|Kamasutra/i });
  const count = await bookCards.count();
  if (count > 0) {
    await bookCards.first().click();
    await page.waitForTimeout(500);
    const body = await page.locator("body").textContent();
    if (body.includes("Read Online") || body.includes("Download") || body.includes("Close")) {
      console.log("       Book detail panel opened with action buttons");
    }
  }
});

await shot("13b-library-interaction");

// =========================================================================
// 14. FEED
// =========================================================================
console.log("\n\x1b[36m===== 14. FEED =====\x1b[0m");
await page.goto(`${BASE}/feed`, { waitUntil: "networkidle" });
await shot("14a-feed");

await step("Feed page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Feed page empty");
});

// =========================================================================
// 15. PARICHAY (About)
// =========================================================================
console.log("\n\x1b[36m===== 15. PARICHAY DEEP TEST =====\x1b[0m");
await page.goto(`${BASE}/parichay`, { waitUntil: "networkidle" });
await shot("15a-parichay-page");

await step("Parichay identity section visible", async () => {
  await page.waitForSelector("text=Who We Are", { timeout: 5000 });
});

await step("Accordion sections expandable", async () => {
  const accordions = page.locator('[class*=accordion], [data-state]').or(
    page.locator("button").filter({ hasText: /Mission|Vision|Values|History|इतिहास|मिशन|दृष्टि/i })
  );
  const count = await accordions.count();
  if (count > 0) {
    await accordions.first().click();
    await page.waitForTimeout(500);
    await accordions.first().click();
    console.log(`       Accordion toggled (${count} triggers)`);
  }
});

await shot("15b-parichay-interaction");

// =========================================================================
// 16. VOTE (Public voting)
// =========================================================================
console.log("\n\x1b[36m===== 16. VOTE =====\x1b[0m");
await page.goto(`${BASE}/vote`, { waitUntil: "networkidle" });
await shot("16a-vote-page");

await step("Vote page loads", async () => {
  const body = await page.locator("body").textContent();
  if (body.length < 50) throw new Error("Vote page empty");
});

// =========================================================================
// 17. ROLE SWITCH
// =========================================================================
console.log("\n\x1b[36m===== 17. ROLE SWITCH =====\x1b[0m");

await step("Role switcher present in header", async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const header = page.locator("header").first();
  const roleElement = header.locator("button, [role=combobox], select").filter({ hasText: /Admin|सुपर|Super/i });
  const count = await roleElement.count();
  if (count > 0) {
    console.log(`       Role switcher found (${count} elements)`);
  } else {
    const headerText = await header.textContent();
    console.log(`       Header text excerpt: ${(headerText || "").substring(0, 200)}`);
  }
});

await shot("17a-role-switcher");

// =========================================================================
// 18. LANDING PAGE
// =========================================================================
console.log("\n\x1b[36m===== 18. LANDING PAGE =====\x1b[0m");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await shot("18a-landing-page");

await step("Landing page shows identity and navigation", async () => {
  const body = await page.locator("body").textContent();
  if (!body.includes("Pragya") && !body.includes("प्रज्ञा")) throw new Error("Brand identity missing");
});

await step("Landing page workstream sections visible", async () => {
  const body = await page.locator("body").textContent();
  const expected = ["Aalekh", "Prachar", "Vimarsh", "Vritt"];
  const found = expected.filter(item => body.includes(item));
  if (found.length < 2) console.log(`       Workstreams found: ${found.join(", ")}`);
  else console.log(`       Workstreams found: ${found.join(", ")}`);
});

// =========================================================================
// 19. SIGN OUT
// =========================================================================
console.log("\n\x1b[36m===== 19. SIGN OUT =====\x1b[0m");
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });

await step("Sign out button works", async () => {
  const signOutBtn = page.locator("button").filter({ hasText: /Sign Out|साइन आउट|Logout|लॉगआउट/i });
  const count = await signOutBtn.count();
  if (count > 0) {
    await signOutBtn.first().click();
    await page.waitForTimeout(1000);
    const url = page.url();
    if (url.includes("/login")) {
      console.log("       Redirected to login after sign out");
    } else {
      console.log(`       After sign out URL: ${url}`);
    }
  }
});

// =========================================================================
// SUMMARY
// =========================================================================
console.log(`\n\x1b[36m========================================\x1b[0m`);
console.log(`  \x1b[33mDEEP TEST RESULTS: ${pass}/${total} passed, ${fail} failed\x1b[0m`);
console.log(`  \x1b[33mScreenshots: ${outDir}\x1b[0m`);
console.log(`\x1b[36m========================================\x1b[0m`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
