"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_QUANTITY } from "@/lib/validations";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
};

/** 40px targets on phones, the compact 32px size from `sm` up. */
const STEP_BUTTON =
  "rounded-full bg-background/70 aria-disabled:opacity-50 sm:size-8 sm:[&_svg]:size-3.5";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = MAX_QUANTITY,
  disabled = false,
  label = "Quantity",
  className,
}: QuantityStepperProps) {
  // `aria-disabled` rather than `disabled`: a button that disables itself
  // under the keyboard user's focus drops focus to <body>, and every step
  // briefly disables while the action is pending.
  const decreaseBlocked = disabled || value <= min;
  const increaseBlocked = disabled || value >= max;

  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-full bg-secondary p-1", className)}
      role="group"
      aria-label={label}
      aria-busy={disabled || undefined}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={STEP_BUTTON}
        aria-disabled={decreaseBlocked || undefined}
        onClick={() => {
          if (!decreaseBlocked) onChange(value - 1);
        }}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus aria-hidden="true" />
      </Button>

      <span className="tabular min-w-8 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={STEP_BUTTON}
        aria-disabled={increaseBlocked || undefined}
        onClick={() => {
          if (!increaseBlocked) onChange(value + 1);
        }}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
