import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for the achievements page: header, summary, up next, filters, grouped grid. */
export default function AchievementsLoading() {
  return (
    <div
      className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-label="Loading achievements"
    >
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      {/* Summary */}
      <Skeleton className="h-56 rounded-xl sm:h-48" />

      {/* Up next */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Explorer: heading, status control, chip rows */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-64 rounded-full sm:h-9" />
          <Skeleton className="ml-auto hidden h-4 w-28 sm:block" />
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-hidden px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-11 shrink-0 rounded-full sm:h-9"
              style={{ width: `${index === 0 ? 4 : 5.5 + (index % 3)}rem` }}
            />
          ))}
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-hidden px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-11 shrink-0 rounded-full sm:h-9"
              style={{ width: `${index === 0 ? 4 : 5 + (index % 4)}rem` }}
            />
          ))}
        </div>
      </div>

      {/* Two grouped sections of cards */}
      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section} className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass flex items-start gap-3.5 rounded-xl p-4">
                <Skeleton className="size-12 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <span className="sr-only">Loading…</span>
    </div>
  );
}
