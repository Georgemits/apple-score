import "server-only";

import { cache } from "react";
import type { Category, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { breakdownByCategory, calculateScore, countProducts } from "@/lib/score";

export type InventoryItem = Prisma.UserProductGetPayload<{ include: { product: true } }>;

/** Everything a user owns, newest change first. */
export async function getInventory(userId: string): Promise<InventoryItem[]> {
  return prisma.userProduct.findMany({
    where: { userId, quantity: { gt: 0 } },
    include: { product: true },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export type UserStats = {
  score: number;
  productCount: number;
  distinctProducts: number;
  mostValuable: InventoryItem | null;
  topCategory: Category | null;
  breakdown: ReturnType<typeof breakdownByCategory>;
};

export function summarize(items: readonly InventoryItem[]): UserStats {
  const breakdown = breakdownByCategory(items);
  const mostValuable =
    items.length === 0
      ? null
      : items.reduce((best, item) =>
          item.product.priceUSD * item.quantity > best.product.priceUSD * best.quantity ? item : best
        );

  return {
    score: calculateScore(items),
    productCount: countProducts(items),
    distinctProducts: items.length,
    mostValuable,
    topCategory: breakdown[0]?.category ?? null,
    breakdown,
  };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  return summarize(await getInventory(userId));
}

/** The full product catalogue. Small and static — fetched in one go. */
export async function getCatalogue() {
  return prisma.product.findMany({
    orderBy: [{ year: "desc" }, { priceUSD: "desc" }, { name: "asc" }],
  });
}

/** Which catalogue entries the signed-in user already owns, and how many. */
export async function getOwnedQuantities(userId: string): Promise<Record<string, number>> {
  const rows = await prisma.userProduct.findMany({
    where: { userId },
    select: { productId: true, quantity: true },
  });

  return Object.fromEntries(rows.map((row) => [row.productId, row.quantity]));
}

export type LeaderboardRow = {
  id: string;
  username: string;
  createdAt: Date;
  score: number;
  productCount: number;
  distinctProducts: number;
  rank: number;
  totalUsers: number;
};

export type Leaderboard = {
  rows: LeaderboardRow[];
  totalUsers: number;
  /** User ids that hold the "Rich Millionaire" badge. */
  topUserIds: string[];
  /** User ids that hold the (playful) "Broke Alert" badge. */
  bottomUserIds: string[];
};

/**
 * Ranks every registered user by Apple Score.
 *
 * Aggregating `priceUSD * quantity` is not expressible with Prisma's typed
 * `groupBy`, so this uses a single window-function query instead of loading
 * every inventory row into memory.
 */
export async function getLeaderboard(): Promise<Leaderboard> {
  const rows = await prisma.$queryRaw<LeaderboardRow[]>`
    WITH scores AS (
      SELECT
        u."id",
        u."username",
        u."createdAt",
        COALESCE(SUM(p."priceUSD" * up."quantity"), 0)::int AS "score",
        COALESCE(SUM(up."quantity"), 0)::int            AS "productCount",
        COUNT(up."id")::int                              AS "distinctProducts"
      FROM "User" u
      LEFT JOIN "UserProduct" up ON up."userId" = u."id" AND up."quantity" > 0
      LEFT JOIN "Product" p ON p."id" = up."productId"
      GROUP BY u."id", u."username", u."createdAt"
    )
    SELECT
      s.*,
      RANK() OVER (ORDER BY s."score" DESC)::int AS "rank",
      COUNT(*) OVER ()::int                      AS "totalUsers"
    FROM scores s
    ORDER BY "rank" ASC, s."createdAt" ASC
  `;

  const totalUsers = rows[0]?.totalUsers ?? 0;

  const scores = rows.map((row) => row.score);
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  const highest = scores.length > 0 ? Math.max(...scores) : 0;

  // Both badges need at least two people and an actual spread — otherwise the
  // same person would be crowned and mocked at once, and a lone user would be
  // told they are last.
  const contested = totalUsers >= 2 && lowest < highest;

  const topUserIds = contested
    ? rows.filter((row) => row.score === highest).map((row) => row.id)
    : [];

  const bottomUserIds = contested
    ? rows.filter((row) => row.score === lowest).map((row) => row.id)
    : [];

  return { rows, totalUsers, topUserIds, bottomUserIds };
}

/** Wrapped in `cache` so a page and its `generateMetadata` share one query. */
export const getPublicProfile = cache(async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, createdAt: true },
  });

  if (!user) return null;

  const items = await getInventory(user.id);
  return { user, items, stats: summarize(items) };
});

/** Most recent inventory changes, used for the activity feed. */
export async function getRecentActivity(userId: string, take = 5): Promise<InventoryItem[]> {
  return prisma.userProduct.findMany({
    where: { userId, quantity: { gt: 0 } },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export type RankSummary = { rank: number; totalUsers: number };

/**
 * A single user's standing, without materialising the whole leaderboard.
 * Uses the same competition ranking as {@link getLeaderboard}.
 */
export async function getUserRank(userId: string): Promise<RankSummary | null> {
  const rows = await prisma.$queryRaw<RankSummary[]>`
    WITH scores AS (
      SELECT
        u."id",
        COALESCE(SUM(p."priceUSD" * up."quantity"), 0)::int AS "score"
      FROM "User" u
      LEFT JOIN "UserProduct" up ON up."userId" = u."id" AND up."quantity" > 0
      LEFT JOIN "Product" p ON p."id" = up."productId"
      GROUP BY u."id"
    )
    SELECT
      ((SELECT COUNT(*) FROM scores s WHERE s."score" > me."score") + 1)::int AS "rank",
      (SELECT COUNT(*) FROM scores)::int                                      AS "totalUsers"
    FROM scores me
    WHERE me."id" = ${userId}
  `;

  return rows[0] ?? null;
}
