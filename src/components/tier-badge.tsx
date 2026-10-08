import type { Tier } from "@/lib/score";
import { cn } from "@/lib/utils";

type TierBadgeProps = {
  tier: Tier;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** The user's "how deep in the ecosystem" tier, as a pill. */
export function TierBadge({ tier, size = "md", className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 font-medium text-foreground backdrop-blur",
        size === "sm" && "px-2.5 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-4 py-1.5 text-base",
        className
      )}
      title={tier.tagline}
    >
      <span aria-hidden="true">{tier.emoji}</span>
      {tier.name}
    </span>
  );
}
