# Parichay App Alignment Design

## Summary

Adjust `/parichay` so it aligns more closely with the existing app's color system, content tone, and institutional UI language while preserving the recently implemented section structure. This is a reconciliation pass, not a fresh redesign.

The page should move away from the softer editorial treatment and toward a public-facing institutional overview that clearly belongs to the same product family as `Login`, `Dashboard`, and `Prachar`.

## Goals

- Keep the current `/parichay` section structure intact.
- Align the page palette and surface treatment with the existing app.
- Rewrite the landing copy to match the app's institutional and operational language.
- Shift the page from editorial public landing toward public institutional overview.
- Preserve `Explore Work` as primary and `Sign In` as secondary.

## Non-Goals

- No full-app redesign.
- No new landing-page structure exploration.
- No workflow logic changes.
- No attempt to make `/parichay` fully internal-facing.

## Updated Direction

- Scope: `/parichay` only
- Alignment target: balanced between `Login` and `Dashboard/Prachar`
- Most-wrong areas identified: both colors and content
- Desired identity: institutional overview page

## Approaches Considered

### 1. Operational Overview

Pull `/parichay` strongly toward dashboard and prachar surfaces.

**Pros**
- Strongest consistency with internal app UI
- Clearer operational tone

**Cons**
- Too easy to make the public landing feel internal-only

### 2. Institutional Bridge

Pull `/parichay` closer to the login page tone and ceremonial bridge feel.

**Pros**
- Stronger continuity with public-to-internal access flow
- More controlled institutional tone

**Cons**
- Weaker workstream legibility

### 3. Balanced Overview (Recommended)

Preserve the current public structure, but align palette, headings, and copy tone with the app.

**Pros**
- Best fit for the request
- Maintains readability for public users
- Feels related to the app without becoming an internal dashboard

**Cons**
- Requires restraint so the page does not drift back toward editorial styling

## Design Decisions

### 1. Color and Surface Alignment

`/parichay` should shift from the current softer editorial beige treatment toward the app's more structured institutional surfaces.

Changes:
- stronger contrast in headings and anchors
- darker institutional brown used more decisively
- reduced use of soft panel fills that feel paper-like
- section containers should feel closer to overview panels than editorial spreads
- CTA hierarchy should match the app's existing primary/secondary action language

### 2. Content Alignment

The page copy should sound like the public overview of a real institutional system.

Changes:
- hero headline becomes more institutional and descriptive
- supporting copy describes organized work, public outputs, and operational domains
- workstream descriptions align with app terminology such as publication, dissemination, review, discourse, and reporting
- section headings become more overview-oriented and less rhetorical

### 3. Institutional Overview Tone

The page remains public, but it should no longer feel like a manifesto-led landing.

It should instead communicate:
- what the institution organizes
- what workstreams exist
- what current output looks like
- how public users and internal users enter different paths

## Concrete Changes by Section

### Hero

- keep the bilingual structure
- replace thesis-led headline with a more institutional overview headline
- reduce the weight of the abstract editorial visual
- make the first fold feel like the top of an institutional overview page

### Workstream Rail

- keep the workstream rail
- make it visually closer to app panels
- tighten descriptions so each item reads like an operating domain

### Proof / Showcase Row

- simplify surrounding proof cards
- keep the article showcase
- make adjacent blocks feel more operational and less editorial

### Section Copy

- rewrite headings and descriptions using language consistent with the app
- reduce literary or philosophical phrasing where it hurts clarity

### Participation / Footer

- make participation and access language more explicit
- clarify the split between public exploration and internal entry

## Implementation Implications

### Primary File

- `src/components/pages/Parichay.tsx`

### Supporting Files

- existing test coverage in `e2e/demo-smoke.spec.ts`
- article mapping helper if copy alignment affects public showcase terminology

## Testing Focus

- confirm public landing still passes existing landing smoke tests
- verify CTA visibility and route behavior remain unchanged
- ensure the page now feels visually closer to `Login` and `Dashboard` than to the prior editorial landing
- visually inspect desktop and mobile after the alignment pass

## Success Criteria

- `/parichay` visibly belongs to the same app family as `Login`, `Dashboard`, and `Prachar`
- the page reads as an institutional overview rather than an editorial landing
- colors and surfaces feel more app-native
- copy is clearer, more operational, and more consistent with the rest of the product
