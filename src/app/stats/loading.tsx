import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for the Census: header, totals, podium and the two breakdown cards. */
export default function StatsLoading() {
  return (
    <div
      className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-label="Loading the Census"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-7 w-44" />
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
