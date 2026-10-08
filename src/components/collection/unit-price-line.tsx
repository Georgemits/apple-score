import { hasCustomPrice } from "@/lib/score";
import { cn, formatUSD } from "@/lib/utils";
import type { CollectionItem } from "@/components/collection/types";

type UnitPriceLineProps = {
  item: Pick<CollectionItem, "quantity" | "pricePaidUSD" | "product">;
  className?: string;
};

/** "$1,199 MSRP", or "$900 paid · ~~$1,199~~ MSRP" when the owner recorded a different price. */
export function UnitPriceLine({ item, className }: UnitPriceLineProps) {
  const msrp = formatUSD(item.product.priceUSD);

  if (hasCustomPrice(item)) {
    return (
      <p className={cn("tabular text-xs text-muted-foreground", className)}>
        <span className="font-medium text-foreground">
          {formatUSD(item.pricePaidUSD ?? 0)} paid
        </span>
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, instead of </span>
        <s>{msrp}</s> MSRP
      </p>
    );
  }

  return <p className={cn("tabular text-xs text-muted-foreground", className)}>{msrp} MSRP</p>;
}
