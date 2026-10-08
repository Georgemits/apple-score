import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Marks discontinued / vintage hardware. Purely informational — it scores at face value. */
export function LegacyBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        className
      )}
      title="Discontinued or vintage hardware"
    >
      <span aria-hidden="true">🕰</span>
      Legacy
    </Badge>
  );
}
