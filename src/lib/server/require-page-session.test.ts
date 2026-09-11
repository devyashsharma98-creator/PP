import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const getSession = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/session", () => ({ getSession }));

const { requirePageSession } = await import("./require-page-session");

async function captureRedirect(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("REDIRECT:")) return message.slice("REDIRECT:".length);
    throw error;
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(null);
});

describe("signed-out deep links", () => {
  it("sends a bare path through unchanged", async () => {
    const url = await captureRedirect(() => requirePageSession("/task-board"));
    expect(url).toBe("/login?returnTo=%2Ftask-board");
  });

  it("carries a reminder's exact record through sign-in", async () => {
    const url = await captureRedirect(() =>
      requirePageSession("/task-board", { search: { projectId: "p1", taskId: "t9" } }),
    );
    expect(decodeURIComponent(url)).toBe("/login?returnTo=/task-board?projectId=p1&taskId=t9");
  });

  it("accepts a raw query string", async () => {
    const url = await captureRedirect(() =>
      requirePageSession("/task-board", { search: "?projectId=p1&view=mine" }),
    );
    expect(decodeURIComponent(url)).toContain("/task-board?projectId=p1&view=mine");
  });

  it("accepts URLSearchParams", async () => {
    const url = await captureRedirect(() =>
      requirePageSession("/task-board", { search: new URLSearchParams("taskId=t9") }),
    );
    expect(decodeURIComponent(url)).toContain("/task-board?taskId=t9");
  });

  it("omits an empty query string rather than leaving a bare '?'", async () => {
    const url = await captureRedirect(() => requirePageSession("/task-board", { search: {} }));
    expect(url).toBe("/login?returnTo=%2Ftask-board");
  });

  it("keeps the returnTo encoded as a single parameter", async () => {
    const url = await captureRedirect(() =>
      requirePageSession("/task-board", { search: { projectId: "p1", taskId: "t9" } }),
    );
    // The nested query must be encoded, not leak into /login's own params.
    const params = new URL(url, "http://x").searchParams;
    expect(params.get("returnTo")).toBe("/task-board?projectId=p1&taskId=t9");
    expect(params.get("projectId")).toBeNull();
  });
});

describe("route rules with a query string present", () => {
  it("matches on the path alone, so a deep link is not mistaken for a foreign route", async () => {
    getSession.mockResolvedValue({
      effectiveRoleCodes: ["karyakarta"],
      primaryRoleCode: "karyakarta",
    });

    // /task-board carries no role restriction, so this must return the session
    // rather than redirect — even though returnTo now contains "?".
    const session = await requirePageSession("/task-board", {
      search: { projectId: "p1", taskId: "t9" },
    });

    expect(session).toMatchObject({ primaryRoleCode: "karyakarta" });
    expect(redirect).not.toHaveBeenCalled();
  });
});
