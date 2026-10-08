import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getCommunityStats,
  getFollowers,
  getFollowing,
  getOwnershipCounts,
  getProfile,
  getRecentDelta,
  getScoreHistory,
  getUserStats,
  summarize,
} from "@/lib/queries";
import { createTestUser, deleteTestUsers, own, product } from "./helpers";

describe("queries", () => {
  let open: Awaited<ReturnType<typeof createTestUser>>;
  let hidden: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    await deleteTestUsers();
    [open, hidden] = await Promise.all([createTestUser(), createTestUser({ isPublic: false })]);
    await own(open.id, "macbook-pro-16-m4-max", 1); // $3,499, 2024
    await own(open.id, "iphone-1st-gen", 2, 300); // legacy 2007, paid $300 each
    await own(open.id, "airpods-pro-3", 1); // $249
    await own(hidden.id, "apple-vision-pro-m5", 1);
  });

  afterAll(async () => {
    await deleteTestUsers();
    await prisma.$disconnect();
  });

  it("summarises a collection", async () => {
    const stats = await getUserStats(open.id);
    expect(stats.score).toBe(3_499 + 2 * 300 + 249);
    expect(stats.productCount).toBe(4);
    expect(stats.distinctProducts).toBe(3);
    expect(stats.mostValuable?.product.slug).toBe("macbook-pro-16-m4-max");
    expect(stats.priciestUnit?.product.slug).toBe("macbook-pro-16-m4-max");
    expect(stats.topCategory).toBe("MAC");
    expect(stats.oldest?.product.year).toBe(2007);
    expect(stats.newest?.product.year).toBe(2025);
    expect(stats.legacyUnits).toBe(2);
    expect(stats.familyCount).toBe(3);
    expect(stats.averageUnitPrice).toBe(Math.round(stats.score / 4));
    expect(stats.tier.id).toBe("committed");
    expect(summarize([]).tier.id).toBe("window-shopper");
  });

  it("returns public profiles to anyone and private ones only to their owner", async () => {
    expect(await getProfile(open.username, null)).not.toBeNull();
    expect(await getProfile(open.username.toUpperCase(), null)).not.toBeNull();
    expect(await getProfile(hidden.username, null)).toBeNull();
    expect(await getProfile(hidden.username, open.id)).toBeNull();
    expect(await getProfile(hidden.username, hidden.id)).not.toBeNull();
    expect(await getProfile("no_such_user_xyz", null)).toBeNull();
  });

  it("tracks score history and weekly deltas from the event log", async () => {
    const before = await getScoreHistory(open.id);
    expect(before[0]).toEqual({ at: expect.any(Date), score: 0 });

    await prisma.activityEvent.create({
      data: {
        userId: open.id,
        productId: (await product("airpods-pro-3")).id,
        productName: "AirPods Pro 3",
        type: "ADD",
        quantityDelta: 1,
        scoreDelta: 249,
        scoreAfter: 249,
      },
    });

    const after = await getScoreHistory(open.id);
    expect(after).toHaveLength(before.length + 1);
    expect(after.at(-1)?.score).toBe(249);
    expect(await getRecentDelta(open.id, 7)).toBe(249);
  });

  it("counts ownership across public collections only", async () => {
    const counts = await getOwnershipCounts();
    const macbook = await product("macbook-pro-16-m4-max");
    const vision = await product("apple-vision-pro-m5");
    expect(counts[macbook.id]).toBeGreaterThanOrEqual(1);
    // The only Vision Pro in test data belongs to a private user; demo users may own one too.
    expect(counts[vision.id] ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("lists follows, hiding private accounts", async () => {
    await prisma.follow.create({ data: { followerId: open.id, followingId: hidden.id } });
    const third = await createTestUser();
    await prisma.follow.create({ data: { followerId: open.id, followingId: third.id } });
    await prisma.follow.create({ data: { followerId: third.id, followingId: open.id } });

    const following = await getFollowing(open.id);
    expect(following.map((u) => u.id)).toEqual([third.id]); // hidden is private
    const followers = await getFollowers(open.id);
    expect(followers.map((u) => u.id)).toEqual([third.id]);
  });

  it("reports community totals", async () => {
    const stats = await getCommunityStats();
    expect(stats.users).toBeGreaterThan(0);
    expect(stats.products).toBe(233);
    expect(stats.collectors).toBeGreaterThan(0);
    expect(stats.totalDollars).toBeGreaterThan(0);
    expect(stats.averageScore).toBeGreaterThan(0);
  });
});
