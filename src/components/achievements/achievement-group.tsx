import { GROUP_LABEL, getAchievementDefinition, type AchievementGroup } from "@/lib/achievements";
import { formatNumber, pluralize } from "@/lib/utils";
import { AchievementCard } from "@/components/achievement-card";
import { isUnlocked, type AchievementView } from "@/components/achievements/types";

type AchievementGroupSectionProps = {
  group: AchievementGroup;
  /** Views in this group that pass the current filters. */
  views: AchievementView[];
  /** Every view in this group, for the x/y unlocked tally. */
  all: AchievementView[];
  signedIn: boolean;
  /** Id to highlight as freshly earned. */
  fresh: string | null;
};

/** Element id of the card for an achievement, for `?fresh=` scrolling. */
export function achievementElementId(id: string): string {
  return `achievement-${id}`;
}

export function AchievementGroupSection({
  group,
  views,
  all,
  signedIn,
  fresh,
}: AchievementGroupSectionProps) {
  const unlocked = all.filter(isUnlocked).length;
  const headingId = `achievements-${group}`;

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={headingId} className="text-xl font-semibold tracking-tight">
          {GROUP_LABEL[group]}
        </h3>
        <p className="tabular shrink-0 text-sm text-muted-foreground">
          {signedIn
            ? `${formatNumber(unlocked)}/${formatNumber(all.length)} unlocked`
            : pluralize(all.length, "achievement")}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {views.map((view, index) => {
          const definition = getAchievementDefinition(view.id);
          if (!definition) return null;
          const unlockedAt = view.unlockedAt ? new Date(view.unlockedAt) : null;
          const isFresh = fresh === view.id && unlockedAt !== null;
          return (
            <li
              key={view.id}
              id={achievementElementId(view.id)}
              tabIndex={isFresh ? -1 : undefined}
              className="animate-enter-up scroll-mt-24 rounded-xl"
              style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
            >
              <AchievementCard
                definition={definition}
                unlockedAt={unlockedAt}
                progress={view.progress}
                holderShare={view.holderShare}
                fresh={isFresh}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
