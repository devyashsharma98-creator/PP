# Pragya Pravah Mobile-First Full-App Redesign

Date: 2026-06-18
Status: Approved design

## Objective

Redesign the complete Pragya Pravah application as a mobile-first institutional command centre. The interface must make operational work fast while retaining a restrained cultural and editorial identity. Shared components and tokens will improve mobile and desktop together rather than creating a separate mobile product.

## Audit Baseline

The production application was inspected at 360x800, 390x844, and 430x932 across Dashboard, Aalekh, Prachar, Calendar, Directory, Dayitv, Library, Vimarsh, Super Admin, Users, and Feed.

- The mobile header and bottom navigation consume 193px of an 800px viewport.
- Dashboard exposes 42 undersized tap targets at 390px and 53 at 430px after all modules load.
- Prachar renders 52 elements outside the visible mobile working area.
- Super Admin tables, tabs, long emails, and capability details overflow narrow screens.
- The frontend contains 294 occurrences of decorative rounded, gradient, blur, and related patterns.
- It contains 531 compact text or control patterns based on 9-12px text and 28-36px controls.
- Masthead hierarchy varies between 24px and 30px page headings.
- The navbar fetches dashboard event and article data on every authenticated route.
- Forty-three components import Framer Motion and 102 patterns use blur, backdrop, gradient, or custom shadow effects.

## Product Priorities

1. Fast operational work on mobile.
2. Clear information hierarchy and predictable actions.
3. Restrained cultural and editorial character.
4. Consistent behavior across roles and modules.
5. Strong accessibility and low-end mobile performance.

## Visual Direction

The application will use a light-first, neutral institutional palette with charcoal text and restrained vermilion accents. Dark mode remains supported but will use neutral near-black surfaces rather than orange-heavy contrast.

Cultural identity will come from typography, terminology, bilingual support, and a small number of deliberate motifs. Gradients, glow objects, decorative blur, glass effects, and repeated orange outlines will be removed from operational interfaces.

Cards will represent actual records or bounded tools. Page sections, mastheads, KPI groups, and explanatory content will use unframed layouts, rules, spacing, and typography instead of nested cards.

## Typography

The application will use Khand for page and section headings and Hind for body text, controls, and data. Both families support Latin and Devanagari, giving headings a strong institutional voice while keeping operational content highly readable.

The operational type system will use five levels:

- Page title: 28px mobile, 32px desktop.
- Section title: 20px mobile, 22px desktop.
- Record title: 16px with 600 weight.
- Body and control text: 14-16px.
- Metadata: 12px minimum, used sparingly.

Letter spacing will be zero except for short institutional labels. Long uppercase copy and 9-10px labels are prohibited. Only the selected interface language is shown as primary content; translation is not duplicated beneath every title.

## Color And Geometry

- Neutral surfaces hold approximately 90 percent of visual weight.
- Vermilion is limited to primary actions, active navigation, focus, and important state emphasis.
- Success, warning, danger, and information use distinct semantic colors.
- Component radii use 4px, 8px, or 12px. Bottom sheets use 16px top corners.
- Elevation uses borders and one restrained shadow tier.
- All color tokens will use OKLCH values.

## Application Shell

### Mobile Header

The authenticated mobile header is a single 56px row containing:

- Navigation menu.
- Current page title.
- Search.
- Notifications.
- Profile control.

Language, theme, role details, and sign-out move into the profile or navigation sheet. The header hides after sustained downward content scrolling and immediately returns on upward scrolling or focus movement into the header.

### Bottom Navigation

The bottom navigation is a 64px safe-area-aware bar with Dashboard, Aalekh, Prachar, Calendar, and More. It sits flush to the viewport edge, does not float over content, and does not use decorative shadows or active-item cards.

The More sheet groups destinations under Coordination, Reference, and Administration. Each row uses a minimum 44px target and a concise label. Descriptive subtitles appear only where they disambiguate similar destinations.

### Desktop Shell

Desktop retains the sidebar but adopts the same tokens, typography, active states, and information architecture. Desktop remains denser than mobile and does not inherit unnecessary mobile spacing.

## Page Structure

Every operational page follows this order:

1. Compact title, current context, and one primary action.
2. Optional status strip with the minimum useful metrics.
3. Filter or view toolbar.
4. Primary records or working surface.
5. Secondary information behind tabs, disclosure controls, or a details view.

Repeated explanatory marketing copy will be removed from authenticated operational pages.

## Shared Components

The redesign will establish shared components for:

