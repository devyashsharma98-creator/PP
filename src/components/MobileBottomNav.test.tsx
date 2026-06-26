// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { MobileBottomNav } from "./MobileBottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/aalekh",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch: _prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-sign-out", () => ({
  useSignOut: () => vi.fn(),
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({
    lang: "hi",
    authReady: true,
    permissions: { canManageUsers: false },
    viewer: { primaryRoleCode: "super_admin", effectiveRoles: ["super_admin"] },
  }),
}));

vi.mock("@/lib/useT", () => ({
  useT: () => (_en: string, hi: string) => hi,
}));

describe("MobileBottomNav", () => {
  it("uses a taller readable mobile command bar for Hindi labels", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<MobileBottomNav />);
    });

    const nav = host.querySelector("[data-mobile-bottom-nav]");
    const grid = nav?.firstElementChild;
    const activeAalekh = host.querySelector('a[href="/aalekh"]');
    const activeLabel = activeAalekh?.querySelector("span");

    expect(grid?.className).toContain("h-[76px]");
    expect(activeLabel?.className).toContain("text-[10px]");
    expect(activeAalekh?.className).toContain("bg-background");
    expect(activeAalekh?.textContent).toContain("आलेख");
  });

  it("opens the More sheet as a bounded scrollable mobile panel", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<MobileBottomNav />);
    });

    act(() => {
      host.querySelector<HTMLButtonElement>('button[aria-label="Open more navigation"]')?.click();
    });

    const dialog = document.body.querySelector('[role="dialog"]');

    expect(dialog?.className).toContain("max-h-[min(88dvh,720px)]");
    expect(dialog?.className).toContain("overflow-y-auto");
    expect(dialog?.textContent).toContain("लॉग आउट");
  });
});
