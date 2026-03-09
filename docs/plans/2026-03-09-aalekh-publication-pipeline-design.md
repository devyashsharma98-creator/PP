# Aalekh Publication Pipeline Design

## Goal

Redesign the Aalekh screen so it reads as a coherent institutional publication pipeline rather than a collection of forms, queues, and leftover article cards. The screen should simultaneously communicate three things:

- writing and editorial intent
- active review and approval movement
- published institutional output

## Current Problem

The existing Aalekh page contains the right functional steps, but they are not presented in a strong order.

What is working today:
- `Karyakarta` can draft and submit articles
- `Unit Head` can review, edit, return, and forward
- `Aayam Pramukh` can review and publish
- published material is visible inside the same page
- the values checklist already reflects an institutional writing discipline

What is weak today:
- the top of the page does not establish Aalekh as an editorial or publication desk
- writing, review, and published output compete visually instead of forming one pipeline
- role-specific lanes exist, but the first impression is still closer to a generic admin workflow than an institutional writing system
- article cards carry the right data, but their hierarchy and tone do not yet feel like editorial dossiers
- the publication-values block feels operational rather than doctrinal

## Product Framing

Aalekh should feel like:

`an institutional publication pipeline where ideas are written, reviewed, refined, and released as serious organisational output`

This keeps it aligned with Pragya Pravah's intellectual and civilisational identity while preserving the operator clarity already built into the app.

## Information Architecture

### 1. Aalekh Masthead

The page should open with a role-aware, bilingual masthead that establishes:
- what this desk is
- where the current user sits in the publication workflow
- what the present lane is responsible for

Examples of role framing:
- `Karyakarta`: writing and submitting institutional drafts
- `Unit Head`: first editorial review and routing
- `Aayam Pramukh`: final thematic approval and publication

This masthead should play the same role on Aalekh that the new masthead plays on Dashboard, but with a more editorial tone.

### 2. Active Lane First

The first actionable section should answer:
- what is waiting on me
- what needs revision
- what is ready to move forward

This is the operational center of the page. It should lead before secondary metrics or archives.

### 3. Writing / Review Workspace

After the active lane, the page should expose the user's main working surface.

For each role:
- `Karyakarta`: draft creation and returned-draft revision
- `Unit Head`: review queue, return-with-notes, forward-to-aayam
- `Aayam Pramukh`: final queue, publish, or return for revision

The workspace should feel intentional and clearly tied to the editorial process.

### 4. Published Record

Published Aalekh should be presented as institutional output, not just completed rows. This section should feel more archival and curated.

### 5. Editorial Values / Standards

The values checklist already points in the right direction. It should remain behaviorally the same but be reframed visually and linguistically as editorial discipline or institutional maryada.

## Visual Direction

Aalekh should feel more editorial than Dashboard while staying in the same design family.

### Visual tone
- manuscript desk rather than generic admin board
- quieter and more publication-focused than Dashboard
- still operationally clear
- bilingual in a deliberate institutional way

### Section feel
- masthead: editorial bureau
- active lane: today's review and publication movement
- article cards: dossier-style sheets with clearer hierarchy
- published section: institutional archive
- values section: calm, disciplined, doctrinal

## Role Behavior

Aalekh should mainly behave as a three-lane publication workflow inside the wider four-role demo hierarchy.

### Karyakarta
- sees personal drafts and returned items
- can write a new Aalekh
- primary action: `Submit for Review`
- role feeling: writer-contributor

### Unit Head
- sees first-review queue
- can return with notes or forward onward
- role feeling: editorial gatekeeper

### Aayam Pramukh
- sees final approval queue and published record
- can publish or send back for revision
- role feeling: institutional curator

### Vibhag Pramukh
Aalekh should not become a separate Vibhag-centric workflow. The page can stay visually consistent with the four-role system without inventing a new editorial lane where the product does not need one.

## Scope

### In scope
- add a real Aalekh masthead
- move the active lane to the top
- improve article-card hierarchy and review-note treatment
- strengthen the published archive section
- reframe the values checklist visually and linguistically
- keep the existing role workflow intact

### Out of scope
- no auth or permission redesign
- no schema changes
- no new editorial workflow steps
- no redesign of Prachar or Calendar in the same change set
- no broad refactor of shared app state

## Expected User Experience

After the redesign:
- Aalekh will immediately read as the institution's writing and review desk
- each role will understand its current lane without reading the whole page
- writing, review, and publication will appear as one continuous pipeline
- published material will feel like serious output rather than leftover list items
- the page will visually match the new homepage and dashboard philosophy

## Files Likely Affected

- `src/components/pages/Aalekh.tsx`
- `src/app/globals.css`
- `e2e/demo-smoke.spec.ts`

## Success Criteria

The redesign succeeds if:
- Aalekh has a strong bilingual masthead and top-level editorial framing
- the active review lane is visible before secondary content
- article cards feel clearer and more editorial
- the published section feels institutional and archival
- the values checklist still behaves the same but feels more meaningful
- all three active roles still complete their existing workflow without regression
