import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getInventory, summarize, type InventoryItem } from "@/lib/queries";
import { CATEGORY_LABEL } from "@/lib/categories";
import { CollectionEmpty } from "@/components/collection/collection-empty";
import { ScoringExplainer } from "@/components/collection/scoring-explainer";
import { CollectionHeader } from "@/components/collection/collection-header";
import { CollectionStats } from "@/components/collection/collection-stats";
import { CollectionView } from "@/components/collection/collection-view";
import type { CollectionItem } from "@/components/collection/types";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My collection",
  description:
    "Every Apple product you own, what each one cost and what it adds to your Apple Score.",
};

export const dynamic = "force-dynamic";

/** Flattens a Prisma row into plain JSON for the client (dates become epoch ms). */
function serialize(item: InventoryItem): CollectionItem {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    pricePaidUSD: item.pricePaidUSD,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
    product: {
      id: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      category: item.product.category,
      family: item.product.family,
      priceUSD: item.product.priceUSD,
      image: item.product.image,
      year: item.product.year,
      legacy: item.product.legacy,
    },
  };
}

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/collection");

  const [inventory, account] = await Promise.all([
    getInventory(session.user.id),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { onboardedAt: true } }),
  ]);
  const stats = summarize(inventory);
  const items = inventory.map(serialize);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <CollectionHeader
        score={stats.score}
        productCount={stats.productCount}
        distinctProducts={stats.distinctProducts}
        categoryCount={stats.breakdown.length}
      />

      {items.length === 0 ? (
        <CollectionEmpty showSetup={account?.onboardedAt === null} />
      ) : (
        <>
          <CollectionView items={items} score={stats.score} />
          <CollectionStats
            categories={stats.breakdown.length}
            families={stats.familyCount}
            oldest={
              stats.oldest
                ? { name: stats.oldest.product.name, year: stats.oldest.product.year }
                : null
            }
            newest={
              stats.newest
                ? { name: stats.newest.product.name, year: stats.newest.product.year }
                : null
            }
            legacyUnits={stats.legacyUnits}
            topCategory={stats.topCategory ? CATEGORY_LABEL[stats.topCategory] : null}
          />
        </>
      )}

      <ScoringExplainer />
    </div>
  );
}
