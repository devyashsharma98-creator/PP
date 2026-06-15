# Aalekh Publication Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn Aalekh into a clear institutional publication pipeline that leads with editorial context, shows the active role lane first, and presents published work as serious organisational output.

**Architecture:** Keep the existing article workflow and permissions intact, but restructure the role views in `Aalekh.tsx` around a consistent pattern: masthead, active lane, workspace, and published record. Use focused smoke coverage to lock the visible role behavior and the new Aalekh framing before and after the UI changes.

**Tech Stack:** Next.js App Router, React, TypeScript, Framer Motion, Playwright.

---

### Task 1: Lock the new Aalekh framing with failing smoke tests

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Add focused Aalekh smoke coverage for the publication-pipeline framing:
- a karyakarta session on `/aalekh` shows a writing-led masthead and a primary draft/submission action
- a unit-head session on `/aalekh` shows a review-led masthead and a pending-review lane
- an aayam-pramukh session on `/aalekh` shows a final-approval masthead and published/archive context

Prefer three small tests over one overloaded test. Reuse the existing `loginAs()` helper.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "aalekh presents the karyakarta writing lane|aalekh presents the unit-head review lane|aalekh presents the aayam publication lane" --reporter=line
```

Expected:
- FAIL because the current Aalekh page lacks the new masthead copy and pipeline-first framing

**Step 3: Write minimal implementation**

Do not change production code yet. Only add the regression tests needed to prove the target behavior.

**Step 4: Run test to verify it still fails for the right reason**

Run the same Playwright command again.

Expected:
- FAIL with assertion mismatches on Aalekh headings or lane copy, not with syntax errors

**Step 5: Commit**

```bash
git add e2e/demo-smoke.spec.ts
git commit -m "test: codify aalekh publication pipeline"
```

### Task 2: Add the Aalekh masthead and top-level lane structure

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/pages/Aalekh.tsx`
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/app/globals.css`

**Step 1: Write the failing test**

Use the Task 1 Aalekh smoke tests as the failing contract. Do not touch implementation until the failures are confirmed.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "aalekh presents the karyakarta writing lane|aalekh presents the unit-head review lane|aalekh presents the aayam publication lane" --reporter=line
```

Expected:
- FAIL on missing masthead and role-lane framing

**Step 3: Write minimal implementation**

In `src/components/pages/Aalekh.tsx`:
- add a reusable Aalekh masthead helper similar in discipline to the dashboard masthead, but more editorial in tone
- restructure each role branch so the top of the page follows the same order:
  - masthead
  - active lane summary
  - working surface
  - published record or secondary overview
- keep the current workflow actions and role branching intact
- do not change article status transitions, permission checks, or data contracts

In `src/app/globals.css`:
- add only the minimal Aalekh-specific layout and editorial utility classes needed for the new masthead and lane panels

**Step 4: Run test to verify it passes**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "aalekh presents the karyakarta writing lane|aalekh presents the unit-head review lane|aalekh presents the aayam publication lane" --reporter=line
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add src/components/pages/Aalekh.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: add aalekh editorial pipeline framing"
```

### Task 3: Upgrade article cards, published archive, and values framing

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/pages/Aalekh.tsx`
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/app/globals.css`
- Verify only: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Extend the Aalekh smoke coverage with small visible checks for:
- review notes remaining prominent on returned drafts
- published Aalekh reading as an archive/output section rather than a generic list
- values/checklist copy reading as institutional standards

Keep the assertions light and user-facing.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "aalekh presents the karyakarta writing lane|aalekh presents the unit-head review lane|aalekh presents the aayam publication lane|aalekh keeps returned-draft review notes visible" --reporter=line
```

Expected:
- FAIL on missing card/archive/standards framing

**Step 3: Write minimal implementation**

In `src/components/pages/Aalekh.tsx`:
- improve article-card hierarchy so title, metadata, status, notes, and actions scan more like editorial dossiers
- make review-note callouts stronger and easier to spot
- make the published area feel like an institutional archive/output section
- reframe the values/checklist block as editorial standards or institutional discipline while preserving the existing behavior

In `src/app/globals.css`:
- add only the extra Aalekh card/archive classes needed to support the refined presentation

**Step 4: Run verification**

Run:
```bash
npm run typecheck
npm run build
npx playwright test e2e/demo-smoke.spec.ts -g "aalekh presents the karyakarta writing lane|aalekh presents the unit-head review lane|aalekh presents the aayam publication lane|aalekh keeps returned-draft review notes visible" --reporter=line
```

Expected:
- `typecheck` PASS
- `build` PASS
- focused Aalekh smoke PASS

**Step 5: Commit**

```bash
git add src/components/pages/Aalekh.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: refine aalekh publication cards and archive"
```
