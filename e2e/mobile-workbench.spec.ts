import { test, expect } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

const PAGES = [
  { path: "/dashboard", name: "dashboard" },
  { path: "/prachar", name: "prachar" },
  { path: "/aalekh", name: "aalekh" },
  { path: "/library", name: "library" },
];

async function gotoAndSettle(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  // Pages may redirect to /login when unauthenticated — that's fine, just settle
  await page.waitForTimeout(1500);
}

test.describe("Mobile 390×844 — page renders, no full-page body overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  for (const { path, name } of PAGES) {
    test(`${name}`, async ({ page }) => {
      await gotoAndSettle(page, path);
      const landed = new URL(page.url()).pathname;

      // Only assert scroll containment when the app shell actually loaded (not redirected to /login)
      if (landed === path) {
        // Body must not grow taller than the viewport — scroll lives inside main#main-content, not body
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        expect(bodyHeight).toBeLessThanOrEqual(MOBILE.height + 50);
      }

      await page.screenshot({ path: `e2e/screenshots/mobile-${name}.png`, fullPage: false });
    });
  }
});

test.describe("Desktop 1440×900 — page renders within viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
  });

  for (const { path, name } of PAGES) {
    test(`${name}`, async ({ page }) => {
      await gotoAndSettle(page, path);
      const landed = new URL(page.url()).pathname;

      if (landed === path) {
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        expect(bodyHeight).toBeLessThanOrEqual(DESKTOP.height + 50);
      }

      await page.screenshot({ path: `e2e/screenshots/desktop-${name}.png`, fullPage: false });
    });
  }
});
