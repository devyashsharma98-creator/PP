# Parichay Story ERP Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/parichay` visually tell Pragya Pravah's organization story while making the ERP workstream layer legible.

**Architecture:** Keep the existing chapter components and add a small shared content module for story stages and ERP flow data. Update the hero, identity, workstreams, and mobile motion behavior without changing routing or server data contracts.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS, Framer Motion, Vitest.

---

### Task 1: Shared Story Content

**Files:**
- Create: `src/components/parichay/story-content.ts`
- Create: `src/components/parichay/story-content.test.ts`

- [ ] Add a failing Vitest test that expects five story stages and five ERP flow steps.
- [ ] Implement `STORY_STAGES` and `ERP_FLOW_STEPS` with stable ids, titles, summaries, and image paths.
- [ ] Run `npx vitest run src/components/parichay/story-content.test.ts`.

### Task 2: Hero Narrative Upgrade

**Files:**
- Modify: `src/components/parichay/chapters/HeroChapter.tsx`

- [ ] Add a full-bleed story image treatment using existing public assets.
- [ ] Add primary `Explore Work` and secondary `Sign In` actions.
- [ ] Add a compact ERP flow strip in the first viewport.

### Task 3: Identity Story Timeline

**Files:**
- Modify: `src/components/parichay/chapters/IdentityChapter.tsx`

- [ ] Render the five-stage story timeline using `STORY_STAGES`.
- [ ] Use restrained image crops and short explanatory copy.
- [ ] Keep existing mission and values content, but fix mobile horizontal offset by disabling perspective overflow on narrow screens.

### Task 4: Workstream ERP Diagram

**Files:**
- Modify: `src/components/parichay/chapters/WorkstreamsChapter.tsx`

- [ ] Add an ERP operating flow before the workstream cards.
- [ ] Clarify each workstream as part of the system: idea, publication, dissemination, discourse, reporting.
- [ ] Add `id="our-work"` for hero anchor navigation.

### Task 5: Mobile Alignment and Verification

**Files:**
- Modify: `src/components/parichay/effects/PerspectiveCard.tsx`
- Modify: `src/components/parichay/chapters/JoinChapter.tsx`

- [ ] Disable 3D transform on mobile and reduced-motion users.
- [ ] Remove mobile X offsets from Join cards.
- [ ] Run lint/build and visually audit `/parichay` at desktop and mobile sizes.
