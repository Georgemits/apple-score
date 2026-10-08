"use client";

import Link from "next/link";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LegacyBadge } from "@/components/legacy-badge";
import { ProductImage } from "@/components/product-image";
import { WishlistButton } from "@/components/wishlist-button";
import type { WishlistItemView } from "@/components/wishlist/types";

type WishlistRowProps = {
  item: WishlistItemView;
  /** The user's current Apple Score, for "takes you to". */
  score: number;
  /** Position in the list, for the entrance stagger. */
  index: number;
  /** This row's purchase is in flight. */
  busy: boolean;
  /** Any purchase is in flight, so no second one can start. */
  disabled: boolean;
  onBuy: (item: WishlistItemView) => void;
};

/** One wanted product: what it costs, where it would take the score, and the two ways off the list. */
export function WishlistRow({ item, score, index, busy, disabled, onBuy }: WishlistRowProps) {
  const { product } = item;

  return (
    <li className="animate-enter-up" style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}>
      <Card
        className={cn(
          "p-3 transition-opacity sm:flex sm:items-center sm:gap-4 sm:p-4",
          busy && "opacity-60"
        )}
        aria-busy={busy}
      >
        <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
          <ProductImage
            src={product.image}
            alt=""
            category={product.category}
            className="size-16 shrink-0 p-2.5 sm:size-20 sm:p-3"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/p/${product.slug}`}
                className="truncate font-semibold leading-snug hover:underline"
              >
                {product.name}
              </Link>
              {product.legacy && <LegacyBadge className="shrink-0" />}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {product.family} · {product.year}
            </p>
            <p className="tabular mt-1 text-sm text-muted-foreground">
              +{formatUSD(product.priceUSD)}
              <span aria-hidden="true"> → </span>
              <span className="sr-only">, which </span>
              takes you to{" "}
              <span className="font-medium text-foreground">
                {formatUSD(score + product.priceUSD)}
              </span>
            </p>
          </div>
          <p className="tabular shrink-0 text-right text-base font-semibold sm:w-20">
            {formatUSD(product.priceUSD)}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 sm:mt-0 sm:shrink-0 sm:border-0 sm:pt-0">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            initialWished
            className="size-11 sm:size-10"
          />
          <Button
            type="button"
            size="sm"
            className="h-11 flex-1 sm:h-10 sm:flex-none"
            onClick={() => onBuy(item)}
            disabled={disabled}
            aria-busy={busy}
            aria-label={`I bought ${product.name}: add it to my collection`}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingBag aria-hidden="true" />
            )}
            I bought it
          </Button>
        </div>
      </Card>
    </li>
  );
}
