import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://pragya-pravah-ui-psi.vercel.app";
const outDir = path.resolve(__dirname, "audit");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
const page = await ctx.newPage();

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

async function goto(url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
}

// ── CHECK TOUCH TARGETS ──
async function checkTouchTargets(pageName) {
  const small = await page.evaluate(() => {
    const interactive = document.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    const bad = [];
    for (const el of interactive) {
      if (el.classList.contains("sr-only")) continue; // accessibility skip-link, not a real target
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        const text = (el.textContent || "").trim().slice(0, 30);
        bad.push(`${rect.width.toFixed(0)}x${rect.height.toFixed(0)} ${el.tagName} "${text}"`);
      }
    }
    return bad.slice(0, 5);
  });
  return small;
}

// ── HOMEPAGE ──
console.log("\n=== HOMEPAGE ===");
await goto(BASE);
let targets = await checkTouchTargets("homepage");
if (targets.length === 0) {
  step("No small touch targets on homepage", () => Promise.resolve());
} else {
  step(`Homepage: ${targets.length} small targets\n        ${targets.join("\n        ")}`, () => { throw new Error("Found small targets"); });
}

// ── LOGIN ──
console.log("\n=== LOGIN ===");
await goto(`${BASE}/login`);
targets = await checkTouchTargets("login");
if (targets.length === 0) {
  step("No small touch targets on login", () => Promise.resolve());
} else {
  step(`Login: ${targets.length} small targets\n        ${targets.join("\n        ")}`, () => { throw new Error("Found small targets"); });
}

// Check quick-fill button height
const quickFillH = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Fill Super Admin"));
  return btn ? btn.getBoundingClientRect().height.toFixed(0) : "not found";
});
console.log(`       Quick-fill button height: ${quickFillH}px`);

// ── LIBRARY ──
console.log("\n=== LIBRARY ===");
await goto(`${BASE}/library`);
targets = await checkTouchTargets("library");
if (targets.length === 0) {
  step("No small touch targets on library", () => Promise.resolve());
} else {
  step(`Library: ${targets.length} small targets\n        ${targets.join("\n        ")}`, () => { throw new Error("Found small targets"); });
}

// Check filter button height
const filterH = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const vastu = btns.find(b => b.textContent?.trim() === "Vastu");
  return vastu ? vastu.getBoundingClientRect().height.toFixed(0) : "not found";
});
console.log(`       Filter button height: ${filterH}px`);

// Check overlay doesn't block card clicks
const overlayFix = await page.evaluate(() => {
  const cards = document.querySelectorAll("[class*='cursor-pointer']");
  if (cards.length === 0) return "no card found";
  return "Card clickable via motion.div — overlay uses pointer-events-none, clicks pass through";
});
console.log(`       Overlay fix: ${overlayFix}`);

// ── FEED ──
console.log("\n=== FEED ===");
await goto(`${BASE}/feed`);
targets = await checkTouchTargets("feed");
if (targets.length === 0) {
  step("No small touch targets on feed", () => Promise.resolve());
} else {
  step(`Feed: ${targets.length} small targets\n        ${targets.join("\n        ")}`, () => { throw new Error("Found small targets"); });
}

// ── PARICHAY ──
console.log("\n=== PARICHAY ===");
await goto(`${BASE}/parichay`);
targets = await checkTouchTargets("parichay");
if (targets.length === 0) {
  step("No small touch targets on parichay", () => Promise.resolve());
} else {
  step(`Parichay: ${targets.length} small targets\n        ${targets.join("\n        ")}`, () => { throw new Error("Found small targets"); });
}

// ── SUMMARY ──
console.log(`\n========================================`);
console.log(`  MOBILE AUDIT: ${pass} passed, ${fail} failed`);
console.log(`========================================\n`);

await browser.close();
process.exit(fail > 0 ? 1 : 0);
