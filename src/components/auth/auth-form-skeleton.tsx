import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for an auth card while the form (which reads search params) streams in. */
export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div role="status" aria-label="Loading form" className="glass space-y-6 rounded-xl p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="mx-auto h-4 w-48" />
    </div>
  );
}
