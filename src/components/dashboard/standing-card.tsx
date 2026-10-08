import Link from "next/link";
import { Settings2, Trophy } from "lucide-react";
import type { BoardRow, Standing } from "@/lib/leaderboard";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { cn, formatNumber, formatUSD, profileName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { RankDelta } from "@/components/rank-delta";
import { RankMedal } from "@/components/rank-medal";
import { UserAvatar } from "@/components/user-avatar";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

type StandingCardProps = {
  standing: Standing | null;
  currentUserId: string;
  /** True when the user owns something but is hidden from the board. */
  isPrivate: boolean;
  delay?: number;
};

/** "$420 behind @steve" / "$1,200 ahead of @alex" / "Tied with @sam". */
function gapCopy(row: BoardRow, me: BoardRow): string {
  const gap = Math.abs(row.value - me.value);
  if (gap === 0) return `Tied with @${row.username}`;
  return row.rank < me.rank
    ? `${formatUSD(gap)} behind @${row.username}`
    : `${formatUSD(gap)} ahead of @${row.username}`;
}

function averageCopy(score: number, average: number): string | null {
  if (average <= 0) return null;
  const percent = Math.round(((score - average) / average) * 100);
  if (percent === 0) return "You're exactly the average collector. Suspiciously so.";
  return percent > 0
    ? `You're ${formatNumber(percent)}% above the average collector.`
    : `You're ${formatNumber(Math.abs(percent))}% below the average collector.`;
}

/**
 * Where the user sits on the overall board: the neighbours either side with
 * the dollar gaps spelled out, plus how they compare to the average collector.
 */
export function StandingCard({ standing, currentUserId, isPrivate, delay }: StandingCardProps) {
  if (!standing) {
    return (
      <DashboardCard
        id="dashboard-standing"
        title="Your standing"
        icon={Trophy}
        href="/leaderboard"
        linkLabel="Board"
        delay={delay}
        bodyClassName="flex items-center"
      >
        {isPrivate ? (
          <EmptyState
            bare
            emoji="🕶️"
            title="You're off the board"
            description={`Private profiles don't rank. Flip yours public to compete on ${LEADERBOARD_NAME}.`}
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <Settings2 aria-hidden="true" />
                  Open settings
                </Link>
              </Button>
            }
            className="w-full py-6"
          />
        ) : (
          <EmptyState
            bare
            emoji="🪜"
            title="Not on the board yet"
            description="Add a product to get on the board. One is enough to start climbing."
            action={
              <Button asChild size="sm">
                <Link href="/catalog">Add a product</Link>
              </Button>
            }
            className="w-full py-6"
          />
        )}
      </DashboardCard>
    );
  }

  const { me, nearby, average } = standing;
  const averageLine = averageCopy(me.value, average);

  return (
    <DashboardCard
      id="dashboard-standing"
      title="Your standing"
      description={`#${formatNumber(me.rank)} of ${formatNumber(me.total)} on ${LEADERBOARD_NAME}`}
      icon={Trophy}
      href="/leaderboard"
      linkLabel="Board"
      delay={delay}
      bodyClassName="flex flex-col"
    >
      <ol className="-mx-2 space-y-1" aria-label="Collectors ranked around you">
        {nearby.map((row) => {
          const isMe = row.id === currentUserId;
          const name = profileName(row);
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
                  href={isMe ? "/profile" : `/u/${row.username}`}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  {name}
                  {isMe && <span className="ml-1.5 text-xs font-medium text-accent">You</span>}
                </Link>
                <p className="flex min-w-0 text-xs text-muted-foreground">
                  {!isMe ? (
                    <span className="truncate">{gapCopy(row, me)}</span>
                  ) : row.isNew || row.movement !== null ? (
                    <RankDelta movement={row.movement} isNew={row.isNew} verbose />
                  ) : (
                    <span className="truncate">Holding your spot</span>
                  )}
                </p>
              </div>
              <span className="tabular shrink-0 text-sm font-semibold">{formatUSD(row.value)}</span>
            </li>
          );
        })}
      </ol>

      {averageLine && (
        <p className="mt-auto text-pretty border-t border-border pt-4 text-sm text-muted-foreground">
          {averageLine}{" "}
          <span className="tabular whitespace-nowrap">(avg {formatUSD(average)})</span>
        </p>
      )}
    </DashboardCard>
  );
}
