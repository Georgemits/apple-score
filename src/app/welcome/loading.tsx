import { Skeleton } from "@/components/ui/skeleton";

const CHIP_WIDTHS = [
  "9rem",
  "11rem",
  "8rem",
  "10rem",
  "12rem",
  "9rem",
  "11rem",
  "8rem",
  "10rem",
  "7rem",
];

export default function WelcomeLoading() {
  return (
    <div className="container px-4 py-8 sm:px-6 sm:py-12">
      <div
        role="status"
        aria-label="Loading the welcome flow"
        className="mx-auto max-w-3xl space-y-8 pb-28 md:pb-24"
      >
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-1.5 rounded-full" />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-sm" />
        </div>

        <Skeleton className="h-11 w-full rounded-lg" />

        <div className="flex flex-wrap gap-2">
          {CHIP_WIDTHS.map((width, index) => (
            <Skeleton key={index} className="h-11 rounded-full" style={{ width }} />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-12 w-28 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}
