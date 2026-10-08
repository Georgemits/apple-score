import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TileSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <Card className={className}>
      <div className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/** Mirrors the dashboard layout so nothing jumps when the real data lands. */
export default function HomeLoading() {
  return (
    <div
      className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading your dashboard…</span>

      {/* Hero */}
      <Card className="p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end">
          <div>
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-3 h-8 w-72 max-w-full" />
            <Skeleton className="mt-8 h-3 w-24" />
            <Skeleton className="mt-3 h-16 w-64 max-w-full sm:h-20 lg:h-24" />
            <div className="mt-6 flex flex-wrap gap-2">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-36 rounded-full" />
            </div>
            <Skeleton className="mt-5 h-4 w-80 max-w-full" />
            <div className="mt-7 max-w-md space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <Skeleton className="h-12 w-40 rounded-full" />
              <Skeleton className="h-12 w-44 rounded-full" />
              <Skeleton className="h-12 w-28 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:order-first lg:col-span-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-7 w-20" />
              <Skeleton className="mt-2 h-3 w-28" />
            </Card>
          ))}
        </div>

        <TileSkeleton rows={5} />
        <TileSkeleton rows={4} className="lg:col-span-2" />
        <TileSkeleton rows={6} />
        <TileSkeleton rows={5} />
        <TileSkeleton rows={3} />
        <TileSkeleton rows={2} className="lg:col-span-3" />
      </div>
    </div>
  );
}
