# Mobile-First Full-App Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Pragya Pravah as a fast mobile-first institutional command centre while preserving every workflow, role boundary, and richer public editorial surface.

**Architecture:** Establish one shared token and component system, then migrate the authenticated shell and pages onto it. Mobile layouts adapt structurally through shared responsive components; desktop keeps denser tables and navigation without a separate codebase. Performance work removes global data fetching and lazy-loads secondary dashboard modules.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 3, Radix UI, TanStack Query, Lucide, Vitest, Testing Library, Playwright.

---

## File Map

### Create

- `src/lib/design/mobile-audit.ts`: pure layout-audit types and threshold helpers.
- `src/lib/design/mobile-audit.test.ts`: unit coverage for target and overflow rules.
- `tests/mobile-ui-regression.spec.ts`: authenticated viewport and console regression suite.
- `src/components/ui/page-header.tsx`: compact operational page heading and primary action.
- `src/components/ui/status-strip.tsx`: responsive high-signal metrics.
- `src/components/ui/record-row.tsx`: shared mobile record presentation and action slot.
- `src/components/ui/responsive-data-view.tsx`: mobile rows plus desktop table boundary.
- `src/components/navbar/ProfileMenu.tsx`: language, theme, role, and sign-out controls.
- `src/components/dashboard/DashboardModuleTabs.tsx`: lazy secondary dashboard modules.

### Modify

- `src/app/layout.tsx`: Khand and Hind font variables.
- `src/app/globals.css`: OKLCH tokens, typography, geometry, shell, and legacy style removal.
- `tailwind.config.ts`: font families and token-backed sizing.
- `src/components/ui/button.tsx`: 44px mobile controls and reduced geometry.
- `src/components/ui/tabs.tsx`: accessible 44px segmented controls.
- `src/components/Navbar.tsx`: one-row mobile header and no global workflow queries.
- `src/components/MobileBottomNav.tsx`: flush 64px navigation and grouped More sheet.
- `src/components/AppLayoutShell.tsx`: fixed-navigation clearance and stable content width.
- `src/components/Masthead.tsx`: delegate operational hierarchy to `PageHeader`.
- `src/components/pages/Dashboard.tsx`: progressive module loading.
- `src/components/pages/dashboard/UnitDashboardView.tsx`: concise event-first hierarchy.
- `src/components/pages/Prachar.tsx`: campaign-first mobile layout and discoverable template rail.
- `src/components/pages/AnnualCalendar.tsx`: agenda-first narrow layout.
- `src/components/pages/Aalekh.tsx`: shared record and toolbar structure.
- `src/components/pages/aalekh/*.tsx`: migrate all role views to shared record rows.
- `src/components/pages/UserManagement.tsx`: responsive account rows and tables.
- `src/components/pages/super-admin/*.tsx`: responsive audit, settings, and capability views.
- `src/components/pages/Directory.tsx`: mobile record layout.
- `src/components/pages/Dayitv.tsx`: simplify hierarchy and mobile responsibility rows.
- `src/components/pages/ELibrary.tsx`: compact filters and stable book grid.
- `src/components/pages/Vimarsh.tsx`: shared type hierarchy and restrained editorial treatment.
- `src/components/pages/ContentFeed.tsx`: shared type hierarchy and record spacing.
- `src/components/pages/AapKaItihas.tsx`: shared type hierarchy and timeline rows.
- `src/components/pages/ClientGuidePage.tsx`: shared controls and type hierarchy.
- `src/components/pages/LoginPageClient.tsx`: new tokens and compact mobile composition.
- `src/components/pages/Parichay.tsx`: shared tokens without flattening the editorial composition.
- Existing component tests beside the files above.
- `package.json`: add mobile regression script.

## Task 1: Add The Mobile Regression Baseline

**Files:**
- Create: `src/lib/design/mobile-audit.ts`
- Create: `src/lib/design/mobile-audit.test.ts`
- Create: `tests/mobile-ui-regression.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing threshold tests**

```ts
// src/lib/design/mobile-audit.test.ts
import { describe, expect, it } from "vitest";
import { classifyTarget, isUnintendedOverflow } from "./mobile-audit";

