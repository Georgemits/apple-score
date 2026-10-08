import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env.test" });
config({ path: ".env" });

// Integration tests talk to a dedicated database when one is configured.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Integration tests need TEST_DATABASE_URL (or DATABASE_URL) pointing at a PostgreSQL database."
  );
}

// Next.js request-scoped APIs are not available outside a request. The data
// layer only uses them for cache invalidation, which tests do not need.
vi.mock("next/cache", () => ({
  revalidatePath: () => undefined,
  revalidateTag: () => undefined,
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }),
}));
