import Link from "next/link";
import { Award } from "lucide-react";
import { ACHIEVEMENTS, RARITY_ORDER, getAchievementDefinition } from "@/lib/achievements";
import type { AchievementRarityMap, UnlockedAchievement } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import { AchievementCard } from "@/components/achievement-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProfileSection } from "@/components/profile/profile-section";
import { ShowMore } from "@/components/profile/show-more";

const PREVIEW = 6;

type AchievementsShowcaseProps = {
  unlocked: UnlockedAchievement[];
  rarity: AchievementRarityMap;
  isOwner: boolean;
  name: string;
  delay?: number;
  className?: string;
};

/** Unlocked achievements, rarest first, then newest. */
export function AchievementsShowcase({
  unlocked,
  rarity,
  isOwner,
  name,
  delay,
  className,
}: AchievementsShowcaseProps) {
  const entries = unlocked
    .flatMap((row) => {
      const definition = getAchievementDefinition(row.achievementId);
      return definition ? [{ definition, unlockedAt: row.unlockedAt }] : [];
    })
    .sort(
      (a, b) =>
        RARITY_ORDER.indexOf(b.definition.rarity) - RARITY_ORDER.indexOf(a.definition.rarity) ||
        b.unlockedAt.getTime() - a.unlockedAt.getTime()
    );

  const total = ACHIEVEMENTS.length;
  const preview = entries.slice(0, PREVIEW);
  const rest = entries.slice(PREVIEW);

  const card = (entry: (typeof entries)[number], index: number) => (
    <li
      key={entry.definition.id}
      className="min-w-0 animate-enter-up"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <AchievementCard
        definition={entry.definition}
        unlockedAt={entry.unlockedAt}
        progress={1}
        holderShare={rarity[entry.definition.id]?.share}
      />
    </li>
  );

  return (
    <ProfileSection
      id="profile-achievements"
      title="Achievements"
      description={`${formatNumber(entries.length)} of ${formatNumber(total)} unlocked`}
      icon={Award}
      href="/achievements"
      linkLabel={isOwner ? "All achievements" : "Browse all"}
      delay={delay}
      className={className}
      bodyClassName={entries.length === 0 ? "flex items-center" : undefined}
    >
      {entries.length === 0 ? (
        <EmptyState
          bare
          emoji="🏅"
          title="Nothing unlocked yet"
          description={
            isOwner
              ? "Your first product earns the first one. The rest take a little more spending."
              : `${name} hasn't unlocked anything yet. The first one is famously easy.`
          }
          action={
            isOwner ? (
              <Button asChild size="sm">
                <Link href="/catalog">Add a product</Link>
              </Button>
            ) : undefined
          }
          className="w-full py-6"
        />
      ) : (
        <ShowMore
          id="profile-achievements-grid"
          as="ul"
          ariaLabel="Unlocked achievements"
          className="grid gap-3 sm:grid-cols-2"
          moreCount={rest.length}
          label={`Show all ${formatNumber(entries.length)}`}
          more={rest.map((entry, index) => card(entry, index))}
        >
          {preview.map((entry, index) => card(entry, index))}
        </ShowMore>
      )}
    </ProfileSection>
  );
}
