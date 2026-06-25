// @vitest-environment jsdom
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it } from "vitest";

import { WorkflowPageLoading } from "./WorkflowPageLoading";

describe("WorkflowPageLoading", () => {
  it("renders a stable app-like loading shell", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    act(() => {
      createRoot(host).render(<WorkflowPageLoading title="Loading calendar" />);
    });

    expect(host.textContent).toContain("Loading calendar");
    expect(host.querySelectorAll("[data-workflow-loading-card]").length).toBeGreaterThanOrEqual(3);
  });
});
