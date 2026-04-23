# Parichay Landing Redesign

## Summary

Redesign `/parichay` as a public-facing movement and ideas landing page for Pragya Pravah. The page should prioritize potential karyakartas and members, present the institution's workstreams clearly, and establish seriousness and credibility without reading like an ERP shell or an operational dashboard.

The recommended direction is **Editorial Rail**: a thesis-led bilingual hero, a visible workstream rail, compact institutional proof, and a simplified public narrative through the rest of the page.

## Goals

- Make the first screen explain the workstreams clearly.
- Establish institutional credibility and seriousness in the first fold.
- Keep `Explore Work` as the primary CTA and `Sign In` as the secondary CTA.
- Make the page visibly bilingual from the first fold.
- Shift the visual language away from decorative product marketing toward disciplined editorial institutional design.

## Non-Goals

- No ERP workflow redesign.
- No re-architecture of authentication, role routing, or navigation logic outside what the landing page directly needs.
- No attempt to surface every internal module in the hero.
- No full bilingual duplication of long-form copy blocks.

## Audience

- **Primary:** potential karyakartas / members evaluating the institution and its work.
- **Secondary:** internal users opening the ERP who need a reliable sign-in route.

## Design Inputs Confirmed

- Tone: intellectual, authoritative, grounded.
- Behavioral quality: disciplined.
- Page identity: movement / ideas platform.
- First-fold priorities: programs/workstreams first, credibility and scale second.
- CTA hierarchy: `Explore Work` primary, `Sign In` secondary.
- Language treatment: visibly bilingual from the first fold.
- Hero visual mode: abstract cultural/editorial visual.
- Overall posture: serious and institutional.

## Approaches Considered

### 1. Editorial Rail (Recommended)

A thesis-led hero with a structured workstream rail and a compact proof band.

**Pros**
- Best balance of movement identity and institutional seriousness.
- Keeps workstreams legible immediately.
- Avoids both generic public-institution templates and app-feature grids.

**Cons**
- Requires more disciplined copy and typographic hierarchy to land well.

### 2. Public Dossier

A formal institutional brief with proof-heavy framing.

**Pros**
- Strongest authority signal.
- Easy to show scale and seriousness.

**Cons**
- Too cold for first-time public visitors.
- Risks feeling bureaucratic rather than movement-led.

### 3. Program Mosaic

A faster, more grid-forward workstream overview.

**Pros**
- Fastest to scan.
- Straightforward to implement on top of existing card patterns.

**Cons**
- Weakest editorial identity.
- Most likely to slip into product UI conventions.

## Recommended Structure

### 1. First Fold

The hero should use an asymmetric editorial composition:

- Left: dominant bilingual thesis block
- Right: vertical rail of core workstreams
- CTA row: `Explore Work` then `Sign In`
- Below: compact proof band with one featured output, one scale marker, and one credibility signal

The thesis area should use one dominant line and one supporting line in the other language rather than mirrored long paragraphs.

### 2. Workstreams Section

Present `Aalekh`, `Prachar`, `Vimarsh`, and `Vritt` as public domains of institutional work, not tool cards.

Each workstream block should contain:
- bilingual title
- one-line public-facing description
- one clear action

### 3. Featured Output / Current Work

Surface one recent article, campaign, discussion, or report to prove the institution is active and current.

### 4. Institutional Credibility

Use a restrained proof section that signals seriousness through scale, cadence, or footprint without becoming a dashboard.

### 5. Participation Path

Offer a calmer participation or connection pathway below the credibility section so the landing page still supports member conversion without overloading the hero.

### 6. Footer / Final Navigation

Include:
- sign in
- key work areas
- organizational/contact paths

## Visual Language

### Tone

- Warm light surfaces
- Restrained saffron/earth accents
- Typographic hierarchy over decorative gradients
- Serious, composed pacing with strong left alignment

### Hero Treatment

- Editorial composition, not centered marketing layout
- Abstract cultural/editorial visual integrated into the hero
- Workstream rail should read like a public intellectual index, not a feature grid

### Bilingual System

- Visible bilinguality from the first fold
- One language leads, the other supports
- Key labels and workstream names remain bilingual
- Avoid duplicated long-form text blocks in both languages

### Elements to De-emphasize or Remove

- Over-animated brand behavior in the hero zone
- Gradient-heavy surfaces and glowing product-marketing cues
- Repeated card stacks that make the page feel like a module directory

## Component and Implementation Implications

### Existing Areas Likely Touched

- `src/components/pages/Parichay.tsx` as the primary implementation target
- shared landing/navigation pieces only if extracting them makes the page structure materially clearer

### Likely Refactor Shape

- Split hero, workstream rail, proof band, and featured output into smaller focused components.
- Keep auth-aware top navigation behavior, but restyle its visual hierarchy for the public landing context.
- Reuse existing translation helpers and auth context rather than inventing a parallel landing-page data layer.

## Content and Data Flow

- Continue using existing bilingual copy infrastructure via `useT`.
- Prefer existing public content sources already available to `/parichay` for featured output or article summaries.
- Do not introduce hard coupling to internal-only ERP data for hero credibility signals.

## Responsive Behavior

- Mobile must retain visible `Sign In`.
- First fold should adapt into a vertical editorial stack with thesis first, CTA row second, workstream rail third.
- Workstream rail must remain legible on mobile without collapsing into cramped equal-width cards.

## Error Handling / Empty States

- If featured public content is unavailable, fall back to a static editorial placeholder rather than leaving a blank gap.
- If dynamic proof metrics are unavailable, show a reduced but intentional credibility band, not broken stats.

## Testing Strategy

- Visual verification on mobile and desktop for `/parichay`.
- Check CTA visibility and routing for `Explore Work` and `Sign In`.
- Verify bilingual copy hierarchy does not duplicate the same text awkwardly across language modes.
- Ensure the landing page remains coherent for authenticated and unauthenticated users.
- Add or update Playwright coverage for public landing-page smoke behavior if the structure changes materially.

## Risks

- Over-correcting into a formal institutional brief could drain movement identity.
- Overusing bilingual duplication could make the hero heavy and unreadable.
- Reusing too many existing card motifs would weaken the new direction.

## Success Criteria

- A first-time visitor can identify the main workstreams within seconds.
- The page feels serious, public, and institutionally credible.
- Internal users can still access sign-in immediately.
- The landing page no longer reads like a product showcase or ERP gateway.
