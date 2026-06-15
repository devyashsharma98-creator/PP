// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders an accessible disabled button", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<Button disabled>Save changes</Button>);
    });

    const button = host.querySelector("button");
    expect(button?.textContent).toBe("Save changes");
    expect(button?.disabled).toBe(true);
  });
});
