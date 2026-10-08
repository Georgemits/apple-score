import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="container max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-72" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-56 w-full rounded-xl" />
      ))}
    </div>
  );
}
