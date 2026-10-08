import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

describe("rate limiting", () => {
  const key = `test:${Date.now()}`;

  afterAll(async () => {
    await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
    await prisma.$disconnect();
  });

  it("allows up to the limit, then blocks until the window resets", async () => {
    const first = await rateLimit(key, 3, 60);
    expect(first.ok).toBe(true);
    expect(first.remaining).toBe(2);

    await rateLimit(key, 3, 60);
    const third = await rateLimit(key, 3, 60);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = await rateLimit(key, 3, 60);
    expect(fourth.ok).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
    expect(fourth.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("starts a fresh window once the previous one has expired", async () => {
    const expiredKey = `${key}:expired`;
    await prisma.rateLimit.create({
      data: { key: expiredKey, count: 99, resetAt: new Date(Date.now() - 1000) },
    });

    const result = await rateLimit(expiredKey, 3, 60);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("keeps separate keys separate", async () => {
    const a = await rateLimit(`${key}:a`, 1, 60);
    const b = await rateLimit(`${key}:b`, 1, 60);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect((await rateLimit(`${key}:a`, 1, 60)).ok).toBe(false);
    expect((await rateLimit(`${key}:b`, 1, 60)).ok).toBe(false);
  });
});
