# Login Editorial Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh the login page so it feels calm, premium, and institutional while keeping the existing bilingual login flow and visible demo-access utilities.

**Architecture:** Keep the existing login route and auth behavior intact. Concentrate the changes in `LoginPageClient.tsx` for structure/copy and `src/app/globals.css` for visual tokens/utilities, reusing the current logo component and shared surface classes where possible.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, shared global utility classes, existing app context language switch.

---

### Task 1: Lock the approved login direction into code structure

**Files:**
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\components\pages\LoginPageClient.tsx`

**Step 1: Refactor copy into a single bilingual content object**

- Replace repeated inline ternaries with one `content` object keyed by language.
- Keep current login logic unchanged.

**Step 2: Simplify the page hierarchy**

- Remove the duplicate language switch presentation.
- Rebuild the hero/login layout around:
  - top utility rail
  - editorial hero block
  - premium login card
  - subdued demo tools section

**Step 3: Preserve functional behavior**

- Keep `handleSubmit`, `returnTo`, role landing, and demo autofill logic intact.

### Task 2: Build the editorial visual system for login

**Files:**
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\components\pages\LoginPageClient.tsx`
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\app\globals.css`

**Step 1: Add login-specific utility classes**

- Create calm editorial utility classes for:
  - page background
  - top rail
  - hero panel
  - institutional note rows
  - login card
  - demo utility chips

**Step 2: Reduce noisy visual treatment**

- Tone down glow, card repetition, and redundant boxed sections.
- Keep saffron as a refined accent rather than a loud effect.

**Step 3: Make mobile layout intentional**

- Ensure the hero collapses gracefully.
- Keep submit and demo utility sections readable on narrow screens.

### Task 3: Improve clarity and trust cues

**Files:**
- Modify: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\components\pages\LoginPageClient.tsx`

**Step 1: Improve hero messaging**

- Use one mission line and one workflow-supporting line.
- Replace current three-card “context/workflow/audience” block with calmer institutional notes.

**Step 2: Improve the sign-in panel**

- Add a clearer support sentence.
- Make the error state more elegant.
- Add a light note about role-aware landing after sign-in.

**Step 3: Keep demo access visible but secondary**

- Lower contrast and visual size.
- Keep the bilingual mobile guide CTA.

### Task 4: Verify and harden

**Files:**
- Modify if needed: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\components\pages\LoginPageClient.tsx`
- Modify if needed: `C:\Users\yashs\Desktop\pp\pragya-pravah-ui\src\app\globals.css`

**Step 1: Run focused checks**

Run:
- `npx eslint src/components/pages/LoginPageClient.tsx src/app/globals.css`
- `npm run build`
- `npm run typecheck`

Expected:
- No lint errors from touched files
- Build succeeds
- Typecheck succeeds after build

**Step 2: Verify in browser**

Check:
- English login view
- Hindi login view
- mobile-width layout
- demo quick-fill visibility
- successful login redirect still works

**Step 3: Deploy and verify live**

- Push to `main`
- Wait for Hostinger deploy completion
- Verify the refreshed login page live in both English and Hindi
