import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "@/lib/middleware/with-auth";

import {
  createPracharCampaign,
  updatePracharCampaign,
} from "./prachar-service";
import { sql } from "@/lib/neon/repository";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/neon/repository", () => ({
  sql: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  auditAndActivity: vi.fn(),
}));

const ctx = {
  session: {
    orgId: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
    email: "aayam@example.org",
    displayName: "Aayam User",
    unitId: null,
    departmentId: null,
  },
  permissions: { canUpdatePrachar: true },
} as unknown as AuthContext;

describe("prachar campaign service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a campaign as an authorized public event", async () => {
    vi.mocked(sql)
      .mockResolvedValueOnce([
        {
          id: "00000000-0000-0000-0000-000000000003",
          title: "Campus outreach",
          status: "authorized_public",
          starts_at: new Date("2026-06-17T09:00:00.000Z"),
          created_at: new Date("2026-06-17T08:00:00.000Z"),
        },
      ])
      .mockResolvedValue([]);

    const result = await createPracharCampaign(
      {
        title: "Campus outreach",
        description: "Launch campaign",
        startsAt: "2026-06-17T09:00:00.000Z",
        templateReference: "Poster A",
      },
      ctx,
      "127.0.0.1",
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("authorized_public");
    const firstSqlCall = vi.mocked(sql).mock.calls[0]?.[0] as TemplateStringsArray;
    expect(Array.from(firstSqlCall).join("")).toContain("insert into public.events");
    expect(Array.from(firstSqlCall).join("")).toContain("'authorized_public'");
  });

  it("updates authorized public campaigns", async () => {
    vi.mocked(sql)
      .mockResolvedValueOnce([
        {
          id: "00000000-0000-0000-0000-000000000003",
          status: "authorized_public",
          title: "Campus outreach",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "00000000-0000-0000-0000-000000000003",
          title: "Updated outreach",
          status: "authorized_public",
          starts_at: new Date("2026-06-17T09:00:00.000Z"),
          updated_at: new Date("2026-06-17T10:00:00.000Z"),
        },
      ])
      .mockResolvedValue([]);

    const result = await updatePracharCampaign(
      "00000000-0000-0000-0000-000000000003",
      { title: "Updated outreach" },
      ctx,
      "127.0.0.1",
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("authorized_public");
    const updateSqlCall = vi.mocked(sql).mock.calls[1]?.[0] as TemplateStringsArray;
    expect(Array.from(updateSqlCall).join("")).toContain("status = 'authorized_public'");
  });

  it("rejects updates for non-published events", async () => {
    vi.mocked(sql).mockResolvedValueOnce([
      {
        id: "00000000-0000-0000-0000-000000000003",
        status: "draft",
        title: "Draft event",
      },
    ]);

    const result = await updatePracharCampaign(
      "00000000-0000-0000-0000-000000000003",
      { title: "Updated title" },
      ctx,
      "127.0.0.1",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(404);
  });

  it("returns not found when updating a campaign outside the published queue", async () => {
    vi.mocked(sql).mockResolvedValueOnce([]);

    const result = await updatePracharCampaign(
      "00000000-0000-0000-0000-000000000099",
      { title: "No campaign" },
      ctx,
      "127.0.0.1",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(404);
  });
});
