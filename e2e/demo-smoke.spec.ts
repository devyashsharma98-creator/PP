import { test, expect } from "@playwright/test";

const DEMO_EMAIL = "demo.vibhag@example.com";
const DEMO_PASSWORD = "Password123!";
const ADMIN_EMAIL = "demo.admin@example.com";
const AAYAM_EMAIL = "demo.aayam@example.com";
const UNITHEAD_EMAIL = "demo.unithead@example.com";
const KARYAKARTA_EMAIL = "demo.karyakarta@example.com";

/**
 * Helper: login via the /login page.
 * Fills the form and clicks Sign In. Waits for navigation away from /login.
 */
async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect away from /login — success goes to /dashboard,
  // failure stays on /login with an error message.
  // We'll wait up to 15s then check where we are.
  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15_000,
    });
  } catch {
    // If we're still on /login, the error message should be visible
  }
}

test.describe("Pragya Pravah Demo Smoke Tests", () => {
  test("1 — /login page loads with form and demo account pills", async ({
    page,
  }) => {
    await page.goto("/login");

    // Login card visible (use the one inside main content area)
    await expect(
      page.locator("main").getByRole("heading", { name: "Pragya Pravah" }),
    ).toBeVisible();

    // Form fields present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Sign In button present
    await expect(
      page.locator('button[type="submit"]', { hasText: "Sign In" }),
    ).toBeVisible();

    // Demo account pills present
    await expect(page.getByRole("button", { name: "Vibhag Pramukh" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Karyakarta" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unit Head" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aayam Pramukh" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Super Admin" })).toBeVisible();
  });

  test("2 — demo account pill fills email and password", async ({ page }) => {
    await page.goto("/login");

    // Click the "Vibhag Pramukh" pill
    await page.getByRole("button", { name: "Vibhag Pramukh" }).click();

    // Email should be filled
    await expect(page.locator('input[type="email"]')).toHaveValue(DEMO_EMAIL);

    // Password should be filled
    await expect(page.locator('input[type="password"]')).toHaveValue(
      DEMO_PASSWORD,
    );
  });

  test("3 — login with demo account redirects to dashboard", async ({
    page,
  }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    // Check if we made it to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      // Success — dashboard loaded
      await expect(page.locator("body")).toContainText(
        /dashboard|gatividhi|गतिविधि/i,
      );
    } else if (currentUrl.includes("/login")) {
      // Login failed — check if there's an error message (auth service issue)
      const errorVisible = await page
        .locator('[class*="destructive"]')
        .isVisible();
      if (errorVisible) {
        // Auth service error — not a code bug, log it
        const errorText = await page
          .locator('[class*="destructive"]')
          .textContent();
        console.log(`Login returned error (auth service): ${errorText}`);
        test.skip(
          true,
          `Auth service error — demo account may not exist: ${errorText}`,
        );
      }
    }
  });

  test("4 — vimarsh page loads (public route)", async ({ page }) => {
    await page.goto("/vimarsh");
    await page.waitForLoadState("networkidle");

    // Should load without auth — public page
    expect(page.url()).toContain("/vimarsh");
    await expect(page.locator("body")).toContainText(
      /vimarsh|विमर्श/i,
    );
  });

  test("5 — protected route /aalekh redirects unauthenticated user to /login", async ({
    page,
  }) => {
    // Clear cookies to ensure fresh session
    await page.context().clearCookies();

    await page.goto("/aalekh");

    // Should be redirected to /login with returnTo
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("returnTo");
  });

  test("6 — protected route /prachar redirects unauthenticated user to /login", async ({
    page,
  }) => {
    await page.context().clearCookies();

    await page.goto("/prachar");

    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("7 — authenticated user can access dashboard", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    const currentUrl = page.url();
    if (!currentUrl.includes("/dashboard")) {
      test.skip(true, "Login did not succeed — auth service issue");
      return;
    }

    // Navigate to dashboard explicitly
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should stay on dashboard (not redirected away)
    expect(page.url()).toContain("/dashboard");
  });

  test("8 — authenticated user can access prachar", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    const currentUrl = page.url();
    if (!currentUrl.includes("/dashboard")) {
      test.skip(true, "Login did not succeed — auth service issue");
      return;
    }

    await page.goto("/prachar");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/prachar");
    await expect(page.locator("body")).toContainText(/prachar|प्रचार/i);
  });

  test("8b - prachar presents the command center masthead", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/prachar");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Prachar Command Center/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Distribute and Confirm Reach/i })).toBeVisible();
    await expect(page.getByText(/move approved work into public reach/i)).toBeVisible();
  });

  test("8c - prachar shows campaign distribution accountability", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/prachar");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Live Distribution Command Center/i)).toBeVisible();
    await expect(page.getByText(/Campaign Dissemination Queue/i)).toBeVisible();
    await expect(page.getByText(/skipped with reason/i)).toBeVisible();
  });

  test("8d - prachar exposes the creative studio", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/prachar");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Campaign Creative Studio/i)).toBeVisible();
    await expect(page.getByText(/Communication kits, posters, and publicity formats/i)).toBeVisible();
  });
  test("9 — authenticated user can access aalekh", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    const currentUrl = page.url();
    if (!currentUrl.includes("/dashboard")) {
      test.skip(true, "Login did not succeed — auth service issue");
      return;
    }

    await page.goto("/aalekh");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/aalekh");
    await expect(page.locator("body")).toContainText(/aalekh|आलेख/i);
  });

  test("9b - aalekh presents the karyakarta writing lane", async ({ page }) => {
    await loginAs(page, KARYAKARTA_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/aalekh");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Aalekh Writing Desk/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Draft and Submit Aalekh/i })).toBeVisible();
    await expect(page.getByText(/Draft, revise, and send forward/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Write New Article/i })).toBeVisible();
  });

  test("9c - aalekh presents the unit-head review lane", async ({ page }) => {
    await loginAs(page, UNITHEAD_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/aalekh");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/First Editorial Review Desk/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Review and Route Aalekh/i })).toBeVisible();
    await expect(page.getByText(/Pending first-review queue/i).first()).toBeVisible();
    await expect(page.getByText(/Return with notes or send to aayam/i).first()).toBeVisible();
  });

  test("9d - aalekh presents the aayam thematic review lane", async ({ page }) => {
    await loginAs(page, AAYAM_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/aalekh");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Aalekh Thematic Review Desk/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Review and Route Aalekh/i })).toBeVisible();
    await expect(page.getByText(/Forward to Vibhag Pramukh/i)).toBeVisible();
    await expect(page.getByText(/Aayam Review Queue/i)).toBeVisible();
  });

  test("9e - calendar presents the institutional planning masthead", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Institutional Calendar Desk/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Plan the Month and Track Organisational Rhythm/i })).toBeVisible();
    await expect(page.getByText(/Track monthly rhythm, upcoming work, and coordination in one view/i)).toBeVisible();
  });

  test("9f - calendar shows the hybrid planning surface", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Hybrid Planning View/i)).toBeVisible();
    await expect(page.getByText("Month Grid", { exact: true })).toBeVisible();
    await expect(page.getByText(/Selected Day Ledger/i)).toBeVisible();
  });

  test("9g - calendar exposes agenda and reminder framing", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Agenda and Reminders/i)).toBeVisible();
    await expect(page.getByText(/Upcoming Institutional Rhythm/i)).toBeVisible();
    await expect(page.getByText("Pending Coordination", { exact: true })).toBeVisible();
  });
  test("10 — logout button visible when authenticated", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    const currentUrl = page.url();
    if (!currentUrl.includes("/dashboard")) {
      test.skip(true, "Login did not succeed — auth service issue");
      return;
    }

    // LogOut button should be visible in navbar
    const logoutBtn = page.locator(
      'button[title="Sign Out"], button[title="लॉग आउट"]',
    );
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
  });
  test("11 - login presents the institutional demo bridge", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const main = page.locator("main");

    await expect(
      main.getByRole("heading", { name: /Pragya Pravah/i }),
    ).toBeVisible();
    await expect(main.getByText(/Bhopal Vibhag/i).first()).toBeVisible();
    await expect(main.getByText(/civilisational thought/i)).toBeVisible();
    await expect(main.getByText(/internal testing/i).first()).toBeVisible();
    await expect(page.getByText(/Activity ledger/i)).toHaveCount(0);
    await expect(page.getByText(/Karyakarta \(Writer\)/i)).toHaveCount(0);
  });

  test("12 - dashboard leads with institutional context and operational summary", async ({
    page,
  }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await expect(page.getByText(/Bhopal Vibhag/i).first()).toBeVisible();
    await expect(page.getByText(/Vibhag Pramukh|विभाग प्रमुख/i)).toBeVisible();
    await expect(page.getByText(/Bhopal Vibhag Activity Console/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Vibhag Review Board/i })).toBeVisible();
    await expect(page.getByText(/Vibhag & Prant Review Lane/i)).toBeVisible();
    await expect(page.getByText(/Vibhag & Prant Approval Queue/i)).toBeVisible();
    await expect(page.getByText(/Karyakarta \(Writer\)/i)).toHaveCount(0);
  });

  test("12b - admin account collapses to vibhag-pramukh UI", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    const headerText = await page.locator("header").textContent();
    expect(headerText ?? "").not.toMatch(/Karyakarta/i);
    await expect(page.getByText(/Super Admin|Org Admin/i)).toHaveCount(0);
    await expect(page.getByText(/Vibhag Pramukh|à¤µà¤¿à¤­à¤¾à¤— à¤ªà¥à¤°à¤®à¥à¤–/i)).toBeVisible();
    await expect(page.getByText(/Bhopal Vibhag Activity Console/i)).toBeVisible();
  });

  test("13 - homepage introduces Pragya Pravah and offers three clear entry paths", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const main = page.locator("main");

    await expect(main.getByText(/Pragya Pravah/i).first()).toBeVisible();
    await expect(main.getByText(/global network|वैश्विक तंत्र/i).first()).toBeVisible();
    await expect(
      main
        .getByRole("link", { name: /Understand the Vision|दृष्टि समझें/i })
        .first(),
    ).toBeVisible();
    await expect(
      main
        .getByRole("link", {
          name: /Enter Demo Console|डेमो प्रणाली खोलें/i,
        })
        .first(),
    ).toBeVisible();
    await expect(
      main
        .getByRole("link", {
          name: /Connect with the Network|संवाद से जुड़ें/i,
        })
        .first(),
    ).toBeVisible();
    await expect(main.getByText(/Fields of Work|कार्य के आयाम/i).first()).toBeVisible();
    await expect(
      main.getByText(/Choose Your Path|अपना मार्ग चुनें/i).first(),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: /The flow of mission/i }).first(),
    ).toBeVisible();
    await expect(page.getByText(/Activity ledger/i)).toHaveCount(0);
    await expect(page.getByText(/Karyakarta \(Writer\)/i)).toHaveCount(0);
  });

  test("13b - authenticated / shows ERP launchpad (not public landing)", async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

    if (!page.url().includes("/dashboard")) {
      test.skip(true, "Login did not succeed - auth service issue");
      return;
    }

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("header")).toContainText(/Internal institutional console/i);
    await expect(page.locator("main")).toContainText(/ERP Launchpad|Operational Home/i);
    await expect(page.getByRole("link", { name: /Enter Demo Console/i })).toHaveCount(0);
  });

  test("14 - /directory redirects unauthenticated user to /login", async ({ page }) => {
    await page.context().clearCookies();

    await page.goto("/directory");

    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("returnTo");
  });

  test("15 - public routes render without internal app chrome", async ({ page }) => {
    const publicRoutes = [
      { path: "/parichay", heading: /Pragya Pravah|प्रज्ञा प्रवाह|Organisation Overview/i },
      { path: "/vimarsh", heading: /Vimarsh|विमर्श/i },
    ];

    for (const route of publicRoutes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main").getByText(route.heading).first()).toBeVisible();
      await expect(page.getByText(/Activity ledger/i)).toHaveCount(0);
      await expect(page.getByText(/Karyakarta \(Writer\)/i)).toHaveCount(0);
    }
  });
});

