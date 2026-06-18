// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuditLogPanel } from "./AuditLogPanel";

const { useAuditLogsMock } = vi.hoisted(() => ({
  useAuditLogsMock: vi.fn(),
}));

vi.mock("@/hooks/api/use-audit-logs", () => ({
  useAuditLogs: useAuditLogsMock,
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({ lang: "en" }),
}));

vi.mock("@/lib/useT", () => ({
  useT: () => (en: string) => en,
}));

const rows = [
  {
    id: "log-z",
    orgId: "org-1",
    action: "auth.login_failed",
    actorEmail: "zelda@example.com",
    entityType: "user",
    entityId: "1234567890",
    changeSummary: "Invalid password",
    createdAt: "2026-06-18T10:30:00.000Z",
  },
  {
    id: "log-a",
    orgId: "org-1",
    action: "user.created",
    actorEmail: "aarav@example.com",
    entityType: "user",
    entityId: "abcdefghij",
    changeSummary: "Created a user",
    createdAt: "2026-06-18T09:30:00.000Z",
  },
];

function renderPanel() {
  const host = document.createElement("div");
  document.body.appendChild(host);

  act(() => {
    createRoot(host).render(<AuditLogPanel />);
  });

  return host;
}

afterEach(() => {
  document.body.replaceChildren();
  useAuditLogsMock.mockReset();
});

describe("AuditLogPanel", () => {
  it("renders audit labels in a table and sorts the current page by actor", () => {
    useAuditLogsMock.mockReturnValue({
      data: { rows, total: 75, page: 1, limit: 50 },
      isLoading: false,
    });

    const host = renderPanel();

    expect(host.querySelector("table")).not.toBeNull();
    expect(host.textContent).toContain("Failed Login");
    expect(host.textContent).toContain("User Created");

    const actorSort = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Actor",
    );
    expect(actorSort).toBeDefined();

    act(() => {
      actorSort?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const renderedRows = Array.from(host.querySelectorAll("tbody tr"));
    expect(renderedRows[0]?.textContent).toContain("aarav@example.com");
    expect(renderedRows[1]?.textContent).toContain("zelda@example.com");
  });

  it("requests the next server page from the table pagination controls", () => {
    useAuditLogsMock.mockReturnValue({
      data: { rows, total: 75, page: 1, limit: 50 },
      isLoading: false,
    });

    const host = renderPanel();
    const nextPage = host.querySelector<HTMLButtonElement>('button[aria-label="Next page"]');
    expect(nextPage).not.toBeNull();

    act(() => {
      nextPage?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useAuditLogsMock).toHaveBeenLastCalledWith({ page: "2", limit: "50" });
  });
});
