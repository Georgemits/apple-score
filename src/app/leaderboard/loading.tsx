import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for Band for Band: header, board chips, podium, standing, table. */
export default function LeaderboardLoading() {
  return (
    <div
      className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-label="Loading the leaderboard"
    >
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      {/* Board chips */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-hidden px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-11 shrink-0 rounded-full sm:h-9"
            style={{ width: `${index === 0 ? 6 : 5.5 + (index % 3)}rem` }}
          />
        ))}
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Skeleton className="h-52 rounded-xl sm:order-1" />
        <Skeleton className="h-52 rounded-xl sm:order-2 sm:-translate-y-4" />
        <Skeleton className="h-52 rounded-xl sm:order-3" />
      </div>

      {/* Standing */}
      <Skeleton className="h-48 rounded-xl" />

      {/* Ranking: heading, search, rows */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-full rounded-full sm:h-11 md:max-w-sm" />
        <div className="space-y-2 md:hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
          <Skeleton className="h-10 w-full rounded-none" />
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-t border-border/60 px-4 py-3"
            >
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
