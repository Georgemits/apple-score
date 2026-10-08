import { Skeleton } from "@/components/ui/skeleton";

const CHIP_WIDTHS = ["6.5rem", "8.5rem", "7rem", "9rem", "7.5rem", "8rem"];

export default function CollectionLoading() {
  return (
    <div
      className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-label="Loading your collection"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-56 sm:h-10" />
          <Skeleton className="h-12 w-44 sm:h-14 sm:w-60" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-12 w-36 rounded-full" />
          <Skeleton className="h-12 w-28 rounded-full" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-11 w-full rounded-lg sm:max-w-md" />

        <div className="flex gap-2 overflow-hidden">
          {CHIP_WIDTHS.map((width, index) => (
            <Skeleton key={index} className="h-11 shrink-0 rounded-full sm:h-9" style={{ width }} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-11 w-48 rounded-full sm:h-10" />
          <Skeleton className="h-11 w-20 rounded-full sm:h-10" />
          <Skeleton className="ml-auto h-7 w-44 rounded-full" />
        </div>

        <Skeleton className="h-4 w-32" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl sm:h-80" />
          ))}
        </div>
      </div>

      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
