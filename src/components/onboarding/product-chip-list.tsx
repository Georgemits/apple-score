"use client";

import type * as React from "react";
import { QuantityStepper } from "@/components/quantity-stepper";
import { SelectChip } from "@/components/onboarding/select-chip";
import type { OnboardingProduct, Picks } from "@/components/onboarding/catalogue";
import { formatUSD } from "@/lib/utils";

type ProductChipListProps = {
  label: string;
  products: readonly OnboardingProduct[];
  picks: Picks;
  /** When true, unselected chips are disabled (the 12-product cap). */
  limitReached: boolean;
  onToggle: (id: string) => void;
  /** When given, selected chips grow a quantity stepper. */
  onQuantityChange?: (id: string, quantity: number) => void;
  /** Appended after the products — the "No iPhone" chip, say. */
  trailing?: React.ReactNode;
};

/** A wrapping row of product chips, each one a pressed/unpressed button. */
export function ProductChipList({
  label,
  products,
  picks,
  limitReached,
  onToggle,
  onQuantityChange,
  trailing,
}: ProductChipListProps) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {products.map((product, index) => {
        const quantity = picks[product.id];
        const selected = quantity !== undefined;
        return (
          <li
            key={product.id}
            className="max-w-full animate-enter-up"
            style={{ animationDelay: `${Math.min(index * 25, 240)}ms` }}
          >
            <SelectChip
              label={product.name}
              detail={formatUSD(product.priceUSD)}
              selected={selected}
              disabled={!selected && limitReached}
              onToggle={() => onToggle(product.id)}
              trailing={
                quantity !== undefined && onQuantityChange ? (
                  <QuantityStepper
                    value={quantity}
                    onChange={(next) => onQuantityChange(product.id, next)}
                    label={`${product.name} quantity`}
                  />
                ) : undefined
              }
            />
          </li>
        );
      })}
      {trailing && <li className="max-w-full">{trailing}</li>}
    </ul>
  );
}
