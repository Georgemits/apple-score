import Link from "next/link";
import { ArrowDown, ArrowUp, PackagePlus, Settings2, Trophy } from "lucide-react";
import type { BoardDefinition, Standing } from "@/lib/leaderboard";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { RankDelta } from "@/components/rank-delta";
import { RankMedal } from "@/components/rank-medal";
import { UserAvatar } from "@/components/user-avatar";
import {
  averageCopy,
  formatBoardValue,
  gapCopy,
  notOnBoardCopy,
  percentileCopy,
} from "@/components/leaderboard/types";

type StandingCardProps = {
  standing: Standing | null;
  board: BoardDefinition;
  viewerId: string;
  /** True when the viewer's profile is private, so they cannot rank anywhere. */
  isPrivate: boolean;
  className?: string;
};

/**
 * "Your standing": the viewer's rank on the current board, the neighbours
 * either side with the gaps spelled out, and how they compare to the average.
 * Falls back to a nudge when they are not on this board yet.
 */
export function StandingCard({
  standing,
  board,
  viewerId,
  isPrivate,
  className,
}: StandingCardProps) {
  if (!standing) {
    const copy = notOnBoardCopy(board);
    return (
      <section aria-labelledby="standing-heading" className={cn("animate-enter-up", className)}>
        <h2 id="standing-heading" className="sr-only">
          Your standing
        </h2>
        {isPrivate ? (
          <EmptyState
            emoji="🕶️"
            title="You're off the board"
            description="Private profiles don't rank. Flip yours public in settings to compete."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <Settings2 aria-hidden="true" />
                  Open settings
                </Link>
              </Button>
            }
            className="py-10"
          />
        ) : (
          <EmptyState
            emoji="🪜"
            title={copy.title}
            description={copy.description}
            action={
              <Button asChild size="sm">
                <Link href={copy.href}>
                  <PackagePlus aria-hidden="true" />
                  {copy.cta}
                </Link>
              </Button>
            }
            className="py-10"
          />
        )}
      </section>
    );
  }

  const { me, nearby, average, percentile, above, belowMe } = standing;
  const metric = board.metric;
  const averageLine = averageCopy(me.value, average);

  return (
    <section aria-labelledby="standing-heading" className={cn("animate-enter-up", className)}>
      <Card className="p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
          {/* ------------------------------------------------------ Position */}
          <div className="min-w-0">
            <h2
              id="standing-heading"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <Trophy className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Your standing
            </h2>

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="tabular text-4xl font-bold tracking-tighter sm:text-5xl">
                <span className="text-muted-foreground">#</span>
                {formatNumber(me.rank)}
              </p>
              <p className="pb-1 text-sm text-muted-foreground">
                of {formatNumber(me.total)} on the {board.label} board
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="tabular font-semibold">{formatBoardValue(metric, me.value)}</span>
              <RankDelta movement={me.movement} isNew={me.isNew} verbose />
            </div>

            <ul className="mt-5 space-y-2 text-pretty text-sm text-muted-foreground">
              <li>{percentileCopy(percentile, me.total)}</li>
              {averageLine && (
                <li>
                  {averageLine}{" "}
                  <span className="tabular whitespace-nowrap">
                    (avg {formatBoardValue(metric, average)})
                  </span>
                </li>
              )}
            </ul>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                  Next up
                </dt>
                <dd className="mt-1 text-pretty text-sm font-medium">
                  {above
                    ? gapCopy(metric, above.gap, above.row.username, "behind")
                    : "Nobody above you. That's the top."}
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                  Breathing down your neck
                </dt>
                <dd className="mt-1 text-pretty text-sm font-medium">
                  {belowMe
                    ? gapCopy(metric, belowMe.gap, belowMe.row.username, "ahead")
                    : "Nobody below you. Yet."}
                </dd>
              </div>
            </dl>
          </div>

          {/* --------------------------------------------------------- Nearby */}
          <div className="min-w-0 lg:border-l lg:border-border lg:pl-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Around you
            </h3>
            <ol className="-mx-2 mt-2 space-y-1" aria-label="Collectors ranked around you">
              {nearby.map((row) => {
                const isMe = row.id === viewerId;
                const name = row.displayName ?? `@${row.username}`;
                return (
                  <li
                    key={row.id}
                    aria-current={isMe ? "true" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-2 py-2",
                      isMe && "bg-accent/8 ring-1 ring-accent/40"
                    )}
                  >
                    <RankMedal rank={row.rank} className="size-8 text-sm" />
                    <UserAvatar user={row} size={36} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/u/${row.username}`}
                        className="block truncate text-sm font-semibold hover:underline"
                      >
                        {name}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-medium text-accent">You</span>
                        )}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {isMe
                          ? `@${row.username}`
                          : gapCopy(
                              metric,
                              Math.abs(row.value - me.value),
                              row.username,
                              row.rank < me.rank ? "behind" : "ahead"
                            )}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold">
                      {formatBoardValue(metric, row.value)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </Card>
    </section>
  );
}
