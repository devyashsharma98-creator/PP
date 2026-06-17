// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import Prachar from "./Prachar";

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
  useT: () => (en: string) => en,
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({
    role: "aayam_pramukh",
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
  it("shows create and edit campaign controls for Prachar writers", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<Prachar />);
    });

    expect(host.textContent).toContain("Create Campaign");
    expect(host.textContent).toContain("Edit Campaign");
  });
});
