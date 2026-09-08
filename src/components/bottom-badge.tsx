import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Playful wooden-spoon badge for whoever currently sits at the bottom. */
export const BOTTOM_BADGE = {
  emoji: "🥲",
  label: "Lowest Apple Score",
  description: "Currently holding up the rest of the board. Plenty of room to climb.",
} as const;

export function BottomBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-dashed", className)}
      title={BOTTOM_BADGE.description}
    >
      <span aria-hidden="true">{BOTTOM_BADGE.emoji}</span>
      {BOTTOM_BADGE.label}
    </Badge>
  );
}
