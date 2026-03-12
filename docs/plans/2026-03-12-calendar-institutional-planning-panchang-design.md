# Calendar Institutional Planning Panchang Design

## Summary

Redesign the internal calendar into an institutional planning surface that balances organisational rhythm and operational planning 50/50. The new calendar should feel equally relevant to all internal roles while keeping Bharat-rooted cues subtle and disciplined.

## Problem

The current calendar already contains useful data, but it still reads more like a functional demo widget than a deliberate institutional planning surface. The month grid, KPI cards, and side content do not yet share the same level of narrative clarity and visual intent that now exists in the homepage, dashboard, aalekh, and prachar flows.

## Goals

- Make Calendar feel like the organisation's rhythm and planning desk.
- Preserve one shared interface for all internal roles.
- Balance institutional gravitas with immediate operational usefulness.
- Keep Bharat-rooted framing subtle rather than ornamental.
- Improve hierarchy for the month grid, agenda, reminders, and selected-day details.

## Non-Goals

- No data-model or permissions redesign.
- No new backend workflow concepts.
- No heavy panchang imitation or explicit spiritual visual language.
- No separate UI products per role.

## Users

### Shared audience

- `Karyakarta`
- `Unit Head`
- `Aayam Pramukh`
- `Vibhag Pramukh`

All internal roles should feel the screen belongs to them, with emphasis changing through context rather than through separate layouts.

## Design Direction

### Recommended direction

`Institutional planning panchang`

This combines:

- hybrid split view
- month grid as the primary anchor
- side panel for agenda, reminders, selected-day detail, and role context
- subtle Bharat-rooted cues through naming, typography rhythm, section framing, and warm surfaces

### Rejected directions

- `Editorial calendar board`
  - too passive for operational follow-through
- `Operations schedule desk`
  - too close to generic planning/admin UI

## Information Architecture

### 1. Calendar masthead

Add a bilingual, role-aware masthead that frames Calendar as the place where institutional rhythm, upcoming work, and pending coordination meet.

Suggested framing:

- English: `Institutional Calendar Desk`
- Hindi: `संस्थागत पंचांग कक्ष`

The masthead should mirror the existing internal design language used in dashboard, aalekh, and prachar.

### 2. Summary band

Place a role-aware summary band directly under the masthead.

Typical summaries:

- this month
- upcoming events
- pending approvals/reviews
- recurring institutional programmes

The layout should remain fixed across roles, with only values and emphasis shifting.

### 3. Hybrid main body

Use a hybrid split:

- left: month grid
- right: agenda + reminders + selected-day details

This allows users to understand both temporal rhythm and immediate operational obligations.

### 4. Selected-day / event panel

The right-side panel should combine:

- selected-day event details
- role-aware action context
- institutional reminders
- near-term agenda

When no selected day has significant detail, the panel should lean into agenda and reminder surfaces instead of feeling empty.

### 5. Institutional agenda strip

Add a small agenda layer that communicates organisational cadence rather than only isolated event records.

This should read like a planning ledger, not a feed.

## Visual Language

### Tone

Calendar should feel:

- measured
- ordered
- institutional
- lightly ceremonial

It should be calmer than Prachar and less editorial than Aalekh.

### Cultural grounding

Bharatiya cues should remain subtle:

- section seals
- warm parchment/stone surfaces
- disciplined bilingual headings
- careful divider rhythm

Avoid:

- overt spiritual styling
- strong panchang imitation
- decorative overload

### Grid and panel treatment

Month cells need clearer hierarchy:

- date numeral
- today marker
- selected state
- event presence
- recurring signal
- pending-state signal

The side panel should feel like a composed planning ledger rather than a loose stack of cards.

## Role Behavior

### Karyakarta

- prioritise awareness and participation
- emphasise published rhythm, recurring programmes, and upcoming schedule

### Unit Head

- emphasise readiness, local coordination, and pending preparation

### Aayam Pramukh

- emphasise thematic cadence and pending review items

### Vibhag Pramukh

- emphasise organisational sequencing and final approval rhythm

### Shared rule

One interface architecture for everyone; only contextual emphasis changes.

## Component Changes

### Update existing screen

Modify `src/components/pages/AnnualCalendar.tsx` to:

- add a proper masthead
- strengthen the summary band
- improve the hybrid split layout
- refine day-cell hierarchy
- restructure the side panel into a combined agenda/reminder/detail surface

### Shared style tokens

Extend `src/app/globals.css` with calendar-specific tokens matching the internal design system:

- masthead
- summary cards
- month cell treatments
- agenda panel
- reminder surfaces

### Smoke coverage

Extend `e2e/demo-smoke.spec.ts` with assertions for:

- calendar masthead language
- hybrid planning layout
- agenda/reminder framing

## Responsive Behavior

- Desktop: clear two-column hybrid split
- Tablet: reduced but still recognisable split
- Mobile: stacked layout with month grid first and planning panel second

The mobile version must still feel deliberate, not collapsed as an afterthought.

## Success Criteria

- Calendar feels coherent with the new institutional design system
- all internal roles can orient quickly
- month rhythm and operational action are both obvious
- subtle cultural grounding is visible without overpowering usability
- smoke tests capture the new top-level planning language
