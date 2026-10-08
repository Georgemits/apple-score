"use client";

import * as React from "react";
import { SearchX } from "lucide-react";
import {
  GROUP_LABEL,
  RARITY_LABEL,
  RARITY_ORDER,
  getAchievementDefinition,
  type AchievementGroup,
  type AchievementRarity,
} from "@/lib/achievements";
import { cn, formatNumber } from "@/lib/utils";
import { AchievementCard } from "@/components/achievement-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export type AchievementView = {
  id: string;
  group: AchievementGroup;
  rarity: AchievementRarity;
  secret: boolean;
  /** 0–1; 0 for guests. */
  progress: number;
  /** ISO timestamp, or null when locked. */
  unlockedAt: string | null;
  holderShare: number;
};

type Status = "all" | "unlocked" | "locked";

type AchievementsExplorerProps = {
  achievements: AchievementView[];
  signedIn: boolean;
  /** Id to highlight as freshly earned (from `?fresh=`). */
  fresh?: string | null;
};

function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("tabular text-xs", active ? "opacity-70" : "opacity-60")}>{count}</span>
      )}
    </button>
  );
}

export function AchievementsExplorer({ achievements, signedIn, fresh }: AchievementsExplorerProps) {
  const [status, setStatus] = React.useState<Status>("all");
  const [rarity, setRarity] = React.useState<AchievementRarity | "all">("all");
  const [group, setGroup] = React.useState<AchievementGroup | "all">("all");

  const groups = React.useMemo(
    () => (Object.keys(GROUP_LABEL) as AchievementGroup[]).filter((key) => achievements.some((a) => a.group === key)),
    [achievements]
  );

  const filtered = React.useMemo(
    () =>
      achievements.filter(
        (achievement) =>
          (status === "all" ||
            (status === "unlocked" && achievement.unlockedAt !== null) ||
            (status === "locked" && achievement.unlockedAt === null)) &&
          (rarity === "all" || achievement.rarity === rarity) &&
          (group === "all" || achievement.group === group)
      ),
    [achievements, status, rarity, group]
  );

  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;

  const reset = () => {
    setStatus("all");
    setRarity("all");
    setGroup("all");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {signedIn && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none" role="group" aria-label="Filter by status">
            <Chip active={status === "all"} onClick={() => setStatus("all")} count={achievements.length}>
              All
            </Chip>
            <Chip active={status === "unlocked"} onClick={() => setStatus("unlocked")} count={unlockedCount}>
              Unlocked
            </Chip>
            <Chip
              active={status === "locked"}
              onClick={() => setStatus("locked")}
              count={achievements.length - unlockedCount}
            >
              Locked
            </Chip>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto scrollbar-none" role="group" aria-label="Filter by rarity">
          <Chip active={rarity === "all"} onClick={() => setRarity("all")}>
            Any rarity
          </Chip>
          {RARITY_ORDER.map((value) => (
            <Chip
              key={value}
              active={rarity === value}
              onClick={() => setRarity(value)}
              count={achievements.filter((a) => a.rarity === value).length}
            >
              {RARITY_LABEL[value]}
            </Chip>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none" role="group" aria-label="Filter by group">
          <Chip active={group === "all"} onClick={() => setGroup("all")}>
            All groups
          </Chip>
          {groups.map((value) => (
            <Chip key={value} active={group === value} onClick={() => setGroup(value)}>
              {GROUP_LABEL[value]}
            </Chip>
          ))}
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {formatNumber(filtered.length)} {filtered.length === 1 ? "achievement" : "achievements"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nothing here"
          description={
            status === "unlocked"
              ? "No unlocked achievements match. Go add something shiny."
              : "No achievements match those filters."
          }
          action={
            <Button variant="outline" onClick={reset}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {groups
            .filter((key) => filtered.some((a) => a.group === key))
            .map((key) => {
              const inGroup = filtered.filter((a) => a.group === key);
              const unlockedInGroup = achievements.filter((a) => a.group === key && a.unlockedAt !== null).length;
              const totalInGroup = achievements.filter((a) => a.group === key).length;
              return (
                <section key={key} aria-labelledby={`group-${key}`} className="space-y-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 id={`group-${key}`} className="text-xl font-semibold tracking-tight">
                      {GROUP_LABEL[key]}
                    </h2>
                    {signedIn && (
                      <span className="tabular text-sm text-muted-foreground">
                        {unlockedInGroup}/{totalInGroup} unlocked
                      </span>
                    )}
                  </div>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {inGroup.map((achievement, index) => {
                      const definition = getAchievementDefinition(achievement.id);
                      if (!definition) return null;
                      return (
                        <li
                          key={achievement.id}
                          className="animate-enter-up"
                          style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
                        >
                          <AchievementCard
                            definition={definition}
                            unlockedAt={achievement.unlockedAt ? new Date(achievement.unlockedAt) : null}
                            progress={achievement.progress}
                            holderShare={achievement.holderShare}
                            fresh={fresh === achievement.id}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}
