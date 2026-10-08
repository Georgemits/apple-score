import type { MilestoneProgress as Progress } from "@/lib/score";
import { cn, formatUSD } from "@/lib/utils";

type MilestoneProgressProps = {
  score: number;
  milestone: Progress | null;
  className?: string;
};

/** A slim bar toward the next score milestone, with the dollars still to go. */
export function MilestoneProgress({ score, milestone, className }: MilestoneProgressProps) {
  if (!milestone) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Every milestone cleared. There is nothing left to buy. (There is always something left to
        buy.)
      </p>
    );
  }

  const percent = Math.round(milestone.progress * 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{formatUSD(milestone.remaining)}</span> to{" "}
          {formatUSD(milestone.target)}
        </span>
        <span className="tabular text-xs text-muted-foreground">{percent}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress from ${formatUSD(score)} to the ${formatUSD(milestone.target)} milestone`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-fuchsia-500 transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(percent, 1.5)}%` }}
        />
      </div>
    </div>
  );
}
