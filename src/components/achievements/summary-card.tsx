import type * as React from "react";
import Link from "next/link";
import { ArrowRight, PackagePlus } from "lucide-react";
import { RARITY_LABEL, type AchievementRarity } from "@/lib/achievements";
import { cn, formatNumber, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RARITY_CHIP } from "@/components/achievements/rarity";
import { holderShareLabel } from "@/components/achievements/types";

export type RaritySummary = { rarity: AchievementRarity; unlocked: number; total: number };
export type RarestUnlock = { title: string; emoji: string; share: number };

export type MemberSummary = {
  unlockedCount: number;
  byRarity: RaritySummary[];
  rarest: RarestUnlock | null;
};

type SummaryCardProps = {
  total: number;
  groupCount: number;
  secretCount: number;
  /** Null for guests. */
  member: MemberSummary | null;
};

function Eyebrow({
  children,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  as?: "p" | "h2" | "h3";
}) {
  return (
    <Tag className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </Tag>
  );
}

function Glow() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-72 animate-float-slow rounded-full bg-gradient-to-br from-gold/25 via-fuchsia-500/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-gradient-to-tr from-accent/15 to-transparent blur-3xl"
      />
    </>
  );
}

/** The page's hero: your tally and rarest trophy, or the pitch for guests. */
export function SummaryCard({ total, groupCount, secretCount, member }: SummaryCardProps) {
  if (!member) {
    return (
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <Glow />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <Eyebrow as="h2">To earn</Eyebrow>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5">
              <span className="score-figure text-5xl font-bold sm:text-6xl">
                {formatNumber(total)}
              </span>
              <span className="text-lg font-medium text-muted-foreground">
                achievements across {formatNumber(groupCount)} groups.
              </span>
            </p>
            <p className="mt-3 max-w-md text-pretty text-muted-foreground">
              Sign up to start unlocking. The first one takes about ten seconds and, unusually for
              Apple, costs nothing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/signup">
                Sign up
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?callbackUrl=/achievements">Log in</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const { unlockedCount, byRarity, rarest } = member;
  const percent = total === 0 ? 0 : Math.round((unlockedCount / total) * 100);
  const barWidth = Math.max(percent, unlockedCount > 0 ? 2 : 0);

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <Glow />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:items-center">
        <div className="min-w-0">
          <Eyebrow as="h2">You&apos;ve unlocked</Eyebrow>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5">
            <span className="score-figure text-5xl font-bold sm:text-6xl">
              {formatNumber(unlockedCount)}
            </span>
            <span className="text-lg font-medium text-muted-foreground">
              of {formatNumber(total)}
            </span>
          </p>

          <div
            className="mt-4 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label="Achievements unlocked"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${formatNumber(unlockedCount)} of ${formatNumber(total)}`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-fuchsia-500 transition-[width] duration-700"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {percent}% complete. {pluralize(secretCount, "secret one")} hiding in here.
          </p>

          <ul aria-label="Unlocked by rarity" className="mt-4 flex flex-wrap gap-2">
            {byRarity.map(({ rarity, unlocked, total: inRarity }) => (
              <li
                key={rarity}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  RARITY_CHIP[rarity]
                )}
              >
                {RARITY_LABEL[rarity]}
                <span className="tabular">
                  {formatNumber(unlocked)}/{formatNumber(inRarity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 lg:border-l lg:border-border/60 lg:pl-8">
          <Eyebrow as="h3">Rarest unlocked</Eyebrow>
          {rarest ? (
            <>
              <p className="mt-1.5 text-lg font-semibold leading-snug">
                <span aria-hidden="true">{rarest.emoji}</span> {rarest.title}
              </p>
              <p className="text-sm text-muted-foreground">
                Held by {holderShareLabel(rarest.share)}.
              </p>
            </>
          ) : (
            <p className="mt-1.5 max-w-xs text-pretty text-sm text-muted-foreground">
              Nothing unlocked yet. Your first product earns the first one. It is not a high bar.
            </p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/catalog">
              <PackagePlus aria-hidden="true" />
              {rarest ? "Add more" : "Add a product"}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
