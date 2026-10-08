import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChartPie, PackagePlus, Share2, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getActivity,
  getCatalogue,
  getInventory,
  getOwnershipCounts,
  getRecentDelta,
  getScoreHistory,
  getUnlockedAchievements,
  getUserById,
  getWishlist,
  summarize,
} from "@/lib/queries";
import { getPodium, getStanding } from "@/lib/leaderboard";
import { nextMilestone } from "@/lib/score";
import { evaluateAchievements, getAchievementDefinition, RARITY_ORDER } from "@/lib/achievements";
import { buildAchievementContext } from "@/lib/achievement-sync";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { pluralize, profileName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScoreHero } from "@/components/score-hero";
import { Sparkline } from "@/components/charts/sparkline";
import { CategoryDonut } from "@/components/charts/category-donut";
import { Podium } from "@/components/podium";
import { EmptyState } from "@/components/empty-state";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatsRow } from "@/components/dashboard/stats-row";
import { StandingCard } from "@/components/dashboard/standing-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  AchievementsCard,
  type RecentUnlock,
  type UpcomingAchievement,
} from "@/components/dashboard/achievements-card";
import { WishlistCard } from "@/components/dashboard/wishlist-card";
import { QuickAddGrid, type QuickAddProduct } from "@/components/dashboard/quick-add";
import { dayOfYear, heroTitle } from "@/components/dashboard/hero-copy";

export const metadata: Metadata = {
  title: "Home",
  description: `Your Apple Score, your standing on ${LEADERBOARD_NAME}, and what to add next.`,
};

export const dynamic = "force-dynamic";

