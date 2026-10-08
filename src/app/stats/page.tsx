import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, DollarSign, Gauge, Users } from "lucide-react";
import {
  getCatalogue,
  getCommunityCategoryTotals,
  getCommunityStats,
  getNewestCollectors,
  getOwnershipCounts,
} from "@/lib/queries";
import { getPodium } from "@/lib/leaderboard";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { formatCompactUSD, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Podium } from "@/components/podium";
import { ProductImage } from "@/components/product-image";
import { StatCard } from "@/components/stat-card";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "The Census",
  description:
    "Community statistics for Apple Score: dollars tracked, the most-owned Apple products, spending by category and the newest collectors.",
  alternates: { canonical: "/stats" },
};

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const [stats, totals, podium, newest, counts, catalogue] = await Promise.all([
    getCommunityStats(),
    getCommunityCategoryTotals(),
    getPodium("overall"),
    getNewestCollectors(6),
    getOwnershipCounts(),
    getCatalogue(),
  ]);

  const byId = new Map(catalogue.map((product) => [product.id, product]));
  const mostOwned = Object.entries(counts)
    .map(([productId, owners]) => ({ product: byId.get(productId), owners }))
    .filter((entry): entry is { product: NonNullable<typeof entry.product>; owners: number } => Boolean(entry.product))
    .sort((a, b) => b.owners - a.owners || b.product.priceUSD - a.product.priceUSD)
    .slice(0, 8);

  const grandTotal = totals.reduce((sum, entry) => sum + entry.total, 0);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow="Community"
        title="The Census"
        description="What everyone on Apple Score owns, added up. Updated every minute, judged never."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/leaderboard">
              {LEADERBOARD_NAME}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="census-totals">
        <h2 id="census-totals" className="sr-only">
          Totals
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Dollars tracked"
            value={formatCompactUSD(stats.totalDollars)}
            hint={stats.totalDollars === 0 ? "Not a single dollar yet. Suspicious." : "across every public collection"}
            icon={DollarSign}
          />
          <StatCard
            label="Collectors"
            value={formatNumber(stats.collectors)}
            hint={`${formatNumber(stats.users)} accounts`}
            icon={Users}
          />
          <StatCard
            label="Products tracked"
            value={formatNumber(stats.totalUnits)}
            hint={`${formatNumber(stats.products)} in the catalogue`}
            icon={Boxes}
          />
          <StatCard
            label="Average score"
            value={formatUSD(stats.averageScore)}
            hint="per collector with a collection"
            icon={Gauge}
          />
        </div>
      </section>

      {podium.length > 0 && (
        <section aria-labelledby="census-podium" className="space-y-4">
          <h2 id="census-podium" className="text-xl font-semibold tracking-tight">
            Currently winning
          </h2>
          <Podium rows={podium} />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where the money goes</CardTitle>
          </CardHeader>
          <CardContent>
            {totals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing tracked yet.</p>
            ) : (
              <ul className="space-y-3">
                {totals.map((entry) => {
                  const share = grandTotal === 0 ? 0 : entry.total / grandTotal;
                  return (
                    <li key={entry.category} className="space-y-1">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-6 text-center" aria-hidden="true">
                          {CATEGORY_EMOJI[entry.category]}
                        </span>
                        <Link
                          href={`/leaderboard?board=${CATEGORY_SLUG[entry.category]}`}
                          className="min-w-0 flex-1 truncate font-medium hover:underline"
                        >
                          {CATEGORY_LABEL[entry.category]}
                        </Link>
                        <span className="tabular text-xs text-muted-foreground">
                          {pluralize(entry.owners, "collector")}
                        </span>
                        <span className="tabular w-20 text-right font-semibold">
                          {formatCompactUSD(entry.total)}
                        </span>
                        <span className="tabular w-10 text-right text-xs text-muted-foreground">
                          {Math.round(share * 100)}%
                        </span>
                      </div>
                      <div className="ml-9 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(share * 100, 1)}%`,
                            backgroundColor: `var(--chart-${CATEGORY_SLUG[entry.category]})`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most-owned products</CardTitle>
          </CardHeader>
          <CardContent>
            {mostOwned.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody owns anything yet. Strong start.</p>
            ) : (
              <ol className="space-y-2">
                {mostOwned.map(({ product, owners }, index) => (
                  <li key={product.id}>
                    <Link
                      href={`/p/${product.slug}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/70"
                    >
                      <span className="tabular w-5 text-right text-xs text-muted-foreground">{index + 1}</span>
                      <ProductImage src={product.image} alt="" category={product.category} className="size-10 p-2" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {pluralize(owners, "collector")} · {formatUSD(product.priceUSD)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="census-newest" className="space-y-4">
        <h2 id="census-newest" className="text-xl font-semibold tracking-tight">
          New on the board
        </h2>
        {newest.length === 0 ? (
          <EmptyState
            emoji="🪑"
            title="Nobody here yet"
            description="The board is empty. First one to spend money wins."
            action={
              <Button asChild>
                <Link href="/signup">Be the first</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {newest.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/u/${user.username}`}
                  className="card-hover glass flex flex-col items-center gap-2 rounded-xl p-4 text-center"
                >
                  <UserAvatar user={user} size={48} />
                  <span className="w-full truncate text-sm font-medium">
                    {user.displayName ?? `@${user.username}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
