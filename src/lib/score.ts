import type { Category } from "@prisma/client";

/**
 * Apple Score = Σ line totals, where one line is:
 *
 *   (price paid ?? MSRP) × quantity, plus 10% if the product is legacy
 *
 * The canonical definition lives here so the UI, the server actions and the
 * leaderboard query all agree on one formula.
 */

/** Vintage hardware is worth a 10% premium on top of its price. */
export const LEGACY_BONUS = 0.1;

export type ScorableItem = {
  quantity: number;
  /** What the owner paid per unit. Null falls back to MSRP. */
  pricePaidUSD: number | null;
  product: { priceUSD: number; legacy: boolean };
};

/** The per-unit price actually used for scoring. */
export function unitPrice(item: ScorableItem): number {
  return item.pricePaidUSD ?? item.product.priceUSD;
}

/** True when the owner overrode the MSRP with a second-hand price. */
export function hasCustomPrice(item: ScorableItem): boolean {
  return item.pricePaidUSD !== null && item.pricePaidUSD !== item.product.priceUSD;
}

/**
 * One inventory row's contribution to the score, legacy bonus included.
 * Rounded so scores stay whole numbers; Postgres ROUND() agrees with
 * Math.round() here because every value is positive.
 */
export function lineTotal(item: ScorableItem): number {
  const base = unitPrice(item) * item.quantity;
  return item.product.legacy ? Math.round(base * (1 + LEGACY_BONUS)) : base;
}

/** The bonus portion alone, for showing "+N legacy bonus" in the UI. */
export function legacyBonus(item: ScorableItem): number {
  if (!item.product.legacy) return 0;
  return lineTotal(item) - unitPrice(item) * item.quantity;
}

export function calculateScore(items: readonly ScorableItem[]): number {
  return items.reduce((total, item) => total + lineTotal(item), 0);
}

export function countProducts(items: readonly { quantity: number }[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/** Score thresholds that trigger a confetti celebration. */
export const MILESTONES = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000] as const;

/** The highest milestone crossed when moving from `previous` to `next`, if any. */
export function milestoneReached(previous: number, next: number): number | null {
  let reached: number | null = null;
  for (const milestone of MILESTONES) {
    if (previous < milestone && next >= milestone) reached = milestone;
  }
  return reached;
}

export type CategoryBreakdown = {
  category: Category;
  total: number;
  units: number;
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
    .sort((a, b) => b.total - a.total);
}
