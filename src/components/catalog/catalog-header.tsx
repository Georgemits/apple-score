import type { Tier } from "@/lib/score";
import { formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AnimatedMoney } from "@/components/animated-number";
import { TierBadge } from "@/components/tier-badge";

type CatalogHeaderProps = {
  score: number;
  tier: Tier;
  /** Distinct catalogue products the user owns. */
  ownedDistinct: number;
  /** Products in the catalogue. */
  total: number;
};

/** "Add products", with the live score and how much of the catalogue is covered. */
export function CatalogHeader({ score, tier, ownedDistinct, total }: CatalogHeaderProps) {
  const share = total === 0 ? 0 : (ownedDistinct / total) * 100;
  const percent = Math.round(share);
  // Never let a non-zero collection render as an empty bar.
  const width = ownedDistinct > 0 ? Math.max(share, 1.5) : 0;

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Catalogue
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tighter sm:text-4xl">
          Add products
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Every Apple product we know about. Tap one to add it at its launch price — or what you
          actually paid.
        </p>
      </div>

      <Card className="shrink-0 px-5 py-4 lg:w-[22rem]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Apple Score
          </p>
          <TierBadge tier={tier} size="sm" />
        </div>
        <p className="score-figure mt-1 text-3xl font-bold sm:text-4xl">
          <AnimatedMoney value={score} />
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              <span className="tabular">{formatNumber(ownedDistinct)}</span> of{" "}
              <span className="tabular">{formatNumber(total)}</span> products owned
            </span>
            <span className="tabular">{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Share of the catalogue you own"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={ownedDistinct}
            aria-valuetext={`${formatNumber(ownedDistinct)} of ${formatNumber(total)} products`}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      </Card>
    </header>
  );
}
