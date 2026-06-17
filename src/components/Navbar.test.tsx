// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { Navbar } from "./Navbar";

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

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({
    role: "karyakarta",
    setRole: vi.fn(),
    lang: "hi",
    setLang: vi.fn(),
    isAuthenticated: true,
    authReady: true,
    permissions: { canManageUsers: false },
    viewer: {
      primaryRoleCode: "karyakarta",
      effectiveRoles: ["karyakarta"],
    },
    availableRoles: ["karyakarta"],
  }),
}));

vi.mock("@/lib/app/constants", () => ({
  canonicalRoleLabels: { karyakarta: "Karyakarta" },
  canonicalRoleLabelsHi: { karyakarta: "कार्यकर्ता" },
  roleLabels: { karyakarta: "Karyakarta" },
  roleLabelsHi: { karyakarta: "कार्यकर्ता" },
}));

vi.mock("@/lib/app/navigation", () => ({
  getNavGroups: () => [],
}));

vi.mock("@/lib/useT", () => ({
  repairBrokenHindi: (value: string) => value,
  useT: () => (_en: string, hi: string) => hi,
}));

vi.mock("@/hooks/use-sign-out", () => ({
  useSignOut: () => vi.fn(),
}));

vi.mock("@/hooks/api/use-dashboard", () => ({
  useDashboardEvents: () => ({ data: [] }),
}));

vi.mock("@/hooks/api/use-dashboard-articles", () => ({
  useDashboardArticles: () => ({ data: [] }),
}));

vi.mock("@/hooks/api/use-search", () => ({
  useSearch: () => ({ data: [], isFetching: false }),
}));

vi.mock("./navbar/useShellFrame", () => ({
  useShellFrame: () => ({
    titleEn: "Aalekh",
    titleHi: "आलेख",
    subtitleEn: "Article workflow",
    subtitleHi: "आलेख कार्यप्रवाह",
  }),
}));

vi.mock("./navbar/useNavbarNotifications", () => ({
  useNavbarNotifications: () => [],
}));

vi.mock("./navbar/MobileNav", () => ({
  MobileNav: () => <button type="button">मेनू</button>,
}));

vi.mock("./navbar/NotificationBell", () => ({
  NotificationBell: () => <button type="button">सूचना</button>,
}));

vi.mock("./navbar/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">थीम</button>,
}));

vi.mock("@/components/PragyaLogo", () => ({
  PragyaLogo: () => <span>logo</span>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: () => <span />,
}));

describe("Navbar", () => {
  it("keeps the Hindi mobile shell readable and deliberately structured", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<Navbar />);
    });

    const shellPanel = host.querySelector("header > div");
    const roleChip = host.querySelector(".shell-role-chip");

    expect(shellPanel?.className).toContain("grid");
    expect(shellPanel?.textContent).toContain("भोपाल विभाग");
    expect(shellPanel?.textContent).toContain("दायित्व");
    expect(roleChip?.className).toContain("flex-1");
  });
});
