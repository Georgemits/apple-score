import type { Category } from "@prisma/client";

/**
 * Apple Score = Σ(product MSRP × quantity).
 *
 * The canonical definition lives here so the UI, the server actions and the
 * leaderboard query all agree on one formula.
 */
export type ScorableItem = {
  quantity: number;
  product: { priceUSD: number };
};

export function calculateScore(items: readonly ScorableItem[]): number {
  return items.reduce((total, item) => total + item.product.priceUSD * item.quantity, 0);
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
      total: current.total + item.product.priceUSD * item.quantity,
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
