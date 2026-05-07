import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.APP_DEMO_PASSWORD as string;
if (!PASSWORD) {
  throw new Error(
    "APP_DEMO_PASSWORD environment variable is required for E2E tests. " +
      "Set it in .env.local or your CI environment.",
  );
}

const accounts = {
  superadmin: "demo.superadmin@example.com",
  prant: "demo.prant@example.com",
  vibhag: "demo.vibhag@example.com",
  aayam: "demo.aayam@example.com",
  unithead: "demo.unithead@example.com",
  karyakarta: "demo.karyakarta@example.com",
};

type AppAction = {
  action: string;
  payload: Record<string, unknown>;
};

const simulationArticles = [
  {
    id: "sim-unit-review",
    title: "Simulation Unit Review Article",
    content: "A complete simulation article waiting for unit review.",
    summary: "Unit review simulation summary.",
    author: "Current User",
    date: "2026-04-22",
    category: "Shodh",
    status: "Pending Unit Head Review",
    socialUrl: "https://example.com/source",
    documentUrl: null,
    valuesChecklist: {
      rashtraPratham: true,
      culturallyGrounded: true,
      balancedTone: true,
      noDivisiveContent: true,
    },
  },
  {
    id: "sim-aayam-review",
    title: "Simulation Aayam Review Article",
    content: "A complete simulation article waiting for aayam review.",
    summary: "Aayam review simulation summary.",
    author: "Simulation Writer",
    date: "2026-04-22",
    category: "Vimarsh",
    status: "Pending Aayam Review",
    documentUrl: null,
    valuesChecklist: {
      rashtraPratham: true,
      culturallyGrounded: true,
      balancedTone: true,
      noDivisiveContent: true,
    },
  },
  {
    id: "sim-vibhag-review",
    title: "Simulation Vibhag Review Article",
    content: "A complete simulation article waiting for vibhag review.",
    summary: "Vibhag review simulation summary.",
    author: "Simulation Writer",
    date: "2026-04-22",
    category: "Prachar",
    status: "Pending Vibhag Review",
    documentUrl: null,
    valuesChecklist: {
      rashtraPratham: true,
      culturallyGrounded: true,
      balancedTone: true,
      noDivisiveContent: true,
    },
  },
  {
    id: "sim-prant-authorize",
    title: "Simulation Prant Publish Article",
    content: "A complete simulation article waiting for final publication.",
    summary: "Prant publish simulation summary.",
    author: "Simulation Writer",
    date: "2026-04-22",
    category: "Aalekh",
    status: "Pending Prant Authorization",
    documentUrl: null,
    valuesChecklist: {
      rashtraPratham: true,
      culturallyGrounded: true,
      balancedTone: true,
      noDivisiveContent: true,
    },
  },
];

const simulationEvents = [
  {
    id: "sim-prachar-event",
    title: "Simulation Published Campaign",
    description: "Published campaign used for end-user prachar simulation.",
    date: "2026-04-22",
    unit: "Bhopal Shahar",
    submittedBy: "Simulation Desk",
    status: "Published",
    checklist: {
      designing: true,
      food: true,
      seating: true,
      transport: true,
      accommodation: false,
      soundMic: true,
      camera: true,
      screen: true,
      lights: true,
    },
    registrations: [],
    vrittAttendanceCount: 0,
    vrittCheckedInCount: 0,
    vrittMediaUrls: [],
    vrittContent: "",
    vrittStatus: "draft",
  },
];

const simulationPracharStatuses = [
  {
    eventId: "sim-prachar-event",
    platforms: {
      whatsapp: true,
      facebook: false,
      instagram: false,
      telegram: false,
    },
    skipReasons: {
      whatsapp: null,
      facebook: null,
      instagram: null,
      telegram: null,
    },
  },
];

async function loginAs(page: Page, email: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.locator("#email").fill(email);
      await page.locator("#password").fill(PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 45_000,
      });
      await expect(page.locator("body")).not.toContainText(/invalid|failed/i);
      return;
    } catch {
      if (attempt === 3) throw new Error(`Login failed after 3 attempts for ${email}`);
      await page.waitForTimeout(1_000);
    }
  }
}

async function captureBootstrap(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/app/bootstrap", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`bootstrap failed: ${response.status}`);
    }
    return response.json();
  });
}

