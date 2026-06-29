// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act, createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Prachar from "./Prachar";

function withClient(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, node);
}

const mockState = vi.hoisted(() => ({
  lang: "en" as "en" | "hi",
  canUpdatePrachar: true,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/lib/useT", () => ({
  useT: () => (en: string, hi?: string) => (mockState.lang === "hi" ? hi ?? en : en),
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({
    lang: mockState.lang,
    permissions: { canUpdatePrachar: mockState.canUpdatePrachar },
  }),
}));

const sampleItem = {
  id: "o1",
  outreachType: "journal",
  relatedType: null,
  relatedId: null,
  title: "Distribute Patrika Vol.3",
  description: "Send the issue out.",
  unitId: null,
  departmentId: null,
  status: "pending" as const,
  assignedTo: null,
  dueDate: null,
  completedAt: null,
  skipReason: null,
  templateReference: null,
  metadata: { issueName: "Vol.3" },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

vi.mock("@/hooks/api/use-outreach", () => ({
  useOutreachItems: () => ({ data: [sampleItem], isLoading: false }),
  useOutreachTypes: () => ({
    data: [
      { type: "journal", labelEn: "Journal Issue", labelHi: "पत्रिका अंक", icon: "BookOpen", color: "violet", descriptionEn: "", descriptionHi: "", fields: [] },
    ],
  }),
  useOutreachAnalytics: () => ({ data: { total: 1, completed: 0, pending: 1, skipped: 0, completionRate: 0, statusTotals: {}, perType: [] } }),
  useCreateOutreach: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateOutreach: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteOutreach: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/components/ToastProvider", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe("Prachar outreach workflow", () => {
  beforeEach(() => {
    mockState.lang = "en";
    mockState.canUpdatePrachar = true;
  });

  it("renders the academic outreach masthead and an open item", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(withClient(<Prachar />));
    });

    expect(host.textContent).toContain("Carry the Work into the World");
    expect(host.textContent).toContain("Distribute Patrika Vol.3");
    // No social-media campaign vocabulary should remain.
    expect(host.textContent).not.toContain("WhatsApp");
    expect(host.textContent).not.toContain("Campaign Dissemination Queue");
  });

  it("offers the New Outreach action to Prachar writers", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(withClient(<Prachar />));
    });

    const newButton = Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.includes("New Outreach"));
    expect(newButton).toBeTruthy();
  });

  it("hides write controls for view-only roles", () => {
    mockState.canUpdatePrachar = false;
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(withClient(<Prachar />));
    });

    const newButton = Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.includes("New Outreach"));
    expect(newButton).toBeFalsy();
  });
});
