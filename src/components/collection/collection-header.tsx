import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { formatNumber, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedMoney } from "@/components/animated-number";

type CollectionHeaderProps = {
  score: number;
  /** Units owned. */
  productCount: number;
  distinctProducts: number;
  categoryCount: number;
};

/** "My collection" with the total as the page's one hero figure. */
export function CollectionHeader({
  score,
  productCount,
  distinctProducts,
  categoryCount,
}: CollectionHeaderProps) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Collection
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tighter sm:text-4xl">
          My collection
        </h1>
        <p className="score-figure mt-4 text-5xl font-bold sm:text-6xl">
          <AnimatedMoney value={score} />
        </p>
        <p className="tabular mt-3 text-sm text-muted-foreground">
          {productCount === 0
            ? "Nothing yet. The number only goes up from here."
            : `${pluralize(productCount, "product")} · ${formatNumber(distinctProducts)} unique · ${pluralize(categoryCount, "category", "categories")}`}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild size="lg">
          <Link href="/catalog">
            <Plus aria-hidden="true" />
            Add products
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/wishlist">
            <Heart aria-hidden="true" />
            Wishlist
          </Link>
        </Button>
      </div>
    </header>
  );
}
