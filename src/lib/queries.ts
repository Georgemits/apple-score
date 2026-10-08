import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma, Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  breakdownByCategory,
  calculateScore,
  countProducts,
  lineTotal,
  tierFor,
  unitPrice,
  type Tier,
} from "@/lib/score";
import { ACHIEVEMENTS } from "@/lib/achievements";

/* -------------------------------------------------------------------------
 * Inventory & stats
 * ---------------------------------------------------------------------- */

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
  /** The single priciest unit, by unit price. */
  priciestUnit: InventoryItem | null;
  topCategory: Category | null;
  breakdown: ReturnType<typeof breakdownByCategory>;
  averageUnitPrice: number;
  /** Oldest and newest products by release year. */
  oldest: InventoryItem | null;
  newest: InventoryItem | null;
  legacyUnits: number;
  familyCount: number;
  tier: Tier;
};

export function summarize(items: readonly InventoryItem[]): UserStats {
  const breakdown = breakdownByCategory(items);
  const score = calculateScore(items);
  const productCount = countProducts(items);

  const mostValuable =
    items.length === 0
      ? null
      : items.reduce((best, item) => (lineTotal(item) > lineTotal(best) ? item : best));

  const priciestUnit =
    items.length === 0
      ? null
      : items.reduce((best, item) => (unitPrice(item) > unitPrice(best) ? item : best));

  const oldest =
    items.length === 0
      ? null
      : items.reduce((best, item) => (item.product.year < best.product.year ? item : best));

  const newest =
    items.length === 0
      ? null
      : items.reduce((best, item) => (item.product.year > best.product.year ? item : best));

  return {
    score,
    productCount,
    distinctProducts: items.length,
    mostValuable,
    priciestUnit,
    topCategory: breakdown[0]?.category ?? null,
    breakdown,
    averageUnitPrice: productCount === 0 ? 0 : Math.round(score / productCount),
    oldest,
    newest,
    legacyUnits: items
      .filter((item) => item.product.legacy)
      .reduce((n, item) => n + item.quantity, 0),
    familyCount: new Set(items.map((item) => item.product.family)).size,
    tier: tierFor(score),
  };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  return summarize(await getInventory(userId));
}

/* -------------------------------------------------------------------------
 * Catalogue
 * ---------------------------------------------------------------------- */

export type CatalogueProduct = Prisma.ProductGetPayload<Record<string, never>>;

/**
 * The full product catalogue. Small and static — cached for a minute and
 * tagged so the seed/admin flows can bust it with `revalidateTag("catalogue")`.
 */
const getCachedCatalogue = unstable_cache(
  async (): Promise<CatalogueProduct[]> =>
    prisma.product.findMany({
      orderBy: [{ year: "desc" }, { priceUSD: "desc" }, { name: "asc" }],
    }),
  ["catalogue"],
  { revalidate: 60, tags: ["catalogue"] }
);

export async function getCatalogue(): Promise<CatalogueProduct[]> {
  // The cache round-trips through JSON, which turns Dates into strings.
  const rows = await getCachedCatalogue();
  return rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt) }));
}

export const getProductBySlug = cache(async (slug: string) =>
  prisma.product.findUnique({ where: { slug } })
);

export type ProductOwner = PublicUser & { quantity: number };

/** Public collectors who own a product, most units first. */
export async function getProductOwners(productId: string, take = 6): Promise<ProductOwner[]> {
  const rows = await prisma.userProduct.findMany({
    where: { productId, quantity: { gt: 0 }, user: { isPublic: true } },
    include: { user: { select: PUBLIC_USER_SELECT } },
    orderBy: [{ quantity: "desc" }, { createdAt: "asc" }],
    take,
  });
  return rows.map((row) => ({ ...row.user, quantity: row.quantity }));
}

/** Which catalogue entries a user already owns, and how many. */
export async function getOwnedQuantities(userId: string): Promise<Record<string, number>> {
  const rows = await prisma.userProduct.findMany({
    where: { userId, quantity: { gt: 0 } },
    select: { productId: true, quantity: true },
  });
  return Object.fromEntries(rows.map((row) => [row.productId, row.quantity]));
}

