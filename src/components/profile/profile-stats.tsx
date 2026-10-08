import { Boxes, CalendarDays, Coins, Gem, Layers, Sparkles } from "lucide-react";
import { CATEGORY_LABEL } from "@/lib/categories";
import type { UserStats } from "@/lib/queries";
import { lineTotal } from "@/lib/score";
import { cn, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";

type ProfileStatsProps = {
  stats: UserStats;
  className?: string;
};

/** The quick numbers under the hero: six cards, two per row on phones. */
export function ProfileStats({ stats, className }: ProfileStatsProps) {
  const top = stats.mostValuable;
  const { oldest, newest } = stats;

  const years =
    oldest && newest
      ? oldest.product.year === newest.product.year
        ? String(oldest.product.year)
        : `${oldest.product.year}–${newest.product.year}`
      : "—";
  const yearsHint =
    oldest && newest
      ? oldest.id === newest.id
        ? oldest.product.name
        : `${oldest.product.name} → ${newest.product.name}`
      : undefined;

  return (
    <section aria-labelledby="profile-stats" className={cn("min-w-0 animate-enter-up", className)}>
      <h2 id="profile-stats" className="sr-only">
        Collection statistics
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Products"
          value={formatNumber(stats.productCount)}
          hint={
            stats.legacyUnits > 0 ? `${pluralize(stats.legacyUnits, "legacy unit")}` : "units owned"
          }
          icon={Boxes}
        />
        <StatCard
          label="Unique"
          value={formatNumber(stats.distinctProducts)}
          hint={pluralize(stats.familyCount, "product family", "product families")}
          icon={Sparkles}
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
          value={top ? formatUSD(lineTotal(top)) : "—"}
          hint={
            top
              ? top.quantity > 1
                ? `${top.product.name} × ${formatNumber(top.quantity)}`
                : top.product.name
              : undefined
          }
          icon={Gem}
        />
        <StatCard label="Oldest to newest" value={years} hint={yearsHint} icon={CalendarDays} />
      </div>
    </section>
  );
}
