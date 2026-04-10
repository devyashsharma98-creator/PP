import type { ApiSuccessResponse } from "../response";
import type { AppOverviewPayload } from "../app/contracts";

export async function fetchOverview() {
  const res = await fetch("/api/app/overview", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = (await res.json()) as ApiSuccessResponse<AppOverviewPayload> | { error?: { message?: string } };

  if (!res.ok || !("success" in data) || !data.success) {
    throw new Error(("error" in data && data.error?.message) || "Failed to load ERP overview");
  }

  return data.data;
}