/** How many users own each product — for "owned by N collectors" and rarity. */
export const getOwnershipCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const rows = await prisma.userProduct.groupBy({
      by: ["productId"],
      where: { quantity: { gt: 0 }, user: { isPublic: true } },
      _count: { userId: true },
    });
    return Object.fromEntries(rows.map((row) => [row.productId, row._count.userId]));
  },
  ["ownership-counts"],
  { revalidate: 60, tags: ["community"] }
);

/* -------------------------------------------------------------------------
 * Profiles
 * ---------------------------------------------------------------------- */

export type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarEmoji: string | null;
  avatarHue: number | null;
  isPublic: boolean;
  createdAt: Date;
};

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarEmoji: true,
  avatarHue: true,
  isPublic: true,
  createdAt: true,
} as const;

/** Wrapped in `cache` so a page and its `generateMetadata` share one query. */
export const getUserByUsername = cache(async (username: string): Promise<PublicUser | null> => {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: PUBLIC_USER_SELECT,
  });
});

export const getUserById = cache(async (id: string): Promise<PublicUser | null> => {
  return prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
});

export type Profile = {
  user: PublicUser;
  items: InventoryItem[];
  stats: UserStats;
};

/**
 * A profile as it may be shown to `viewerId`. Private profiles are only
 * returned to their owner.
 */
export const getProfile = cache(
  async (username: string, viewerId: string | null): Promise<Profile | null> => {
    const user = await getUserByUsername(username);
    if (!user) return null;
    if (!user.isPublic && user.id !== viewerId) return null;

    const items = await getInventory(user.id);
    return { user, items, stats: summarize(items) };
  }
);

/* -------------------------------------------------------------------------
 * Activity & history
 * ---------------------------------------------------------------------- */

export type ActivityItem = Prisma.ActivityEventGetPayload<{
  include: { product: { select: { slug: true; image: true; category: true } } };
}>;

