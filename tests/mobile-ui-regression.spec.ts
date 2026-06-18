import { expect, test, type Page } from "@playwright/test";

const routes = ["/dashboard", "/aalekh", "/prachar", "/calendar", "/super-admin", "/users"] as const;
const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@pragyapravah.local");
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? "Pragya@12345");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
}

for (const viewport of viewports) {
  for (const route of routes) {
    test(`${route} fits ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await signIn(page);

      await page.goto(route);

      const mainHeading = page.locator("main h1").first();
      await expect(mainHeading).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
}
