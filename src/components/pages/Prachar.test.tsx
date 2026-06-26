// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Prachar from "./Prachar";

const mockState = vi.hoisted(() => ({
  lang: "en" as "en" | "hi",
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

vi.mock("embla-carousel-react", () => ({
  default: () => [
    vi.fn(),
    {
      on: vi.fn(),
      off: vi.fn(),
      selectedScrollSnap: () => 0,
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      scrollTo: vi.fn(),
    },
  ],
}));

vi.mock("@/lib/useT", () => ({
  useT: () => (en: string, hi?: string) => (mockState.lang === "hi" ? hi ?? en : en),
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({
    role: "aayam_pramukh",
    lang: mockState.lang,
    permissions: { canUpdatePrachar: true },
  }),
}));

vi.mock("@/hooks/api/use-dashboard", () => ({
  useDashboardEvents: () => ({
    data: [
      {
        id: "event-1",
        title: "Published Campaign",
        description: "Outreach description",
        date: "17 Jun 2026",
        dateIso: "2026-06-17T09:00:00.000Z",
        unit: "Delhi",
        status: "Published",
      },
    ],
  }),
}));

vi.mock("@/hooks/api/use-org-structure", () => ({
  useOrgStructure: () => ({
    data: {
      units: [{ id: "unit-1", name: "Delhi", nameHi: null, code: "delhi", unitKind: "unit" }],
      departments: [{ id: "dept-1", name: "Prachar", nameHi: null, code: "prachar", departmentKind: "prachar", unitId: null }],
    },
  }),
}));

vi.mock("@/hooks/api/use-prachar", () => ({
  usePracharStatuses: () => ({ data: [] }),
  useUpdatePracharPlatform: () => ({ mutateAsync: vi.fn() }),
  useCreatePracharCampaign: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
  useUpdatePracharCampaign: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
}));

describe("Prachar campaign controls", () => {
  beforeEach(() => {
    mockState.lang = "en";
  });

  it("shows create and edit campaign controls for Prachar writers", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<Prachar />);
    });

    expect(host.textContent).toContain("Create Campaign");
    expect(host.textContent).toContain("Edit Campaign");
  });

  it("switches tabs into bounded Prachar work areas", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<Prachar />);
    });

    expect(host.textContent).toContain("Campaign Dissemination Queue");
    expect(host.textContent).not.toContain("Communication kits, posters, and publicity formats");

    const createTab = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Create");
    expect(createTab).toBeTruthy();
    act(() => {
      createTab?.click();
    });

    expect(host.textContent).toContain("Communication kits, posters, and publicity formats");
    expect(host.textContent).not.toContain("Campaign Dissemination Queue");

    const analyticsTab = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Analytics");
    expect(analyticsTab).toBeTruthy();
    act(() => {
      analyticsTab?.click();
    });

    expect(host.textContent).toContain("Coverage Analytics");
    expect(host.textContent).not.toContain("Communication kits, posters, and publicity formats");
  });

  it("uses Hindi copy for generated campaign output controls", () => {
    mockState.lang = "hi";
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<Prachar />);
    });

    const createTab = Array.from(host.querySelectorAll('button[role="tab"]')).find((button) => button.textContent?.includes("बनाएँ"));
    expect(createTab).toBeTruthy();
    act(() => {
      createTab?.click();
    });

    const generateButton = Array.from(host.querySelectorAll("button")).find((button) => {
      const text = button.textContent ?? "";
      return text.includes("संदेश") || text.includes("Generate copy");
    });
    expect(generateButton).toBeTruthy();
    act(() => {
      generateButton?.click();
    });

    expect(host.textContent).toContain("निर्मित अभियान संदेश");
    expect(host.textContent).toContain("फिर कॉपी करें");
    expect(host.textContent).not.toContain("Generated campaign copy");
    expect(host.textContent).not.toContain("Copy again");
  });
});
