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

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = MAX_QUANTITY,
  disabled = false,
  label = "Quantity",
  className,
}: QuantityStepperProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-full bg-secondary p-1", className)}
      role="group"
      aria-label={label}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full bg-background/70"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
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
        size="icon-sm"
        className="rounded-full bg-background/70"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
