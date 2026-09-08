import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
