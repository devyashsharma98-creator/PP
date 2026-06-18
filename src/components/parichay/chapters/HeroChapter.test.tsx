// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { HeroChapter } from "./HeroChapter";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", () => {
  const MotionElement = ({
    children,
    initial: _initial,
    animate: _animate,
    transition: _transition,
    whileHover: _whileHover,
    style: _style,
    ...props
  }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => <div {...props}>{children}</div>;

  return {
    motion: new Proxy({}, { get: () => MotionElement }),
    useScroll: () => ({ scrollYProgress: 0 }),
    useTransform: () => 0.5,
  };
});

vi.mock("@/components/PragyaLogo", () => ({
  PragyaLogo: () => <span aria-hidden="true" />,
}));

describe("HeroChapter", () => {
  it("keeps the tall hero visible and unshifted on mobile", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<HeroChapter />);
    });

    const hero = host.querySelector('[data-testid="parichay-hero"]');
    const content = host.querySelector('[data-testid="parichay-hero-content"]');

    expect(hero?.className).toContain("max-md:!opacity-100");
    expect(content?.className).toContain("max-md:!transform-none");
  });
});
