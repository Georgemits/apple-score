import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getCatalogue,
  getOwnedQuantities,
  getOwnershipCounts,
  getUserStats,
  getWishlistIds,
} from "@/lib/queries";
import { categoryFromSlug } from "@/lib/categories";
import { CatalogHeader } from "@/components/catalog/catalog-header";
import { Catalogue } from "@/components/catalog/catalogue";
import type { CatalogueItem } from "@/components/catalog/types";

export const metadata: Metadata = {
  title: "Add products",
  description:
    "Browse every Apple product in the catalogue and add the ones you own to your Apple Score.",
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type PageProps = { searchParams: Promise<SearchParams> };

/** Longest search we bother seeding from the URL. */
const MAX_QUERY_LENGTH = 80;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/catalog");
  const userId = session.user.id;

  const [params, catalogue, owned, wishlist, holders, stats] = await Promise.all([
    searchParams,
    getCatalogue(),
    getOwnedQuantities(userId),
    getWishlistIds(userId),
    getOwnershipCounts(),
    getUserStats(userId),
  ]);

  // Sets and Dates do not cross the client boundary; fold everything the
  // tiles need into one plain row per product.
  const items: CatalogueItem[] = catalogue.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    family: product.family,
    priceUSD: product.priceUSD,
    image: product.image,
    year: product.year,
    legacy: product.legacy,
    owned: owned[product.id] ?? 0,
    holders: holders[product.id] ?? 0,
    wished: wishlist.has(product.id),
  }));

  const initialCategory = categoryFromSlug(first(params.category).toLowerCase());
  const initialQuery = first(params.q).slice(0, MAX_QUERY_LENGTH);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <CatalogHeader
        score={stats.score}
        tier={stats.tier}
        ownedDistinct={stats.distinctProducts}
        total={catalogue.length}
      />
      <Catalogue
        items={items}
        currentScore={stats.score}
        initialCategory={initialCategory}
        initialQuery={initialQuery}
      />
    </div>
  );
}