describe("mobile UI audit thresholds", () => {
  it("rejects visible operational targets smaller than 44px", () => {
    expect(classifyTarget({ width: 36, height: 36, hidden: false })).toBe("too-small");
    expect(classifyTarget({ width: 44, height: 44, hidden: false })).toBe("pass");
  });

  it("ignores clipped decoration but rejects clipped content", () => {
    expect(isUnintendedOverflow({ left: -24, right: 120, viewport: 390, decorative: true })).toBe(false);
    expect(isUnintendedOverflow({ left: 24, right: 460, viewport: 390, decorative: false })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx vitest run src/lib/design/mobile-audit.test.ts`

Expected: FAIL because `mobile-audit.ts` does not exist.

- [ ] **Step 3: Implement the pure audit helpers**

```ts
// src/lib/design/mobile-audit.ts
export type TargetBox = { width: number; height: number; hidden: boolean };
export type OverflowBox = { left: number; right: number; viewport: number; decorative: boolean };

export function classifyTarget(box: TargetBox) {
  if (box.hidden) return "ignored" as const;
  return box.width >= 44 && box.height >= 44 ? "pass" as const : "too-small" as const;
}

export function isUnintendedOverflow(box: OverflowBox) {
  if (box.decorative) return false;
  return box.left < 0 || box.right > box.viewport;
}
```

- [ ] **Step 4: Add authenticated Playwright assertions**

```ts
// tests/mobile-ui-regression.spec.ts
import { expect, test } from "@playwright/test";

const routes = ["/dashboard", "/aalekh", "/prachar", "/calendar", "/super-admin", "/users"];
const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@pragyapravah.local");
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? "Pragya@12345");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/);
});

for (const viewport of viewports) {
  for (const route of routes) {
    test(`${route} fits ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
}
```

- [ ] **Step 5: Add the script and verify baseline failures are captured**

```json
// package.json scripts
"test:mobile-ui": "playwright test tests/mobile-ui-regression.spec.ts --project=chromium --reporter=list"
```

Run: `npx vitest run src/lib/design/mobile-audit.test.ts`

Expected: 2 tests PASS.

Run: `npm run test:mobile-ui`

Expected before redesign: failures on Prachar and Super Admin at narrow widths.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/design tests/mobile-ui-regression.spec.ts
git commit -m "test: add mobile layout regression baseline"
```

## Task 2: Replace Global Tokens And Typography

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `src/app/layout-fonts.test.ts`

- [ ] **Step 1: Add a failing font-variable assertion**

```ts
// src/app/layout-fonts.test.ts
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("loads the approved Khand and Hind families", () => {
  const source = readFileSync("src/app/layout.tsx", "utf8");
  expect(source).toContain("Khand");
  expect(source).toContain("Hind");
  expect(source).not.toContain("IBM_Plex_Sans");
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/app/layout-fonts.test.ts`

Expected: FAIL because the layout still imports IBM Plex.

- [ ] **Step 3: Load the approved font pairing**

```tsx
// src/app/layout.tsx
import { Hind, Khand } from "next/font/google";

const headingFont = Khand({
  subsets: ["latin", "devanagari"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
  display: "swap",
});

const bodyFont = Hind({
  subsets: ["latin", "devanagari"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// html className
className={`${headingFont.variable} ${bodyFont.variable}`}
```

- [ ] **Step 4: Replace root tokens with restrained OKLCH values**

```css
/* src/app/globals.css */
:root {
  --background: 0.985 0.004 70;
  --foreground: 0.22 0.018 45;
  --card: 1 0 0;
  --card-foreground: 0.22 0.018 45;
  --primary: 0.55 0.18 32;
  --primary-foreground: 0.985 0.004 70;
  --secondary: 0.95 0.008 70;
  --secondary-foreground: 0.28 0.018 45;
  --muted: 0.96 0.006 70;
  --muted-foreground: 0.46 0.018 45;
  --border: 0.89 0.01 70;
  --ring: 0.55 0.18 32;
  --radius: 0.5rem;
}

body {
  font-family: var(--font-body), sans-serif;
  letter-spacing: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), sans-serif;
  letter-spacing: 0;
}
```

Update Tailwind color entries from `hsl(var(--token))` to `oklch(var(--token))` and set `fontFamily.heading` and `fontFamily.body` to the two CSS variables.

```ts
// tailwind.config.ts theme.extend
colors: {
  background: "oklch(var(--background) / <alpha-value>)",
  foreground: "oklch(var(--foreground) / <alpha-value>)",
  primary: {
    DEFAULT: "oklch(var(--primary) / <alpha-value>)",
    foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
  },
},
fontFamily: {
  heading: ["var(--font-heading)", "sans-serif"],
  body: ["var(--font-body)", "sans-serif"],
},
```

- [ ] **Step 5: Remove global decorative effects from operational utility classes**

Replace `.institution-panel`, `.institution-panel-muted`, `.dashboard-masthead`, and `.dashboard-context-card` with 1px borders, 8px radius, no pseudo-element glow, and at most one restrained shadow token. Keep public `parchment-*` tokens isolated to public pages.

```css
.institution-panel {
  border: 1px solid oklch(var(--border));
  border-radius: 0.5rem;
  background: oklch(var(--card));
}

.institution-panel::before { content: none; }
.institution-panel-muted { background: oklch(var(--muted)); }
```

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/app/layout-fonts.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit 0.

```bash
git add src/app/layout.tsx src/app/layout-fonts.test.ts src/app/globals.css tailwind.config.ts
git commit -m "feat: establish institutional design tokens and typography"
```

## Task 3: Standardize Controls And Operational Primitives

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/page-header.tsx`
- Create: `src/components/ui/status-strip.tsx`
- Create: `src/components/ui/record-row.tsx`
- Test: `src/components/ui/button.test.tsx`
- Create: `src/components/ui/operational-primitives.test.tsx`

- [ ] **Step 1: Write failing control and hierarchy tests**

```tsx
// src/components/ui/operational-primitives.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";
import { RecordRow } from "./record-row";

describe("operational primitives", () => {
  it("renders one page title and one primary action", () => {
    render(<PageHeader title="Campaigns" action={<button>Create campaign</button>} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Create campaign" })).toBeVisible();
  });

  it("keeps record metadata separate from its primary action", () => {
    render(<RecordRow title="Lokmanthan" metadata={["Bhopal", "Published"]} action={<button>Open</button>} />);
    expect(screen.getByText("Bhopal")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/ui/operational-primitives.test.tsx src/components/ui/button.test.tsx`

Expected: FAIL because new primitives do not exist and small button is 36px.

- [ ] **Step 3: Set stable mobile control dimensions**

```ts
// src/components/ui/button.tsx variants
size: {
  default: "h-11 px-4",
  sm: "h-11 px-3 md:h-9",
  lg: "h-12 px-6",
  icon: "h-11 w-11",
}
```

Update `TabsList` and `TabsTrigger` so every trigger is at least `h-11`, uses 8px radius, and scrolls horizontally when labels cannot fit.

- [ ] **Step 4: Implement shared hierarchy components**

```tsx
// src/components/ui/page-header.tsx
export function PageHeader({ title, context, description, action }: {
  title: string;
  context?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {context ? <p className="text-xs font-semibold text-primary">{context}</p> : null}
        <h1 className="mt-1 text-[28px] font-semibold leading-8 md:text-[32px] md:leading-9">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
```

Implement `StatusStrip` as a border-separated grid and `RecordRow` as an 8px bordered record with `min-h-11` actions, no decorative shadows, and no nested cards.

```tsx
export function StatusStrip({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return <dl className="grid grid-cols-2 divide-x divide-y border-y border-border sm:grid-cols-4 sm:divide-y-0">{items.map(item => <div key={item.label} className="px-3 py-3"><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className="mt-1 text-lg font-semibold">{item.value}</dd></div>)}</dl>;
}

export function RecordRow({ title, metadata, action }: { title: string; metadata?: string[]; action?: React.ReactNode }) {
  return <article className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-card p-3"><div className="min-w-0 flex-1"><h3 className="text-base font-semibold leading-5">{title}</h3>{metadata?.length ? <p className="mt-1 text-sm text-muted-foreground">{metadata.join(" · ")}</p> : null}</div>{action ? <div className="shrink-0">{action}</div> : null}</article>;
}
```

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/components/ui`

Expected: all UI component tests PASS.

```bash
git add src/components/ui
git commit -m "feat: add mobile-first operational primitives"
```

## Task 4: Rebuild The Authenticated Shell

**Files:**
- Modify: `src/components/Navbar.tsx`
- Create: `src/components/navbar/ProfileMenu.tsx`
- Modify: `src/components/MobileBottomNav.tsx`
- Modify: `src/components/AppLayoutShell.tsx`
- Modify: `src/components/navbar/MobileNav.tsx`
- Test: `src/components/Navbar.test.tsx`
- Test: `src/components/MobileBottomNav.test.tsx`

- [ ] **Step 1: Rewrite shell tests for the approved contract**

```tsx
it("renders a single 56px mobile command row", () => {
  renderNavbar();
  const header = document.querySelector("[data-mobile-app-header]");
  expect(header?.className).toContain("h-14");
  expect(header?.textContent).not.toContain("Dayitva");
});

it("renders a flush 64px bottom bar with route prefetching", () => {
  renderBottomNav();
  const nav = document.querySelector("[data-mobile-bottom-nav]");
  expect(nav?.className).toContain("bottom-0");
  expect(nav?.firstElementChild?.className).toContain("h-16");
  const source = readFileSync("src/components/MobileBottomNav.tsx", "utf8");
  expect(source).not.toContain("prefetch={false}");
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/Navbar.test.tsx src/components/MobileBottomNav.test.tsx`

Expected: FAIL on two-row header, 76px floating nav, and old labels.

- [ ] **Step 3: Remove global workflow queries from Navbar**

Delete `useDashboardEvents`, `useDashboardArticles`, and `useNavbarNotifications` from `Navbar.tsx`. `NotificationBell` must fetch only its notification query internally.

```tsx
<header data-mobile-app-header className="sticky top-0 z-30 h-14 border-b border-border bg-background md:h-auto">
  <div className="flex h-full items-center gap-2 px-3 md:min-h-[64px] md:px-6">
    <MobileNav />
    <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{t(shellFrame.titleEn, shellFrame.titleHi)}</h1>
    <GlobalSearch />
    <NotificationBell />
    <ProfileMenu />
  </div>
</header>
```

- [ ] **Step 4: Move secondary controls into ProfileMenu**

`ProfileMenu` contains current role, language toggle, theme toggle, organisation landing link, and sign-out. Each row uses a 44px minimum height and a Lucide icon.

```tsx
<DropdownMenuContent align="end" className="w-64">
  <DropdownMenuLabel>{currentRoleLabel}</DropdownMenuLabel>
  <DropdownMenuItem asChild className="min-h-11"><Link href="/parichay"><Home aria-hidden />Organisation</Link></DropdownMenuItem>
  <DropdownMenuItem className="min-h-11" onSelect={toggleLanguage}><Languages aria-hidden />{languageActionLabel}</DropdownMenuItem>
  <DropdownMenuItem className="min-h-11" onSelect={toggleTheme}><Moon aria-hidden />{themeActionLabel}</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem className="min-h-11 text-destructive" onSelect={() => void signOut()}><LogOut aria-hidden />Sign out</DropdownMenuItem>
</DropdownMenuContent>
```

- [ ] **Step 5: Rebuild bottom navigation and shell clearance**

```tsx
<nav data-mobile-bottom-nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden">
  <div className="grid h-16 grid-cols-5 px-1">
    {primaryNav.map((item) => (
      <Link key={item.path} href={item.path} className={cn("flex min-w-0 flex-col items-center justify-center gap-1 text-xs", isActivePath(item.path) ? "text-primary" : "text-muted-foreground")}>
        <item.icon className="h-5 w-5" aria-hidden />
        <span className="truncate">{t(item.label, item.sublabel)}</span>
      </Link>
    ))}
    <button type="button" onClick={() => setOpen(true)} className={cn("flex min-w-0 flex-col items-center justify-center gap-1 text-xs", overflowActive ? "text-primary" : "text-muted-foreground")}>
      <MoreHorizontal className="h-5 w-5" aria-hidden />
      <span>{t("More", "More")}</span>
    </button>
  </div>
</nav>
```

Change authenticated main padding to `pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]`, remove floating-shell shadows, and keep desktop sidebar behavior unchanged.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/components/Navbar.test.tsx src/components/MobileBottomNav.test.tsx src/lib/app/navigation.test.ts`

Expected: PASS.

```bash
git add src/components/Navbar.tsx src/components/navbar src/components/MobileBottomNav.tsx src/components/AppLayoutShell.tsx
git commit -m "feat: rebuild authenticated mobile navigation"
```

## Task 5: Unify Page Hierarchy

**Files:**
- Modify: `src/components/Masthead.tsx`
- Modify: `src/components/pages/dashboard/UnitDashboardView.tsx`
- Modify: `src/components/pages/aalekh/VibhagView.tsx`
- Modify: `src/components/pages/Prachar.tsx`
- Modify: `src/components/pages/AnnualCalendar.tsx`
- Test: `src/components/Masthead.test.tsx`

- [ ] **Step 1: Add a failing single-language hierarchy test**

```tsx
it("shows only the active-language title and no decorative mandala", () => {
  render(<Masthead title="Dashboard" titleHi="Dashboard Hindi" seal="Desk" sealHi="Desk Hindi" />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
  expect(screen.queryByText("Dashboard Hindi")).not.toBeInTheDocument();
  expect(document.querySelector("svg[aria-hidden='true']")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/Masthead.test.tsx`

Expected: FAIL because alternate titles and decorative SVG are rendered.

- [ ] **Step 3: Make Masthead delegate to PageHeader and StatusStrip**

Remove `MastheadMandala`, duplicate alternate title, context cards, blur decorations, and uppercase tracking. Map `contexts` to compact `StatusStrip` items.

```tsx
return (
  <div className={cn("space-y-5", className)}>
    <PageHeader title={t(title, titleHi ?? title)} context={seal ? t(seal, sealHi ?? seal) : undefined} description={t(subtitle ?? "", subtitleHi ?? subtitle ?? "")} action={actions} />
    {contexts?.length ? <StatusStrip items={contexts.map(mapContext)} /> : null}
  </div>
);
```

- [ ] **Step 4: Replace custom operational heroes**

Dashboard, Prachar, and Calendar use `PageHeader` rather than custom gradient or rounded hero sections. Keep one visible primary action and move secondary metrics into `StatusStrip`.

```tsx
<PageHeader
  context={t("Prachar command centre", "Prachar command centre")}
  title={t("Distribute and confirm reach", "Distribute and confirm reach")}
  description={t("Close channel follow-through for published campaigns.", "Close channel follow-through for published campaigns.")}
  action={permissions.canUpdatePrachar ? <Button onClick={openCreateCampaign}><Plus aria-hidden />{t("Create campaign", "Create campaign")}</Button> : null}
/>
<StatusStrip items={campaignSummaryItems} />
```

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/components/Masthead.test.tsx src/components/pages/Prachar.test.tsx`

Expected: PASS.

```bash
git add src/components/Masthead.tsx src/components/pages
git commit -m "feat: unify operational page hierarchy"
```

## Task 6: Add Responsive Records And Repair Administration

**Files:**
- Create: `src/components/ui/responsive-data-view.tsx`
- Create: `src/components/ui/responsive-data-view.test.tsx`
- Modify: `src/components/pages/UserManagement.tsx`
- Modify: `src/components/pages/super-admin/SuperAdminDashboard.tsx`
- Modify: `src/components/pages/super-admin/AuditLogPanel.tsx`
- Modify: `src/components/pages/super-admin/OrgSettingsPanel.tsx`

- [ ] **Step 1: Write a failing responsive presentation test**

```tsx
// @vitest-environment jsdom
it("renders mobile records and a desktop table from one data source", () => {
  render(<ResponsiveDataView rows={[{ id: "1", name: "Master Admin", email: "admin@example.com" }]} getRowKey={row => row.id} renderMobile={row => <RecordRow title={row.name} metadata={[row.email]} />} renderDesktop={rows => <table><tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td></tr>)}</tbody></table>} />);
  expect(document.querySelector("[data-mobile-records]")).toBeInTheDocument();
  expect(document.querySelector("[data-desktop-table]")).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/ui/responsive-data-view.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the responsive boundary**

```tsx
type ResponsiveDataViewProps<T> = {
  rows: T[];
  getRowKey: (row: T) => React.Key;
  renderMobile: (row: T) => React.ReactNode;
  renderDesktop: (rows: T[]) => React.ReactNode;
};

export function ResponsiveDataView<T>({ rows, getRowKey, renderMobile, renderDesktop }: ResponsiveDataViewProps<T>) {
  return (
    <>
      <div data-mobile-records className="space-y-2 md:hidden">{rows.map(row => <div key={getRowKey(row)}>{renderMobile(row)}</div>)}</div>
      <div data-desktop-table className="hidden overflow-x-auto md:block">{renderDesktop(rows)}</div>
    </>
  );
}
```

- [ ] **Step 4: Migrate accounts, logs, capabilities, and settings**

Use labeled `RecordRow` metadata on mobile. Long email addresses use `break-all` only in expanded details; collapsed rows use `truncate` plus an accessible title. Replace the capability table with `Capability`, `Area`, `Access`, and `Detail` fields in mobile rows.

```tsx
<ResponsiveDataView
  rows={capabilities}
  getRowKey={row => row.capability}
  renderMobile={row => <RecordRow title={row.capability} metadata={[row.area, row.access]} action={<Button variant="ghost" size="icon" aria-label={`View ${row.capability}`}><ChevronRight aria-hidden /></Button>} />}
  renderDesktop={rows => <CapabilityTable rows={rows} />}
/>
```

- [ ] **Step 5: Verify narrow admin layouts**

Run: `npm run test:mobile-ui -- --grep "super-admin|users"`

Expected: no horizontal overflow at 360, 390, or 430px.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/responsive-data-view* src/components/pages/UserManagement.tsx src/components/pages/super-admin
git commit -m "feat: make administration responsive"
```

## Task 7: Make Dashboard Progressive And Event-First

**Files:**
- Create: `src/components/dashboard/DashboardModuleTabs.tsx`
- Create: `src/components/dashboard/DashboardModuleTabs.test.tsx`
- Modify: `src/components/pages/Dashboard.tsx`
- Modify: `src/components/pages/dashboard/UnitDashboardView.tsx`
- Modify: `src/components/pages/dashboard/config.ts`

- [ ] **Step 1: Write a failing lazy-module test**

```tsx
it("mounts only the selected secondary module", async () => {
  render(<DashboardModuleTabs />);
  expect(screen.getByRole("tab", { name: "Tasks" })).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByTestId("dashboard-module-media")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("tab", { name: "Media" }));
  expect(await screen.findByTestId("dashboard-module-media")).toBeVisible();
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/dashboard/DashboardModuleTabs.test.tsx`

Expected: FAIL because all dashboard modules currently mount together.

- [ ] **Step 3: Implement lazy tab modules**

```tsx
const loading = () => <div className="h-48 animate-pulse rounded-lg bg-muted" aria-label="Loading module" />;
const TaskBoardPanel = dynamic(() => import("@/components/pages/dashboard/tasks/TaskBoardPanel").then(module => module.TaskBoardPanel), { loading });
const CircularsPanel = dynamic(() => import("@/components/pages/dashboard/circulars/CircularsPanel").then(module => module.CircularsPanel), { loading });
const VolunteersPanel = dynamic(() => import("@/components/pages/dashboard/volunteers/VolunteersPanel").then(module => module.VolunteersPanel), { loading });
const MediaLibraryPanel = dynamic(() => import("@/components/pages/dashboard/media/MediaLibraryPanel").then(module => module.MediaLibraryPanel), { loading });
const ConferencesPanel = dynamic(() => import("@/components/pages/dashboard/conferences/ConferencesPanel").then(module => module.ConferencesPanel), { loading });
const SurveysPanel = dynamic(() => import("@/components/pages/dashboard/surveys/SurveysPanel").then(module => module.SurveysPanel), { loading });

export function DashboardModuleTabs() {
  const [active, setActive] = useState("tasks");
  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList aria-label="Dashboard modules">
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="circulars">Circulars</TabsTrigger>
        <TabsTrigger value="people">People</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
        <TabsTrigger value="conferences">Conferences</TabsTrigger>
        <TabsTrigger value="surveys">Surveys</TabsTrigger>
      </TabsList>
      <TabsContent value="tasks"><TaskBoardPanel /></TabsContent>
      <TabsContent value="circulars"><CircularsPanel /></TabsContent>
      <TabsContent value="people"><VolunteersPanel /></TabsContent>
      <TabsContent value="media"><div data-testid="dashboard-module-media"><MediaLibraryPanel /></div></TabsContent>
      <TabsContent value="conferences"><ConferencesPanel /></TabsContent>
      <TabsContent value="surveys"><SurveysPanel /></TabsContent>
    </Tabs>
  );
}
```

Tabs are Tasks, Circulars, People, Media, Conferences, and Surveys. Notifications remain in the bell and a compact dashboard summary rather than a full always-mounted panel.

- [ ] **Step 4: Simplify event records**

Event cards become `RecordRow` instances. Show one primary command based on status; move Clone, Form Link, Poll, Vritt, Venue QR, and Feed into a Lucide Ellipsis action menu with 44px items.

```tsx
<RecordRow
  title={event.title}
  metadata={[event.status, event.date, event.unit]}
  action={<EventActionMenu event={event} itemClassName="min-h-11" />}
/>
```

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/components/dashboard src/components/pages/dashboard`

Expected: PASS.

```bash
git add src/components/dashboard src/components/pages/Dashboard.tsx src/components/pages/dashboard
git commit -m "feat: make dashboard progressive and event-first"
```

## Task 8: Rebuild Aalekh, Prachar, And Calendar Working Surfaces

**Files:**
- Modify: `src/components/pages/Aalekh.tsx`
- Modify: `src/components/pages/aalekh/KaryakartaView.tsx`
- Modify: `src/components/pages/aalekh/UnitHeadView.tsx`
- Modify: `src/components/pages/aalekh/AayamView.tsx`
- Modify: `src/components/pages/aalekh/VibhagView.tsx`
- Modify: `src/components/pages/aalekh/GalleryView.tsx`
- Modify: `src/components/pages/Prachar.tsx`
- Modify: `src/components/pages/AnnualCalendar.tsx`
- Test: `src/components/pages/Prachar.test.tsx`
- Create: `src/components/pages/AnnualCalendar.test.tsx`

- [ ] **Step 1: Add failing workflow-surface tests**

```tsx
function renderPrachar() {
  return render(<Prachar />);
}

it("exposes a discoverable campaign template rail", () => {
  renderPrachar();
  expect(screen.getByRole("region", { name: "Creative templates" })).toHaveClass("snap-x");
  expect(screen.getByRole("button", { name: "Next template" })).toBeVisible();
});

it("defaults to agenda on a narrow viewport", () => {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation(() => ({
    matches: true,
    media: "(max-width: 639px)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
  render(<AnnualCalendar />);
  expect(screen.getByRole("tab", { name: "Agenda" })).toHaveAttribute("aria-selected", "true");
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/pages/Prachar.test.tsx src/components/pages/AnnualCalendar.test.tsx`

Expected: FAIL on clipped templates and month-first mobile behavior.

- [ ] **Step 3: Migrate Aalekh role views**

Use one `RecordRow` composition for every role. Keep status-specific commands visible and place optional gallery mode in the toolbar. Remove repeated KPI cards in favor of `StatusStrip`.

```tsx
<RecordRow
  title={article.title}
  metadata={[article.status, article.author, article.date]}
  action={primaryArticleAction(article, permissions)}
/>
```

- [ ] **Step 4: Repair Prachar mobile layout**

Campaign closure remains first. Creative templates use `overflow-x-auto snap-x snap-mandatory`, cards use `min-w-[min(82vw,20rem)]`, and previous/next icon buttons update scroll position. Remove all off-canvas translated template content.

```tsx
<section aria-label="Creative templates">
  <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-semibold">{t("Creative templates", "Creative templates")}</h2><div className="flex gap-2"><Button size="icon" variant="outline" aria-label="Previous template" onClick={scrollPrevious}><ChevronLeft aria-hidden /></Button><Button size="icon" variant="outline" aria-label="Next template" onClick={scrollNext}><ChevronRight aria-hidden /></Button></div></div>
  <div ref={templateRailRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">{templates.map(template => <TemplateCard key={template.id} template={template} className="min-w-[min(82vw,20rem)] snap-start" />)}</div>
</section>
```

- [ ] **Step 5: Add Calendar Agenda mode**

Use Month/Agenda segmented tabs. Initialize from a mobile media query without changing event data. Agenda groups records by date and uses `RecordRow`; month grid remains available.

```tsx
<Tabs value={viewMode} onValueChange={value => setViewMode(value as "month" | "agenda")}>
  <TabsList><TabsTrigger value="month">{t("Month", "Month")}</TabsTrigger><TabsTrigger value="agenda">{t("Agenda", "Agenda")}</TabsTrigger></TabsList>
  <TabsContent value="month"><MonthGrid events={monthEvents} /></TabsContent>
  <TabsContent value="agenda"><AgendaList groups={agendaGroups} /></TabsContent>
</Tabs>
```

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/components/pages/Prachar.test.tsx src/components/pages/AnnualCalendar.test.tsx src/hooks/api/workflow-data-mappers.test.ts`

Expected: PASS.

Run: `npm run test:mobile-ui -- --grep "aalekh|prachar|calendar"`

Expected: PASS at all three mobile widths.

```bash
git add src/components/pages/Aalekh.tsx src/components/pages/aalekh src/components/pages/Prachar.tsx src/components/pages/AnnualCalendar*
git commit -m "feat: rebuild core mobile workflow surfaces"
```

## Task 9: Migrate Coordination, Reference, And Public Surfaces

**Files:**
- Modify: `src/components/pages/Directory.tsx`
- Modify: `src/components/pages/Dayitv.tsx`
- Modify: `src/components/pages/ELibrary.tsx`
- Modify: `src/components/pages/Vimarsh.tsx`
- Modify: `src/components/pages/ContentFeed.tsx`
- Modify: `src/components/pages/AapKaItihas.tsx`
- Modify: `src/components/pages/ClientGuidePage.tsx`
- Modify: `src/components/pages/LoginPageClient.tsx`
- Modify: `src/components/pages/Parichay.tsx`
- Test: `src/components/pages/LoginPageClient.test.tsx`
- Test: `src/components/pages/parichay-articles.test.ts`

- [ ] **Step 1: Add a failing login density test**

```tsx
it("keeps the mobile login action inside the first 800px viewport", () => {
  render(<LoginPageClient />);
  const panel = screen.getByRole("heading", { name: "Internal access panel" }).closest("section");
  expect(panel).toHaveAttribute("data-mobile-priority", "true");
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/components/pages/LoginPageClient.test.tsx`

Expected: FAIL because the current mobile composition places sign-in controls below the first viewport.

- [ ] **Step 3: Migrate coordination and reference pages**

Directory and Dayitv use shared record rows. Library filters use a scrollable 44px segmented toolbar and a stable one-column/two-column book grid. Vimarsh, Feed, History, and Guide use the shared type scale and remove operational card nesting.

```tsx
<div className="flex min-h-11 gap-2 overflow-x-auto" role="toolbar" aria-label={t("Filter by subject", "Filter by subject")}>{subjects.map(subject => <Button key={subject} variant={activeSubject === subject ? "default" : "outline"} onClick={() => setActiveSubject(subject)}>{subject}</Button>)}</div>
<div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">{filteredBooks.map(book => <BookRecord key={book.id} book={book} />)}</div>
```

- [ ] **Step 4: Recompose Login**

Place identity, concise supporting copy, credentials, and sign-in controls in one mobile flow. Remove decorative credential cards, orange glow, and duplicated feature pills. Preserve password manager semantics and quick-fill behavior.

```tsx
<main className="mx-auto grid min-h-dvh max-w-5xl items-center px-4 py-6 lg:grid-cols-[1fr_24rem] lg:gap-12">
  <header className="mb-6 lg:mb-0"><PragyaLogo className="h-12 w-12" /><h1 className="mt-4 text-4xl font-semibold">Pragya Pravah</h1><p className="mt-2 max-w-lg text-base text-muted-foreground">{t("Civilisational thought, organised action.", "Civilisational thought, organised action.")}</p></header>
  <section data-mobile-priority="true" aria-labelledby="login-title"><h2 id="login-title" className="text-2xl font-semibold">{t("Internal access", "Internal access")}</h2><LoginForm /></section>
</main>
```

- [ ] **Step 5: Retoken Parichay without flattening it**

Keep its editorial chapter structure and public storytelling, but replace global orange-heavy controls, generic shadows, and duplicate bilingual headings with shared tokens and active-language behavior.

```tsx
<article className="bg-background text-foreground">
  <ParichayNavigation />
  <PublicHero activeLanguage={lang} />
  <PublicWorkChapters activeLanguage={lang} />
  <PublicFooter />
</article>
```

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/components/pages/LoginPageClient.test.tsx src/components/pages/parichay-articles.test.ts`

Expected: PASS.

```bash
git add src/components/pages
git commit -m "feat: align reference and public mobile surfaces"
```

## Task 10: Remove Legacy Effects And Complete Verification

**Files:**
- Modify: `src/components/PageTransition.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/MobileBottomNav.tsx`
- Modify: `src/components/Masthead.tsx`
- Modify: `src/components/pages/Dashboard.tsx`
- Modify: `src/components/pages/Prachar.tsx`
- Modify: `src/components/pages/AnnualCalendar.tsx`
- Modify: `src/components/pages/UserManagement.tsx`
- Test: all existing tests and `tests/mobile-ui-regression.spec.ts`

- [ ] **Step 1: Add static quality gates**

```ts
// append to src/lib/design/mobile-audit.test.ts
import { spawnSync } from "node:child_process";

it("does not reintroduce operational glow and oversized rounding", () => {
  const result = spawnSync("rg", ["-n", "blur-3xl|rounded-3xl|backdrop-blur-xl", "src/components"], { encoding: "utf8" });
  const output = result.stdout ?? "";
  const operationalMatches = output.split("\n").filter(line => /pages[\\/](Dashboard|Prachar|AnnualCalendar|UserManagement)|Navbar|MobileBottomNav/.test(line));
  expect(operationalMatches).toEqual([]);
});
```

- [ ] **Step 2: Verify RED and remove remaining legacy patterns**

Run: `npx vitest run src/lib/design/mobile-audit.test.ts`

Expected initially: FAIL with exact legacy class locations.

Remove the reported blur, glow, oversized radius, negative letter spacing, and operational gradient classes. Keep only explicitly approved public editorial treatments.

```tsx
// Operational surfaces use this shape after the scan.
<section className="rounded-lg border border-border bg-card p-4 md:p-5">{children}</section>
```

- [ ] **Step 3: Simplify page transitions**

```tsx
// src/components/PageTransition.tsx
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">{children}</div>;
}
```

Remove Framer Motion imports where they only animate initial opacity or decorative hover movement.

- [ ] **Step 4: Run the full automated verification**

Run: `npx vitest run`

Expected: all test files PASS, zero failures.

Run: `npm run typecheck`

Expected: exit 0.

Run: `npm run lint`

Expected: exit 0 with no errors.

Run: `npm run build`

Expected: optimized production build completes.

Run: `npm run test:mobile-ui`

Expected: all route/viewport combinations PASS with no horizontal overflow.

- [ ] **Step 5: Perform production-style browser verification**

At 360x800, 390x844, 430x932, 768x1024, 1280x800, and 1440x900 verify:

- Login and super-admin session.
- Header and bottom navigation clearance.
- Dashboard event and module workflows.
- Aalekh published and review records.
- Prachar campaign closure and template rail.
- Calendar month and agenda views.
- Super Admin accounts and capability records.
- Light and dark themes.
- English and Hindi modes.
- No console errors or API responses at 400 or above.

- [ ] **Step 6: Commit the cleanup**

```bash
git add src package.json tests
git commit -m "perf: complete mobile UI accessibility and performance pass"
```

- [ ] **Step 7: Push and verify deployment**

```bash
git push -u origin codex/mobile-ui-redesign
```

Confirm the Vercel deployment is READY for the final commit, then rerun the production browser suite against the deployment URL before promoting or merging to `main`.
