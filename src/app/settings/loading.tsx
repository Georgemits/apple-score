import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { SETTINGS_SECTIONS } from "@/components/settings/sections";

function SectionSkeleton({ rows, swatches = false }: { rows: number; swatches?: boolean }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="mt-6 space-y-5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        {swatches && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="size-11 rounded-full" />
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export default function SettingsLoading() {
  return (
    <div
      className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading settings…</span>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>

      <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="-mx-4 flex gap-2 overflow-hidden px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {SETTINGS_SECTIONS.map((section) => (
            <Skeleton
              key={section.id}
              className="h-10 w-28 shrink-0 rounded-full lg:h-9 lg:w-full lg:rounded-lg"
            />
          ))}
        </div>

        <div className="mt-6 max-w-3xl space-y-6 lg:mt-0">
          <SectionSkeleton rows={2} swatches />
          <SectionSkeleton rows={3} />
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Skeleton className="h-10 w-40 rounded-full" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
            </div>
            <Skeleton className="mt-6 h-10 w-40 rounded-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
