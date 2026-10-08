import { Boxes, History, Hourglass, Layers, Sparkles, type LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Edge = { name: string; year: number } | null;

type CollectionStatsProps = {
  categories: number;
  families: number;
  oldest: Edge;
  newest: Edge;
  legacyUnits: number;
  /** Label of the category with the most dollars in it. */
  topCategory: string | null;
};

/** The footer facts card: breadth, age and how much of it is vintage. */
export function CollectionStats({
  categories,
  families,
  oldest,
  newest,
  legacyUnits,
  topCategory,
}: CollectionStatsProps) {
  return (
    <section aria-labelledby="collection-stats-heading">
      <Card className="p-5 sm:p-6">
        <h2 id="collection-stats-heading" className="text-base font-semibold tracking-tight">
          By the numbers
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <Stat
            icon={Layers}
            label="Categories"
            value={formatNumber(categories)}
            hint={topCategory ? `${topCategory} leads` : undefined}
          />
          <Stat
            icon={Boxes}
            label="Families"
            value={formatNumber(families)}
            hint={families === 1 ? "product line" : "product lines"}
          />
          <Stat
            icon={History}
            label="Oldest"
            value={oldest ? String(oldest.year) : "—"}
            hint={oldest?.name}
          />
          <Stat
            icon={Sparkles}
            label="Newest"
            value={newest ? String(newest.year) : "—"}
            hint={newest?.name}
          />
          <Stat
            icon={Hourglass}
            label="Legacy units"
            value={formatNumber(legacyUnits)}
            hint={legacyUnits === 0 ? "Nothing vintage yet" : "Discontinued hardware"}
          />
        </dl>
      </Card>
    </section>
  );
}

type StatProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
};

function Stat({ icon: Icon, label, value, hint }: StatProps) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="tabular mt-1 truncate text-2xl font-semibold tracking-tight">{value}</dd>
      {hint && (
        <dd className="truncate text-xs text-muted-foreground" title={hint}>
          {hint}
        </dd>
      )}
    </div>
  );
}
