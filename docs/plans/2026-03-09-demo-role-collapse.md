# Demo Role Collapse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Collapse all visible demo identity to four workflow roles so the app never shows `Super Admin`, `Org Admin`, or other backend-only role labels in user-facing UI.

**Architecture:** Keep canonical backend permissions unchanged on the server and treat `viewer.uiRole` as the only user-facing role identity on the client. Update the login quick-fill list, shared shell labels, and smoke coverage so the demo consistently presents one visible four-role ladder.

**Tech Stack:** Next.js App Router, React, TypeScript, Playwright, Supabase-backed bootstrap viewer context.

---

### Task 1: Lock the visible-role contract with failing smoke tests

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/e2e/demo-smoke.spec.ts`

**Step 1: Write the failing test**

Update the smoke spec so it asserts the demo-visible hierarchy directly:
- `/login` shows only four quick-fill pills: `Vibhag Pramukh`, `Aayam Pramukh`, `Unit Head`, `Karyakarta`
- `/login` does not show `Super Admin`
- an authenticated `demo.admin@example.com` session does not show `Super Admin` anywhere in the shell and instead shows `Vibhag Pramukh`

Use the existing login helper and add a dedicated admin smoke path instead of weakening the current vibhag smoke.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "login page loads with form and demo account pills|admin account collapses to vibhag-pramukh UI" --reporter=line
```

Expected:
- FAIL because `/login` still exposes `Super Admin`
- FAIL because the navbar/dashboard shell still renders the canonical admin label for `demo.admin@example.com`

**Step 3: Write minimal implementation**

Do not touch permissions yet. Only add the test expectations needed to prove the visible-role contract.

**Step 4: Run test to verify it still fails for the right reason**

Run the same Playwright command again.

Expected:
- FAIL with assertion mismatch on visible role labels, not with syntax/runtime errors

**Step 5: Commit**

```bash
git add e2e/demo-smoke.spec.ts
git commit -m "test: codify four-role demo hierarchy"
```

### Task 2: Remove canonical admin labels from visible UI

**Files:**
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/app/login/page.tsx`
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/Navbar.tsx`
- Modify: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/context/AppContext.tsx`

**Step 1: Write the failing test**

Use the Task 1 smoke assertions as the failing contract. Do not add new production code until that failure is confirmed.

**Step 2: Run test to verify it fails**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "login page loads with form and demo account pills|admin account collapses to vibhag-pramukh UI" --reporter=line
```

Expected:
- FAIL because the app still leaks canonical admin labels

**Step 3: Write minimal implementation**

Make only the smallest user-facing changes required:
- In `src/app/login/page.tsx`, keep one quick-fill account per visible role and remove the `Super Admin` pill from the public demo shortcuts. The admin account remains manually usable, but the quick-fill grid stays aligned to the four visible roles.
- In `src/components/Navbar.tsx`, stop rendering `viewer.primaryRoleCode` as the visible badge label. Use the existing collapsed `role` from `useAppContext()` for both English and Hindi badge text.
- In `src/context/AppContext.tsx`, normalize the user-facing role label text so `karyakarta` displays as `Karyakarta` rather than `Karyakarta (Writer)`.

Do not alter:
- canonical permission checks in `src/lib/server/permissions.ts`
- `primaryRoleCode` in the viewer contract
- any auth/bootstrap behavior

**Step 4: Run test to verify it passes**

Run:
```bash
npx playwright test e2e/demo-smoke.spec.ts -g "login page loads with form and demo account pills|admin account collapses to vibhag-pramukh UI" --reporter=line
```

Expected:
- PASS
- no visible `Super Admin` text remains in the tested login/dashboard shell flow

**Step 5: Commit**

```bash
git add src/app/login/page.tsx src/components/Navbar.tsx src/context/AppContext.tsx e2e/demo-smoke.spec.ts
git commit -m "feat: collapse demo role labels to visible hierarchy"
```

### Task 3: Verify the full demo shell stays coherent

**Files:**
- Verify only: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/e2e/demo-smoke.spec.ts`
- Verify only: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/pages/Dashboard.tsx`
- Verify only: `C:/Users/yashs/Desktop/pp/pragya-pravah-ui/src/components/Navbar.tsx`

**Step 1: Write the failing test**

No new test file is required. Reuse the updated smoke suite as the regression safety net.

**Step 2: Run targeted verification**

Run:
```bash
npm run typecheck
npm run build
npx playwright test e2e/demo-smoke.spec.ts -g "login page loads with form and demo account pills|dashboard leads with institutional context and operational summary|admin account collapses to vibhag-pramukh UI" --reporter=line
```

Expected:
- `typecheck` PASS
- `build` PASS
- targeted smoke PASS for both regular vibhag and collapsed-admin flows

**Step 3: Minimal cleanup**

If any remaining visible copy still references canonical admin roles or `Karyakarta (Writer)`, remove only those user-facing leaks. Do not refactor unrelated dashboard logic.

**Step 4: Run final verification**

Run the same command block again after cleanup.

Expected:
- all verification steps PASS

**Step 5: Commit**

```bash
git add src/app/login/page.tsx src/components/Navbar.tsx src/context/AppContext.tsx e2e/demo-smoke.spec.ts
git commit -m "test: verify collapsed demo role experience"
```
