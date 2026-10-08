import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Two projects:
 *
 * - `unit` — pure functions (score, achievements, validation). No database.
 * - `integration` — the data layer and server actions against a real
 *   PostgreSQL database (`TEST_DATABASE_URL`, falling back to `DATABASE_URL`).
 *   Runs serially because tests share one database.
 */
const alias = {
  "@": path.resolve(__dirname, "src"),
  // `server-only` throws outside a React Server Components bundle; tests run in Node.
  "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
};

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          fileParallelism: false,
          sequence: { concurrent: false },
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
