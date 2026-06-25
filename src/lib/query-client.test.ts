import { describe, expect, it } from "vitest";

import { createAppQueryClient } from "./query-client";

describe("createAppQueryClient", () => {
  it("uses productive cache defaults for workflow navigation", () => {
    const client = createAppQueryClient();
    const options = client.getDefaultOptions();

    expect(options.queries?.staleTime).toBe(5 * 60 * 1000);
    expect(options.queries?.gcTime).toBe(10 * 60 * 1000);
    expect(options.queries?.retry).toBe(1);
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
  });

  it("does not retry mutations by default", () => {
    const client = createAppQueryClient();

    expect(client.getDefaultOptions().mutations?.retry).toBe(0);
  });
});
