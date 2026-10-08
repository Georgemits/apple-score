import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import {
  ACHIEVEMENTS,
  GROUP_LABEL,
  RARITY_LABEL,
  RARITY_ORDER,
  evaluateAchievements,
  getAchievementDefinition,
  type AchievementRarity,
} from "@/lib/achievements";
import { buildAchievementContext } from "@/lib/achievement-sync";
import { getAchievementRarity, getUnlockedAchievements } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AchievementCard } from "@/components/achievement-card";
import {
  AchievementsExplorer,
  type AchievementView,
} from "@/components/achievements/achievements-explorer";

export const metadata: Metadata = {
  title: "Achievements",
  description: `${ACHIEVEMENTS.length} achievements to earn by growing your Apple collection — from First Purchase to Apple Billionaire.`,
  alternates: { canonical: "/achievements" },
};

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ fresh?: string }> };

const RARITY_CHIP: Record<AchievementRarity, string> = {
  common: "bg-secondary text-muted-foreground",
  uncommon: "bg-success/12 text-success",
  rare: "bg-accent/12 text-accent",
  epic: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300",
  legendary: "bg-gold/15 text-amber-700 dark:text-amber-300",
};

export default async function AchievementsPage({ searchParams }: PageProps) {
  const [{ fresh }, session, rarity] = await Promise.all([
    searchParams,
    auth(),
    getAchievementRarity(),
  ]);
  const userId = session?.user?.id ?? null;

  const [evaluations, unlocked] = userId
    ? await Promise.all([
        buildAchievementContext(userId).then(evaluateAchievements),
        getUnlockedAchievements(userId),
      ])
    : [[], []];

  const progressById = new Map(evaluations.map((entry) => [entry.id, entry.progress]));
  const unlockedById = new Map(unlocked.map((row) => [row.achievementId, row.unlockedAt]));

  const views: AchievementView[] = ACHIEVEMENTS.map((definition) => ({
    id: definition.id,
    group: definition.group,
    rarity: definition.rarity,
    secret: Boolean(definition.secret),
    progress: progressById.get(definition.id) ?? 0,
    unlockedAt: unlockedById.get(definition.id)?.toISOString() ?? null,
    holderShare: rarity.byId[definition.id]?.share ?? 0,
  }));

  const unlockedCount = unlocked.length;
  const total = ACHIEVEMENTS.length;
  const percent = total === 0 ? 0 : Math.round((unlockedCount / total) * 100);

  const rarest = [...unlocked]
    .map((row) => ({ row, definition: getAchievementDefinition(row.achievementId) }))
    .filter((entry) => entry.definition)
    .sort(
      (a, b) =>
        (rarity.byId[a.row.achievementId]?.share ?? 0) - (rarity.byId[b.row.achievementId]?.share ?? 0) ||
        RARITY_ORDER.indexOf(b.definition!.rarity) - RARITY_ORDER.indexOf(a.definition!.rarity)
    )[0];

  const upNext = userId
    ? views
        .filter((view) => view.unlockedAt === null && !view.secret && view.progress > 0)
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 3)
    : [];

  const groupCount = Object.keys(GROUP_LABEL).length;

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow={`${total} to earn`}
        title="Achievements"
        description="Earned by what you own, how you collect and where you rank. Unlocks are permanent — even if you sell the Mac Pro."
      />

      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-gradient-to-br from-gold/25 to-fuchsia-500/15 blur-3xl"
        />
        {userId ? (
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Your progress
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  <span className="score-figure">{formatNumber(unlockedCount)}</span>
                  <span className="text-muted-foreground"> of {formatNumber(total)} unlocked</span>
                </p>
              </div>
              <div
                className="h-2.5 w-full max-w-md overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Achievements unlocked"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-fuchsia-500"
                  style={{ width: `${Math.max(percent, unlockedCount > 0 ? 2 : 0)}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {RARITY_ORDER.map((value) => {
                  const count = unlocked.filter(
                    (row) => getAchievementDefinition(row.achievementId)?.rarity === value
                  ).length;
                  const of = ACHIEVEMENTS.filter((definition) => definition.rarity === value).length;
                  return (
                    <span
                      key={value}
                      className={`tabular inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${RARITY_CHIP[value]}`}
                    >
                      {RARITY_LABEL[value]} {count}/{of}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="md:text-right">
              {rarest?.definition ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Rarest unlocked
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    <span aria-hidden="true">{rarest.definition.emoji}</span> {rarest.definition.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Held by {Math.max(1, Math.round((rarity.byId[rarest.row.achievementId]?.share ?? 0) * 100))}% of
                    collectors
                  </p>
                </>
              ) : (
                <p className="max-w-xs text-sm text-muted-foreground">
                  Nothing unlocked yet. Your first product earns the first one — it is not a high
                  bar.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {formatNumber(total)} achievements across {groupCount} groups.
              </p>
              <p className="mt-1 text-muted-foreground">
                Sign up, add what you own, and start unlocking. The first one takes about ten
                seconds.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/signup">
                Start unlocking
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}
      </Card>

      {upNext.length > 0 && (
        <section aria-labelledby="up-next" className="space-y-4">
          <h2 id="up-next" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Sparkles className="size-5 text-accent" aria-hidden="true" />
            Up next
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {upNext.map((view) => {
              const definition = getAchievementDefinition(view.id)!;
              return (
                <li key={view.id}>
                  <AchievementCard
                    definition={definition}
                    unlockedAt={null}
                    progress={view.progress}
                    holderShare={view.holderShare}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AchievementsExplorer achievements={views} signedIn={Boolean(userId)} fresh={fresh ?? null} />
    </div>
  );
}
