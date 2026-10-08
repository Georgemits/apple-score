import type * as React from "react";
import { Trophy } from "lucide-react";
import type { MilestoneProgress as Progress, Tier } from "@/lib/score";
import { Card } from "@/components/ui/card";
import { AnimatedMoney } from "@/components/animated-number";
import { MilestoneProgress } from "@/components/milestone-progress";
import { RankDelta } from "@/components/rank-delta";
import { TierBadge } from "@/components/tier-badge";
import { cn, formatNumber, formatSignedUSD } from "@/lib/utils";

export type HeroRank = {
  rank: number;
  total: number;
  percentile: number;
  movement: number | null;
  isNew: boolean;
};

type ScoreHeroProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  score: number;
  tier: Tier;
  rank?: HeroRank | null;
  /** Dollars added over the last seven days. */
  weekDelta?: number;
  milestone?: Progress | null;
  footnote?: React.ReactNode;
  actions?: React.ReactNode;
  /** Rendered beside the figure on wide screens — a chart, usually. */
  aside?: React.ReactNode;
  className?: string;
};

/**
 * The centrepiece of every signed-in page: the Apple Score as a giant dollar
 * figure, with the facts that make it feel like a position rather than a
 * number — rank, percentile, tier, weekly movement and the next milestone.
 */
export function ScoreHero({
  eyebrow,
  title,
  score,
  tier,
  rank,
  weekDelta = 0,
  milestone,
  footnote,
  actions,
  aside,
  className,
}: ScoreHeroProps) {
  return (
    <Card className={cn("relative overflow-hidden p-6 sm:p-10", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 size-80 animate-float-slow rounded-full bg-gradient-to-br from-accent/25 via-fuchsia-500/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-transparent blur-3xl"
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end">
        <div className="min-w-0">
          {eyebrow && <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>}
          <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Apple Score
          </p>
          <p className="score-figure mt-2 text-6xl font-bold sm:text-7xl lg:text-8xl">
            <AnimatedMoney value={score} fromZero />
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <TierBadge tier={tier} />
            {rank && rank.total > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-sm font-medium backdrop-blur">
                <Trophy className="size-3.5 text-gold" aria-hidden="true" />#
                {formatNumber(rank.rank)} of {formatNumber(rank.total)}
                <RankDelta movement={rank.movement} isNew={rank.isNew} />
              </span>
            ) : null}
            {weekDelta !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                  weekDelta > 0
                    ? "bg-success/12 text-success"
                    : "bg-destructive/12 text-destructive"
                )}
              >
                {formatSignedUSD(weekDelta)} this week
              </span>
            )}
          </div>

          {rank && rank.total > 1 && (
            <p className="mt-4 text-pretty text-base text-muted-foreground">
              {rank.percentile >= 50 ? (
                <>
                  You&apos;re richer in Apple than{" "}
                  <span className="font-semibold text-foreground">{rank.percentile}%</span> of
                  collectors.
                </>
              ) : rank.percentile === 0 ? (
                <>
                  Everyone on the board has spent more than you.{" "}
                  <span className="font-semibold text-foreground">Impressive restraint.</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{100 - rank.percentile}%</span> of
                  collectors have spent more. Plenty of room to climb.
                </>
              )}
            </p>
          )}

          {footnote && <div className="mt-3 text-sm text-muted-foreground">{footnote}</div>}

          {milestone !== undefined && (
            <MilestoneProgress score={score} milestone={milestone} className="mt-6 max-w-md" />
          )}

          {actions && <div className="mt-7 flex flex-wrap gap-2">{actions}</div>}
        </div>

        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </Card>
  );
}
