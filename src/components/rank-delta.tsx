import { ArrowDown, ArrowUp, Minus, Sparkles } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

type RankDeltaProps = {
  /** previousRank − rank: positive is climbing. Null when unknown. */
  movement: number | null;
  /** Joined the board this week. */
  isNew?: boolean;
  /** Longer copy: "↑ 7 positions this week". */
  verbose?: boolean;
  className?: string;
};

/** Rank movement over the last 7 days, colour plus icon plus text. */
export function RankDelta({ movement, isNew = false, verbose = false, className }: RankDeltaProps) {
  if (isNew) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold text-accent",
          className
        )}
        title="Joined the board this week"
      >
        <Sparkles className="size-3" aria-hidden="true" />
        New
      </span>
    );
  }

  if (movement === null) return null;

  if (movement === 0) {
    return (
      <span
        className={cn(
          "inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-muted-foreground",
          className
        )}
        title="No change this week"
      >
        <Minus className="size-3 shrink-0" aria-hidden="true" />
        {verbose ? (
          <span className="truncate">Holding steady this week</span>
        ) : (
          <span className="sr-only">No change this week</span>
        )}
      </span>
    );
  }

  const up = movement > 0;
  const count = Math.abs(movement);

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1 text-xs font-semibold",
        up ? "text-success" : "text-destructive",
        className
      )}
      title={`${up ? "Up" : "Down"} ${count} ${count === 1 ? "position" : "positions"} this week`}
    >
      {up ? (
        <ArrowUp className="size-3 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-3 shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">
        {verbose
          ? `${formatNumber(count)} ${count === 1 ? "position" : "positions"} this week`
          : formatNumber(count)}
      </span>
    </span>
  );
}
