import type * as React from "react";
import { Award } from "lucide-react";
import {
  ACHIEVEMENTS,
  RARITY_LABEL,
  type AchievementDefinition,
  type AchievementRarity,
} from "@/lib/achievements";
import { cn, formatNumber, formatRelative } from "@/lib/utils";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

export type RecentUnlock = { definition: AchievementDefinition; unlockedAt: Date };
export type UpcomingAchievement = { definition: AchievementDefinition; progress: number };

type AchievementsCardProps = {
  /** Most recent unlocks, newest first. */
  recent: RecentUnlock[];
  /** Locked, non-secret achievements closest to unlocking. */
  upNext: UpcomingAchievement[];
  unlockedCount: number;
  delay?: number;
};

const HALO: Record<AchievementRarity, string> = {
  common: "bg-secondary",
  uncommon: "bg-success/15",
  rare: "bg-accent/15",
  epic: "bg-fuchsia-500/15",
  legendary: "bg-gradient-to-br from-gold/35 to-orange-500/25",
};

const CHIP: Record<AchievementRarity, string> = {
  common: "bg-secondary text-muted-foreground",
  uncommon: "bg-success/12 text-success",
  rare: "bg-accent/12 text-accent",
  epic: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300",
  legendary: "bg-gold/15 text-amber-700 dark:text-amber-300",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </h3>
  );
}

/** Latest unlocks plus the three achievements nearest to unlocking, with bars. */
export function AchievementsCard({ recent, upNext, unlockedCount, delay }: AchievementsCardProps) {
  const total = ACHIEVEMENTS.length;

  return (
    <DashboardCard
      id="dashboard-achievements"
      title="Achievements"
      description={`${formatNumber(unlockedCount)} of ${formatNumber(total)} unlocked`}
      icon={Award}
      href="/achievements"
      delay={delay}
      bodyClassName="flex flex-col gap-5"
    >
      <div className="space-y-2">
        <SectionLabel>Recently unlocked</SectionLabel>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing unlocked yet. Your first product fixes that.
          </p>
        ) : (
          <ol className="-mx-2 space-y-1" aria-label="Recently unlocked achievements">
            {recent.map(({ definition, unlockedAt }) => (
              <li key={definition.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl text-lg",
                    HALO[definition.rarity]
                  )}
                  aria-hidden="true"
                >
                  {definition.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{definition.title}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        CHIP[definition.rarity]
                      )}
                    >
                      {RARITY_LABEL[definition.rarity]}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Unlocked{" "}
                    <time dateTime={unlockedAt.toISOString()}>{formatRelative(unlockedAt)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="space-y-2">
        <SectionLabel>Up next</SectionLabel>
        {upNext.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every achievement in sight is unlocked. We will think of more.
          </p>
        ) : (
          <ol className="-mx-2 space-y-1" aria-label="Achievements closest to unlocking">
            {upNext.map(({ definition, progress }) => {
              const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
              return (
                <li key={definition.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg grayscale"
                    aria-hidden="true"
                  >
                    {definition.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{definition.title}</p>
                      <span className="tabular shrink-0 text-xs text-muted-foreground">
                        {percent}%
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {definition.description}
                    </p>
                    <div
                      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${definition.title} progress`}
                    >
                      <span
                        className="block h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </DashboardCard>
  );
}
