import { Medal, Trophy, Wallet, type LucideIcon } from "lucide-react";
import type { Category } from "@prisma/client";
import { CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { tierFor } from "@/lib/score";
import { cn, formatNumber, formatUSD } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";

/** A made-up but plausible collector, so the pitch has a face. */
const SAMPLE = { score: 18_492, rank: 17, total: 1_204 } as const;

const SAMPLE_BREAKDOWN: readonly { category: Category; share: number }[] = [
  { category: "IPHONE", share: 0.42 },
  { category: "MAC", share: 0.37 },
  { category: "WATCH", share: 0.13 },
  { category: "AIRPODS", share: 0.08 },
];

const BENEFITS: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Wallet,
    title: "One honest number",
    text: "Every dollar you’ve spent on Apple hardware, added up. No multipliers, no excuses.",
  },
  {
    icon: Trophy,
    title: LEADERBOARD_NAME,
    text: "Climb the leaderboard, follow friends and compare collections head to head.",
  },
  {
    icon: Medal,
    title: "Achievements worth bragging about",
    text: "From your first purchase to Infinite Loop. A few of them are secret.",
  },
];

/** The static "why bother" column beside the login and signup forms. */
export function AuthValuePanel({ className }: { className?: string }) {
  const tier = tierFor(SAMPLE.score);

  return (
    <aside aria-label="Why Apple Score" className={cn("space-y-8", className)}>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Apple Score
        </p>
        <h2 className="text-balance text-3xl font-semibold tracking-tighter xl:text-4xl">
          How much Apple do you own?
        </h2>
        <p className="max-w-md text-pretty text-muted-foreground">
          Add what you own, get one number, see where it lands you.
        </p>
      </div>

      <Card className="relative overflow-hidden p-6 xl:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 size-72 animate-float-slow rounded-full bg-gradient-to-br from-accent/25 via-fuchsia-500/15 to-transparent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-16 size-60 rounded-full bg-gradient-to-tr from-emerald-500/15 to-transparent blur-3xl"
        />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Example · Apple Score
          </p>
          <p className="score-figure mt-3 text-6xl font-bold xl:text-7xl">
            {formatUSD(SAMPLE.score)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-sm font-medium backdrop-blur">
              <Trophy className="size-3.5 text-gold" aria-hidden="true" />#
              {formatNumber(SAMPLE.rank)} of {formatNumber(SAMPLE.total)}
            </span>
            <TierBadge tier={tier} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{tier.tagline}</p>

          <div className="mt-6 space-y-2" aria-hidden="true">
            <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-secondary">
              {SAMPLE_BREAKDOWN.map((entry) => (
                <span
                  key={entry.category}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${entry.share * 100}%`,
                    backgroundColor: `var(--chart-${CATEGORY_SLUG[entry.category]})`,
                  }}
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {SAMPLE_BREAKDOWN.map((entry) => (
                <li key={entry.category} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: `var(--chart-${CATEGORY_SLUG[entry.category]})` }}
                  />
                  {CATEGORY_LABEL[entry.category]} {Math.round(entry.share * 100)}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <ul className="space-y-5">
        {BENEFITS.map((benefit) => (
          <li key={benefit.title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <benefit.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{benefit.title}</p>
              <p className="text-pretty text-sm text-muted-foreground">{benefit.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
