import Link from "next/link";
import { Check } from "lucide-react";
import type { Standing } from "@/lib/leaderboard";
import type { PublicUser, UserStats } from "@/lib/queries";
import { cn, formatNumber, profileName } from "@/lib/utils";
import { AnimatedMoney } from "@/components/animated-number";
import { TierBadge } from "@/components/tier-badge";
import { UserAvatar } from "@/components/user-avatar";

export type CompareStatKey = "score" | "rank" | "products" | "categories" | "achievements";

export type CompareSide = {
  user: PublicUser;
  stats: UserStats;
  standing: Standing | null;
  achievements: number;
};

type CompareColumnProps = {
  side: CompareSide;
  /** Which stats this side is ahead on. */
  leads: Record<CompareStatKey, boolean>;
  isViewer: boolean;
};

function StatRow({ label, value, leads }: { label: string; value: string; leads: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2",
        leads ? "bg-success/12" : "bg-secondary/60"
      )}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="tabular flex items-center gap-1.5 text-sm font-semibold">
        {value}
        {leads && (
          <>
            <Check className="size-3.5 text-success" aria-hidden="true" />
            <span className="sr-only">(ahead)</span>
          </>
        )}
      </dd>
    </div>
  );
}

/** One collector's side of the head-to-head. */
export function CompareColumn({ side, leads, isViewer }: CompareColumnProps) {
  const { user, stats, standing, achievements } = side;
  const name = profileName(user);

  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <Link
        href={`/u/${user.username}`}
        className="group flex max-w-full flex-col items-center gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UserAvatar user={user} size={88} ring />
        <span className="min-w-0 max-w-full">
          <span className="block truncate text-xl font-semibold tracking-tight group-hover:underline">
            {name}
            {isViewer && <span className="ml-1.5 text-xs font-medium text-accent">You</span>}
          </span>
          {user.displayName && (
            <span className="block truncate text-sm text-muted-foreground">@{user.username}</span>
          )}
        </span>
      </Link>

      <TierBadge tier={stats.tier} size="sm" className="mt-3" />

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Apple Score
      </p>
      <p className="score-figure mt-1 w-full truncate text-4xl font-bold sm:text-5xl">
        <AnimatedMoney value={stats.score} fromZero />
      </p>
      {leads.score && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-success">Ahead</p>
      )}

      <dl className="mt-6 w-full space-y-1.5">
        <StatRow
          label="Rank"
          value={
            standing
              ? `#${formatNumber(standing.me.rank)} of ${formatNumber(standing.me.total)}`
              : "Unranked"
          }
          leads={leads.rank}
        />
        <StatRow label="Products" value={formatNumber(stats.productCount)} leads={leads.products} />
        <StatRow
          label="Categories"
          value={formatNumber(stats.breakdown.length)}
          leads={leads.categories}
        />
        <StatRow
          label="Achievements"
          value={formatNumber(achievements)}
          leads={leads.achievements}
        />
      </dl>
    </div>
  );
}
