import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, Layers, PackagePlus, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getInventory, getUserRank, summarize } from "@/lib/queries";
import { CATEGORY_LABEL } from "@/lib/categories";
import { unitPrice } from "@/lib/score";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { formatNumber, formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScoreHero } from "@/components/score-hero";
import { StatCard } from "@/components/stat-card";
import { ProductGrid } from "@/components/product-grid";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Home",
  description: "Your Apple Score, your products and your quick statistics.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/home");

  const [items, rank] = await Promise.all([
    getInventory(session.user.id),
    getUserRank(session.user.id),
  ]);

  const stats = summarize(items);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <ScoreHero
        eyebrow={`Welcome back, @${session.user.username}`}
        title="Here's how your collection stacks up."
        score={stats.score}
        footnote={
          stats.productCount === 0
            ? "Add your first product to get on the board."
            : `${formatNumber(stats.productCount)} ${stats.productCount === 1 ? "product" : "products"} across ${stats.breakdown.length} ${stats.breakdown.length === 1 ? "category" : "categories"}.`
        }
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/products/add">
                <PackagePlus aria-hidden="true" />
                Add product
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/leaderboard">
                <Trophy aria-hidden="true" />
                {LEADERBOARD_NAME}
              </Link>
            </Button>
          </>
        }
      />

      <section aria-labelledby="quick-stats">
        <h2 id="quick-stats" className="sr-only">
          Quick statistics
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Products owned"
            value={formatNumber(stats.productCount)}
            hint={`${stats.distinctProducts} unique`}
            icon={Boxes}
          />
          <StatCard
            label="Rank"
            value={rank ? `#${formatNumber(rank.rank)}` : "—"}
            hint={rank ? `of ${formatNumber(rank.totalUsers)} users` : undefined}
            icon={Trophy}
          />
          <StatCard
            label="Top category"
            value={stats.topCategory ? CATEGORY_LABEL[stats.topCategory] : "—"}
            hint={stats.topCategory ? `${stats.breakdown[0]?.units ?? 0} items` : undefined}
            icon={Layers}
          />
          <StatCard
            label="Most valuable"
            value={
              stats.mostValuable
                ? formatUSD(unitPrice(stats.mostValuable) * stats.mostValuable.quantity)
                : "—"
            }
            hint={stats.mostValuable?.product.name}
            icon={PackagePlus}
          />
        </div>
      </section>

      <section aria-labelledby="my-products" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="my-products" className="text-xl font-semibold tracking-tight">
            My products
          </h2>
          {items.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href="/products/add">
                <PackagePlus aria-hidden="true" />
                Add product
              </Link>
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No products yet"
            description="Your Apple Score is 0 until you add something. Start with the device you're reading this on."
            action={
              <Button asChild>
                <Link href="/products/add">
                  <PackagePlus aria-hidden="true" />
                  Add your first product
                </Link>
              </Button>
            }
          />
        ) : (
          <ProductGrid items={items} />
        )}
      </section>
    </div>
  );
}
