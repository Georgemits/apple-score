import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  unlockedIds,
  type AchievementContext,
  type AchievementItem,
} from "@/lib/achievements";
import { breakdownByCategory, calculateScore, countProducts } from "@/lib/score";

type Spec = Partial<AchievementItem["product"]> & {
  quantity?: number;
  pricePaidUSD?: number | null;
};

function make(spec: Spec): AchievementItem {
  return {
    quantity: spec.quantity ?? 1,
    pricePaidUSD: spec.pricePaidUSD ?? null,
    product: {
      slug: spec.slug ?? "thing",
      name: spec.name ?? "Thing",
      category: spec.category ?? "ACCESSORY",
      family: spec.family ?? "Accessories",
      priceUSD: spec.priceUSD ?? 100,
      year: spec.year ?? 2024,
      legacy: spec.legacy ?? false,
    },
  };
}

function context(
  items: AchievementItem[],
  extra: Partial<AchievementContext> = {}
): AchievementContext {
  return {
    score: calculateScore(items),
    productCount: countProducts(items),
    distinctProducts: items.length,
    items,
    breakdown: breakdownByCategory(items),
    rank: null,
    totalUsers: 0,
    followers: 0,
    following: 0,
    activeDays: 1,
    ...extra,
  };
}

describe("achievement catalogue", () => {
  it("has unique ids and complete metadata", () => {
    const ids = new Set(ACHIEVEMENTS.map((definition) => definition.id));
    expect(ids.size).toBe(ACHIEVEMENTS.length);
    for (const definition of ACHIEVEMENTS) {
      expect(definition.title.length).toBeGreaterThan(0);
      expect(definition.description.length).toBeGreaterThan(0);
      expect(definition.emoji.length).toBeGreaterThan(0);
    }
  });

  it("unlocks nothing for an empty collection", () => {
    expect(unlockedIds(context([]))).toEqual([]);
    for (const evaluation of evaluateAchievements(context([]))) {
      expect(evaluation.progress).toBeGreaterThanOrEqual(0);
      expect(evaluation.progress).toBeLessThanOrEqual(1);
    }
  });
});

describe("score milestones", () => {
  it("unlock in order as the score grows", () => {
    const at = (score: number) =>
      unlockedIds(context([make({ priceUSD: score, category: "MAC", family: "Mac Studio" })]));
    expect(at(999)).toContain("first-purchase");
    expect(at(999)).not.toContain("apple-starter");
    expect(at(1_000)).toContain("apple-starter");
    expect(at(5_000)).toContain("apple-addict");
    expect(at(10_000)).toContain("apple-enthusiast");
    expect(at(25_000)).toContain("apple-lifestyle");
    expect(at(100_000)).toContain("apple-billionaire");
    expect(at(100_000)).not.toContain("the-one-percent");
  });
});

describe("collection achievements", () => {
  it("counts iPhones, Macs and category spread", () => {
    const items = [
      make({
        category: "IPHONE",
        family: "iPhone Pro",
        name: "iPhone 17 Pro Max",
        year: 2025,
        quantity: 2,
      }),
      make({ category: "IPHONE", family: "iPhone", name: "iPhone 11", year: 2019 }),
      make({ category: "MAC", family: "MacBook Pro", name: 'MacBook Pro 14" (M4)' }),
      make({
        category: "MAC",
        family: "Mac Studio",
        name: "Mac Studio (M3 Ultra)",
        priceUSD: 3_999,
      }),
      make({ category: "WATCH", family: "Apple Watch Ultra", name: "Apple Watch Ultra 3" }),
      make({ category: "AIRPODS", family: "AirPods Pro", name: "AirPods Pro 3", quantity: 3 }),
      make({ category: "IPAD", family: "iPad Pro", name: 'iPad Pro 13" (M4)' }),
    ];
    const ids = unlockedIds(context(items));
    expect(ids).toContain("hello-iphone");
    expect(ids).toContain("iphone-collector"); // 3 units
    expect(ids).toContain("go-pro-max");
    expect(ids).not.toContain("annual-upgrader"); // only two release years
    expect(ids).toContain("think-different");
    expect(ids).toContain("best-of-both"); // laptop + desktop
    expect(ids).toContain("ultra-instinct");
    expect(ids).toContain("ultra-wrist");
    expect(ids).toContain("lost-and-found"); // 3 of the same AirPods
    expect(ids).toContain("full-ecosystem"); // 5 categories
    expect(ids).toContain("big-spender"); // $3,999 line
    expect(ids).not.toContain("whale");
  });

  it("recognises vintage hardware", () => {
    const ids = unlockedIds(
      context([
        make({
          slug: "iphone-1st-gen",
          category: "IPHONE",
          family: "iPhone",
          year: 2007,
          legacy: true,
        }),
        make({ slug: "ipod-mini", category: "IPOD", family: "iPod", year: 2004, legacy: true }),
      ])
    );
    expect(ids).toContain("time-traveller");
    expect(ids).toContain("click-wheel");
    expect(ids).toContain("the-original");
    expect(ids).not.toContain("vintage-collector");
  });

  it("rewards recorded bargains", () => {
    const bargains = [1, 2, 3].map((n) =>
      make({ slug: `b${n}`, priceUSD: 500, pricePaidUSD: 300 })
    );
    expect(unlockedIds(context(bargains))).toContain("bargain-hunter");
    expect(unlockedIds(context(bargains.slice(0, 2)))).not.toContain("bargain-hunter");
  });
});

describe("social, leaderboard and habit achievements", () => {
  it("depend on context beyond the collection", () => {
    const base = [make({ priceUSD: 1_000 })];
    expect(unlockedIds(context(base, { rank: 1, totalUsers: 4 }))).not.toContain("band-leader");
    expect(unlockedIds(context(base, { rank: 1, totalUsers: 5 }))).toContain("band-leader");
    expect(unlockedIds(context(base, { rank: 3, totalUsers: 5 }))).toContain("podium");
    expect(unlockedIds(context(base, { rank: 8, totalUsers: 9 }))).not.toContain("top-ten");
    expect(unlockedIds(context(base, { rank: 8, totalUsers: 10 }))).toContain("top-ten");
    expect(unlockedIds(context(base, { following: 5 }))).toContain("social-butterfly");
    expect(unlockedIds(context(base, { followers: 5 }))).toContain("influencer");
    expect(unlockedIds(context(base, { activeDays: 7 }))).toEqual(
      expect.arrayContaining(["habit", "regular"])
    );
  });
});
