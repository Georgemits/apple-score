"use client";

import type * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectChipProps = {
  label: string;
  /** Secondary text at the right edge — the price, usually. */
  detail?: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
  /** Rendered inside the pill after the toggle, e.g. a quantity stepper. */
  trailing?: React.ReactNode;
  className?: string;
};

/**
 * A toggleable pill. The toggle itself is a real button with `aria-pressed`;
 * anything in `trailing` sits beside it so interactive controls never nest.
 */
export function SelectChip({
  label,
  detail,
  selected,
  disabled = false,
  onToggle,
  trailing,
  className,
}: SelectChipProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center rounded-full border transition-colors duration-200",
        selected
          ? "border-accent/60 bg-accent/10 shadow-sm"
          : "border-border bg-background/60 backdrop-blur hover:border-foreground/20 hover:bg-secondary/80",
        disabled && !selected && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={onToggle}
        className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-full py-2 pl-3 pr-4 text-left text-sm font-medium disabled:cursor-not-allowed"
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-background"
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} />}
        </span>
        <span className="truncate">{label}</span>
        {detail && (
          <span
            className={cn(
              "tabular shrink-0 text-xs",
              selected ? "text-foreground/70" : "text-muted-foreground"
            )}
          >
            {detail}
          </span>
        )}
      </button>
      {trailing && <div className="mr-1.5 shrink-0">{trailing}</div>}
    </div>
  );
}