/** Most recent inventory changes, newest first. */
export async function getActivity(userId: string, take = 8): Promise<ActivityItem[]> {
  return prisma.activityEvent.findMany({
    where: { userId },
    include: { product: { select: { slug: true, image: true, category: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export type ScorePoint = { at: Date; score: number };

/**
 * The score over time: a point at account creation plus one per event. The
 * series is monotone in time and ends at the current score.
 */
export async function getScoreHistory(userId: string): Promise<ScorePoint[]> {
  const [user, events] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.activityEvent.findMany({
      where: { userId },
      select: { createdAt: true, scoreAfter: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!user) return [];

  return [
    { at: user.createdAt, score: 0 },
    ...events.map((event) => ({ at: event.createdAt, score: event.scoreAfter })),
  ];
}

/** Distinct calendar days (UTC) on which the user changed their collection. */
export async function getActiveDays(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ days: number }[]>`
    SELECT COUNT(DISTINCT DATE_TRUNC('day', "createdAt"))::int AS "days"
    FROM "ActivityEvent"
    WHERE "userId" = ${userId}
  `;
  return rows[0]?.days ?? 0;
}

/** Score change over the last `days` days, from the event log. */
export async function getRecentDelta(userId: string, days = 7): Promise<number> {
  const result = await prisma.activityEvent.aggregate({
    where: { userId, createdAt: { gt: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
    _sum: { scoreDelta: true },
  });
  return result._sum.scoreDelta ?? 0;
}

/* -------------------------------------------------------------------------
 * Social
 * ---------------------------------------------------------------------- */

export type FollowCounts = { followers: number; following: number };

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const row = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
    select: { followerId: true },
  });
  return row !== null;
}

/** Public users a user follows, newest follow first. */
export async function getFollowing(userId: string, take = 50): Promise<PublicUser[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId, following: { isPublic: true } },
    include: { following: { select: PUBLIC_USER_SELECT } },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((row) => row.following);
}

export async function getFollowers(userId: string, take = 50): Promise<PublicUser[]> {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId, follower: { isPublic: true } },
    include: { follower: { select: PUBLIC_USER_SELECT } },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((row) => row.follower);
}

/* -------------------------------------------------------------------------
 * Wishlist
 * ---------------------------------------------------------------------- */

export type WishlistEntry = Prisma.WishlistItemGetPayload<{ include: { product: true } }>;

export async function getWishlist(userId: string): Promise<WishlistEntry[]> {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWishlistIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return new Set(rows.map((row) => row.productId));
}

/* -------------------------------------------------------------------------
 * Achievements
 * ---------------------------------------------------------------------- */

export type UnlockedAchievement = { achievementId: string; unlockedAt: Date };

export async function getUnlockedAchievements(userId: string): Promise<UnlockedAchievement[]> {
  return prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
    orderBy: { unlockedAt: "desc" },
  });
}

export type AchievementRarityMap = Record<string, { holders: number; share: number }>;

/** How many public users hold each achievement, as a share of all public users. */
export const getAchievementRarity = unstable_cache(
  async (): Promise<{ totalUsers: number; byId: AchievementRarityMap }> => {
    const [totalUsers, rows] = await Promise.all([
      prisma.user.count({ where: { isPublic: true } }),
      prisma.userAchievement.groupBy({
        by: ["achievementId"],
        where: { user: { isPublic: true } },
        _count: { userId: true },
      }),
    ]);

    const byId: AchievementRarityMap = {};
    for (const definition of ACHIEVEMENTS) {
      byId[definition.id] = { holders: 0, share: 0 };
    }
    for (const row of rows) {
      byId[row.achievementId] = {
        holders: row._count.userId,
        share: totalUsers === 0 ? 0 : row._count.userId / totalUsers,
      };
    }
    return { totalUsers, byId };
  },
  ["achievement-rarity"],
  { revalidate: 60, tags: ["community"] }
);

/* -------------------------------------------------------------------------
 * Community
 * ---------------------------------------------------------------------- */

export type CommunityStats = {
  users: number;
  /** Users with at least one product. */
  collectors: number;
  products: number;
  /** Dollars tracked across every public collection. */
  totalDollars: number;
  /** Mean score across collectors with something owned. */
  averageScore: number;
  /** Total units tracked. */
  totalUnits: number;
};

export const getCommunityStats = unstable_cache(
  async (): Promise<CommunityStats> => {
    const [users, products, rows] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.$queryRaw<{ collectors: number; total: number; units: number }[]>`
        WITH per_user AS (
          SELECT up."userId",
                 SUM(COALESCE(up."pricePaidUSD", p."priceUSD") * up."quantity") AS "score",
                 SUM(up."quantity") AS "units"
          FROM "UserProduct" up
          JOIN "Product" p ON p."id" = up."productId"
          JOIN "User" u ON u."id" = up."userId"
          WHERE up."quantity" > 0 AND u."isPublic" = true
          GROUP BY up."userId"
        )
        SELECT COUNT(*)::int AS "collectors",
               COALESCE(SUM("score"), 0)::bigint::int AS "total",
               COALESCE(SUM("units"), 0)::int AS "units"
        FROM per_user
      `,
    ]);

    const row = rows[0] ?? { collectors: 0, total: 0, units: 0 };
    return {
      users,
      collectors: row.collectors,
      products,
      totalDollars: row.total,
      averageScore: row.collectors === 0 ? 0 : Math.round(row.total / row.collectors),
      totalUnits: row.units,
    };
  },
  ["community-stats"],
  { revalidate: 60, tags: ["community"] }
);

/** Public usernames for the sitemap. */
export async function getPublicUsernames(
  take = 5000
): Promise<{ username: string; updatedAt: Date }[]> {
  return prisma.user.findMany({
    where: { isPublic: true },
    select: { username: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
    take,
  });
}

/** Search public users by username/display name prefix, for the follow box. */
export async function searchUsers(query: string, take = 8): Promise<PublicUser[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return prisma.user.findMany({
    where: {
      isPublic: true,
      OR: [
        { username: { contains: term } },
        { displayName: { contains: term, mode: "insensitive" } },
      ],
    },
    select: PUBLIC_USER_SELECT,
    orderBy: { username: "asc" },
    take,
  });
}
