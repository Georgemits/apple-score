import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  ACHIEVEMENTS,
  GROUP_LABEL,
  RARITY_ORDER,
  evaluateAchievements,
  getAchievementDefinition,
} from "@/lib/achievements";
import { buildAchievementContext } from "@/lib/achievement-sync";
import { getAchievementRarity, getUnlockedAchievements } from "@/lib/queries";
import { firstParam, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { AchievementsExplorer } from "@/components/achievements/achievements-explorer";
import {
  SummaryCard,
  type MemberSummary,
  type RaritySummary,
} from "@/components/achievements/summary-card";
import { UpNext, type UpNextItem } from "@/components/achievements/up-next";
import type { AchievementView } from "@/components/achievements/types";

const TOTAL = ACHIEVEMENTS.length;
const GROUP_COUNT = Object.keys(GROUP_LABEL).length;
const SECRET_COUNT = ACHIEVEMENTS.filter((definition) => definition.secret).length;
const UP_NEXT = 3;

export const metadata: Metadata = {
  title: "Achievements",
  description: `${TOTAL} achievements to earn across ${GROUP_COUNT} groups, from First Purchase to Apple Billionaire. Unlock them by growing your Apple collection.`,
  alternates: { canonical: "/achievements" },
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type PageProps = { searchParams: Promise<SearchParams> };

function rarityRank(rarity: AchievementView["rarity"]): number {
  return RARITY_ORDER.indexOf(rarity);
}

export default async function AchievementsPage({ searchParams }: PageProps) {
  const [params, session, rarity] = await Promise.all([
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

  // Plain data for the client; the definition itself is looked up by id there.
  const views: AchievementView[] = ACHIEVEMENTS.map((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    emoji: definition.emoji,
    rarity: definition.rarity,
    group: definition.group,
    secret: definition.secret === true,
    progress: progressById.get(definition.id) ?? 0,
    unlockedAt: unlockedById.get(definition.id)?.toISOString() ?? null,
    holderShare: rarity.byId[definition.id]?.share ?? 0,
  }));

  // `?fresh=` only lights up a card the viewer has actually earned.
  const freshParam = firstParam(params.fresh);
  const fresh =
    freshParam && unlockedById.has(freshParam) && getAchievementDefinition(freshParam)
      ? freshParam
      : null;

  const unlockedViews = views.filter((view) => view.unlockedAt !== null);

  const member: MemberSummary | null = userId
    ? {
        unlockedCount: unlockedViews.length,
        byRarity: RARITY_ORDER.map((value): RaritySummary => ({
          rarity: value,
          unlocked: unlockedViews.filter((view) => view.rarity === value).length,
          total: views.filter((view) => view.rarity === value).length,
        })),
        rarest: rarestOf(unlockedViews),
      }
    : null;

  const upNext: UpNextItem[] = userId
    ? views
        .filter((view) => view.unlockedAt === null && !view.secret && view.progress < 1)
        .sort((a, b) => b.progress - a.progress || rarityRank(a.rarity) - rarityRank(b.rarity))
        .slice(0, UP_NEXT)
        .flatMap((view) => {
          const definition = getAchievementDefinition(view.id);
          return definition
            ? [{ definition, progress: view.progress, holderShare: view.holderShare }]
            : [];
        })
    : [];

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow={`${formatNumber(TOTAL)} to earn`}
        title="Achievements"
        description="Earned by what you own, how you collect and where you rank. Unlocks are permanent, even if you sell the Mac Pro."
      />

      <Reveal>
        <SummaryCard
          total={TOTAL}
          groupCount={GROUP_COUNT}
          secretCount={SECRET_COUNT}
          member={member}
        />
      </Reveal>

      {upNext.length > 0 && (
        <Reveal delay={0.06}>
          <UpNext items={upNext} />
        </Reveal>
      )}

      <Reveal delay={0.12}>
        <AchievementsExplorer achievements={views} signedIn={userId !== null} fresh={fresh} />
      </Reveal>
    </div>
  );
}

/** Fewest holders first; ties go to the higher rarity, then the newest unlock. */
function rarestOf(unlockedViews: AchievementView[]): MemberSummary["rarest"] {
  const rarest = [...unlockedViews].sort(
    (a, b) =>
      a.holderShare - b.holderShare ||
      rarityRank(b.rarity) - rarityRank(a.rarity) ||
      (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "")
  )[0];
  return rarest ? { title: rarest.title, emoji: rarest.emoji, share: rarest.holderShare } : null;
}
