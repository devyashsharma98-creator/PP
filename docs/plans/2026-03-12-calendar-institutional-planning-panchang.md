# Calendar Institutional Planning Panchang Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the internal calendar into a hybrid institutional planning surface that balances organisational rhythm and operational planning for all internal roles.

**Architecture:** Keep the current data sources, role filtering, and route structure intact, but upgrade `AnnualCalendar.tsx` into a stronger hybrid split view with a masthead, summary band, improved month-grid hierarchy, and a combined agenda/reminder/detail side panel. Add only CSS tokens and smoke coverage needed to support the new visual contract.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Playwright

---

### Task 1: Add calendar smoke coverage first

**Files:**
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\e2e\demo-smoke.spec.ts`

**Step 1: Write the failing tests**

Add three focused smoke tests near the authenticated internal-route checks:

- `calendar presents the institutional planning masthead`
- `calendar shows the hybrid planning surface`
- `calendar exposes agenda and reminder framing`

Use assertions similar to:

```ts
await expect(page.getByText(/Institutional Calendar Desk/i)).toBeVisible();
await expect(page.getByRole("heading", { name: /Plan the Month and Track Organisational Rhythm/i })).toBeVisible();
await expect(page.getByText(/Hybrid Planning View/i)).toBeVisible();
await expect(page.getByText(/Agenda and Reminders/i)).toBeVisible();
```

**Step 2: Run the targeted tests to verify they fail**

Run:

```bash
$env:BASE_URL='http://127.0.0.1:3000'; npx playwright test e2e/demo-smoke.spec.ts -g "calendar presents the institutional planning masthead|calendar shows the hybrid planning surface|calendar exposes agenda and reminder framing" --reporter=line
```

Expected:

- the new calendar assertions fail because the live page does not yet contain the new masthead and planning copy

**Step 3: Commit the red-state tests**

```bash
git add e2e/demo-smoke.spec.ts
git commit -m "test: codify calendar planning panchang"
```

### Task 2: Add calendar masthead and summary band

**Files:**
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\components\pages\AnnualCalendar.tsx`
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\app\globals.css`

**Step 1: Add role-aware masthead data**

In `AnnualCalendar.tsx`, create:

- a `CalendarMasthead` helper component
- role-aware context cards similar to the pattern used in dashboard, aalekh, and prachar

Include wording along these lines:

- seal: `Institutional Calendar Desk / संस्थागत पंचांग कक्ष`
- title: `Plan the Month and Track Organisational Rhythm / मासिक योजना और संस्थागत लय`
- supporting body explaining rhythm + action

**Step 2: Replace the current plain title/header**

Render the new masthead at the top of the page and remove the simpler heading block if present.

**Step 3: Strengthen the KPI band**

Keep current role-driven KPI logic, but render the cards in a more deliberate summary band using new calendar-specific classes.

**Step 4: Add minimal calendar token classes**

In `globals.css`, add classes such as:

- `.calendar-masthead`
- `.calendar-context-grid`
- `.calendar-context-card`
- `.calendar-summary-grid`
- `.calendar-summary-card`

Match the internal institutional design system already used in dashboard, aalekh, and prachar.

**Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected:

- TypeScript passes

**Step 6: Commit**

```bash
git add src/components/pages/AnnualCalendar.tsx src/app/globals.css
git commit -m "feat: add calendar institutional masthead"
```

### Task 3: Rebuild the calendar into a stronger hybrid split

**Files:**
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\components\pages\AnnualCalendar.tsx`
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\app\globals.css`

**Step 1: Restructure the main layout**

Refactor the main body into:

- left column: month grid
- right column: agenda, reminders, selected-day details

Desktop should show a true split; mobile should stack cleanly.

**Step 2: Improve month-cell hierarchy**

For each day cell, make hierarchy explicit:

- date numeral
- today state
- selected state
- event chips
- pending-state emphasis
- recurring-state emphasis

Do not add new data. Only improve structure and readability.

**Step 3: Refine event chips**

Make event chips read as institutional schedule markers rather than tiny utility tags.

Keep:

- aayam colour semantics
- pending state
- published state

But improve legibility and spacing.

**Step 4: Add hybrid-view language**

Add visible planning language that the smoke tests can target, such as:

- `Hybrid Planning View`
- `Agenda and Reminders`
- `Selected Day Ledger`

These labels should feel institutional, not generic SaaS.

**Step 5: Add CSS support**

Add only the classes needed for:

- hybrid split layout
- improved day cells
- event chips
- planning panel shells

**Step 6: Run typecheck and build**

Run:

```bash
npm run typecheck
npm run build
```

Expected:

- both commands pass

**Step 7: Commit**

```bash
git add src/components/pages/AnnualCalendar.tsx src/app/globals.css
git commit -m "feat: strengthen calendar hybrid planning layout"
```

### Task 4: Compose the right-side planning panel

**Files:**
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\components\pages\AnnualCalendar.tsx`
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\app\globals.css`

**Step 1: Merge agenda and reminders into one coherent panel**

Build a composed right-hand surface that includes:

- agenda list
- reminders / pending action cues
- selected-day details
- role context

It should feel like a planning ledger rather than independent cards.

**Step 2: Keep all roles in the same architecture**

Do not fork the layout by role. Only change:

- emphasis
- counts
- action wording
- reminder focus

**Step 3: Improve selected-day event detail cards**

Refine `EventCard` or equivalent detail rendering so it feels consistent with the new internal module language.

Prefer:

- clearer title hierarchy
- better chip grouping
- role-aware action labels when present

**Step 4: Add reminder language**

Include clear planning phrases such as:

- `Agenda and Reminders`
- `Upcoming Institutional Rhythm`
- `Pending Coordination`

Use subtle Bharat-rooted cues only.

**Step 5: Run the targeted smoke tests**

Run:

```bash
$env:BASE_URL='http://127.0.0.1:3000'; npx playwright test e2e/demo-smoke.spec.ts -g "calendar presents the institutional planning masthead|calendar shows the hybrid planning surface|calendar exposes agenda and reminder framing" --reporter=line
```

Expected:

- still red against production until deployment

Then run locally after deployment or against a fresh ready production deployment.

**Step 6: Commit**

```bash
git add src/components/pages/AnnualCalendar.tsx src/app/globals.css
git commit -m "feat: compose calendar agenda and reminder panel"
```

### Task 5: Verify, push, and run live smoke

**Files:**
- Verify only

**Step 1: Run full local verification**

Run:

```bash
npm run typecheck
npm run build
```

Expected:

- both pass

**Step 2: Push to main**

```bash
git push origin main
```

**Step 3: Wait for production readiness**

Run:

```bash
Invoke-WebRequest -Uri "$env:BASE_URL/api/health" -UseBasicParsing
```

Expected:

- production health check returns HTTP 200

**Step 4: Run targeted live smoke**

Run:

```bash
$env:BASE_URL='<production-url>'; npx playwright test e2e/demo-smoke.spec.ts -g "calendar presents the institutional planning masthead|calendar shows the hybrid planning surface|calendar exposes agenda and reminder framing" --reporter=line
```

Expected:

- all targeted calendar tests pass

**Step 5: Run full live smoke**

Run:

```bash
$env:BASE_URL='<production-url>'; npx playwright test e2e/demo-smoke.spec.ts --reporter=line
```

Expected:

- full suite passes with the new calendar included

**Step 6: Final commit if any verification-only adjustments were needed**

```bash
git add .
git commit -m "fix: polish calendar planning panchang"
```
