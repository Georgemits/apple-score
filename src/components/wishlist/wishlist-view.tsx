"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { addProductAction } from "@/actions/products";
import { toggleWishlistAction } from "@/actions/social";
import { useScoreAction } from "@/hooks/use-score-action";
import { formatUSD, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PurchaseSimulator } from "@/components/wishlist/purchase-simulator";
import { WishlistRow } from "@/components/wishlist/wishlist-row";
import type { WishlistItemView } from "@/components/wishlist/types";

type WishlistViewProps = {
  items: WishlistItemView[];
  /** The user's current Apple Score. */
  score: number;
};

function without(set: ReadonlySet<string>, value: string): ReadonlySet<string> {
  const next = new Set(set);
  next.delete(value);
  return next;
}

/** The wishlist rows plus the purchase simulator, sharing one selection. */
export function WishlistView({ items, score }: WishlistViewProps) {
  const router = useRouter();
  const { run, isPending } = useScoreAction();
  const [, startRemoval] = React.useTransition();

  /** Products bought from this page and hidden while the wishlist catches up. */
  const [bought, setBought] = React.useState<ReadonlySet<string>>(() => new Set());
  /** Products unticked in the simulator. Everything else is included by default. */
  const [excluded, setExcluded] = React.useState<ReadonlySet<string>>(() => new Set());
  const [buyingId, setBuyingId] = React.useState<string | null>(null);

  const visible = React.useMemo(
    () => items.filter((item) => !bought.has(item.productId)),
    [items, bought]
  );
  const wanting = visible.reduce((sum, item) => sum + item.product.priceUSD, 0);

  const buy = (item: WishlistItemView) => {
    const { productId, product } = item;
    setBuyingId(productId);

    run(
      () =>
        addProductAction({ productId, quantity: 1 }).then(
          (result) => {
            if (!result.ok) setBuyingId(null);
            return result;
          },
          (error: unknown) => {
            setBuyingId(null);
            throw error;
          }
        ),
      `Added ${product.name} to your collection.`,
      () => {
        setBuyingId(null);
        setBought((previous) => new Set(previous).add(productId));

        // It is owned now, so it leaves the wishlist. The score hook already
        // refreshed once; refresh again once the list has actually changed.
        startRemoval(async () => {
          try {
            let result = await toggleWishlistAction({ productId });
            if (result.ok && result.data.wished) {
              // It had already left the list (another tab?), so the toggle put it back. Undo that.
              result = await toggleWishlistAction({ productId });
            }
            if (!result.ok) {
              toast.error(result.error);
              setBought((previous) => without(previous, productId));
              return;
            }
            router.refresh();
          } catch (error) {
            console.error(error);
            toast.error(`${product.name} is in your collection, but still on the wishlist.`);
            setBought((previous) => without(previous, productId));
          }
        });
      }
    );
  };

  const toggleSelected = (productId: string) =>
    setExcluded((previous) =>
      previous.has(productId) ? without(previous, productId) : new Set(previous).add(productId)
    );
  const selectAll = () => setExcluded(new Set());
  const selectNone = () => setExcluded(new Set(visible.map((item) => item.productId)));

  if (visible.length === 0) {
    return (
      <EmptyState
        emoji="🛒"
        title="Nothing on the wishlist. Suspicious."
        description="Window shopping is free. Wishlisting is free. Buying is the expensive part — go find something to want."
        action={
          <Button asChild>
            <Link href="/catalog">
              <Search aria-hidden="true" />
              Browse the catalogue
            </Link>
          </Button>
        }
        className="py-20"
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,23rem)] lg:items-start lg:gap-8">
      <section aria-labelledby="wishlist-heading" className="min-w-0 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="wishlist-heading" className="text-lg font-semibold tracking-tight">
            On the list
          </h2>
          <p className="tabular text-sm text-muted-foreground">
            {pluralize(visible.length, "product")} · {formatUSD(wanting)}
          </p>
        </div>
        <ol className="space-y-2 sm:space-y-3">
          {visible.map((item, index) => (
            <WishlistRow
              key={item.id}
              item={item}
              score={score}
              index={index}
              busy={buyingId === item.productId}
              disabled={isPending}
              onBuy={buy}
            />
          ))}
        </ol>
      </section>

      <PurchaseSimulator
        className="lg:sticky lg:top-24"
        items={visible}
        excluded={excluded}
        onToggle={toggleSelected}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        score={score}
      />
    </div>
  );
}
