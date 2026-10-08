import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { buildAchievementContext, syncAchievements } from "@/lib/achievement-sync";
import { getAchievementRarity, getUnlockedAchievements } from "@/lib/queries";
import { createTestUser, deleteTestUsers, own } from "./helpers";

describe("achievement sync", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    await deleteTestUsers();
    user = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUsers();
    await prisma.$disconnect();
  });

  it("unlocks nothing for an empty collection", async () => {
    expect(await syncAchievements(user.id)).toEqual([]);
    expect(await getUnlockedAchievements(user.id)).toEqual([]);
  });

  it("persists new unlocks once and reports only what is new", async () => {
    await own(user.id, "mac-pro-m2-ultra", 1); // $6,999 — Mac Pro, Ultra chip
    const first = await syncAchievements(user.id);
    const ids = first.map((unlock) => unlock.id);
    expect(ids).toEqual(
      expect.arrayContaining(["first-purchase", "apple-starter", "apple-addict", "think-different", "cheese-grater", "ultra-instinct", "big-spender", "whale"])
    );

    const again = await syncAchievements(user.id);
    expect(again).toEqual([]);

    const stored = await getUnlockedAchievements(user.id);
    expect(stored.map((row) => row.achievementId).sort()).toEqual(ids.sort());
    for (const row of stored) expect(row.unlockedAt).toBeInstanceOf(Date);
  });

  it("keeps unlocks after the condition stops holding", async () => {
    await prisma.userProduct.deleteMany({ where: { userId: user.id } });
    const context = await buildAchievementContext(user.id);
    expect(context.score).toBe(0);
    expect(await syncAchievements(user.id, context)).toEqual([]);
    const stored = await getUnlockedAchievements(user.id);
    expect(stored.map((row) => row.achievementId)).toContain("cheese-grater");
  });

  it("builds a context from authoritative data", async () => {
    await own(user.id, "airpods-pro-3", 3);
    const other = await createTestUser();
    await prisma.follow.create({ data: { followerId: other.id, followingId: user.id } });

    const context = await buildAchievementContext(user.id);
    expect(context.score).toBe(3 * 249);
    expect(context.productCount).toBe(3);
    expect(context.distinctProducts).toBe(1);
    expect(context.followers).toBe(1);
    expect(context.rank).not.toBeNull();
    expect(context.totalUsers).toBeGreaterThan(0);

    const fresh = await syncAchievements(user.id, context);
    expect(fresh.map((unlock) => unlock.id)).toContain("lost-and-found");
  });

  it("reports rarity as the share of public users holding each achievement", async () => {
    const rarity = await getAchievementRarity();
    expect(rarity.totalUsers).toBeGreaterThan(0);
    expect(rarity.byId["first-purchase"]).toBeDefined();
    expect(rarity.byId["first-purchase"]!.holders).toBeGreaterThan(0);
    expect(rarity.byId["first-purchase"]!.share).toBeLessThanOrEqual(1);
    expect(rarity.byId["garage-days"]).toBeDefined();
  });
});
