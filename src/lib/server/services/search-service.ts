/**
 * Search Service — Cross-entity search logic.
 */
import "server-only";

import { executeSqlQuery } from "@/lib/neon/client";
import { rowMatchesScope, type ScopedAccess } from "@/lib/app/scope";

type SearchEventRow = {
  id: string;
  org_id: string;
  unit_id: string | null;
  department_id: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  status: string;
  starts_at: string;
};

type SearchArticleRow = {
  id: string;
  org_id: string;
  unit_id: string | null;
  department_id: string | null;
  author_user_id: string | null;
  created_by: string | null;
  title: string;
  content: string | null;
  status: string;
  created_at: string;
};

type SearchUserRow = {
  id: string;
  org_id: string;
  display_name: string | null;
  email: string | null;
};

export type SearchResultItem = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  date?: string;
};

/**
 * Cyclomatic: 2 | Cognitive: 3
 * Search events matching the query, filtered by scope.
 */
export async function searchEvents(
  orgId: string,
  q: string,
  scopedAccess: ScopedAccess,
  userId: string
): Promise<SearchResultItem[]> {
  const rows = await executeSqlQuery<SearchEventRow>(
    `SELECT id, org_id, unit_id, department_id, created_by, title, description, status, starts_at
     FROM public.events
     WHERE org_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
     ORDER BY starts_at DESC
     LIMIT 20`,
    [orgId, `%${q}%`]
  );

  const results: SearchResultItem[] = [];
  for (const e of rows) {
    if (!rowMatchesScope(scopedAccess, e, userId)) continue;
    results.push({
      type: "event",
      id: e.id,
      title: e.title,
      subtitle: e.description || "",
      status: e.status,
      date: e.starts_at,
    });
  }
  return results;
}

/**
 * Cyclomatic: 2 | Cognitive: 3
 * Search articles matching the query, filtered by scope.
 */
export async function searchArticles(
  orgId: string,
  q: string,
  scopedAccess: ScopedAccess,
  userId: string
): Promise<SearchResultItem[]> {
  const rows = await executeSqlQuery<SearchArticleRow>(
    `SELECT id, org_id, unit_id, department_id, author_user_id, created_by, title, content, status, created_at
     FROM public.articles
     WHERE org_id = $1 AND (title ILIKE $2 OR content ILIKE $2)
     ORDER BY created_at DESC
     LIMIT 20`,
    [orgId, `%${q}%`]
  );

  const results: SearchResultItem[] = [];
  for (const a of rows) {
    if (!rowMatchesScope(scopedAccess, a, userId)) continue;
    results.push({
      type: "article",
      id: a.id,
      title: a.title,
      subtitle: (a.content || "").substring(0, 100),
      status: a.status,
      date: a.created_at,
    });
  }
  return results;
}

/**
 * Cyclomatic: 3 | Cognitive: 4
 * Search users matching the query, respecting org-wide visibility.
 */
export async function searchUsers(
  orgId: string,
  q: string,
  scopedAccess: ScopedAccess,
  userId: string
): Promise<SearchResultItem[]> {
  const rows = await executeSqlQuery<SearchUserRow>(
    `SELECT id, org_id, display_name, email
     FROM public.profiles
     WHERE org_id = $1 AND (display_name ILIKE $2 OR email ILIKE $2)
     ORDER BY created_at DESC
     LIMIT 20`,
    [orgId, `%${q}%`]
  );

  const results: SearchResultItem[] = [];
  for (const u of rows) {
    if (!scopedAccess.orgWide && u.id !== userId) continue;
    results.push({
      type: "user",
      id: u.id,
      title: u.display_name || "Unknown",
      subtitle: u.email || "",
    });
  }
  return results;
}

/**
 * Cyclomatic: 3 | Cognitive: 4
 * Orchestrates search across entities based on the type filter.
 */
export async function performSearch(
  orgId: string,
  q: string,
  type: string | null,
  scopedAccess: ScopedAccess,
  userId: string
): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = [];

  if (!type || type === "events") {
    results.push(...(await searchEvents(orgId, q, scopedAccess, userId)));
  }
  if (!type || type === "articles") {
    results.push(...(await searchArticles(orgId, q, scopedAccess, userId)));
  }
  if (!type || type === "users") {
    results.push(...(await searchUsers(orgId, q, scopedAccess, userId)));
  }

  return results;
}
