import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENTS,
  unlockedIds,
  type AchievementContext,
  type AchievementDefinition,
  type AchievementGroup,
} from "@/lib/achievements";
import { getStanding } from "@/lib/leaderboard";
import { getActiveDays, getFollowCounts, getInventory, summarize } from "@/lib/queries";

/** Everything the achievement rules need, gathered from authoritative data. */
export async function buildAchievementContext(userId: string): Promise<AchievementContext> {
  const [items, standing, follows, activeDays] = await Promise.all([
    getInventory(userId),
    getStanding(userId),
    getFollowCounts(userId),
    getActiveDays(userId),
  ]);
  const stats = summarize(items);

  return {
    score: stats.score,
    productCount: stats.productCount,
    distinctProducts: stats.distinctProducts,
    items,
    breakdown: stats.breakdown,
    rank: standing?.me.rank ?? null,
    totalUsers: standing?.me.total ?? 0,
    followers: follows.followers,
    following: follows.following,
    activeDays,
  };
}

/**
 * A context that carries only follow counts. Enough for the social group,
 * and far cheaper than the full ranking query a follow does not change.
 */
export async function buildSocialContext(userId: string): Promise<AchievementContext> {
  const follows = await getFollowCounts(userId);
  return {
    score: 0,
    productCount: 0,
    distinctProducts: 0,
    items: [],
    breakdown: [],
    rank: null,
    totalUsers: 0,
    followers: follows.followers,
    following: follows.following,
    activeDays: 0,
  };
}

export const SOCIAL_GROUPS: readonly AchievementGroup[] = ["social"];

export type UnlockSummary = Pick<AchievementDefinition, "id" | "title" | "emoji" | "rarity">;

export type SyncOptions = {
  /** A context already built for this request, so it is not rebuilt. */
  context?: AchievementContext;
  /** Evaluate only these groups; pair with a context built for them. */
  only?: readonly AchievementGroup[];
};

/**
 * Evaluates achievements for the user and records any that are newly earned.
 * Returns the definitions unlocked by this call, in catalogue order, so the
 * caller can celebrate them. Unlocks are never revoked.
 */
export async function syncAchievements(
  userId: string,
  options: SyncOptions = {}
): Promise<UnlockSummary[]> {
  const resolved = options.context ?? (await buildAchievementContext(userId));
  const earned = new Set(unlockedIds(resolved, options.only));
  if (earned.size === 0) return [];

  const existing = await prisma.userAchievement.findMany({
    where: { userId, achievementId: { in: [...earned] } },
    select: { achievementId: true },
  });
  const have = new Set(existing.map((row) => row.achievementId));

  const fresh = ACHIEVEMENTS.filter(
    (definition) => earned.has(definition.id) && !have.has(definition.id)
  );
  if (fresh.length === 0) return [];

  await prisma.userAchievement.createMany({
    data: fresh.map((definition) => ({ userId, achievementId: definition.id })),
    skipDuplicates: true,
  });

  return fresh.map(({ id, title, emoji, rarity }) => ({ id, title, emoji, rarity }));
}