const RECENT_UNLOCKS = 3;
const UP_NEXT = 3;
const QUICK_ADD = 4;

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/home");
  const userId = session.user.id;

  const [
    items,
    standing,
    weekDelta,
    history,
    activity,
    unlocked,
    wishlist,
    catalogue,
    ownership,
    user,
    account,
    achievementContext,
  ] = await Promise.all([
    getInventory(userId),
    getStanding(userId),
    getRecentDelta(userId, 7),
    getScoreHistory(userId),
    getActivity(userId, 6),
    getUnlockedAchievements(userId),
    getWishlist(userId),
    getCatalogue(),
    getOwnershipCounts(),
    getUserById(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { onboardedAt: true } }),
    buildAchievementContext(userId),
  ]);

  // The session outlived the account.
  if (!user) redirect("/login?callbackUrl=/home");

  const stats = summarize(items);
  const name = profileName(user);

  /* ---------------------------------------------------------------- Quick add */
  const ownedIds = new Set(items.map((item) => item.productId));
  const quickAdd: QuickAddProduct[] = catalogue
    .filter((product) => !ownedIds.has(product.id))
    .map((product) => ({ product, holders: ownership[product.id] ?? 0 }))
    .sort(
      (a, b) =>
        b.holders - a.holders ||
        b.product.year - a.product.year ||
        a.product.name.localeCompare(b.product.name)
    )
    .slice(0, QUICK_ADD)
    .map(({ product, holders }) => ({
      id: product.id,
      name: product.name,
      priceUSD: product.priceUSD,
      image: product.image,
      category: product.category,
      holders,
    }));

  const quickAddCard = (delay: number) => (
    <DashboardCard
      id="dashboard-quick-add"
      title="Quick add"
      description="Popular with other collectors, missing from yours. One tap each."
      icon={Sparkles}
      href="/catalog"
      linkLabel="Catalogue"
      className="lg:col-span-3"
      delay={delay}
      bodyClassName={quickAdd.length === 0 ? "flex items-center" : undefined}
    >
      {quickAdd.length === 0 ? (
        <EmptyState
          bare
          emoji="🧹"
          title="You own all the popular stuff"
          description="Nothing left to suggest. The catalogue has deeper cuts."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/catalog">Browse the catalogue</Link>
            </Button>
          }
          className="w-full py-6"
        />
      ) : (
        <QuickAddGrid products={quickAdd} />
      )}
    </DashboardCard>
  );

  /* --------------------------------------------------------- Empty collection */
  if (items.length === 0) {
    const podium = await getPodium("overall");

    return (
      <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <WelcomeCard name={name} showSetup={account?.onboardedAt === null} />

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <DashboardCard
            id="dashboard-podium"
            title="Who's winning right now"
            description={`The top of ${LEADERBOARD_NAME}. Your name goes here eventually.`}
            icon={Trophy}
            href="/leaderboard"
            linkLabel="Full board"
            className="lg:col-span-3"
            delay={60}
            bodyClassName={podium.length === 0 ? "flex items-center" : "pt-2"}
          >
            {podium.length === 0 ? (
              <EmptyState
                bare
                emoji="🏁"
                title="The board is empty"
                description="First to add a product takes #1. No pressure."
                className="w-full py-6"
              />
            ) : (
              <Podium rows={podium} currentUserId={userId} />
            )}
          </DashboardCard>

          {quickAddCard(120)}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- Achievements */
  const unlockedIds = new Set(unlocked.map((row) => row.achievementId));
  const recentUnlocks: RecentUnlock[] = unlocked.slice(0, RECENT_UNLOCKS).flatMap((row) => {
    const definition = getAchievementDefinition(row.achievementId);
    return definition ? [{ definition, unlockedAt: row.unlockedAt }] : [];
  });
  const upNext: UpcomingAchievement[] = evaluateAchievements(achievementContext)
    .filter((evaluation) => !evaluation.unlocked && !unlockedIds.has(evaluation.id))
    .flatMap((evaluation) => {
      const definition = getAchievementDefinition(evaluation.id);
      return definition && !definition.secret
        ? [{ definition, progress: evaluation.progress }]
        : [];
    })
    .sort(
      (a, b) =>
        b.progress - a.progress ||
        RARITY_ORDER.indexOf(a.definition.rarity) - RARITY_ORDER.indexOf(b.definition.rarity)
    )
    .slice(0, UP_NEXT);

  /* ------------------------------------------------------------------- Hero */
  const milestone = nextMilestone(stats.score);
  const points = history.map((point) => ({ at: point.at.getTime(), score: point.score }));
  const changes = Math.max(0, history.length - 1);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <ScoreHero
        eyebrow={`Welcome back, ${name}`}
        title={heroTitle(stats.tier, dayOfYear() + user.username.length)}
        score={stats.score}
        tier={stats.tier}
        rank={
          standing
            ? {
                rank: standing.me.rank,
                total: standing.me.total,
                percentile: standing.percentile,
                movement: standing.me.movement,
                isNew: standing.me.isNew,
              }
            : null
        }
        weekDelta={weekDelta}
        milestone={milestone}
        footnote={`${pluralize(stats.productCount, "product")} across ${pluralize(stats.breakdown.length, "category", "categories")}.`}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/catalog">
                <PackagePlus aria-hidden="true" />
                Add product
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/leaderboard">
                <Trophy aria-hidden="true" />
                {LEADERBOARD_NAME}
              </Link>
            </Button>
            {user.isPublic && (
              <Button asChild size="lg" variant="ghost">
                <Link href={`/u/${user.username}/card`}>
                  <Share2 aria-hidden="true" />
                  Share
                </Link>
              </Button>
            )}
          </>
        }
        aside={
          <div className="rounded-2xl border border-border/70 bg-background/50 p-4 backdrop-blur">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Score over time
              </p>
              <p className="tabular text-xs text-muted-foreground">
                {pluralize(changes, "change")}
              </p>
            </div>
            <Sparkline
              className="mt-3"
              points={points}
              height={120}
              showScale
              label="Your Apple Score over time"
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Standing comes right after the hero on phones; the stats row jumps
            above it on wide screens via order-first. */}
        <StandingCard
          standing={standing}
          currentUserId={userId}
          isPrivate={!user.isPublic}
          delay={0}
        />

        <StatsRow stats={stats} className="lg:order-first lg:col-span-3" />

        <DashboardCard
          id="dashboard-categories"
          title="Spending by category"
          description="Where the money went."
          icon={ChartPie}
          href="/collection"
          linkLabel="Collection"
          className="lg:col-span-2"
          delay={60}
          bodyClassName="flex items-center"
        >
          <CategoryDonut breakdown={stats.breakdown} className="w-full" />
        </DashboardCard>

        <ActivityFeed items={activity} delay={120} />

        <AchievementsCard
          recent={recentUnlocks}
          upNext={upNext}
          unlockedCount={unlocked.length}
          delay={180}
        />

        <WishlistCard items={wishlist} score={stats.score} delay={240} />

        {quickAddCard(240)}
      </div>
    </div>
  );
}
