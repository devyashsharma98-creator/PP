/**
 * High-level map of ERP surfaces to data paths. TanStack `/api/v1` mutations call
 * `refreshWorkspace()` so bootstrap-backed UI stays aligned.
 */
export const WORKSPACE_MODULE_SOURCES = [
  { route: "/dashboard", reads: ["TanStack:dashboard-events", "AppContext:bootstrap"], writes: ["/api/v1/events", "/api/app/actions"] },
  { route: "/aalekh", reads: ["AppContext:bootstrap.articles"], writes: ["/api/app/actions"] },
  { route: "/prachar", reads: ["AppContext:bootstrap.events+pracharStatuses"], writes: ["/api/app/actions"] },
  { route: "/calendar", reads: ["AppContext + local"], writes: ["/api/app/actions"] },
  { route: "/directory", reads: ["demo/static"], writes: [] },
  { route: "/users", reads: ["TanStack:users"], writes: ["/api/v1/users", "refreshWorkspace"] },
  { route: "/vimarsh", reads: ["AppContext:bootstrap"], writes: ["/api/app/actions"] },
  { route: "/feed", reads: ["AppContext:bootstrap"], writes: [] },
] as const;

/** UX / a11y conventions to keep visuals + logic aligned (institutional tone per CLAUDE.md). */
export const UX_CONVENTIONS = [
  "Prefer Masthead + context cards for role clarity; avoid generic SaaS copy.",
  "Empty states: explain next step + one primary CTA (e.g. Unit dashboard empty lane).",
  "Keyboard: visible focus ring (globals `focus-visible`); respect `prefers-reduced-motion` for scroll.",
  "Hindi: `useT` / `displayBilingualHi` for UI copy; repair for legacy DB strings.",
  "Performance: `optimizePackageImports` for lucide; `content-visibility` on dense event cards.",
] as const;
