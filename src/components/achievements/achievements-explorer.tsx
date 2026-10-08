"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  AchievementGroupSection,
  achievementElementId,
} from "@/components/achievements/achievement-group";
import { FilterBar, type FilterCounts } from "@/components/achievements/filter-bar";
import {
  DEFAULT_FILTERS,
  GROUP_KEYS,
  RARITY_KEYS,
  isUnlocked,
  matchesFilters,
  matchesStatus,
  resultLabel,
  type AchievementView,
  type Filters,
  type StatusFilter,
} from "@/components/achievements/types";

type AchievementsExplorerProps = {
  achievements: AchievementView[];
  signedIn: boolean;
  /** Id to highlight as freshly earned (validated by the server page). */
  fresh: string | null;
};

function zeroed<K extends string>(keys: readonly K[]): Record<K | "all", number> {
  const record = { all: 0 } as Record<K | "all", number>;
  for (const key of keys) record[key] = 0;
  return record;
}

/**
 * Each axis is counted under the *other* two, so a chip's number is exactly
 * what pressing it would show.
 */
function countOptions(achievements: AchievementView[], filters: Filters): FilterCounts {
  const counts: FilterCounts = {
    status: { all: 0, unlocked: 0, locked: 0 },
    rarity: zeroed(RARITY_KEYS),
    group: zeroed(GROUP_KEYS),
  };

  for (const view of achievements) {
    const statusOk = matchesStatus(view, filters.status);
    const rarityOk = filters.rarity === "all" || view.rarity === filters.rarity;
    const groupOk = filters.group === "all" || view.group === filters.group;

    if (rarityOk && groupOk) {
      counts.status.all += 1;
      counts.status[isUnlocked(view) ? "unlocked" : "locked"] += 1;
    }
    if (statusOk && groupOk) {
      counts.rarity.all += 1;
      counts.rarity[view.rarity] += 1;
    }
    if (statusOk && rarityOk) {
      counts.group.all += 1;
      counts.group[view.group] += 1;
    }
  }

  return counts;
}

function ExplorerEmpty({
  status,
  signedIn,
  onReset,
}: {
  status: StatusFilter;
  signedIn: boolean;
  onReset: () => void;
}) {
  const reset = (
    <Button type="button" variant="outline" onClick={onReset}>
      Reset filters
    </Button>
  );

  if (status === "unlocked" && !signedIn) {
    return (
      <EmptyState
        emoji="🔒"
        title="Nothing unlocked yet"
        description="Achievements unlock as you add what you own. The first one takes about ten seconds and, unusually for Apple, costs nothing."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/signup">
                Sign up
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            {reset}
          </div>
        }
      />
    );
  }

  if (status === "unlocked") {
    return (
      <EmptyState
        emoji="🔒"
        title="Nothing unlocked here yet"
        description="Buying things helps. That is, admittedly, the entire premise."
        action={reset}
      />
    );
  }

  if (status === "locked") {
    return (
      <EmptyState
        emoji="🏆"
        title="Nothing left to unlock here"
        description="You've cleared this set. We'll think of harder ones."
        action={reset}
      />
    );
  }

  return (
    <EmptyState
      emoji="🔍"
      title="No achievements match"
      description="Try fewer filters. They're all still out there."
      action={reset}
    />
  );
}

export function AchievementsExplorer({ achievements, signedIn, fresh }: AchievementsExplorerProps) {
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);

  const update = React.useCallback((patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);
  const reset = React.useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filtered = React.useMemo(
    () => achievements.filter((view) => matchesFilters(view, filters)),
    [achievements, filters]
  );
  const counts = React.useMemo(() => countOptions(achievements, filters), [achievements, filters]);

  const groups = React.useMemo(
    () =>
      GROUP_KEYS.map((group) => ({
        group,
        all: achievements.filter((view) => view.group === group),
        views: filtered.filter((view) => view.group === group),
      })).filter((entry) => entry.views.length > 0),
    [achievements, filtered]
  );

  // Bring a freshly unlocked card into view and hand it focus, once.
  React.useEffect(() => {
    if (!fresh) return;
    const element = document.getElementById(achievementElementId(fresh));
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    element.focus({ preventScroll: true });
  }, [fresh]);

  return (
    <section aria-labelledby="all-achievements" className="space-y-6">
      <div className="space-y-1">
        <h2 id="all-achievements" className="text-2xl font-semibold tracking-tight">
          All achievements
        </h2>
        <p className="text-sm text-muted-foreground">
          Secret ones stay masked until you earn them. You will know it when you see it.
        </p>
      </div>

      <FilterBar
        filters={filters}
        counts={counts}
        onChange={update}
        onReset={reset}
        resultLabel={resultLabel(filtered.length, achievements.length)}
      />

      {filtered.length === 0 ? (
        <ExplorerEmpty status={filters.status} signedIn={signedIn} onReset={reset} />
      ) : (
        <div className="space-y-10">
          {groups.map(({ group, all, views }) => (
            <AchievementGroupSection
              key={group}
              group={group}
              all={all}
              views={views}
              signedIn={signedIn}
              fresh={fresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}
