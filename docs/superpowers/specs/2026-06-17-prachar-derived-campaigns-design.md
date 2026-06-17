# Prachar Derived Campaigns Design

## Goal

Add campaign CRUD to Prachar without introducing a new campaign table. A Prachar campaign remains a published event presented through the outreach workflow, with platform progress stored in `prachar_statuses`.

## Decisions

- Campaign records are derived from `events`.
- Creating a campaign from Prachar creates a new event directly in published status.
- Editing a campaign updates the underlying event fields and Prachar template reference.
- Platform completion and skip tracking continues to use `prachar_statuses`.
- No database migration is required.

## Product Behavior

Prachar keeps its existing command-center page, summary cards, campaign dossier cards, and creative studio. The new behavior adds direct campaign management for the outreach desk.

Users with the required authority see a `Create Campaign` action in the Prachar masthead or command-center area. The create dialog captures title, description, campaign date, unit, department or aayam, and optional template reference. Submitting the dialog creates a new published event and seeds platform status rows when a template reference is provided.

Each campaign dossier card gets an `Edit Campaign` action for authorized users. The edit dialog allows changes to title, description, date, unit, department or aayam, and template reference. The existing channel checklist remains inline on the card so WhatsApp, Facebook, Instagram, and Telegram completion can still be managed without opening the edit dialog.

Read-only users continue to see campaign status and creative guidance, but no create or edit controls.

## Architecture

The implementation follows the existing project pattern:

`validation schema -> server service -> API route -> TanStack Query hook -> client component`

The server service owns campaign creation and updates so the UI does not need to understand event status internals. The service writes to `events`, writes audit/activity entries, and manages template reference rows in `prachar_statuses` when needed.

The client hook extends `src/hooks/api/use-prachar.ts` with create and edit mutations. On success, it invalidates dashboard events and Prachar statuses so the new or edited campaign appears in the queue immediately.

The Prachar page stays event-derived by continuing to compute campaign cards from published events returned by `useDashboardEvents()`.

## Data Model

No new table is added.

The underlying campaign fields map to existing event columns:

- Campaign title -> `events.title`
- Campaign description -> `events.description`
- Campaign date -> `events.starts_at`
- Unit -> `events.unit_id`
- Department or aayam -> `events.department_id`
- Campaign visibility -> `events.status = 'published'`

Template reference remains on `prachar_statuses.template_ref`. Because `prachar_statuses` is platform-scoped, template reference is written consistently across the four platform rows for the campaign event. If no row exists yet, the service creates rows with `is_done = false` and the provided template reference.

## API Surface

Add a Prachar-focused campaign route:

- `POST /api/v1/prachar/campaigns`
- `PATCH /api/v1/prachar/campaigns/[eventId]`

The POST route creates a new published event. The PATCH route only updates published events, preventing Prachar from accidentally editing draft or review-lane events that do not belong in the campaign queue.

Both routes require authenticated access and `canUpdatePrachar`. This keeps campaign management owned by the Prachar desk and avoids widening read-only event roles. Super admin access continues to work through the existing inherited permission model.

## Validation

Create campaign input:

- `title`: required, 1-200 characters
- `description`: optional
- `starts_at`: required ISO datetime
- `unit_id`: optional UUID
- `department_id`: optional UUID
- `template_reference`: optional, max 256 characters

Update campaign input:

- Same fields as create, but all optional
- Empty patch payload is rejected
- `eventId` must refer to a published event in the user's organization

## UI Design

The create and edit controls should feel like part of the current Prachar control room, not a generic event admin form.

Use shadcn `Dialog`, existing `Button`, `Input`, `Label`, and any existing select primitives already used in the repo. The dialog copy should follow the bilingual `t("English", "Hindi")` pattern through `useT()`.

The create dialog title should be outreach-specific: `Create Campaign` with the matching Hindi copy supplied through `useT()`. The form should use compact operational labels and avoid exposing internal event status language.

The edit action should sit inside each campaign dossier card near the existing status/action area. It should not disturb the platform checklist layout.

## Error Handling

Client dialogs show inline errors from failed mutations and keep entered form values intact. Submit buttons show pending state and prevent duplicate submission.

Server routes return:

- `400` for invalid input
- `403` for insufficient permissions
- `404` when editing a non-existent or non-published event
- `500` for unexpected persistence failures

Service errors should not leak database details to the client.

## Testing

Use TDD for implementation.

Focused test coverage should include:

- Validation rejects missing title and invalid datetime for create.
- Service creates an event with published status.
- Service updates only published events.
- Service writes or updates template reference rows in `prachar_statuses`.
- API route enforces write permission.
- Prachar UI exposes create and edit controls for authorized users.
- New campaign appears in the queue after creation.

Full verification before completion:

- `npm run typecheck`
- `npm run build`
- Focused Prachar tests or smoke coverage

## Out Of Scope

- New `prachar_campaigns` table
- New workflow status model
- Public posting integrations
- File uploads or generated media assets
- Replacing the existing platform checklist
- Changing the event review workflow outside Prachar direct campaign creation
