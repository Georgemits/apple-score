import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { formatCompactUSD, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { loadCommunityStats } from "./data";

/** Four community figures in one strip. Zeros are handled with a straight face. */
export async function CommunityStats() {
  const stats = await loadCommunityStats();
  const quiet = stats.collectors === 0;

  const cells = [
    {
      label: "Collectors",
      value: formatNumber(stats.collectors),
      hint: quiet ? "Be the first on the board" : `${pluralize(stats.totalUnits, "unit")} tracked`,
    },
    {
      label: "Dollars tracked",
      value: formatCompactUSD(stats.totalDollars),
      hint: quiet ? "Not a single dollar yet. Suspicious." : "Across every public collection",
    },
    {
      label: "In the catalogue",
      value: formatNumber(stats.products),
      hint: stats.products === 0 ? "Catalogue loading" : "Products with a launch price",
    },
    {
      label: "Average score",
      value: quiet ? "—" : formatUSD(stats.averageScore),
      hint: quiet ? "No scores to average yet" : "Per collector",
    },
  ];

  return (
    <section aria-labelledby="community-title" className="py-6 sm:py-8">
      <h2 id="community-title" className="sr-only">
        Community statistics
      </h2>
      <Reveal>
        <Card>
          <dl className="grid grid-cols-2 sm:grid-cols-4 [&>*:nth-child(even)]:border-l sm:[&>*:nth-child(n+2)]:border-l [&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-t-0">
            {cells.map((cell) => (
              <div key={cell.label} className="min-w-0 border-border/60 p-5 sm:p-6">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {cell.label}
                </dt>
                <dd className="tabular mt-1.5 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  {cell.value}
                </dd>
                <dd className="mt-1 truncate text-xs text-muted-foreground">{cell.hint}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Reveal>
    </section>
  );
}
