import { test, expect } from "@playwright/test";

test("library cards expose an accessible View Details control", async ({ page }) => {
  await page.goto("/library", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /view details/i }).first()).toBeVisible();
});

test("dashboard shows seeded event cards after login", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /fill super admin/i }).click();
  await page.getByRole("button", { name: /sign in|लॉगिन/i }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText("Bharatiya Chintan Shivir").first()).toBeVisible();
});

test("primary mobile header controls meet 44px touch target minimum", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/", { waitUntil: "networkidle" });
  const smallTargets = await page.evaluate(() =>
    Array.from(document.querySelectorAll("header button, header [role='button'], header select, header a[href]"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      })
      .map((element) => element.getAttribute("aria-label") || element.textContent?.trim() || element.getAttribute("href") || element.tagName),
  );
  expect(smallTargets).toEqual([]);
});
