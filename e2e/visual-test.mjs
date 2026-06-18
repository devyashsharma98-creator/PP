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

const pages = [
  { path: "/", name: "homepage" },
  { path: "/login", name: "login" },
  { path: "/parichay", name: "parichay" },
  { path: "/library", name: "library" },
  { path: "/feed", name: "feed" },
  { path: "/calendar", name: "calendar" },
  { path: "/aalekh", name: "aalekh" },
  { path: "/prachar", name: "prachar" },
];

for (const { path, name } of pages) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log(`OK ${name}`);
}

await browser.close();
console.log(`\nScreenshots saved to ${outDir}`);
