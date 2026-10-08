import Link from "next/link";
import { Heart } from "lucide-react";
import type { WishlistEntry } from "@/lib/queries";
import { formatUSD, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProductImage } from "@/components/product-image";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

const SHOWN = 3;

type WishlistCardProps = {
  /** The whole wishlist, newest first; the card shows the first few. */
  items: WishlistEntry[];
  /** Current Apple Score, for "would take you to $X". */
  score: number;
  delay?: number;
};

/** The next few things the user wants, priced against their score. */
export function WishlistCard({ items, score, delay }: WishlistCardProps) {
  const shown = items.slice(0, SHOWN);
  const wholeList = items.reduce((sum, item) => sum + item.product.priceUSD, 0);

  return (
    <DashboardCard
      id="dashboard-wishlist"
      title="Wishlist"
      description={
        items.length > 0
          ? `${pluralize(items.length, "product")} · ${formatUSD(wholeList)} if you bought the lot`
          : undefined
      }
      icon={Heart}
      href="/wishlist"
      delay={delay}
      bodyClassName={items.length === 0 ? "flex items-center" : undefined}
    >
      {shown.length === 0 ? (
        <EmptyState
          bare
          emoji="🛒"
          title="Nothing on the list"
          description="Window shopping is free. Wishlisting is free. Buying is the expensive part."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/catalog">Browse the catalogue</Link>
            </Button>
          }
          className="w-full py-6"
        />
      ) : (
        <ol className="-mx-2 space-y-1" aria-label="Wishlist">
          {shown.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <ProductImage
                src={item.product.image}
                alt=""
                category={item.product.category}
                className="size-11 shrink-0 p-2"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Would take you to{" "}
                  <span className="tabular font-semibold text-foreground">
                    {formatUSD(score + item.product.priceUSD)}
                  </span>
                </p>
              </div>
              <span className="tabular shrink-0 text-sm font-semibold">
                {formatUSD(item.product.priceUSD)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}
