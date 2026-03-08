# Demo Visual System Design

## Goal

Upgrade the demo-facing experience so Pragya Pravah reads as a contemporary Bharatiya intellectual institution rather than a generic admin product. The design must balance institutional gravitas and operational clarity in roughly equal measure for a mixed audience of senior stakeholders and daily operators.

## Organisational Context

Pragya Pravah should be framed as an intellectual-civilisational institution. Public material consistently emphasizes:

- Bharatiya knowledge systems and civilisational continuity
- discourse, review, and intellectual formation rather than startup-style productivity
- institutional seriousness over spectacle
- contemporary relevance rather than nostalgia-only heritage treatment

Reference material used for this framing:

- Lokmanthan 2024 coverage: [lokmanthan.org](https://lokmanthan.org/news/lokmanthan-bhagyanagar-2024-president-murmu-will-inaugurate-the-four-day-cultural-maha-kumbh-starting-from-november-21/)
- Youth and Dharma 2025 coverage: [organiser.org](https://organiser.org/2025/01/25/275103/bharat/youth-embrace-dharma-and-indic-modernism-at-barkatullah-universitys-youth-and-dharma-2025-event/)
- Public seminar listing: [cfplist.com](https://www.cfplist.com/CFP/43009)

Inference from those sources:

- the app should feel scholarly, rooted, and nationally self-aware
- it should avoid devotional-app tropes and generic SaaS polish
- visual identity should come from proportion, typography, motif, and language discipline

## Audience

- Primary demo audience: mixed
- Emotional split: 50% institutional gravitas, 50% operational clarity

This means the first impression must establish identity quickly, while the first interactive screens must still feel fast, legible, and trustworthy for day-to-day use.

## Core Principle

`civilisational in tone, operational in structure`

Identity should be strongest in:

- the public entry experience
- login
- section framing
- navigation chrome
- headings, labels, and empty states

Operational clarity should dominate:

- dashboard composition
- cards and data panels
- workflow states
- tables, queues, and actions

## Visual Architecture

### 1. Public Gateway Layer

Applies to `/` and major public-facing presentation surfaces.

- richer atmosphere
- stronger symbolism
- slower motion
- manuscript / discourse / institutional cues

This layer earns attention and creates the philosophical frame for the product.

### 2. Operational Layer

Applies to `/dashboard` and the internal shell after login.

- cleaner grids
- calmer spacing
- restrained ornament
- strong hierarchy for data and actions

This layer should feel like a disciplined institutional console, not a decorative microsite.

### 3. Bridge Layer

Applies to `/login`, navbar, shared shell framing, role badges, section headers, and empty states.

- uses the same DNA as the public layer
- remains operationally compact enough for internal work
- prevents the product from feeling like two disconnected systems

## Language System

The app should preserve institution-specific terms where they carry real meaning:

- Aayam
- Vimarsh
- Dayitva
- Karyakarta
- Vibhag
- Pragya

English labels should sound editorial and institutional rather than startup-generic. Good tone:

- Review Queue
- Unit Activity
- Published Note
- Aayam Scope
- Institutional Overview

Avoid tone like:

- growth dashboard
- quick wins
- team performance
- productivity shortcuts

Hindi should feel formal and readable. It should avoid both stiff bureaucratic phrasing and overly casual copy.

## Data Presentation Model

Each important screen should follow this reading order:

`identity cue -> context cue -> primary action -> evidence/data -> deeper detail`

Implications:

- the screen top should orient the user within the institution
- the next line should explain what they are seeing in organisational terms
- primary actions should be obvious without dominating the screen
- cards and records should read like serious internal artefacts, not novelty widgets

## Visual System

### Colour

- Base neutrals: parchment, stone, warm white, deep ink, navy-charcoal
- Primary action colour: saffron
- Secondary accent colours: copper, maroon, peacock blue, leaf green
- Accent colours should map to modules or states, not appear indiscriminately

### Typography

- English typography should feel editorial and institution-led
- Devanagari should feel dignified and legible in both headings and control labels
- Headings should read like declarations or sutras
- Body text should stay clean and pragmatic

### Motifs

Allowed:

- geometric seals
- sutra dividers
- lattice backgrounds
- mandala-derived framing
- archival/editorial panel treatment

Avoid:

- heavy temple literalism
- deity iconography
- poster-like oversaturation
- ornamental clutter in operational screens

### Motion

- Public screens: slower reveal, atmospheric transitions, symbolic movement
- Internal screens: faster, tighter transitions for orientation and hierarchy
- Motion should guide reading order, not compete with content

## Approved Implementation Scope

Phase 1 should cover:

- `src/app/login/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/Navbar.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/components/pages/Dashboard.tsx`

This phase intentionally avoids a full multi-page redesign. The goal is to improve the demo through the highest-leverage surfaces:

- login as the identity bridge
- shared shell as the consistent institutional frame
- dashboard as the proof screen for the demo

## Non-Goals

- no auth redesign
- no app architecture rewrite
- no schema or API changes
- no full-page restyling of every feature module in the first pass
- no decorative overload that slows primary workflows

## Success Criteria

- the product feels like one coherent institution across public and internal surfaces
- the login screen no longer feels like a generic form dropped into a branded app
- the dashboard reads as a serious organisational console within 5-10 seconds
- stakeholders perceive cultural specificity without loss of usability
- operators can still scan status, queues, and actions quickly on desktop and mobile

## Phase 2 Candidates

If Phase 1 lands well, the same system can extend to:

- `src/components/pages/Aalekh.tsx`
- `src/components/pages/Prachar.tsx`
- `src/components/pages/Vimarsh.tsx`
- page-level empty states and detail sheets

