"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/product-image";
import { LegacyBadge } from "@/components/legacy-badge";
import { WishlistButton } from "@/components/wishlist-button";
import type { CatalogueItem } from "@/components/catalog/types";
import { formatNumber, formatUSD, pluralize } from "@/lib/utils";

/** Entrance stagger: 12 × 20ms caps the delay at 240ms however long the list. */
const MAX_STAGGER = 12;
const STAGGER_MS = 20;

type ProductTileProps = {
  item: CatalogueItem;
  /** Position in the rendered list, for the entrance stagger. */
  index: number;
  onOpen: (item: CatalogueItem) => void;
};

/**
 * One catalogue product. A compact row on phones, a card on desktop. The whole
 * tile opens the add dialog; the wishlist heart sits beside it as a sibling so
 * the two controls never nest.
 */
export function ProductTile({ item, index, onOpen }: ProductTileProps) {
  return (
    <li
      className="card-hover glass group relative flex animate-enter-up items-center gap-3 rounded-2xl p-3 lg:flex-col lg:items-stretch lg:p-4"
      style={{ animationDelay: `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms` }}
    >
      <ProductImage
        src={item.image}
        alt=""
        category={item.category}
        className="size-16 shrink-0 p-3 lg:aspect-square lg:size-auto lg:w-full lg:p-7"
      />

      <div className="min-w-0 flex-1 lg:mt-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug lg:text-base">{item.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular">{item.year}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{item.family}</span>
          {item.legacy && <LegacyBadge className="px-2 py-0 text-[11px]" />}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 lg:mt-3">
          <span className="tabular text-sm font-semibold lg:text-base">
            {formatUSD(item.priceUSD)}
          </span>
          {item.owned > 0 && (
            <Badge variant="accent">
              Owned <span className="tabular">×{formatNumber(item.owned)}</span>
            </Badge>
          )}
        </div>
        {item.holders > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {pluralize(item.holders, "collector")} {item.holders === 1 ? "owns" : "own"} this
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`Add ${item.name} to your collection`}
        className="absolute inset-0 rounded-2xl"
      />

      <div className="flex shrink-0 flex-col items-center justify-between gap-1 self-stretch lg:contents">
        <WishlistButton
          productId={item.id}
          productName={item.name}
          initialWished={item.wished}
          className="relative z-10 size-11 bg-background/70 backdrop-blur lg:absolute lg:right-3 lg:top-3 lg:size-9"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity lg:absolute lg:bottom-4 lg:right-4 lg:size-8 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
        >
          <Plus className="size-4" />
        </span>
      </div>
    </li>
  );
}
