"use client";

import * as React from "react";
import { LoaderCircle, Plus } from "lucide-react";
import type { Category } from "@prisma/client";
import { addProductAction } from "@/actions/products";
import { useScoreAction } from "@/hooks/use-score-action";
import { cn, formatUSD, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";

/** Plain, serialisable shape handed across the server/client boundary. */
export type QuickAddProduct = {
  id: string;
  name: string;
  priceUSD: number;
  image: string;
  category: Category;
  /** Public collectors who own it. */
  holders: number;
};

type QuickAddGridProps = {
  products: QuickAddProduct[];
  className?: string;
};

/**
 * One-tap adds for popular products the user does not own yet. Each tap runs
 * the real server action; the page refreshes and the product leaves the list.
 */
export function QuickAddGrid({ products, className }: QuickAddGridProps) {
  const { run, isPending } = useScoreAction();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // The hook flips `isPending` back regardless of outcome; follow it so a
  // failed add never leaves a spinner behind.
  React.useEffect(() => {
    if (!isPending) setPendingId(null);
  }, [isPending]);

  const add = (product: QuickAddProduct) => {
    setPendingId(product.id);
    run(() => addProductAction({ productId: product.id, quantity: 1 }), `Added ${product.name}.`);
  };

  return (
    <ul
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}
      aria-label="Popular products you can add in one tap"
    >
      {products.map((product) => {
        const busy = pendingId === product.id;
        return (
          <li
            key={product.id}
            className="card-hover flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 p-3 lg:flex-col lg:items-stretch lg:p-4"
          >
            <ProductImage
              src={product.image}
              alt=""
              category={product.category}
              className="size-14 shrink-0 p-2.5 lg:aspect-square lg:size-auto lg:w-full lg:p-5"
            />
            <div className="min-w-0 flex-1 lg:mt-3">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
              <p className="tabular mt-0.5 truncate text-xs text-muted-foreground">
                {formatUSD(product.priceUSD)}
                {product.holders > 0 && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {pluralize(product.holders, "collector")}
                  </>
                )}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-11 shrink-0 px-4 lg:mt-3 lg:h-10 lg:w-full"
              onClick={() => add(product)}
              disabled={isPending}
              aria-label={`Add ${product.name} to your collection`}
              aria-busy={busy}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              Add
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
