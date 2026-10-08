import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getBoardPage, getPodium, getStanding, simulateRank } from "@/lib/leaderboard";
import { createTestUser, deleteTestUsers, own } from "./helpers";

describe("leaderboard", () => {
  let rich: Awaited<ReturnType<typeof createTestUser>>;
  let mid: Awaited<ReturnType<typeof createTestUser>>;
  let broke: Awaited<ReturnType<typeof createTestUser>>;
  let empty: Awaited<ReturnType<typeof createTestUser>>;
  let hidden: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    await deleteTestUsers();
    [rich, mid, broke, empty, hidden] = await Promise.all([
      createTestUser(),
      createTestUser(),
      createTestUser(),
      createTestUser(),
      createTestUser({ isPublic: false }),
    ]);

    await own(rich.id, "mac-pro-m2-ultra", 1); // $6,999
    await own(rich.id, "iphone-17-pro-max", 2); // $2,398
    await own(mid.id, "macbook-air-13-m4", 1); // $999
    await own(mid.id, "airpods-pro-3", 1); // $249
    await own(broke.id, "polishing-cloth", 1); // $19
    await own(hidden.id, "pro-display-xdr", 3); // private: must never appear
  });

  afterAll(async () => {
    await deleteTestUsers();
    await prisma.$disconnect();
  });

  it("ranks public users by dollars spent and excludes private and empty collections", async () => {
    const page = await getBoardPage("overall");
    const ids = page.rows.map((row) => row.id);

    expect(ids).toContain(rich.id);
    expect(ids).toContain(mid.id);
    expect(ids).toContain(broke.id);
    expect(ids).not.toContain(empty.id);
    expect(ids).not.toContain(hidden.id);

    const richRow = page.rows.find((row) => row.id === rich.id)!;
    const midRow = page.rows.find((row) => row.id === mid.id)!;
    const brokeRow = page.rows.find((row) => row.id === broke.id)!;

    expect(richRow.score).toBe(6_999 + 2 * 1_199);
    expect(midRow.score).toBe(999 + 249);
    expect(brokeRow.score).toBe(19);
    expect(richRow.rank).toBeLessThan(midRow.rank);
    expect(midRow.rank).toBeLessThan(brokeRow.rank);
    expect(richRow.units).toBe(3);
    expect(richRow.highlight).toBe("Mac Pro (M2 Ultra)");
  });

  it("uses competition ranking for ties", async () => {
    const twin = await createTestUser();
    await own(twin.id, "polishing-cloth", 1);

    const page = await getBoardPage("overall");
    const a = page.rows.find((row) => row.id === broke.id)!;
    const b = page.rows.find((row) => row.id === twin.id)!;
    expect(a.rank).toBe(b.rank);
    expect(a.isBottom).toBe(true);
    expect(b.isBottom).toBe(true);

    await prisma.user.delete({ where: { id: twin.id } });
  });

  it("filters category boards and ranks the products board by units", async () => {
    const iphone = await getBoardPage("iphone");
    expect(iphone.rows.map((row) => row.id)).toContain(rich.id);
    expect(iphone.rows.map((row) => row.id)).not.toContain(mid.id);
    expect(iphone.rows.find((row) => row.id === rich.id)!.score).toBe(2 * 1_199);

    const products = await getBoardPage("products");
    const richRow = products.rows.find((row) => row.id === rich.id)!;
    expect(richRow.value).toBe(3);
  });

  it("reports a user's standing with neighbours and percentile", async () => {
    const standing = await getStanding(mid.id);
    expect(standing).not.toBeNull();
    expect(standing!.me.id).toBe(mid.id);
    expect(standing!.me.score).toBe(999 + 249);

    // Seeded demo accounts may sit between the fixtures, so check the shape
    // of the neighbourhood rather than specific ids.
    expect(standing!.above).not.toBeNull();
    expect(standing!.above!.row.rank).toBeLessThan(standing!.me.rank);
    expect(standing!.above!.gap).toBe(standing!.above!.row.value - standing!.me.value);
    expect(standing!.above!.gap).toBeGreaterThan(0);
    expect(standing!.belowMe).not.toBeNull();
    expect(standing!.belowMe!.row.rank).toBeGreaterThan(standing!.me.rank);
    expect(standing!.belowMe!.gap).toBeGreaterThan(0);
    expect(standing!.nearby.length).toBeGreaterThanOrEqual(3);
    expect(standing!.nearby.length).toBeLessThanOrEqual(5);
    expect(standing!.nearby.map((row) => row.id)).toContain(mid.id);
    expect(standing!.percentile).toBeGreaterThan(0);
    expect(standing!.percentile).toBeLessThan(100);
    expect(standing!.average).toBeGreaterThan(0);

    // Other accounts in the database may outrank the fixtures; only relative
    // order is guaranteed.
    const richStanding = await getStanding(rich.id);
    expect(richStanding!.me.rank).toBeLessThan(standing!.me.rank);
    expect(richStanding!.percentile).toBeGreaterThan(standing!.percentile);
    if (richStanding!.me.rank === 1) {
      expect(richStanding!.above).toBeNull();
      expect(richStanding!.percentile).toBe(100);
    }

    expect(await getStanding(empty.id)).toBeNull();
    expect(await getStanding(hidden.id)).toBeNull();
  });

  it("simulates the rank a hypothetical score would earn", async () => {
    const asIs = await simulateRank(broke.id, 19);
    const standing = await getStanding(broke.id);
    expect(asIs!.rank).toBe(standing!.me.rank);

    const richer = await simulateRank(broke.id, 100_000);
    expect(richer!.rank).toBe(1);

    const newcomer = await simulateRank(empty.id, 1_500);
    expect(newcomer!.total).toBe(asIs!.total + 1);
    expect(newcomer!.rank).toBeGreaterThan(1);

    // Private profiles never rank, so there is nothing to project.
    expect(await simulateRank(hidden.id, 1_000_000)).toBeNull();
  });

  it("puts the top three on the podium", async () => {
    const podium = await getPodium();
    expect(podium.length).toBeGreaterThan(0);
    expect(podium[0]!.rank).toBe(1);
    expect(podium[0]!.isTop).toBe(true);
  });

  it("limits the Following board to the viewer and who they follow", async () => {
    await prisma.follow.create({ data: { followerId: mid.id, followingId: rich.id } });
    const page = await getBoardPage("following", { viewerId: mid.id });
    const ids = page.rows.map((row) => row.id);
    expect(ids).toEqual([rich.id, mid.id]);

    const anonymous = await getBoardPage("following");
    expect(anonymous.rows).toHaveLength(0);
  });
});
