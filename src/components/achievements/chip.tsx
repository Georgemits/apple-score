"use client";

import type * as React from "react";
import { cn, formatNumber } from "@/lib/utils";

type ChipProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  active: boolean;
  /** Shown after the label in tabular figures. */
  count?: number;
};

/** A pill toggle with `aria-pressed`. Tap targets stay ≥ 44px on phones. */
export function Chip({ active, count, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors sm:h-9 sm:px-3.5",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border/70 bg-background/60 text-foreground backdrop-blur hover:bg-secondary",
        className
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn("tabular", active ? "text-primary-foreground/70" : "text-muted-foreground")}
        >
          {formatNumber(count)}
        </span>
      )}
    </button>
  );
}

type ChipRowProps = {
  label: string;
  children: React.ReactNode;
};

/** A horizontally scrolling chip row with faded edges on phones; wraps on wider screens. */
export function ChipRow({ label, children }: ChipRowProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="scrollbar-none fade-x -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]"
    >
      {children}
    </div>
  );
}
