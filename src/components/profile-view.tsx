import Link from "next/link";
import { CalendarDays, Boxes, Layers, PackagePlus, Trophy } from "lucide-react";
import type { InventoryItem, RankSummary, UserStats } from "@/lib/queries";
import { getAchievements } from "@/lib/achievements";
import { CATEGORY_LABEL } from "@/lib/categories";
import { formatDate, formatMonthYear, formatNumber, formatUSD, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/animated-number";
import { AchievementsGrid } from "@/components/achievements-grid";
import { CategoryChart } from "@/components/category-chart";
import { ProductImage } from "@/components/product-image";
import { ShareProfileButton } from "@/components/share-profile-button";
import { StatCard } from "@/components/stat-card";

type ProfileViewProps = {
  user: { username: string; email?: string | undefined; createdAt: Date };
  stats: UserStats;
  recent: InventoryItem[];
  rank: RankSummary | null;
  isOwner: boolean;
};

export function ProfileView({ user, stats, recent, rank, isOwner }: ProfileViewProps) {
  const achievements = getAchievements({
    score: stats.score,
    productCount: stats.productCount,
    distinctProducts: stats.distinctProducts,
    breakdown: stats.breakdown,
  });

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden p-7 sm:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-gradient-to-br from-accent/20 to-fuchsia-500/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="size-20 text-xl sm:size-24 sm:text-2xl">
              <AvatarFallback>{initials(user.username)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                @{user.username}
              </h1>
              {isOwner && user.email && (
                <p className="mt-1 truncate text-muted-foreground">{user.email}</p>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                Member since {formatMonthYear(user.createdAt)}
              </p>
              {rank && (
                <Badge variant="accent" className="mt-3">
                  <Trophy className="size-3" aria-hidden="true" />
                  Rank #{formatNumber(rank.rank)} of {formatNumber(rank.totalUsers)}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="sm:text-right">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Apple Score
              </p>
              <p className="tabular text-4xl font-semibold tracking-tighter sm:text-5xl">
                <AnimatedNumber value={stats.score} />
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareProfileButton username={user.username} />
              {isOwner && (
                <Button asChild size="sm">
                  <Link href="/products/add">
                    <PackagePlus aria-hidden="true" />
                    Add product
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <section aria-labelledby="profile-stats">
        <h2 id="profile-stats" className="sr-only">
          Collection statistics
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Products owned"
            value={formatNumber(stats.productCount)}
            hint={`${stats.distinctProducts} unique`}
            icon={Boxes}
          />
          <StatCard
            label="Top category"
            value={stats.topCategory ? CATEGORY_LABEL[stats.topCategory] : "—"}
            hint={
              stats.breakdown[0]
                ? `${formatNumber(stats.breakdown[0].total)} pts`
                : "Nothing added yet"
            }
            icon={Layers}
          />
          <StatCard
            label="Most valuable"
            value={
              stats.mostValuable
                ? formatUSD(stats.mostValuable.product.priceUSD * stats.mostValuable.quantity)
                : "—"
            }
            hint={stats.mostValuable?.product.name}
            icon={PackagePlus}
          />
          <StatCard
            label="Rank"
            value={rank ? `#${formatNumber(rank.rank)}` : "—"}
            hint={rank ? `of ${formatNumber(rank.totalUsers)} users` : undefined}
            icon={Trophy}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart breakdown={stats.breakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent additions</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isOwner
                  ? "Nothing added yet. Your activity will show up here."
                  : "This collector hasn't added anything yet."}
              </p>
            ) : (
              <ul className="space-y-4">
                {recent.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <ProductImage
                      src={item.product.image}
                      alt=""
                      category={item.product.category}
                      className="size-11 shrink-0 p-2"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)} · {CATEGORY_LABEL[item.product.category]}
                      </p>
                    </div>
                    <p className="tabular shrink-0 text-sm font-semibold">
                      +{formatNumber(item.product.priceUSD * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="achievements" className="space-y-4">
        <h2 id="achievements" className="text-xl font-semibold tracking-tight">
          Achievements
        </h2>
        <AchievementsGrid achievements={achievements} />
      </section>
    </div>
  );
}
