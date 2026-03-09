# Prachar Campaign Control Room Design

## Goal
Redesign the Prachar page so it feels like a campaign control room: an institutional outreach desk that combines dissemination accountability, public-reach momentum, and creative-studio support.

## Product Truth
The current Prachar screen already operates on published events, 4 platform completion tracking, skip reasons, and template references. The redesign should preserve this behavior and permissions model while improving the visual hierarchy and narrative flow.

## Direction
Recommended direction: command center first, studio second, energy throughout.

Prachar should present:
- a role-aware masthead
- a live distribution command center
- event-wise dissemination queue cards
- a creative-studio band for templates and publicity formats
- clear closure signals for pending vs completed outreach

## Information Architecture
1. Prachar masthead
2. Live distribution command center
3. Event dissemination queue
4. Campaign creative studio
5. Reach discipline / closure cues

Core page principle:
`publish -> distribute -> confirm reach`

## Visual Language
Prachar should feel more kinetic than Aalekh and more campaign-oriented than Dashboard while staying inside the same institutional visual system.

Use:
- sharper section rhythm
- stronger progress and pending states
- campaign-dossier cards for each event
- more active motion and hierarchy
- a curated studio presentation for templates

Avoid:
- flat checkbox-grid feeling
- random carousel energy without purpose
- generic SaaS status-board styling

## Role Behavior
- Vibhag Pramukh: overall dissemination readiness and closure visibility
- Aayam Pramukh: actionable campaign ownership for approved work
- Unit Head / Karyakarta: understandable view, but no fake control where permissions do not allow it

Core behavior principle:
`show campaign state broadly, preserve action rights accurately`

## Implementation Scope
1. Add Prachar masthead
2. Restructure command-center summary area
3. Upgrade dissemination queue cards
4. Refine creative studio presentation
5. Add smoke assertions for Prachar role framing and studio sections

## Constraints
- no schema changes
- no auth redesign
- no permission broadening
- no unrelated module work
- keep the existing event/platform update behavior intact
