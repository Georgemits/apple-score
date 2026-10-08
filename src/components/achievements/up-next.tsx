import { Sparkles } from "lucide-react";
import type { AchievementDefinition } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievement-card";

export type UpNextItem = {
  definition: AchievementDefinition;
  /** 0–1, strictly below 1. */
  progress: number;
  holderShare: number;
};

type UpNextProps = {
  items: UpNextItem[];
};

/** The locked, non-secret achievements nearest to unlocking, with bars. */
export function UpNext({ items }: UpNextProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="up-next" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <h2 id="up-next" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="size-5 text-accent" aria-hidden="true" />
          Up next
        </h2>
        <p className="text-sm text-muted-foreground">
          The {items.length === 1 ? "one" : "ones"} you&apos;re closest to.
        </p>
      </div>

      <ol
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label="Achievements closest to unlocking"
      >
        {items.map(({ definition, progress, holderShare }, index) => {
          const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
          return (
            <li
              key={definition.id}
              className="flex animate-enter-up flex-col gap-1.5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <p className="tabular px-1 text-xs font-medium text-muted-foreground">
                {percent === 0 ? "Not started" : `${percent}% there`}
              </p>
              <AchievementCard
                definition={definition}
                unlockedAt={null}
                progress={progress}
                holderShare={holderShare}
                className="flex-1"
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
