# Demo Role Collapse Design

## Goal

Simplify the Pragya Pravah ERP demo so the UI exposes only four workflow-facing roles:

- `Vibhag Pramukh`
- `Aayam Pramukh`
- `Unit Head`
- `Karyakarta`

All higher-order backend/admin roles should collapse into these visible demo roles so dashboards, labels, flows, and notifications feel coherent to stakeholders during the demo.

## Current Problem

The current app mixes two different ideas:

1. organisational hierarchy
2. visible workflow roles

The organisation itself is modeled as:

- `Kshetra`
- `Prant`
- `Vibhag`
- `Ikai / Unit`

But the product experience is built mainly around four role-specific workflow lanes:

- `Karyakarta`
- `Unit Head`
- `Aayam Pramukh`
- `Vibhag Pramukh`

On top of that, the backend also carries canonical roles such as:

- `super_admin`
- `org_admin`
- `kshetra_reviewer`
- `prant_sanyojak`
- `prant_aayam_pramukh`

This causes a live inconsistency:

- permissions and bootstrap can correctly identify a user as `super_admin`
- but the UI collapses that user into the `vibhag_pramukh` dashboard lane
- some shell areas still display the canonical admin label

The result is a confusing demo where the same user can appear as both `Super Admin` and `Vibhag Pramukh`.

## Hierarchy Truth

### Organisational hierarchy

The app's own Dayitv content presents the territorial hierarchy as:

- `Kshetra`
- `Prant`
- `Vibhag`
- `Ikai / Unit`

This should remain the conceptual organisational structure.

### Aayam structure

The app separately models functional verticals such as:

- `Yuva`
- `Mahila`
- `Shodh`
- `Prachar`
- `Vimarsh`

These are parallel institutional lanes, not replacements for territorial structure.

### Workflow hierarchy for the demo

The visible demo flow should be:

1. `Vibhag Pramukh`
2. `Aayam Pramukh`
3. `Unit Head`
4. `Karyakarta`

This is the only role ladder that should be visible inside the product demo.

## Core Principle

`Keep canonical permissions, collapse visible identity.`

Implications:

- backend canonical roles may remain unchanged for authorization
- UI should expose only one collapsed visible role identity
- no user-facing component should show `super_admin`, `org_admin`, `prant_*`, or `kshetra_*`
- dashboard and flow selection should be driven by the collapsed demo role only

## Collapse Mapping

The collapse model should be:

- `super_admin` -> `vibhag_pramukh`
- `org_admin` -> `vibhag_pramukh`
- `kshetra_reviewer` -> `vibhag_pramukh`
- `prant_sanyojak` -> `vibhag_pramukh`
- `prant_aayam_pramukh` -> `vibhag_pramukh`
- `vibhag_pramukh` -> `vibhag_pramukh`
- `aayam_pramukh` -> `aayam_pramukh`
- `unit_head` -> `unit_head`
- `karyakarta` -> `karyakarta`

This preserves the existing review workflow structure while hiding backend complexity from the demo.

## Architectural Decision

The collapse should stay authoritative at the server-to-viewer boundary.

That means:

- canonical role detection and permission checks continue to operate on full backend role codes
- `viewer.uiRole` remains the collapsed, workflow-facing role
- client components should render labels, shell framing, notifications, and dashboard variants from the collapsed role
- canonical role labels should not be surfaced in visible UI

This avoids scattered client-side remapping and removes split-brain behavior between shell components and page components.

## Scope of Change

### In scope

- collapse all higher canonical roles into the four demo-visible roles
- remove canonical admin labels from visible UI
- make navbar, shell framing, dashboard selection, and flow-specific role labels consistent with collapsed roles
- keep article, calendar, and dashboard flows aligned to the same four-role system

### Out of scope

- no schema changes
- no auth redesign
- no permission weakening
- no RLS changes
- no new super-admin-specific dashboard
- no change to actual organisational content on the public pages

## Expected User Experience

After this change:

- `demo.admin@example.com` should behave as `Vibhag Pramukh` in all visible UI
- `org_admin` and other upper roles should also appear as `Vibhag Pramukh`
- users should never see conflicting labels such as `Super Admin` in one place and `Bhopal Vibhag Activity Console` in another
- all dashboards and review lanes should feel like part of one intentional demo hierarchy

## Files Likely Affected

- `src/lib/server/permissions.ts`
- `src/context/AppContext.tsx`
- `src/components/Navbar.tsx`
- `src/components/pages/Dashboard.tsx`
- `src/components/pages/Aalekh.tsx`
- `src/components/pages/AnnualCalendar.tsx`
- any smoke tests asserting post-login role identity

## Success Criteria

The change succeeds if:

- only four visible roles remain in the app UI
- `demo.admin@example.com` no longer shows `Super Admin` anywhere user-facing
- dashboard, navbar, notifications, and role-aware pages all agree on the same collapsed role
- permissions remain unchanged for backend role checks
- the app still supports the same operational flows after collapse
