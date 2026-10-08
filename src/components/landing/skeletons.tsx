import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for the eyebrow badge text while the catalogue count streams in. */
export function CatalogueCountSkeleton() {
  return (
    <span
      className="inline-block h-3 w-36 animate-pulse-soft rounded-full bg-secondary align-middle"
      aria-hidden="true"
    />
  );
}

/** Mirrors the four-cell community strip. */
export function CommunityStatsSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading community statistics" className="py-6 sm:py-8">
      <Card className="grid grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </Card>
    </section>
  );
}

/** Mirrors the podium section (heading row + three cards). */
export function PodiumSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading the top three" className="py-16 sm:py-24">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-52 rounded-xl sm:h-72" />
        ))}
      </div>
    </section>
  );
}
