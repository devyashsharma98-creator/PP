const CORE_WORKFLOW_ROUTES = [
  "/dashboard",
  "/calendar",
  "/aalekh",
  "/prachar",
  "/task-board",
  "/notifications",
  "/feed",
] as const;

function isCurrentRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function getWorkflowPrefetchRoutes(pathname: string, isAuthenticated: boolean) {
  if (!isAuthenticated) return [];
  return CORE_WORKFLOW_ROUTES.filter((route) => !isCurrentRoute(pathname, route));
}
