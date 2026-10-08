import { describe, expect, it } from "vitest";
import {
  MILESTONES,
  TIERS,
  breakdownByCategory,
  calculateScore,
  countProducts,
  hasCustomPrice,
  lineTotal,
  milestoneReached,
  nextMilestone,
  nextTier,
  percentile,
  tierFor,
  unitPrice,
} from "@/lib/score";

const item = (
  priceUSD: number,
  quantity: number,
  pricePaidUSD: number | null = null,
  category: "IPHONE" | "MAC" | "AIRPODS" = "IPHONE"
) => ({ quantity, pricePaidUSD, product: { priceUSD, category } });

describe("Apple Score formula", () => {
  it("is the sum of price × quantity across the collection", () => {
    const items = [
      item(3_499, 1, null, "MAC"),
      item(1_599, 1),
      item(249, 1, null, "AIRPODS"),
      item(799, 1),
    ];
    expect(calculateScore(items)).toBe(3_499 + 1_599 + 249 + 799);
  });

  it("multiplies by quantity", () => {
    expect(lineTotal(item(1_199, 2))).toBe(2_398);
    expect(countProducts([item(1, 2), item(1, 3)])).toBe(5);
  });

  it("prefers the recorded price over the launch MSRP", () => {
    expect(unitPrice(item(999, 1))).toBe(999);
    expect(unitPrice(item(999, 1, 650))).toBe(650);
    expect(lineTotal(item(999, 3, 650))).toBe(1_950);
    expect(hasCustomPrice(item(999, 1))).toBe(false);
    expect(hasCustomPrice(item(999, 1, 999))).toBe(false);
    expect(hasCustomPrice(item(999, 1, 0))).toBe(true);
  });

  it("applies no multipliers of any kind", () => {
    // A $2,495 Macintosh 128K is worth exactly $2,495, whatever its age.
    expect(lineTotal({ quantity: 1, pricePaidUSD: null, product: { priceUSD: 2_495 } })).toBe(
      2_495
    );
  });

  it("is zero for an empty collection", () => {
    expect(calculateScore([])).toBe(0);
    expect(countProducts([])).toBe(0);
  });
});

describe("milestones", () => {
  it("are ascending", () => {
    for (let index = 1; index < MILESTONES.length; index += 1) {
      expect(MILESTONES[index]!).toBeGreaterThan(MILESTONES[index - 1]!);
    }
  });

  it("reports the highest milestone crossed by a change", () => {
    expect(milestoneReached(0, 999)).toBeNull();
    expect(milestoneReached(0, 1_000)).toBe(1_000);
    expect(milestoneReached(999, 1_000)).toBe(1_000);
    expect(milestoneReached(4_000, 12_000)).toBe(10_000);
    expect(milestoneReached(12_000, 4_000)).toBeNull();
    expect(milestoneReached(1_000, 1_000)).toBeNull();
  });

  it("tracks progress toward the next milestone", () => {
    expect(nextMilestone(0)).toEqual({ target: 1_000, remaining: 1_000, progress: 0 });
    expect(nextMilestone(500)).toEqual({ target: 1_000, remaining: 500, progress: 0.5 });
    expect(nextMilestone(1_000)?.target).toBe(5_000);
    expect(nextMilestone(3_000)?.progress).toBe(0.5);
    expect(nextMilestone(2_000_000)).toBeNull();
  });
});

describe("tiers", () => {
  it("are ordered by minimum score", () => {
    for (let index = 1; index < TIERS.length; index += 1) {
      expect(TIERS[index]!.min).toBeGreaterThan(TIERS[index - 1]!.min);
    }
  });

  it("picks the highest tier a score qualifies for", () => {
    expect(tierFor(0).id).toBe("window-shopper");
    expect(tierFor(1).id).toBe("toe-dipper");
    expect(tierFor(999).id).toBe("toe-dipper");
    expect(tierFor(1_000).id).toBe("casual-fan");
    expect(tierFor(12_482).id).toBe("ecosystem-hostage");
    expect(tierFor(10_000_000).id).toBe("infinite-loop");
  });

  it("knows the next tier up", () => {
    expect(nextTier(0)?.id).toBe("toe-dipper");
    expect(nextTier(5_000)?.id).toBe("ecosystem-hostage");
    expect(nextTier(1_000_000)).toBeNull();
  });
});

describe("percentile", () => {
  it("is the share of other users strictly below", () => {
    expect(percentile(0, 1)).toBe(0);
    expect(percentile(0, 2)).toBe(0);
    expect(percentile(1, 2)).toBe(100);
    expect(percentile(82, 101)).toBe(82);
    expect(percentile(9, 10)).toBe(100);
  });
});

describe("category breakdown", () => {
  it("sums dollars and units per category, sorted by dollars", () => {
    const items = [
      item(1_000, 1, null, "IPHONE"),
      item(500, 2, null, "AIRPODS"),
      item(3_000, 1, null, "MAC"),
    ];
    const breakdown = breakdownByCategory(items);
    expect(breakdown.map((entry) => entry.category)).toEqual(["MAC", "AIRPODS", "IPHONE"]);
    expect(breakdown[1]).toEqual({ category: "AIRPODS", total: 1_000, units: 2, share: 0.2 });
    expect(breakdown.reduce((sum, entry) => sum + entry.share, 0)).toBeCloseTo(1);
  });

  it("is empty for an empty collection", () => {
    expect(breakdownByCategory([])).toEqual([]);
  });
});
