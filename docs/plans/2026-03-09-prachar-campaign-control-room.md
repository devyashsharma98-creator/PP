# Prachar Campaign Control Room Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn Prachar into a campaign control room that leads with dissemination accountability, presents event outreach as campaign dossiers, and frames templates as a creative studio rather than a passive carousel.

**Architecture:** Keep the existing published-event and platform update workflow intact, but restructure `Prachar.tsx` into a consistent pattern: masthead, command-center summary, dissemination queue, and creative studio. Use focused smoke tests to lock the visible user-facing framing before and after the UI changes.

**Tech Stack:** Next.js App Router, React, TypeScript, Framer Motion, Playwright, Embla Carousel.

---

### Task 1: Lock the Prachar control-room framing with failing smoke tests

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Add focused Prachar smoke coverage for the new framing:
- a vibhag-pramukh session on `/prachar` shows a Prachar command-room masthead and command-center language
- the page shows a dissemination queue / accountability message instead of only generic publication wording
- the page shows a creative-studio section for templates

Prefer 2-3 small tests over one overloaded test. Reuse the existing `loginAs()` helper.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "prachar presents the command center masthead|prachar shows campaign distribution accountability|prachar exposes the creative studio" --reporter=line
```

Expected:
- FAIL because the current Prachar page lacks the new masthead copy and control-room framing

**Step 3: Write minimal implementation**

Do not change production code yet. Only add the regression tests needed to prove the target behavior.

**Step 4: Run test to verify it still fails for the right reason**

Run the same Playwright command again.

Expected:
- FAIL with assertion mismatches on Prachar headings or section copy, not with syntax errors

**Step 5: Commit**

```bash
git add e2e/demo-smoke.spec.ts
git commit -m "test: codify prachar campaign control room"
```

### Task 2: Add the Prachar masthead and command-center summary band

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/pages/Prachar.tsx`
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/app/globals.css`

**Step 1: Use the failing tests from Task 1**

Do not add production code until the Prachar smoke assertions are failing for missing masthead/summary copy.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "prachar presents the command center masthead|prachar shows campaign distribution accountability|prachar exposes the creative studio" --reporter=line
```

Expected:
- FAIL on missing Prachar masthead and command-center framing

**Step 3: Write minimal implementation**

In `src/components/pages/Prachar.tsx`:
- add a reusable Prachar masthead helper with a more urgent, communications-led tone than Aalekh
- replace the simple title block with the new masthead
- add a summary band above the queue showing dissemination pressure, completion state, and current mission of the page
- preserve the existing permissions, update behavior, and published-events filter

In `src/app/globals.css`:
- add only the minimal Prachar-specific layout utility classes needed for the masthead and summary band

**Step 4: Run test to verify it passes**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "prachar presents the command center masthead|prachar shows campaign distribution accountability|prachar exposes the creative studio" --reporter=line
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add src/components/pages/Prachar.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: add prachar control room masthead"
```

### Task 3: Upgrade the dissemination queue cards and creative studio

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/pages/Prachar.tsx`
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/app/globals.css`
- Verify only: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/e2e/demo-smoke.spec.ts`

**Step 1: Extend the failing tests**

Add light user-facing Prachar assertions for:
- event cards reading like campaign dossiers rather than checkbox slabs
- visible completion / pending emphasis
- creative studio language reading like a communications desk rather than a generic template carousel

Keep assertions shallow and stable.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "prachar presents the command center masthead|prachar shows campaign distribution accountability|prachar exposes the creative studio|prachar highlights event campaign progress" --reporter=line
```

Expected:
- FAIL on missing queue/studio framing

**Step 3: Write minimal implementation**

In `src/components/pages/Prachar.tsx`:
- restyle event queue cards so each event reads like a mini campaign dossier
- make completion, pending state, and skipped channels easier to scan
- keep inline skip-reason behavior intact
- reframe the templates area as a campaign creative studio without inventing actual template generation features
- preserve Embla behavior unless the redesign proves a simpler static grid is better

In `src/app/globals.css`:
- add only the extra Prachar card/studio classes needed to support the refined presentation

**Step 4: Run verification**

Run:
```bash
npm run typecheck
npm run build
npx playwright test e2e/demo-smoke.spec.ts -g "prachar presents the command center masthead|prachar shows campaign distribution accountability|prachar exposes the creative studio|prachar highlights event campaign progress" --reporter=line
```

Expected:
- `typecheck` PASS
- `build` PASS
- focused Prachar smoke PASS

**Step 5: Commit**

```bash
git add src/components/pages/Prachar.tsx src/app/globals.css e2e/demo-smoke.spec.ts
git commit -m "feat: refine prachar campaign queue and studio"
```
