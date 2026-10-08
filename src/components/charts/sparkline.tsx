"use client";

import * as React from "react";
import { cn, formatCompactUSD, formatDate, formatUSD } from "@/lib/utils";

export type SparkPoint = { at: number; score: number };

type SparklineProps = {
  points: SparkPoint[];
  height?: number;
  className?: string;
  /** Accessible title for the chart. */
  label?: string;
  /** Show the min/max dollar labels on the left. */
  showScale?: boolean;
};

const MAX_POINTS = 240;

function downsample(points: SparkPoint[]): SparkPoint[] {
  if (points.length <= MAX_POINTS) return points;
  const step = points.length / MAX_POINTS;
  const sampled: SparkPoint[] = [];
  for (let index = 0; index < MAX_POINTS; index += 1) {
    sampled.push(points[Math.floor(index * step)]!);
  }
  sampled.push(points[points.length - 1]!);
  return sampled;
}

/**
 * Score over time as a stepped area chart (the score only changes at events,
 * so steps are the honest shape). Hover or focus for a crosshair and tooltip.
 */
export function Sparkline({
  points: rawPoints,
  height = 120,
  className,
  label = "Apple Score over time",
  showScale = false,
}: SparklineProps) {
  const points = React.useMemo(() => downsample(rawPoints), [rawPoints]);
  const [hover, setHover] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const width = 600;
  const padX = 8;
  const padTop = 10;
  const padBottom = 8;

  const geometry = React.useMemo(() => {
    if (points.length === 0) return null;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const minAt = first.at;
    const maxAt = Math.max(last.at, minAt + 1);
    const maxScore = Math.max(...points.map((point) => point.score), 1);

    const x = (at: number) => padX + ((at - minAt) / (maxAt - minAt)) * (width - padX * 2);
    const y = (score: number) => padTop + (1 - score / maxScore) * (height - padTop - padBottom);

    // Stepped path: hold each value until the next event.
    let line = `M ${x(first.at)} ${y(first.score)}`;
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index]!;
      line += ` H ${x(point.at)} V ${y(point.score)}`;
    }
    line += ` H ${width - padX}`;

    const area = `${line} V ${height - padBottom} H ${x(first.at)} Z`;
    const endX = width - padX;
    const endY = y(last.score);

    return { x, y, line, area, endX, endY, maxScore, minAt, maxAt };
  }, [points, height]);

  if (!geometry || points.length < 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        Your score chart starts with your first product.
      </div>
    );
  }

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const at = geometry.minAt + ratio * (geometry.maxAt - geometry.minAt);
    // The value in force at `at` is the last point at or before it.
    let index = 0;
    for (let i = 0; i < points.length; i += 1) {
      if (points[i]!.at <= at) index = i;
    }
    setHover(index);
  };

  const active = hover === null ? null : points[hover]!;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        className="relative w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? points.length - 1) - 1));
          if (event.key === "ArrowRight")
            setHover((h) => Math.min(points.length - 1, (h ?? points.length - 2) + 1));
          if (event.key === "Escape") setHover(null);
        }}
        onBlur={() => setHover(null)}
        aria-label={`${label}. Use the arrow keys to inspect points.`}
        role="group"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.28" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line
            x1={padX}
            x2={width - padX}
            y1={height - padBottom}
            y2={height - padBottom}
            stroke="var(--chart-axis)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path d={geometry.area} fill="url(#spark-fill)" />
          <path
            d={geometry.line}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {active && (
            <line
              x1={geometry.x(active.at)}
              x2={geometry.x(active.at)}
              y1={padTop}
              y2={height - padBottom}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              strokeDasharray="0"
              vectorEffect="non-scaling-stroke"
              opacity="0.5"
            />
          )}
        </svg>

        {/* The end marker and crosshair dot are HTML so they stay round under preserveAspectRatio="none". */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-background"
          style={{
            left: `${(geometry.endX / width) * 100}%`,
            top: `${(geometry.endY / height) * 100}%`,
          }}
        />
        {active && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-background"
            style={{
              left: `${(geometry.x(active.at) / width) * 100}%`,
              top: `${(geometry.y(active.score) / height) * 100}%`,
            }}
          />
        )}

        {/* Always mounted: a live region inserted with its text already present
            is not announced by every screen reader, so the first arrow press
            would be silent. */}
        <div
          role="status"
          className={
            active
              ? "pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
              : "sr-only"
          }
          style={
            active
              ? {
                  left: `clamp(3.5rem, ${(geometry.x(active.at) / width) * 100}%, calc(100% - 3.5rem))`,
                  top: 0,
                }
              : undefined
          }
        >
          {active && (
            <>
              <p className="font-semibold">{formatUSD(active.score)}</p>
              <p className="text-muted-foreground">{formatDate(new Date(active.at))}</p>
            </>
          )}
        </div>
      </div>

      {showScale && (
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{formatDate(new Date(geometry.minAt))}</span>
          <span className="tabular">peak {formatCompactUSD(geometry.maxScore)}</span>
        </div>
      )}
    </div>
  );
}
