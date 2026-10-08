import type { Category } from "@prisma/client";

/**
 * The Apple Score.
 *
 *   Apple Score = Σ over owned products of  (price paid ?? launch MSRP) × quantity
 *
 * It is a plain dollar amount: the money a user has spent on Apple hardware,
 * in whole US dollars. There are no multipliers, bonuses or weights — more money
 * spent on Apple is a higher score, and that is the whole idea.
 *
 * "Price paid" is optional. When the owner has not recorded one, the product's
 * launch MSRP for its base configuration is used. The canonical definition lives
 * here so the UI, the server actions and the leaderboard SQL
 * (`src/lib/leaderboard.ts`) all agree on exactly one formula.
 */

export type ScorableItem = {
  quantity: number;
  /** What the owner paid per unit. Null falls back to the launch MSRP. */
  pricePaidUSD: number | null;
  product: { priceUSD: number };
};

/** The per-unit price actually used for scoring. */
export function unitPrice(item: ScorableItem): number {
  return item.pricePaidUSD ?? item.product.priceUSD;
}

/** True when the owner recorded a price that differs from the MSRP. */
export function hasCustomPrice(item: ScorableItem): boolean {
  return item.pricePaidUSD !== null && item.pricePaidUSD !== item.product.priceUSD;
}

/** One inventory row's contribution to the score. */
export function lineTotal(item: ScorableItem): number {
  return unitPrice(item) * item.quantity;
}

export function calculateScore(items: readonly ScorableItem[]): number {
  return items.reduce((total, item) => total + lineTotal(item), 0);
}

export function countProducts(items: readonly { quantity: number }[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/* -------------------------------------------------------------------------
 * Milestones
 * ---------------------------------------------------------------------- */

/** Score thresholds that trigger a celebration and a milestone achievement. */
export const MILESTONES = [
  1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
] as const;

export type Milestone = (typeof MILESTONES)[number];

/** The highest milestone crossed when moving from `previous` to `next`, if any. */
export function milestoneReached(previous: number, next: number): Milestone | null {
  let reached: Milestone | null = null;
  for (const milestone of MILESTONES) {
    if (previous < milestone && next >= milestone) reached = milestone;
  }
  return reached;
}

export type MilestoneProgress = {
  /** The next threshold to reach. */
  target: Milestone;
  /** Dollars still to go. */
  remaining: number;
  /** 0–1 progress from the previous milestone (or 0) to the target. */
  progress: number;
};

/** Progress toward the next milestone, or null once every milestone is passed. */
export function nextMilestone(score: number): MilestoneProgress | null {
  let floor = 0;
  for (const milestone of MILESTONES) {
    if (score < milestone) {
      const span = milestone - floor;
      return {
        target: milestone,
        remaining: milestone - score,
        progress: span === 0 ? 1 : Math.min(1, Math.max(0, (score - floor) / span)),
      };
    }
    floor = milestone;
  }
  return null;
}

/* -------------------------------------------------------------------------
 * Tiers — the "how deep in the ecosystem are you" ladder
 * ---------------------------------------------------------------------- */

export type Tier = {
  id: string;
  /** Minimum score for this tier, inclusive. */
  min: number;
  name: string;
  emoji: string;
  tagline: string;
};

/** Ordered lowest to highest. Playful about money, never about people. */
export const TIERS: readonly Tier[] = [
  {
    id: "window-shopper",
    min: 0,
    name: "Window Shopper",
    emoji: "🪟",
    tagline: "Looking, not buying. Yet.",
  },
  { id: "toe-dipper", min: 1, name: "Toe Dipper", emoji: "🧦", tagline: "One cable at a time." },
  {
    id: "casual-fan",
    min: 1_000,
    name: "Casual Fan",
    emoji: "🍏",
    tagline: "You own a thing or two.",
  },
  {
    id: "committed",
    min: 2_500,
    name: "Committed",
    emoji: "🔒",
    tagline: "The ecosystem has you now.",
  },
  {
    id: "apple-addict",
    min: 5_000,
    name: "Apple Addict",
    emoji: "💊",
    tagline: "Three devices, one wallet.",
  },
  {
    id: "ecosystem-hostage",
    min: 10_000,
    name: "Ecosystem Hostage",
    emoji: "⛓️",
    tagline: "Leaving would cost more than staying.",
  },
  {
    id: "cupertino-royalty",
    min: 25_000,
    name: "Cupertino Royalty",
    emoji: "👑",
    tagline: "Apple Park should name a bench after you.",
  },
  {
    id: "keynote-vip",
    min: 50_000,
    name: "Keynote VIP",
    emoji: "🎟️",
    tagline: "You have personally funded a keynote demo.",
  },
  {
    id: "tims-favourite",
    min: 100_000,
    name: "Tim's Favourite Customer",
    emoji: "🍎",
    tagline: "Tim Cook knows your name. Probably.",
  },
  {
    id: "infinite-loop",
    min: 250_000,
    name: "Infinite Loop",
    emoji: "♾️",
    tagline: "There is no exit. There never was.",
  },
] as const;

export function tierFor(score: number): Tier {
  let current: Tier = TIERS[0]!;
  for (const tier of TIERS) {
    if (score >= tier.min) current = tier;
  }
  return current;
}

/** The tier after the current one, or null at the top. */
export function nextTier(score: number): Tier | null {
  const current = tierFor(score);
  const index = TIERS.findIndex((tier) => tier.id === current.id);
  return TIERS[index + 1] ?? null;
}

/* -------------------------------------------------------------------------
 * Percentile
 * ---------------------------------------------------------------------- */

/**
 * "You're richer in Apple than N% of users": the share of *other* users with a
 * strictly lower score, as a whole percentage. A lone user scores 0%, which is
 * accurate — there is nobody to beat yet.
 */
export function percentile(usersBelow: number, totalUsers: number): number {
  const others = totalUsers - 1;
  if (others <= 0) return 0;
  return Math.round((Math.max(0, usersBelow) / others) * 100);
}

/* -------------------------------------------------------------------------
 * Breakdowns
 * ---------------------------------------------------------------------- */

export type CategoryBreakdown = {
  category: Category;
  /** Dollars spent in this category. */
  total: number;
  /** Units owned in this category. */
  units: number;
  /** Share of the total score, 0–1. */
  share: number;
};

export function breakdownByCategory(
  items: readonly (ScorableItem & { product: { category: Category } })[]
): CategoryBreakdown[] {
  const totals = new Map<Category, { total: number; units: number }>();

  for (const item of items) {
    const current = totals.get(item.product.category) ?? { total: 0, units: 0 };
    totals.set(item.product.category, {
      total: current.total + lineTotal(item),
      units: current.units + item.quantity,
    });
  }

  const grandTotal = [...totals.values()].reduce((sum, entry) => sum + entry.total, 0);

  return [...totals.entries()]
    .map(([category, entry]) => ({
      category,
      total: entry.total,
      units: entry.units,
      share: grandTotal === 0 ? 0 : entry.total / grandTotal,
    }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}
