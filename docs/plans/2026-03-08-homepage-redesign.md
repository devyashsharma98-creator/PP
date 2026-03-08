# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the public homepage so first-time visitors understand what Pragya Pravah is, why its work matters, and how to engage, while preserving a strong civilisational and institutionally rooted visual identity.

**Architecture:** Keep the homepage inside the current `LandingPage` component, but simplify its narrative into a clearer section sequence: hero gateway, institutional framing, fields of work, relevance section, audience paths, and operational bridge CTA. Reuse the shared visual token system from `globals.css` so the homepage feels aligned with the new login and internal shell without copying their exact layout.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Framer Motion, lucide-react, Playwright

---

### Task 1: Lock The Homepage Narrative In Smoke Tests

**Files:**
- Modify: `e2e/demo-smoke.spec.ts`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Add one homepage smoke assertion block that locks the new public narrative and CTA labels.

```typescript
test("13 - homepage introduces Pragya Pravah and offers three clear entry paths", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const main = page.locator("main");
  await expect(main.getByText(/Pragya Pravah/i).first()).toBeVisible();
  await expect(main.getByText(/civilisational|Bharatiya|intellectual forum/i)).toBeVisible();
  await expect(main.getByRole("link", { name: /Understand the Vision|दृष्टि समझें/i })).toBeVisible();
  await expect(main.getByRole("link", { name: /Enter Demo Console|डेमो प्रणाली खोलें/i })).toBeVisible();
  await expect(main.getByRole("link", { name: /Connect with the Network|संवाद से जुड़ें/i })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: FAIL because the current homepage does not present this clearer narrative or CTA set.

**Step 3: Write minimal implementation**

Do not implement here. This task only locks the public homepage acceptance criteria.

**Step 4: Run test to verify it still fails for the right reason**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: FAIL on missing text or CTA labels, not on unrelated runtime crashes.

**Step 5: Commit**

```bash
git add e2e/demo-smoke.spec.ts
git commit -m "test: lock homepage redesign expectations"
```

### Task 2: Build Shared Homepage Tokens And Section Utilities

**Files:**
- Modify: `src/app/globals.css`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Extend the homepage smoke expectation with one structural signal that the new section framing exists.

```typescript
await expect(main.getByText(/Fields of Work|कार्य के आयाम/i)).toBeVisible();
await expect(main.getByText(/Choose Your Path|अपना मार्ग चुनें/i)).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: FAIL because the current landing structure does not use those clearer section labels.

**Step 3: Write minimal implementation**

In `src/app/globals.css`, add homepage-specific utilities that match the approved direction:

- hero atmospheric background treatment
- editorial section wrapper and section dividers
- bilingual eyebrow/header treatment
- audience path card treatment
- workstream grid tile treatment
- homepage-specific CTA button variants if needed

Keep these utilities additive rather than replacing the global token system.

Representative classes to add:

```css
.home-hero-bg { ... }
.home-section-shell { ... }
.home-editorial-eyebrow { ... }
.home-path-card { ... }
.home-work-grid-card { ... }
```

**Step 4: Run test to verify it still fails for content reasons**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: still FAIL, but now due to missing homepage content rather than lack of shared classes.

**Step 5: Commit**

```bash
git add src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: add homepage redesign tokens"
```

### Task 3: Rebuild The Hero As A Civilisational Gateway

**Files:**
- Modify: `src/components/pages/LandingPage.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Make the hero expectations precise.

```typescript
await expect(main.getByRole("link", { name: /Understand the Vision|दृष्टि समझें/i })).toBeVisible();
await expect(main.getByRole("link", { name: /Enter Demo Console|डेमो प्रणाली खोलें/i })).toBeVisible();
await expect(main.getByRole("link", { name: /Connect with the Network|संवाद से जुड़ें/i })).toBeVisible();
await expect(main.getByText(/what Pragya Pravah is|intellectual forum|Bharatiya/i)).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: FAIL because the current hero does not clearly deliver all three opening jobs.

**Step 3: Write minimal implementation**

In `src/components/pages/LandingPage.tsx`:

- replace the current dense top section with a hero that does three jobs at once
- keep symbolic motion, but reduce competing visual elements
- add a bilingual identity statement and present-day relevance line
- add three mission-native CTAs

Representative structure:

