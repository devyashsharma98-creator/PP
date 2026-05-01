# Parichay App Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `/parichay` to the existing app's colors and institutional content style without changing its current section structure.

**Architecture:** Keep the landing's current hero, rail, proof row, section order, and CTA hierarchy, but swap the softer editorial surface treatment for app-native institutional surfaces and rewrite public copy so it reads like an overview page instead of an editorial landing. Limit changes to the Parichay page and its direct landing coverage, reusing the extracted article-showcase helper as-is unless terminology updates require minor copy edits.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Playwright, Vitest

---

### Task 1: Lock the app-alignment behavior in a failing smoke test

**Files:**
- Modify: `e2e/demo-smoke.spec.ts`
- Test: `e2e/demo-smoke.spec.ts`

- [ ] **Step 1: Write the failing regression**

```ts
test("13i - parichay reads like an institutional overview page", async ({ page }) => {
  await page.goto("/parichay", { waitUntil: "domcontentloaded" });
  const hero = page.locator("#mission");

  await expect(
    hero.getByRole("heading", {
      name: /Institutional overview of Pragya Pravah workstreams/i,
    }),
  ).toBeVisible();
  await expect(
    hero.getByText(/Public interface for publication, dissemination, discourse, and reporting/i),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Institutional overview/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Current public output/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the regression and confirm RED**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13i - parichay reads like an institutional overview page"`

Expected: FAIL because the current page still uses the softer editorial wording.

- [ ] **Step 3: Keep existing landing coverage intact**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13[e-h] -"`

Expected: PASS with `13f` still skipped, proving the new regression is the only intended red test.

- [ ] **Step 4: Commit after implementation**

```bash
git add e2e/demo-smoke.spec.ts src/components/pages/Parichay.tsx docs/superpowers/plans/2026-04-23-parichay-app-alignment-implementation.md
git commit -m "feat: align parichay to app overview style"
```

### Task 2: Align Parichay surfaces and color treatment with the app

**Files:**
- Modify: `src/components/pages/Parichay.tsx`
- Test: `e2e/demo-smoke.spec.ts`

- [ ] **Step 1: Replace the soft editorial surface palette with app-native institutional surfaces**

```tsx
<div className="min-h-screen overflow-x-hidden bg-[#f6f3ef] text-[#1a1c1a]">
  ...
  <section id="mission" className="bg-[#f2efea] ...">
    <div className="border border-[#d8d2ca] bg-white ...">
```

Use these principles consistently:
- page background closer to app neutrals than paper-like beige
- stronger heading contrast
- brown accent reserved for anchors and primary actions
- panels closer to overview cards than editorial sheets

- [ ] **Step 2: Tighten hero panel styling toward app panels**

```tsx
<div className="mx-auto max-w-7xl border border-[#d8d2ca] bg-white px-6 py-8 md:px-10 md:py-10">
  ...
  <WorkstreamRail />
</div>
```

Update:
- hero CTA fills/borders to match app button hierarchy
- workstream rail borders and backgrounds to feel like dashboard-adjacent panels
- proof cards to use cleaner surfaces and less warm-fill stacking

- [ ] **Step 3: Keep mobile and authenticated sign-in behavior unchanged**

```tsx
<Link
  href="/login"
  className="inline-flex h-10 w-10 ... bg-[#964900] text-white ..."
  aria-label={t("Sign In", "प्रवेश")}
>
```

Do not regress:
- mobile sign-in icon button
- authenticated console button
- visible CTA hierarchy

- [ ] **Step 4: Run the landing surface smoke tests**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13[g-i] -"`

Expected: PASS after the visual and copy alignment lands.

### Task 3: Rewrite section copy to match the app’s institutional language

**Files:**
- Modify: `src/components/pages/Parichay.tsx`
- Test: `e2e/demo-smoke.spec.ts`

- [ ] **Step 1: Replace the editorial hero headline and support copy**

```tsx
<h1 className="...">
  Institutional overview of Pragya Pravah workstreams.
</h1>
<p className="...">
  Public interface for publication, dissemination, discourse, and reporting.
</p>
```

Hindi support should remain visible, but the tone should be institutional, not manifesto-led.

- [ ] **Step 2: Rewrite section headings and intros**

```tsx
<SectionHeading
  eyebrowEn="Institutional overview"
  eyebrowHi="संस्थागत अवलोकन"
  titleEn="Core public workstreams"
  titleHi="मुख्य सार्वजनिक कार्य-प्रवाह"
  bodyEn="Each workstream represents an active operating domain within the public interface of Pragya Pravah."
  bodyHi="प्रत्येक कार्य-प्रवाह प्रज्ञा प्रवाह के सार्वजनिक पटल का एक सक्रिय संचालन-क्षेत्र है।"
/>
```

Apply the same pattern to:
- current work
- institutional credibility
- participation / access

- [ ] **Step 3: Tighten workstream and proof-card descriptions**

```tsx
summaryEn: "Publication desk for long-form writing, review-ready drafts, and public research output."
summaryHi: "दीर्घ लेखन, समीक्षा-योग्य प्रारूप और सार्वजनिक शोध-सामग्री हेतु प्रकाशन कक्ष।"
```

Target vocabulary:
- publication
- dissemination
- review
- discourse
- reporting
- public interface
- institutional rhythm

- [ ] **Step 4: Run the focused landing checks**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13[e-i] -"`

Expected: PASS with `13f` skipped and the new institutional-overview regression green.

### Task 4: Final verification and visual review

**Files:**
- Modify: `src/components/pages/Parichay.tsx`
- Test: `src/components/pages/parichay-articles.test.ts`, `e2e/demo-smoke.spec.ts`, `e2e/end-user-simulation.spec.ts`

- [ ] **Step 1: Run the helper unit test**

Run: `npx vitest run src/components/pages/parichay-articles.test.ts`

Expected: PASS

- [ ] **Step 2: Run project verification**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run lint`
Expected: PASS with existing warnings only

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Run landing browser verification**

Run:

```bash
npx playwright test e2e/demo-smoke.spec.ts --grep "13[e-i] -"
npx playwright test e2e/end-user-simulation.spec.ts --grep "public visitor can enter the landing"
```

Expected:
- landing smoke passes with `13f` skipped
- public visitor simulation passes

- [ ] **Step 4: Visually inspect desktop and mobile**

Check:
- `/parichay` still feels public
- palette feels closer to `Login`/`Dashboard`
- copy reads as institutional overview
- section structure remains intact

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/Parichay.tsx e2e/demo-smoke.spec.ts docs/superpowers/plans/2026-04-23-parichay-app-alignment-implementation.md
git commit -m "feat: align parichay to app overview style"
```
