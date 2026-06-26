// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { BookOpen, LayoutDashboard } from "lucide-react";

import { MobileNav } from "./MobileNav";

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

vi.mock("@/lib/useT", () => ({
  useT: () => (_en: string, hi: string) => hi,
}));

vi.mock("@/components/PragyaLogo", () => ({
  PragyaLogo: () => <span>logo</span>,
}));

const navigationGroups = [
  {
    title: "Main Work",
    titleHi: "मुख्य कार्य",
    icon: LayoutDashboard,
    items: [
      {
        path: "/dashboard",
        label: "Dashboard",
        sublabel: "गतिविधि डैशबोर्ड",
        description: "Operational dashboard",
        descriptionHi: "गतिविधि और अनुमोदन का पूरा कार्यक्षेत्र",
        icon: LayoutDashboard,
      },
      {
        path: "/aalekh",
        label: "Aalekh",
        sublabel: "लंबा हिंदी नेविगेशन शीर्षक",
        description: "Writing desk",
        descriptionHi: "ज्ञान लेखन और समीक्षा का कार्यक्षेत्र",
        icon: BookOpen,
      },
    ],
  },
];

describe("MobileNav", () => {
  it("shows full Hindi side navigation labels without truncation", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(
        <MobileNav
          open
          onOpenChange={vi.fn()}
          pathname="/aalekh"
          lang="hi"
          shellFrame={{
            titleEn: "Aalekh",
            titleHi: "आलेख",
            subtitleEn: "Writing workflow",
            subtitleHi: "ज्ञान लेखन कार्यप्रवाह",
          }}
          navigationGroups={navigationGroups}
        />,
      );
    });

    const sheet = document.body.querySelector('[role="dialog"]');
    const activeLink = document.body.querySelector('a[href="/aalekh"]');
    const activeLabel = activeLink?.querySelector("span");

    expect(sheet?.className).toContain("w-[min(92vw,360px)]");
    expect(activeLabel?.className).not.toContain("truncate");
    expect(activeLabel?.className).toContain("whitespace-normal");
    expect(activeLabel?.textContent).toContain("लंबा हिंदी नेविगेशन शीर्षक");
  });
});