```tsx
<section className="home-hero-bg">
  <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
    <div className="space-y-6">
      <p className="home-editorial-eyebrow">Pragya Pravah / प्रज्ञा प्रवाह</p>
      <h1>...</h1>
      <p>...</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/parichay">Understand the Vision / दृष्टि समझें</Link>
        <Link href="/login">Enter Demo Console / डेमो प्रणाली खोलें</Link>
        <Link href="/directory">Connect with the Network / संवाद से जुड़ें</Link>
      </div>
    </div>
    <div>{/* symbolic visual composition */}</div>
  </div>
</section>
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: PASS for hero narrative and CTA checks.

**Step 5: Commit**

```bash
git add src/components/pages/LandingPage.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: redesign homepage hero gateway"
```

### Task 4: Add Institutional Framing And Fields Of Work

**Files:**
- Modify: `src/components/pages/LandingPage.tsx`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Add explicit checks for the next two homepage sections.

```typescript
await expect(main.getByText(/Institutional Framing|संस्थागत परिचय|intellectual forum/i)).toBeVisible();
await expect(main.getByText(/Fields of Work|कार्य के आयाम/i)).toBeVisible();
await expect(main.getByText(/Vimarsh|Shodh|Prachar|Yuva/i)).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: FAIL because these clearer intermediate sections do not exist yet.

**Step 3: Write minimal implementation**

In `src/components/pages/LandingPage.tsx`:

- replace any diffuse overview blocks with a short institutional-framing band
- rebuild the aayam/workstream area so each tile explains actual work
- keep bilingual headings, but prevent duplicate text overload
- make sure each tile has mission-native CTA text

Representative content:

- `Institutional Framing / संस्थागत परिचय`
- `Fields of Work / कार्य के आयाम`
- `Read Current Vimarsh / वर्तमान विमर्श पढ़ें`
- `Explore Shodh Work / शोध कार्य देखें`
- `See Prachar Activity / प्रचार कार्य देखें`

**Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: PASS for institutional framing and workstream presence.

**Step 5: Commit**

```bash
git add src/components/pages/LandingPage.tsx e2e/demo-smoke.spec.ts
git commit -m "feat: add homepage institutional framing and work grid"
```

### Task 5: Add The Why-Now Section And Audience Paths

**Files:**
- Modify: `src/components/pages/LandingPage.tsx`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Add assertions for the relevance section and tailored visitor paths.

```typescript
await expect(main.getByText(/Why This Work Matters|यह कार्य अभी क्यों/i)).toBeVisible();
await expect(main.getByText(/Choose Your Path|अपना मार्ग चुनें/i)).toBeVisible();
await expect(main.getByText(/Visitor|Thinker|Organiser/i)).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: FAIL because the current homepage does not explicitly guide all three audience types.

**Step 3: Write minimal implementation**

In `src/components/pages/LandingPage.tsx`:

- add a sharper `Why This Work Matters Now` section
- connect philosophy to present-day public discourse and civilisational stakes
- add three audience cards with tailored descriptions and buttons

Representative path CTAs:

```tsx
Visitor -> "Understand the Vision / दृष्टि समझें"
Thinker -> "Read Current Vimarsh / वर्तमान विमर्श पढ़ें"
Organiser -> "See Organisational Work / कार्यप्रवाह देखें"
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/pages/LandingPage.tsx e2e/demo-smoke.spec.ts
git commit -m "feat: add homepage relevance section and audience paths"
```

### Task 6: Bridge The Homepage To The Demo Console

**Files:**
- Modify: `src/components/pages/LandingPage.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Lock the final operational bridge CTA in tests.

```typescript
await expect(main.getByText(/Mission Into Operations|कार्य से प्रणाली तक/i)).toBeVisible();
await expect(main.getByRole("link", { name: /Enter Demo Console|डेमो प्रणाली खोलें/i })).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: FAIL because the current close of the page does not make this philosophical-to-operational bridge explicit enough.

**Step 3: Write minimal implementation**

In `src/components/pages/LandingPage.tsx` and `src/app/globals.css`:

- rebuild the closing section into an operational bridge
- connect institutional mission to visible workflows and the demo console
- preserve bilingual tone and strong final CTA hierarchy

Representative copy:

```tsx
<p className="home-editorial-eyebrow">Mission Into Operations / कार्य से प्रणाली तक</p>
<h2>Pragya Pravah in organised action</h2>
<p>From discourse and research to review, publication, and coordination.</p>
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/pages/LandingPage.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: bridge homepage narrative to demo console"
```

### Task 7: Final Verification

**Files:**
- Verify only: `src/components/pages/LandingPage.tsx`
- Verify only: `src/app/globals.css`
- Verify only: `e2e/demo-smoke.spec.ts`

**Step 1: Run focused homepage smoke**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13 - homepage introduces Pragya Pravah and offers three clear entry paths"`

Expected: PASS.

**Step 2: Run broader smoke**

Run: `npx playwright test e2e/demo-smoke.spec.ts`

Expected: PASS except skips caused by external auth/bootstrap issues.

**Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

**Step 4: Run production build**

Run: `npm run build`

Expected: PASS.

**Step 5: Manual verification**

Check these in the browser:

- homepage explains the organisation within the first screen
- hero offers all three entry actions clearly
- bilingual treatment feels intentional, not duplicated noise
- buttons sound institution-native
- section flow is clearer than the current homepage on desktop and mobile

**Step 6: Commit**

```bash
git add src/components/pages/LandingPage.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: redesign homepage narrative and gateway"
```