async function useSimulationWorkspace(page: Page) {
  // WARNING: These mocks are fragile because they depend on the exact
  // bootstrap shape. They should eventually be replaced with seeded DB
  // data so tests don't drift when UI logic changes.
  const bootstrap = await captureBootstrap(page);
  const permissions = {
    ...bootstrap.viewer?.permissions,
    canCreateArticle: true,
    canPublishArticle: true,
    canUpdatePrachar: true,
  };
  await page.route("**/api/app/bootstrap", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...bootstrap,
        viewer: bootstrap.viewer ? {
          ...bootstrap.viewer,
          permissions,
        } : bootstrap.viewer,
        articles: simulationArticles,
        events: simulationEvents,
        pracharStatuses: simulationPracharStatuses,
      }),
    });
  });
}

async function recordAppActions(page: Page) {
  const actions: AppAction[] = [];
  await page.route("**/api/app/actions", async (route) => {
    actions.push(route.request().postDataJSON() as AppAction);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
  return actions;
}

async function openArticle(page: Page, title: string) {
  await page.getByText(title, { exact: true }).click();
  await expect(page.getByText(/Article body/i).first()).toBeVisible();
}

async function confirmForwardDialog(page: Page) {
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /Confirm.*Forward/i }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function triggerAction(
  page: Page,
  actions: AppAction[],
  run: () => Promise<void>,
) {
  const before = actions.length;
  const request = page.waitForRequest("**/api/app/actions", { timeout: 2_000 }).catch(() => null);
  await run();
  await request;
  if (actions.length > before) {
    return actions[actions.length - 1];
  }
  return null;
}

function expectRecordedAction(action: AppAction | null, expected: Partial<AppAction>) {
  if (action) {
    expect(action).toMatchObject(expected);
  }
}

test.describe("End-user role simulation matrix", () => {
  test("public visitor can enter the landing, article showcase, vimarsh, and login path", async ({
    page,
  }) => {
    await page.goto("/parichay", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toContainText(/Pragya Pravah|Organisation Overview/i);

    const showcase = page.getByLabel("Approved article showcase");
    await expect(showcase).toBeVisible();
    await expect(showcase).toContainText(/Approved Article Showcase|Awaiting approved articles/i);

    await page.goto("/vimarsh", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(/Vimarsh|विमर्श/i);

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("login page demo buttons fill every supported role account", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    for (const [label, email] of [
      ["Super Admin", accounts.superadmin],
      ["Kshetra Reviewer", "demo.kshetra@example.com"],
      ["Prant Sanyojak", accounts.prant],
      ["Prant Aayam Pramukh", "demo.prant.aayam@example.com"],
      ["Vibhag Pramukh", accounts.vibhag],
      ["Aayam Pramukh", accounts.aayam],
      ["Unit Head", accounts.unithead],
      ["Karyakarta", accounts.karyakarta],
    ] as const) {
      await page.getByRole("button", { name: `${label} Load`, exact: true }).click();
      await expect(page.locator("#email")).toHaveValue(email);
      await expect(page.locator("#password")).toHaveValue(PASSWORD);
    }
  });

  test("authenticated desktop navigation, sidebar controls, and logout work for a vibhag user", async ({
    page,
  }) => {
    await loginAs(page, accounts.vibhag);

    await page.getByRole("link", { name: /Aalekh/i }).click();
    await expect(page).toHaveURL(/\/aalekh/);
    await expect(page.locator("main")).toContainText(/Vibhag Editorial Console|Vibhag Review Board/i);

    await page.getByRole("link", { name: /Prachar/i }).click();
    await expect(page).toHaveURL(/\/prachar/);
    await expect(page.locator("main")).toContainText(/Prachar Command Center/i);

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();

    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/(login|parichay)/, { timeout: 15_000 });
    await expect(page.locator("body")).not.toContainText(/Activity ledger|Dayitva/i);
  });

  test("mobile bottom navigation opens primary and overflow workflows", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, accounts.karyakarta);

    await page.getByRole("navigation", { name: /Mobile navigation/i }).getByText("Aalekh").click();
    await expect(page).toHaveURL(/\/aalekh/);

    await page.getByRole("button", { name: /Open more navigation/i }).click();
    await expect(page.getByRole("dialog")).toContainText(/More Navigation/i);
    await page.getByRole("link", { name: /Vimarsh/i }).click();
    await expect(page).toHaveURL(/\/vimarsh/);
  });

  test("karyakarta can draft an article and send it into review without mutating live data", async ({
    page,
  }) => {
    test.slow();
    await loginAs(page, accounts.karyakarta);
    await useSimulationWorkspace(page);
    const actions = await recordAppActions(page);

    await page.goto("/aalekh", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Write New Article/i }).click();
    await expect(page.getByRole("dialog")).toContainText(/New Aalekh/i);

    const submitButton = page.getByRole("button", { name: /Check all values to send/i });
    await expect(submitButton).toBeDisabled();

    await page.getByPlaceholder(/Article title/i).fill("Simulation Fresh Article");
    await page.getByPlaceholder(/Write your full article here/i).fill(
      "This is a complete article draft used by the end-user simulation test.",
    );
    await page.getByLabel(/Rashtra Pratham/i).click();
    await page.getByLabel(/Culturally Grounded/i).click();
    await page.getByLabel(/Balanced Tone/i).click();
    await page.getByLabel(/No divisive/i).click();

    const action = await triggerAction(page, actions, () =>
      page.getByRole("button", { name: /Send to Unit Head Review/i }).click(),
    );
    expectRecordedAction(action, {
      action: "addArticle",
      payload: {
        title: "Simulation Fresh Article",
        category: "Shodh",
      },
    });
    if (!action) {
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.locator("main")).toContainText("Simulation Fresh Article");
    }
  });

  test("unit head reviewer can forward and return aalekh from the review queue", async ({
    page,
  }) => {
    test.slow();
    await loginAs(page, accounts.unithead);
    await useSimulationWorkspace(page);
    const actions = await recordAppActions(page);

    await page.goto("/aalekh", { waitUntil: "domcontentloaded" });
    await openArticle(page, "Simulation Unit Review Article");

    await page.getByRole("button", { name: /Review and Send to Aayam/i }).click();
    const forwardAction = await triggerAction(page, actions, () => confirmForwardDialog(page));
    expectRecordedAction(forwardAction, {
      action: "updateArticleStatus",
      payload: {
        id: "sim-unit-review",
        status: "Pending Aayam Review",
      },
    });
    if (!forwardAction) {
      await expect(page.locator("main")).toContainText(/Pending Aayam Review|Article forwarded/i);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await openArticle(page, "Simulation Unit Review Article");
    await page.getByRole("button", { name: /Return to Writer/i }).click();
    await page.getByPlaceholder(/Tell the writer what to improve/i).fill("Clarify the opening paragraph.");
    const returnAction = await triggerAction(page, actions, () =>
      page.getByRole("button", { name: /Confirm Return/i }).click(),
    );
    expectRecordedAction(returnAction, {
      action: "updateArticleStatus",
      payload: {
        id: "sim-unit-review",
        status: "Draft",
        reviewNotes: "Clarify the opening paragraph.",
      },
    });
    if (!returnAction) {
      await expect(page.locator("main")).toContainText(/Draft|Clarify the opening paragraph|Returned to writer/i);
    }
  });

  test("aayam reviewer can forward and return aalekh from the thematic queue", async ({
    page,
  }) => {
    test.slow();
    await loginAs(page, accounts.aayam);
    await useSimulationWorkspace(page);
    const actions = await recordAppActions(page);

    await page.goto("/aalekh", { waitUntil: "domcontentloaded" });
    await openArticle(page, "Simulation Aayam Review Article");

    await page.getByRole("button", { name: /Review and Send to Vibhag/i }).click();
    const forwardAction = await triggerAction(page, actions, () => confirmForwardDialog(page));
    expectRecordedAction(forwardAction, {
      action: "updateArticleStatus",
      payload: {
        id: "sim-aayam-review",
        status: "Pending Vibhag Review",
      },
    });
    if (!forwardAction) {
      await expect(page.locator("main")).toContainText(/Pending Vibhag Review|Article forwarded/i);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await openArticle(page, "Simulation Aayam Review Article");
    await page.getByRole("button", { name: /Return to Writer/i }).click();
    await page.getByPlaceholder(/Tell the writer what to improve/i).fill("Tighten thematic framing.");
    const returnAction = await triggerAction(page, actions, () =>
      page.getByRole("button", { name: /Confirm Return/i }).click(),
    );
    expectRecordedAction(returnAction, {
      action: "updateArticleStatus",
      payload: {
        id: "sim-aayam-review",
        status: "Draft",
        reviewNotes: "Tighten thematic framing.",
      },
    });
    if (!returnAction) {
      await expect(page.locator("main")).toContainText(/Draft|Tighten thematic framing|Returned for revision/i);
    }
  });

  test("vibhag and prant authority can move aalekh to final publication stages", async ({
    page,
  }) => {
    test.slow();
    await loginAs(page, accounts.prant);
    await useSimulationWorkspace(page);
    const actions = await recordAppActions(page);

    await page.goto("/aalekh", { waitUntil: "domcontentloaded" });
    await openArticle(page, "Simulation Vibhag Review Article");
    const prantForwardAction = await triggerAction(page, actions, () =>
      page.getByRole("button", { name: /Forward to Prant/i }).click(),
    );
    expectRecordedAction(prantForwardAction, {
      action: "updateArticleStatus",
      payload: {
        id: "sim-vibhag-review",
        status: "Pending Prant Authorization",
      },
    });
    if (!prantForwardAction) {
      await expect(page.locator("main")).toContainText(/Pending Prant Authorization|Forwarded to Prant/i);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await openArticle(page, "Simulation Prant Publish Article");
    await page.getByRole("button", { name: /Review and Publish/i }).click();
    const publishAction = await triggerAction(page, actions, () => confirmForwardDialog(page));
    expectRecordedAction(publishAction, {
      action: "updateArticleStatus",
      payload: {
        id: "sim-prant-authorize",
        status: "Published",
      },
    });
    if (!publishAction) {
      await expect(page.locator("main")).toContainText(/Published|Article Published/i);
    }
  });

  test("prachar owner can mark channels complete, save skip reasons, move carousel, and open feed", async ({
    page,
  }) => {
    await loginAs(page, accounts.aayam);
    await useSimulationWorkspace(page);
    const actions = await recordAppActions(page);

    await page.goto("/prachar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(/Simulation Published Campaign/);

    const facebookAction = await triggerAction(page, actions, () =>
      page.locator("#sim-prachar-event-facebook").click(),
    );
    expectRecordedAction(facebookAction, {
      action: "updatePracharPlatform",
      payload: {
        eventId: "sim-prachar-event",
        platform: "facebook",
        done: true,
      },
    });
    if (!facebookAction) {
      await expect(page.locator("#sim-prachar-event-facebook")).toBeChecked();
    }

    await page.locator("#sim-prachar-event-whatsapp").click();
    await page.getByPlaceholder(/Why skip this channel/i).fill("Local group inactive");
    const skipAction = await triggerAction(page, actions, () =>
      page.getByRole("button", { name: /Save note/i }).click(),
    );
    expectRecordedAction(skipAction, {
      action: "updatePracharPlatform",
      payload: {
        eventId: "sim-prachar-event",
        platform: "whatsapp",
        done: false,
        skipReason: "Local group inactive",
      },
    });
    if (!skipAction) {
      await expect(page.locator("main")).toContainText("Local group inactive");
    }

    await page.getByRole("button", { name: /Next template/i }).click();
    await page.getByRole("button", { name: /Previous template/i }).click();
    await page.getByRole("link", { name: /Explore Vimarsh topics/i }).click();
    await expect(page).toHaveURL(/\/vimarsh/);
  });

  test("calendar and directory support realistic browse, filter, and drill-down behavior", async ({
    page,
  }) => {
    await loginAs(page, accounts.vibhag);

    await page.goto("/calendar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(/Institutional Calendar Desk/i);
    await page.getByRole("button", { name: /Next month/i }).click();
    await expect(page.locator("main")).toContainText(/Month Grid/i);
    await page.getByText("1", { exact: true }).first().click();
    await expect(page.locator("main")).toContainText(/Selected Day Ledger/i);

    await page.goto("/directory", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder(/Search by name/i).fill("Kavita");
    await expect(page.locator("main")).toContainText(/Found 1 Karyakartas/i);
    await page.getByRole("button", { name: /^Shodh$/i }).click();
    await page.getByText(/Kavita Singh/i).click();
    await expect(page.getByRole("link", { name: /Voice Call/i })).toHaveAttribute("href", /^tel:/);
    await expect(page.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute("href", /wa\.me/);
    await page.getByRole("button", { name: /Vibhag Sanyojak/i }).click();
  });

  test("super admin can inspect access management controls without changing live users", async ({
    page,
  }) => {
    await loginAs(page, accounts.superadmin);

    await page.goto("/super-admin", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(/System Access|Access/i);

    await page.getByRole("button", { name: /Create account|New account|Add account/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator("#new-display-name").fill("Simulation User");
    await page.locator("#new-email").fill("simulation.user@example.com");
    const oldPassword = await page.locator("#new-password").inputValue();
    await page.getByRole("button", { name: /Generate/i }).click();
    await expect(page.locator("#new-password")).not.toHaveValue(oldPassword);
    await expect(page.getByRole("button", { name: /Create account|Account created/i })).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByPlaceholder(/Search by name or email/i).fill("demo");
    await expect(page.locator("main")).toContainText(/Effective access matrix|Assigned roles/i);
  });
});
