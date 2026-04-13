# Pragya Pravah Login Editorial Refresh Design

## Goal

Recast the login page into a calm, premium, institutional entry surface that feels appropriate for a serious ERP while preserving bilingual access, role-aware sign-in, and visible-but-secondary demo controls.

## Approved Direction

- **Aesthetic:** institutional editorial
- **Mood:** calm + premium
- **Hero emphasis:** balanced mission-first + workflow clarity
- **Demo accounts:** visible, but visually secondary

## Design Summary

The page should feel less like a prototype panel and more like the front desk of an internal institutional system. The visual language stays rooted in parchment, ink, and restrained saffron accents, but the composition becomes quieter, more intentional, and more readable on mobile.

## Experience Principles

1. **Trust first** — the first screen should immediately feel official, calm, and reliable.
2. **Primary action obvious** — sign-in should dominate the hierarchy without shouting.
3. **Mission + workflow balance** — the page should explain both what Pragya Pravah is and what the console is for.
4. **Demo tools stay secondary** — useful for internal testing, but not allowed to hijack the main experience.
5. **Bilingual dignity** — Hindi and English must both feel deliberate, not patched in.

## Layout Direction

### Overall frame

- Keep a two-column desktop structure and a single-column mobile stack.
- Reduce the “dashboard card grid” feeling.
- Use more vertical rhythm and fewer repeated boxed panels.

### Left / hero side

- Stronger brand block with a more editorial typographic treatment.
- One mission statement line.
- One concise workflow-supporting paragraph.
- Replace the three equal context cards with a calmer “institutional notes” pattern.

### Right / login side

- A slimmer, more premium sign-in card.
- Clear hierarchy: seal → title → support text → fields → submit → secondary tools.
- More intentional field spacing, better label rhythm, and softer error presentation.

### Demo access

- Keep visible under the main form.
- Present as lower-contrast utility chips/buttons.
- Preserve quick-fill behavior with less visual dominance.

## Visual Language

- Warm parchment base, deep ink typography, restrained saffron highlights.
- Softer surfaces and finer borders.
- Less glow, less “demo bridge” energy, more editorial polish.
- Language toggle reduced to one primary control.

## Mobile Expectations

- Brand block should remain elegant without crowding the form.
- Demo controls should wrap cleanly and still feel secondary.
- The sign-in action should remain visible without excessive scrolling.

## Non-Goals

- No auth-flow logic changes beyond presentation polish.
- No role-routing changes.
- No new dependencies.
- No redesign of the internal post-login shell in this pass.
