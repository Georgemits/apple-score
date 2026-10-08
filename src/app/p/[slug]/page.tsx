import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Layers, Tag, Users } from "lucide-react";
import { auth } from "@/auth";
import {
  getCatalogue,
  getInventory,
  getOwnershipCounts,
  getProductBySlug,
  getProductOwners,
  getWishlistIds,
  ownedQuantities,
  summarize,
  type InventoryItem,
} from "@/lib/queries";
import { simulateRank } from "@/lib/leaderboard";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { formatNumber, formatUSD, pluralize, profileName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "@/components/product-image";
import { LegacyBadge } from "@/components/legacy-badge";
import { UserAvatar } from "@/components/user-avatar";
import { WishlistButton } from "@/components/wishlist-button";
import { AddProductButton } from "@/components/product/add-product-button";
import { StatCard } from "@/components/stat-card";
import { LEADERBOARD_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };

  const description = `${product.name} (${product.year}) adds ${formatUSD(product.priceUSD)} to your Apple Score. ${CATEGORY_LABEL[product.category]} · ${product.family}.`;
  return {
    title: `${product.name} — ${formatUSD(product.priceUSD)}`,
    description,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: { title: product.name, description, type: "website" },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [owners, counts, catalogue, inventory, wished] = await Promise.all([
    getProductOwners(product.id),
    getOwnershipCounts(),
    getCatalogue(),
    userId ? getInventory(userId) : Promise.resolve<InventoryItem[]>([]),
    userId ? getWishlistIds(userId) : Promise.resolve(new Set<string>()),
  ]);
  const stats = userId ? summarize(inventory) : null;
  const owned = ownedQuantities(inventory);

  const holders = counts[product.id] ?? 0;
  const ownedQuantity = owned[product.id] ?? 0;
  const projected =
    userId && stats ? await simulateRank(userId, stats.score + product.priceUSD) : null;

  const siblings = catalogue
    .filter((entry) => entry.family === product.family && entry.id !== product.id)
    .sort((a, b) => b.year - a.year)
    .slice(0, 6);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={`/catalog?category=${CATEGORY_SLUG[product.category]}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {CATEGORY_LABEL[product.category]}
      </Link>

      <Card className="relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gradient-to-br from-accent/20 to-fuchsia-500/15 blur-3xl"
        />
        <div className="relative grid gap-8 md:grid-cols-[14rem_minmax(0,1fr)] md:items-center">
          <ProductImage
            src={product.image}
            alt=""
            category={product.category}
            className="mx-auto size-48 p-8 md:size-56"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                <span aria-hidden="true">{CATEGORY_EMOJI[product.category]}</span>
                {CATEGORY_LABEL[product.category]}
              </Badge>
              <Badge variant="outline">{product.family}</Badge>
              {product.legacy && <LegacyBadge />}
              {ownedQuantity > 0 && (
                <Badge variant="accent">You own {formatNumber(ownedQuantity)}</Badge>
              )}
            </div>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tighter sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Announced {product.year}
              {product.legacy ? " · discontinued" : ""}
            </p>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Adds to your Apple Score
            </p>
            <p className="score-figure mt-1 text-5xl font-bold sm:text-6xl">
              {formatUSD(product.priceUSD)}
            </p>

            {projected && stats && (
              <p className="mt-3 text-sm text-muted-foreground">
                Adding one takes you to{" "}
                <span className="font-semibold text-foreground">
                  {formatUSD(stats.score + product.priceUSD)}
                </span>{" "}
                and #{formatNumber(projected.rank)} of {formatNumber(projected.total)} on{" "}
                {LEADERBOARD_NAME}.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {userId ? (
                <>
                  <AddProductButton
                    product={product}
                    ownedQuantity={ownedQuantity}
                    currentScore={stats?.score ?? 0}
                  />
                  <WishlistButton
                    productId={product.id}
                    productName={product.name}
                    initialWished={wished.has(product.id)}
                    className="size-12 border border-border/70 bg-background/60"
                  />
                </>
              ) : (
                <Button asChild size="lg">
                  <Link href={`/signup?callbackUrl=/p/${product.slug}`}>Sign up to add it</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <section aria-labelledby="product-stats">
        <h2 id="product-stats" className="sr-only">
          Product facts
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Launch price"
            value={formatUSD(product.priceUSD)}
            hint="US, base configuration"
            icon={Tag}
          />
          <StatCard label="Announced" value={String(product.year)} icon={Calendar} />
          <StatCard
            label="Family"
            value={product.family}
            hint={CATEGORY_LABEL[product.category]}
            icon={Layers}
          />
          <StatCard
            label="Collectors"
            value={formatNumber(holders)}
            hint={holders === 0 ? "Nobody owns one yet" : `${holders === 1 ? "owns" : "own"} this`}
            icon={Users}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Who owns it</CardTitle>
          </CardHeader>
          <CardContent>
            {owners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No public collector owns this yet. Be the first — it is a great flex.
              </p>
            ) : (
              <ul className="space-y-3">
                {owners.map((owner) => (
                  <li key={owner.id} className="flex items-center gap-3">
                    <UserAvatar user={owner} size={36} />
                    <Link
                      href={`/u/${owner.username}`}
                      className="min-w-0 flex-1 truncate font-medium hover:underline"
                    >
                      {profileName(owner)}
                    </Link>
                    <span className="tabular text-sm text-muted-foreground">
                      ×{formatNumber(owner.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>More {product.family}</CardTitle>
          </CardHeader>
          <CardContent>
            {siblings.length === 0 ? (
              <p className="text-sm text-muted-foreground">This one stands alone.</p>
            ) : (
              <ul className="space-y-2">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={`/p/${sibling.slug}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/70"
                    >
                      <ProductImage
                        src={sibling.image}
                        alt=""
                        category={sibling.category}
                        className="size-10 p-2"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{sibling.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {sibling.year} · {pluralize(counts[sibling.id] ?? 0, "collector")}
                        </span>
                      </span>
                      <span className="tabular text-sm font-semibold">
                        {formatUSD(sibling.priceUSD)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