- App header, sidebar, bottom navigation, and navigation sheet.
- Page header and status strip.
- Button, icon button, segmented control, tabs, filter bar, and action menu.
- Record row, record card, mobile data list, desktop data table, and pagination.
- Status badge and metadata line.
- Text, select, date, checkbox, file, and search fields.
- Empty, loading, error, and permission-denied states.
- Bottom sheet, confirmation dialog, and details panel.
- Toast and inline validation feedback.

Primary commands remain visible. Secondary record commands move into a consistent overflow menu. Icon-only controls require accessible names and tooltips on pointer devices.

## Module Treatment

### Dashboard

Dashboard becomes a task-oriented overview. Event workflow is primary. Task Board, notifications, circulars, volunteers, media, conferences, and surveys use tabs or collapsible module sections and load on demand. The page must not mount every module on first render.

### Aalekh

Queues, drafts, reviews, and published records share one record-row system. Review actions are explicit and status-driven. Gallery view remains optional and secondary.

### Prachar

Campaign closure is the primary lane. Platform completion uses compact progress rows. Creative templates become a horizontally scrollable, clearly signposted secondary section with snap behavior and visible controls; templates are never clipped without a navigation affordance.

### Calendar

Month and agenda views use a stable segmented control. The agenda list becomes the default on narrow screens when event density makes the calendar grid difficult to scan.

### Administration

Users, audit logs, settings, capability matrices, and role assignments use responsive record rows on mobile and dense tables on desktop. Long identifiers wrap or truncate with an explicit reveal action. Tables never depend on hidden horizontal overflow for core information.

### Reference And Public Pages

Library, Vimarsh, Feed, History, Guide, Login, and Parichay retain a richer editorial character but inherit the shared typography, color, control, and accessibility tokens. Public pages use more expressive composition without leaking that decoration into operational screens.

## Interaction And Motion

- All interactive targets are at least 44x44px on mobile.
- Focus indicators remain visible in both themes.
- Motion communicates navigation and state changes only.
- Motion uses transform and opacity, never layout dimensions.
- Reduced-motion settings disable nonessential transitions.
- Optimistic updates are used where rollback is safe.
- Destructive and externally visible actions require clear confirmation.

## Performance

- Remove dashboard event and article queries from the global navbar.
- Enable route prefetching for primary authenticated workflows.
- Lazy-load secondary dashboard modules and heavy dialogs.
- Reduce Framer Motion usage to shared transition primitives.
- Remove decorative blur and backdrop filters from fixed mobile chrome.
- Avoid rendering hidden desktop and mobile data presentations simultaneously.
- Keep loading states dimensionally stable to prevent layout shift.

## Accessibility

- Meet WCAG 2.2 AA contrast and interaction requirements.
- Maintain semantic headings and landmark navigation.
- Support keyboard navigation, screen readers, zoom to 200 percent, and reduced motion.
- Do not communicate status through color alone.
- Preserve Latin and Devanagari readability at all supported sizes.
- Forms associate labels, help text, and errors programmatically.

## Responsive Acceptance Criteria

The following must pass at 360x800, 390x844, 430x932, 768x1024, 1280x800, and 1440x900:

- No unintended horizontal page overflow.
- No text or control overlap.
- No content hidden behind fixed navigation.
- All primary mobile targets are at least 44x44px.
- Long names, emails, titles, and translated strings remain usable.
- One clear page title and one clear primary action appear above the fold.
- Mobile tables render as readable record rows.
- Primary workflows remain available without opening the desktop sidebar.

## Verification

- Component tests for navigation, page headers, record rows, responsive tables, action menus, and language behavior.
- Automated viewport tests for overflow, overlap, target sizes, and fixed-navigation clearance.
- Browser workflow tests for authentication, event workflow, Aalekh review, Prachar closure, calendar navigation, user administration, and More navigation.
- Production build, typecheck, lint, and full test suite.
- Post-deploy browser checks for console errors, failed API responses, and visual regressions in light and dark modes.

## Rollout Order

1. Tokens, fonts, global styles, and shared controls.
2. Authenticated shell and navigation.
3. Page header, status strip, records, tables, forms, dialogs, and empty states.
4. Dashboard and its lazy-loaded modules.
5. Aalekh, Prachar, and Calendar.
6. Directory, Dayitv, Super Admin, and Users.
7. Reference and public pages.
8. Full responsive, accessibility, performance, and production verification.

## Non-Goals

- No workflow or permission model changes.
- No database schema changes unless required by an independently confirmed defect.
- No removal of existing modules.
- No separate mobile codebase.
- No decorative redesign that reduces operational density or clarity.
