const API_BASE = "/api/v1";

export interface AssigneeOption {
  id: string;
  displayName: string | null;
  displayNameHi: string | null;
  responsibility: string | null;
}

/**
 * Distinguishes the reasons an assignee list can come back empty, so the UI can
 * say "you may not do this", "the request failed" and "nobody matched" rather
 * than showing one indistinguishable blank box.
 */
export class AssigneeFetchError extends Error {
  constructor(
    message: string,
    readonly kind: "forbidden" | "network" | "server",
    readonly status?: number,
  ) {
    super(message);
    this.name = "AssigneeFetchError";
  }
}

export async function fetchAssignees(params: { search?: string; limit?: number } = {}): Promise<AssigneeOption[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/assignees${query ? `?${query}` : ""}`, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (cause) {
    throw new AssigneeFetchError(
      "Could not reach the server.",
      "network",
    );
  }

  if (res.status === 403) {
    throw new AssigneeFetchError(
      "You do not have permission to assign work.",
      "forbidden",
      403,
    );
  }

  if (!res.ok) {
    throw new AssigneeFetchError("The member list could not be loaded.", "server", res.status);
  }

  const body = await res.json().catch(() => null);
  if (!body?.success) {
    throw new AssigneeFetchError(
      body?.error?.message ?? "The member list could not be loaded.",
      "server",
      res.status,
    );
  }

  return body.data as AssigneeOption[];
}
