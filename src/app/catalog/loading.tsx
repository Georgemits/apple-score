import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        Loading the catalogue…
      </p>

      {/* Header: title on the left, score card on the right */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl lg:w-[22rem]" />
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="py-3">
          <Skeleton className="h-12 w-full rounded-full sm:h-11" />
        </div>

        {/* Category chips */}
        <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-11 shrink-0 rounded-full sm:h-9"
              style={{ width: `${index === 0 ? 4.5 : 6 + (index % 3)}rem` }}
            />
          ))}
        </div>

        {/* Filters + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-11 w-56 rounded-full sm:h-9" />
          <Skeleton className="h-11 w-32 rounded-full sm:h-9" />
          <Skeleton className="h-11 w-36 rounded-full sm:h-9" />
          <Skeleton className="h-4 w-28 basis-full sm:ml-auto sm:basis-auto" />
        </div>
      </div>

      {/* Tiles: compact rows on phones, cards on desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="h-[5.5rem] rounded-2xl lg:h-[19rem]" />
        ))}
      </div>
    </div>
  );
}
