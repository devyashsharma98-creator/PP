# Demo Visual System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the login, shared shell, and dashboard so the demo presents Pragya Pravah as a contemporary Bharatiya intellectual institution with equal institutional gravitas and operational clarity.

**Architecture:** Apply the approved dual-layer design system: a richer public/bridge presentation for login and shell framing, and a calmer operational treatment for dashboard workflows. Reuse the current App Router structure and existing component boundaries, adding a shared visual token layer in CSS so the identity reads consistently across desktop and mobile.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, shadcn/ui, Framer Motion, Playwright

---

### Task 1: Lock The Demo Bridge In Playwright

**Files:**
- Modify: `e2e/demo-smoke.spec.ts`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Add one unauthenticated login-screen assertion and one authenticated dashboard assertion so the visual refresh has concrete acceptance checks.

```typescript
test("11 - login presents the institutional demo bridge", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText(/Pragya Pravah/i)).toBeVisible();
  await expect(page.getByText(/Bhopal Vibhag/i)).toBeVisible();
  await expect(page.getByText(/civilisational thought/i)).toBeVisible();
  await expect(page.getByText(/internal testing/i)).toBeVisible();
});

test("12 - dashboard leads with institutional context and operational summary", async ({ page }) => {
  await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);

  if (!page.url().includes("/dashboard")) {
    test.skip(true, "Login did not succeed - auth service issue");
    return;
  }

  await expect(page.getByText(/Bhopal Vibhag/i)).toBeVisible();
  await expect(page.getByText(/Activity Console|Institutional Overview/i)).toBeVisible();
  await expect(page.getByText(/Final Approvals Queue|Review Board|Gatividhi/i)).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "11 - login presents the institutional demo bridge|12 - dashboard leads with institutional context and operational summary"`

Expected: FAIL because the new institutional copy and framing do not exist yet.

**Step 3: Write minimal implementation**

Do not implement here. This task only establishes the failing acceptance checks that later tasks will satisfy.

**Step 4: Run test to verify it still fails for the right reason**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "11 - login presents the institutional demo bridge|12 - dashboard leads with institutional context and operational summary"`

Expected: FAIL on missing text or structure, not on unrelated crashes.

**Step 5: Commit**

```bash
git add e2e/demo-smoke.spec.ts
git commit -m "test: lock demo visual bridge expectations"
```

### Task 2: Add Shared Visual Tokens And Institutional Shell Framing

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/AppSidebar.tsx`
- Modify: `src/components/MobileBottomNav.tsx`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Extend the smoke checks to require the shared shell language and bridge framing:

```typescript
await expect(page.getByText(/Institutional Overview|Activity Console/i)).toBeVisible();
await expect(page.getByTitle(/Sign Out|Log Out/i)).toBeVisible();
await expect(page.getByText(/Bhopal Vibhag/i)).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "11 - login presents the institutional demo bridge|12 - dashboard leads with institutional context and operational summary"`

Expected: FAIL because shell chrome still uses the current generic framing.

**Step 3: Write minimal implementation**

Implement the shared layer:

- In `src/app/globals.css`
  - add reusable classes for institutional panels, section seals, archival table/card surfaces, subtler bridge backgrounds, and restrained accent ramps
  - refine current token set instead of replacing it wholesale
- In `src/app/layout.tsx`
  - give the main app frame a clearer top-level reading structure and a slightly richer page backdrop
- In `src/components/Navbar.tsx`
  - add a tighter institutional heading/subheading structure
  - make the role badge, language toggle, and notification area feel more editorial and less generic SaaS
- In `src/components/AppSidebar.tsx`
  - turn the sidebar into a darker "institution ledger" rail with better hierarchy, calmer spacing, and stronger active-state treatment
- In `src/components/MobileBottomNav.tsx`
  - align mobile chrome with the same token system so the experience remains coherent on phones

Representative shell copy to add:

```tsx
<p className="section-seal">Bhopal Vibhag</p>
<h2 className="text-base font-semibold">Pragya Pravah</h2>
<p className="text-xs text-muted-foreground">
  Civilisational discourse, organised action
</p>
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "11 - login presents the institutional demo bridge|12 - dashboard leads with institutional context and operational summary"`

Expected: PASS for shell-level text and framing checks.

**Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/Navbar.tsx src/components/AppSidebar.tsx src/components/MobileBottomNav.tsx e2e/demo-smoke.spec.ts
git commit -m "feat: add institutional shell framing for demo flow"
```

### Task 3: Rebuild Login As The Demo Bridge

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Make the login expectations precise:

```typescript
await expect(page.getByText(/Civilisational thought, organised action/i)).toBeVisible();
await expect(page.getByText(/Demo accounts for internal testing/i)).toBeVisible();
await expect(page.getByText(/Bhopal Vibhag/i)).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "11 - login presents the institutional demo bridge"`

Expected: FAIL because the current login page is a plain centered card without the richer bridge treatment.

**Step 3: Write minimal implementation**

Restructure `src/app/login/page.tsx` so it:

- introduces an atmospheric bridge layout rather than a bare centered card
- keeps the real auth form intact
- presents demo accounts as an internal access panel rather than generic pill buttons
- adds one strong institutional line of copy and one compact explanation of what the app controls

Representative structure:

```tsx
<div className="min-h-[calc(100vh-4rem)] demo-bridge-bg">
  <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr]">
    <div className="space-y-5">
      <p className="section-seal">Bhopal Vibhag</p>
      <h1 className="text-4xl font-bold font-devanagari">Pragya Pravah</h1>
      <p className="text-lg text-foreground/70">
        Civilisational thought, organised action.
      </p>
      <p className="text-sm text-muted-foreground">
        Review queues, unit activity, aalekh workflow, and prachar coordination in one institutional console.
      </p>
    </div>

    <Card className="institution-panel">
      {/* existing login form and demo-account quick fill */}
    </Card>
  </section>
</div>
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "11 - login presents the institutional demo bridge"`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/login/page.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: turn login into demo bridge screen"
```

### Task 4: Make Dashboard The Proof Screen

**Files:**
- Modify: `src/components/pages/Dashboard.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Add a dashboard assertion for institutional framing and clearer operational hierarchy:

```typescript
await expect(page.getByText(/Activity Console|Institutional Overview/i)).toBeVisible();
await expect(page.getByText(/Final Approvals Queue|Aayam Review Board|Unit Activity/i)).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "12 - dashboard leads with institutional context and operational summary"`

Expected: FAIL because the dashboard currently opens with functional headings only.

**Step 3: Write minimal implementation**

In `src/components/pages/Dashboard.tsx`:

- add a consistent top section with:
  - institutional cue
  - role-aware context line
  - concise operational summary
- restyle KPI cards as institutional summary blocks rather than startup metrics
- tighten section headers for queues and lists
- preserve current role branching and data logic

Representative header pattern:

```tsx
<div className="space-y-3">
  <p className="section-seal">Bhopal Vibhag Activity Console</p>
  <h1 className="text-3xl font-bold">
    {t("Institutional Overview", "Sansthagat Avalokan")}
  </h1>
  <p className="max-w-2xl text-sm text-muted-foreground">
    {t(
      "Unit activity, review queues, and published work in one operational view.",
      "Ek hi parichalan drishya mein ikai gatividhi, samiksha katarein aur prakashit karya."
    )}
  </p>
</div>
```

Also add or reuse CSS panel classes so cards, queues, and sheets share the same visual language.

**Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "12 - dashboard leads with institutional context and operational summary"`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/pages/Dashboard.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: make dashboard the demo proof screen"
```

### Task 5: Final Verification

**Files:**
- Verify only: `src/app/login/page.tsx`
- Verify only: `src/components/Navbar.tsx`
- Verify only: `src/components/AppSidebar.tsx`
- Verify only: `src/components/MobileBottomNav.tsx`
- Verify only: `src/components/pages/Dashboard.tsx`
- Verify only: `src/app/globals.css`
- Verify only: `e2e/demo-smoke.spec.ts`

**Step 1: Run focused demo smoke tests**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "11 - login presents the institutional demo bridge|12 - dashboard leads with institutional context and operational summary"`

Expected: PASS.

**Step 2: Run broader regression smoke**

Run: `npx playwright test e2e/demo-smoke.spec.ts`

Expected: PASS except for skips explicitly caused by missing remote auth data.

**Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS, or document any unrelated pre-existing failures before proceeding.

**Step 4: Manual demo verification**

Check these flows in the browser:

- `/login` reads as the institutional bridge
- `/dashboard` lands with a strong identity cue and clear operational summary
- navbar/sidebar/mobile nav feel visually consistent
- desktop and mobile layouts remain usable

**Step 5: Commit**

```bash
git add src/app/login/page.tsx src/components/Navbar.tsx src/components/AppSidebar.tsx src/components/MobileBottomNav.tsx src/components/pages/Dashboard.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: refresh demo visual system"
```
