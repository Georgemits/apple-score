import Link from "next/link";
import type { BoardRow } from "@/lib/leaderboard";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { RankDelta } from "@/components/rank-delta";
import { TopBadge } from "@/components/score-badges";
import { cn, formatNumber, formatUSD } from "@/lib/utils";

type PodiumProps = {
  rows: BoardRow[];
  /** Format the ranked value — dollars by default, units for the products board. */
  formatValue?: (value: number) => string;
  currentUserId?: string | null;
};

const PLACE = {
  1: {
    medal: "🥇",
    label: "1st",
    ring: "ring-gold/70",
    glow: "shadow-glow-gold",
    order: "sm:order-2",
    lift: "sm:-translate-y-4",
  },
  2: { medal: "🥈", label: "2nd", ring: "ring-silver/70", glow: "", order: "sm:order-1", lift: "" },
  3: { medal: "🥉", label: "3rd", ring: "ring-bronze/70", glow: "", order: "sm:order-3", lift: "" },
} as const;

/** The top three, with first place in the middle and raised on wide screens. */
export function Podium({ rows, formatValue = formatUSD, currentUserId }: PodiumProps) {
  const top = rows.filter((row) => row.rank <= 3).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <ol className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Top three">
      {top.map((row) => {
        const place = PLACE[Math.min(row.rank, 3) as 1 | 2 | 3];
        const isMe = row.id === currentUserId;
        return (
          <li key={row.id} className={cn("min-w-0", place.order, place.lift)}>
            <Card
              className={cn(
                "card-hover flex h-full flex-col items-center gap-2 px-2 py-4 text-center sm:gap-3 sm:p-6",
                row.rank === 1 && place.glow,
                isMe && "ring-2 ring-accent/60"
              )}
            >
              <span className="text-2xl leading-none sm:text-3xl" aria-hidden="true">
                {place.medal}
              </span>
              <span className="sr-only">{place.label} place</span>
              <Link
                href={`/u/${row.username}`}
                className="group flex min-w-0 max-w-full flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserAvatar
                  user={row}
                  size={row.rank === 1 ? 72 : 56}
                  className={cn("ring-4", place.ring)}
                />
                <span className="w-full truncate text-sm font-semibold group-hover:underline sm:text-base">
                  {row.displayName ?? `@${row.username}`}
                </span>
              </Link>
              <p className="score-figure w-full truncate text-lg font-bold sm:text-2xl">
                {formatValue(row.value)}
              </p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">
                {formatNumber(row.units)} {row.units === 1 ? "product" : "products"}
              </p>
              <RankDelta movement={row.movement} isNew={row.isNew} />
              {row.isTop && <TopBadge className="hidden sm:inline-flex" />}
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
