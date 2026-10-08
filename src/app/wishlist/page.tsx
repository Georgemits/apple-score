import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { getUserStats, getWishlist, type WishlistEntry } from "@/lib/queries";
import { formatUSD, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import type { WishlistItemView } from "@/components/wishlist/types";

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "The Apple products you want next, and what buying them would do to your Apple Score.",
};

export const dynamic = "force-dynamic";

/** Flattens a Prisma row into plain JSON for the client (dates become epoch ms). */
function serialize(entry: WishlistEntry): WishlistItemView {
  return {
    id: entry.id,
    productId: entry.productId,
    createdAt: entry.createdAt.getTime(),
    product: {
      id: entry.product.id,
      slug: entry.product.slug,
      name: entry.product.name,
      category: entry.product.category,
      family: entry.product.family,
      priceUSD: entry.product.priceUSD,
      image: entry.product.image,
      year: entry.product.year,
      legacy: entry.product.legacy,
    },
  };
}

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/wishlist");

  const [wishlist, stats] = await Promise.all([
    getWishlist(session.user.id),
    getUserStats(session.user.id),
  ]);
  const items = wishlist.map(serialize);
  const wanting = items.reduce((sum, item) => sum + item.product.priceUSD, 0);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow="Window shopping"
        title="Wishlist"
        description={
          items.length === 0
            ? `Your Apple Score is ${formatUSD(stats.score)}. It is safe, for now.`
            : `${pluralize(items.length, "product")} · ${formatUSD(wanting)} of wanting. Your Apple Score today: ${formatUSD(stats.score)}.`
        }
        actions={
          <Button asChild>
            <Link href="/catalog">
              <Plus aria-hidden="true" />
              Find more to want
            </Link>
          </Button>
        }
      />

      <WishlistView items={items} score={stats.score} />
    </div>
  );
}
