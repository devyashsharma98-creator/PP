import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Integration suite: runs the *.db.test.ts files against a real Postgres.
 * Kept separate from the default config so the ordinary unit suite never
 * requires a database.
 */
export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.db.test.ts"],
    // Brings an empty disposable database up to schema + reference data.
    globalSetup: ["./test/integration-global-setup.ts"],
    setupFiles: ["./test/neon-local-http-proxy.mjs"],
    fileParallelism: false,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The services are server modules; in the test runner the guard has
      // nothing to protect against, so it is stubbed out.
      "server-only": path.resolve(__dirname, "./test/server-only-stub.mjs"),
    },
  },
});
