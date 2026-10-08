import { cn } from "@/lib/utils";

type StepProgressProps = {
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
  className?: string;
};

/** One thin segment per step; the current one carries `aria-current="step"`. */
export function StepProgress({ steps, current, className }: StepProgressProps) {
  return (
    <nav aria-label="Progress" className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Step {current + 1} of {steps.length} · {steps[current]}
      </p>
      <ol
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((label, index) => {
          const state = index < current ? "complete" : index === current ? "current" : "upcoming";
          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              className="space-y-1.5"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-1.5 rounded-full transition-colors duration-300",
                  state === "upcoming" ? "bg-secondary" : "bg-accent"
                )}
              />
              <span
                className={cn(
                  "sr-only sm:not-sr-only sm:block sm:text-xs",
                  state === "current"
                    ? "sm:font-semibold sm:text-foreground"
                    : "sm:text-muted-foreground"
                )}
              >
                {label}
                {state === "complete" && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
