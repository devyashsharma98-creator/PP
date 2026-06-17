// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import LoginPageClient from "./LoginPageClient";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
  },
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: () => ({
    lang: "en",
    setLang: vi.fn(),
  }),
}));

describe("LoginPageClient", () => {
  it("shows the super admin test credential on the login panel", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<LoginPageClient />);
    });

    expect(host.textContent).toContain("Super Admin");
    expect(host.textContent).toContain("admin@pragyapravah.local");
    expect(host.textContent).toContain("Pragya@12345");
  });
});
