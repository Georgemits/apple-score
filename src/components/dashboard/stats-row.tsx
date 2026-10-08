import { Boxes, Coins, Gem, Hourglass, Layers } from "lucide-react";
import type { UserStats } from "@/lib/queries";
import { CATEGORY_LABEL } from "@/lib/categories";
import { lineTotal } from "@/lib/score";
import { cn, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";

type StatsRowProps = {
  stats: UserStats;
  className?: string;
};

/** The quick numbers under the hero: four cards, five once vintage kit shows up. */
export function StatsRow({ stats, className }: StatsRowProps) {
  const showLegacy = stats.legacyUnits > 0;
  const mostExpensive = stats.mostValuable;

  return (
    <section aria-labelledby="dashboard-stats" className={cn("min-w-0", className)}>
      <h2 id="dashboard-stats" className="sr-only">
        Quick statistics
      </h2>
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4",
          showLegacy
            ? "lg:grid-cols-5 [&>:last-child]:col-span-2 lg:[&>:last-child]:col-span-1"
            : "lg:grid-cols-4"
        )}
      >
        <StatCard
          label="Products"
          value={formatNumber(stats.productCount)}
          hint={`${formatNumber(stats.distinctProducts)} unique`}
          icon={Boxes}
        />
        <StatCard
          label="Categories"
          value={formatNumber(stats.breakdown.length)}
          hint={stats.topCategory ? `Mostly ${CATEGORY_LABEL[stats.topCategory]}` : undefined}
          icon={Layers}
        />
        <StatCard
          label="Average price"
          value={formatUSD(stats.averageUnitPrice)}
          hint="per unit owned"
          icon={Coins}
        />
        <StatCard
          label="Most expensive line"
          value={mostExpensive ? formatUSD(lineTotal(mostExpensive)) : "—"}
          hint={
            mostExpensive
              ? mostExpensive.quantity > 1
                ? `${mostExpensive.product.name} × ${formatNumber(mostExpensive.quantity)}`
                : mostExpensive.product.name
              : undefined
          }
          icon={Gem}
        />
        {showLegacy && (
          <StatCard
            label="Legacy units"
            value={formatNumber(stats.legacyUnits)}
            hint={pluralize(stats.legacyUnits, "vintage piece")}
            icon={Hourglass}
          />
        )}
      </div>
    </section>
  );
}
