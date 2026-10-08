"use client";

import type * as React from "react";
import { cn, formatNumber } from "@/lib/utils";

type ChipProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  active?: boolean;
  /** Shown after the label in tabular figures. */
  count?: number;
  size?: "md" | "sm";
};

/** A pill toggle. Tap targets stay ≥ 44px on phones and tighten up on desktop. */
export function Chip({
  active = false,
  count,
  size = "md",
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
        size === "md" ? "h-11 px-4 text-sm sm:h-9 sm:px-3.5" : "h-10 px-3.5 text-xs sm:h-8 sm:px-3",
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
