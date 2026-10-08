"use client";

import * as React from "react";
import type { CategoryBreakdown } from "@/lib/score";
import { CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { cn, formatCompactUSD, formatNumber, formatUSD } from "@/lib/utils";

type CategoryDonutProps = {
  breakdown: readonly CategoryBreakdown[];
  className?: string;
  /** Hide the legend list (when the parent renders its own). */
  compact?: boolean;
};

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Surface gap between segments, in degrees. */
const GAP_DEGREES = 2.4;

/**
 * Spending split by category: a donut with a surface gap between slices,
 * the total in the centre, and a legend that doubles as the data table.
 * Colours follow the category (never the rank) via CSS variables that are
 * re-stepped for dark mode.
 */
export function CategoryDonut({ breakdown, className, compact = false }: CategoryDonutProps) {
  const [active, setActive] = React.useState<number | null>(null);
  const total = breakdown.reduce((sum, entry) => sum + entry.total, 0);

  if (breakdown.length === 0 || total === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Add a product to see how your spending splits across categories.
      </p>
    );
  }

  let offset = 0;
  const slices = breakdown.map((entry, index) => {
    const share = entry.total / total;
    const degrees = share * 360;
    const gap = breakdown.length > 1 ? Math.min(GAP_DEGREES, degrees / 2) : 0;
    const visible = Math.max(degrees - gap, 0);
    const slice = {
      index,
      entry,
      share,
      dash: (visible / 360) * CIRCUMFERENCE,
      rotate: offset + gap / 2,
    };
    offset += degrees;
    return slice;
  });

  const shown = active === null ? null : breakdown[active]!;

  return (
    <div className={cn("flex flex-col gap-6 sm:flex-row sm:items-center", className)}>
      <div className="relative mx-auto shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`Spending split: ${breakdown
            .map(
              (entry) =>
                `${CATEGORY_LABEL[entry.category]} ${Math.round((entry.total / total) * 100)}%`
            )
            .join(", ")}`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={STROKE}
          />
          {slices.map((slice) => (
            <circle
              key={slice.entry.category}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={`var(--chart-${CATEGORY_SLUG[slice.entry.category]})`}
              strokeWidth={active === null || active === slice.index ? STROKE : STROKE - 6}
              strokeDasharray={`${slice.dash} ${CIRCUMFERENCE - slice.dash}`}
              strokeDashoffset={0}
              transform={`rotate(${slice.rotate - 90} ${SIZE / 2} ${SIZE / 2})`}
              className="transition-[stroke-width,opacity] duration-200"
              opacity={active === null || active === slice.index ? 1 : 0.45}
              onPointerEnter={() => setActive(slice.index)}
              onPointerLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          aria-hidden="true"
        >
          {shown ? (
            <>
              <p className="text-[11px] font-medium text-muted-foreground">
                {CATEGORY_LABEL[shown.category]}
              </p>
              <p className="text-lg font-semibold tracking-tight">
                {formatCompactUSD(shown.total)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {Math.round((shown.total / total) * 100)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-medium text-muted-foreground">Total</p>
              <p className="text-lg font-semibold tracking-tight">{formatCompactUSD(total)}</p>
              <p className="text-[11px] text-muted-foreground">
                {breakdown.length} {breakdown.length === 1 ? "category" : "categories"}
              </p>
            </>
          )}
        </div>
      </div>

      {!compact && (
        <ul className="min-w-0 flex-1 space-y-2">
          {breakdown.map((entry, index) => (
            <li
              key={entry.category}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-1 transition-colors",
                active === index && "bg-secondary/70"
              )}
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: `var(--chart-${CATEGORY_SLUG[entry.category]})` }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {CATEGORY_LABEL[entry.category]}
              </span>
              <span className="tabular hidden text-xs text-muted-foreground sm:inline">
                {formatNumber(entry.units)} {entry.units === 1 ? "item" : "items"}
              </span>
              <span className="tabular w-20 text-right text-sm font-semibold">
                {formatUSD(entry.total)}
              </span>
              <span className="tabular w-10 text-right text-xs text-muted-foreground">
                {Math.round((entry.total / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
