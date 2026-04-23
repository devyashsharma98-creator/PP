# Parichay Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Editorial Rail redesign for `/parichay` while preserving public article preview data, auth-aware navigation, and mobile sign-in visibility.

**Architecture:** Keep `/parichay` as a single page entry point, but replace the mixed decorative layout with a smaller content-driven section model. Preserve existing public article fetching and auth context, and move section content into structured arrays and focused subcomponents so the page can render bilingual editorial sections predictably.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Playwright, Vitest

---

### Task 1: Lock the landing regression in Playwright

**Files:**
- Modify: `e2e/demo-smoke.spec.ts`
- Test: `e2e/demo-smoke.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
test("13g - parichay uses the editorial rail hero and visible workstreams", async ({ page }) => {
  await page.goto("/parichay", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: /Ideas, dialogue, and organised public action/i })).toBeVisible();
  await expect(page.getByText(/विचार, विमर्श और संगठित लोक-कार्य/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore Work/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sign In|प्रवेश/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Aalekh|आलेख/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Prachar|प्रचार/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Vimarsh|विमर्श/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Vritt|वृत्त/i })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13g - parichay uses the editorial rail hero and visible workstreams"`

Expected: FAIL because the current hero does not contain the new editorial headline or workstream rail semantics.

- [ ] **Step 3: Keep the landing article showcase coverage intact**

```ts
test("13h - parichay still shows the approved article showcase inside the public landing", async ({ page }) => {
  await page.goto("/parichay", { waitUntil: "domcontentloaded" });

  const showcase = page.getByLabel("Approved article showcase");
  await expect(showcase).toBeVisible();
  await expect(showcase).toContainText(/Approved Article Showcase|प्रकाशन योग्य आलेख/i);
});
```

- [ ] **Step 4: Run the new landing tests together**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13[g-h] - parichay"`

Expected: FAIL for `13g`, PASS or stay green for existing showcase expectations once implemented.

- [ ] **Step 5: Commit after implementation**

```bash
git add e2e/demo-smoke.spec.ts src/components/pages/Parichay.tsx
git commit -m "feat: redesign parichay landing editorial rail"
```

### Task 2: Replace the hero and section model with editorial-rail content structures

**Files:**
- Modify: `src/components/pages/Parichay.tsx`
- Test: `e2e/demo-smoke.spec.ts`

- [ ] **Step 1: Replace ad hoc section constants with explicit landing content structures**

```ts
type Workstream = {
  id: string;
  href: string;
  titleEn: string;
  titleHi: string;
  summaryEn: string;
  summaryHi: string;
  actionEn: string;
  actionHi: string;
};

const WORKSTREAMS: Workstream[] = [
  {
    id: "aalekh",
    href: "/aalekh",
    titleEn: "Aalekh",
    titleHi: "आलेख",
    summaryEn: "Long-form writing, research notes, and publication-ready argument.",
    summaryHi: "दीर्घ लेखन, शोध टिप्पणी और प्रकाशन-योग्य विचार-सामग्री।",
    actionEn: "Read the writing desk",
    actionHi: "लेखन कक्ष देखें",
  },
  // Prachar, Vimarsh, Vritt...
];
```

- [ ] **Step 2: Implement a new editorial hero with bilingual thesis + workstream rail**

```tsx
function Hero() {
  const t = useT();

  return (
    <section id="mission" className="relative overflow-hidden bg-[#f4efe6] px-6 pb-16 pt-32 md:px-12 md:pb-24 md:pt-36">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7a5a42]">
            {t("Public movement of ideas", "सार्वजनिक वैचारिक प्रवाह")}
          </p>
          <div className="space-y-4">
            <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] text-[#24160f] md:text-7xl">
              Ideas, dialogue, and organised public action.
            </h1>
            <p className="max-w-2xl text-xl leading-8 text-[#5c4736]" lang="hi">
              विचार, विमर्श और संगठित लोक-कार्य के माध्यम से राष्ट्रीय जीवन की युगानुकूल दिशा।
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="#workstreams">...</Link>
            <Link href="/login">...</Link>
          </div>
        </div>
        <WorkstreamRail />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Preserve the article showcase, but reposition it as proof inside the first fold**

```tsx
<div className="grid gap-4 border-t border-[#d9c7b5] pt-6 md:grid-cols-[1.1fr_0.9fr_0.8fr]">
  <FeaturedProofCard ... />
  <CredibilityCard ... />
  <ArticleShowcaseArtifact />
</div>
```

- [ ] **Step 4: Replace the old card-stack sections with focused public narrative sections**

```tsx
<WorkstreamsSection />
<FeaturedOutputSection />
<CredibilitySection />
<ParticipationSection />
<LandingFooter />
```

- [ ] **Step 5: Run the targeted Playwright tests**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13[g-h] - parichay"`

Expected: PASS

### Task 3: Keep responsive behavior and authenticated entry points stable

**Files:**
- Modify: `src/components/pages/Parichay.tsx`
- Test: `e2e/demo-smoke.spec.ts`

- [ ] **Step 1: Keep the mobile sign-in/console icon behavior in the top bar**

```tsx
{isAuthenticated ? (
  <Link
    href={landingPath}
    aria-label={t("Enter Console", "कार्यक्षेत्र में प्रवेश")}
    className="inline-flex h-10 w-10 ... sm:h-auto sm:w-auto sm:px-4 sm:py-2"
  >
    <LayoutGrid className="h-4 w-4 sm:hidden" />
    <span className="hidden sm:inline">{t("Enter Console", "कार्यक्षेत्र")}</span>
  </Link>
) : (
  <Link
    href="/login"
    aria-label={t("Sign In", "प्रवेश")}
    className="inline-flex h-10 w-10 ... sm:h-auto sm:w-auto sm:px-4 sm:py-2"
  >
    <LogIn className="h-4 w-4 sm:hidden" />
    <span className="hidden sm:inline">{t("Sign In", "प्रवेश")}</span>
  </Link>
)}
```

- [ ] **Step 2: Ensure the hero collapses into a vertical editorial stack on mobile**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13g - parichay uses the editorial rail hero and visible workstreams" --project=chromium`

Expected: PASS with mobile-safe CTA and workstream visibility after local visual inspection.

- [ ] **Step 3: Run type and lint verification for the refactor**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run lint`
Expected: PASS with existing warnings only

### Task 4: Full verification and browser review

**Files:**
- Modify: `src/components/pages/Parichay.tsx`
- Test: `e2e/demo-smoke.spec.ts`, `e2e/end-user-simulation.spec.ts`

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Run the landing and simulation smoke tests**

Run: `npx playwright test e2e/demo-smoke.spec.ts --grep "13"`
Expected: PASS

Run: `npx playwright test e2e/end-user-simulation.spec.ts --grep "public visitor can enter the landing"`
Expected: PASS

- [ ] **Step 3: Manually inspect `/parichay` on desktop and mobile**

Run:

```bash
npm run dev
```

Then inspect:
- `http://localhost:3000/parichay` at desktop width
- mobile-width `/parichay`

Check:
- bilingual first fold
- editorial rail present
- `Explore Work` and `Sign In` visible
- workstreams readable without dashboard feel

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/Parichay.tsx e2e/demo-smoke.spec.ts docs/superpowers/plans/2026-04-23-parichay-landing-implementation.md
git commit -m "feat: redesign parichay landing editorial rail"
```
