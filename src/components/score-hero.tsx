import type * as React from "react";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";

type ScoreHeroProps = {
  eyebrow?: string;
  title: React.ReactNode;
  score: number;
  footnote?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function ScoreHero({
  eyebrow,
  title,
  score,
  footnote,
  actions,
  className,
}: ScoreHeroProps) {
  return (
    <Card className={cn("relative overflow-hidden p-7 sm:p-10", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gradient-to-br from-accent/25 to-fuchsia-500/20 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>

          <p className="mt-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Apple Score
          </p>
          <p className="tabular mt-1 text-5xl font-semibold tracking-tighter sm:text-7xl">
            <AnimatedNumber value={score} />
          </p>
          {footnote && <div className="mt-3 text-sm text-muted-foreground">{footnote}</div>}
        </div>

        {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
      </div>
    </Card>
  );
}
