import { LEGACY_BONUS } from "@/lib/score";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BONUS_LABEL = `+${Math.round(LEGACY_BONUS * 100)}%`;

/** Marks discontinued / vintage hardware, which scores a bonus. */
export function LegacyBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        className
      )}
      title={`Legacy hardware — scores ${BONUS_LABEL} bonus points`}
    >
      <span aria-hidden="true">🕰</span>
      Legacy {BONUS_LABEL}
    </Badge>
  );
}
