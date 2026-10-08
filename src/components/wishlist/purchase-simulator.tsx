"use client";

import * as React from "react";
import { Calculator, RefreshCw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { simulatePurchaseAction, type Simulation } from "@/actions/simulate";
import { tierFor } from "@/lib/score";
import { cn, formatNumber, formatRank, formatSignedUSD, formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedMoney } from "@/components/animated-number";
import { RankDelta } from "@/components/rank-delta";
import { TierBadge } from "@/components/tier-badge";
import type { WishlistItemView } from "@/components/wishlist/types";

const DEBOUNCE_MS = 300;
const KEY_SEPARATOR = "\n";

type PurchaseSimulatorProps = {
  items: WishlistItemView[];
  /** Product ids the user has unticked. Everything else counts. */
  excluded: ReadonlySet<string>;
  onToggle: (productId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  /** The user's current Apple Score. */
  score: number;
  className?: string;
};

/**
 * "What if I bought all of this?" — ticks a subset of the wishlist and asks
 * the server where that would put the score and the rank. Nothing is saved.
 * The dollar figure is computed locally so it moves instantly; the rank
 * arrives after a short debounce.
 */
export function PurchaseSimulator({
  items,
  excluded,
  onToggle,
  onSelectAll,
  onSelectNone,
  score,
  className,
}: PurchaseSimulatorProps) {
  const selected = items.filter((item) => !excluded.has(item.productId));
  const selectedKey = selected
    .map((item) => item.productId)
    .sort()
    .join(KEY_SEPARATOR);
  const added = selected.reduce((sum, item) => sum + item.product.priceUSD, 0);

  const [result, setResult] = React.useState<{ key: string; data: Simulation } | null>(null);
  const [failedKey, setFailedKey] = React.useState<string | null>(null);
  const latest = React.useRef(0);

  const simulate = React.useCallback((key: string) => {
    const request = ++latest.current;
    const productIds = key.split(KEY_SEPARATOR);
    setFailedKey(null);

    simulatePurchaseAction({ items: productIds.map((productId) => ({ productId, quantity: 1 })) })
      .then((response) => {
        if (request !== latest.current) return;
        if (!response.ok) {
          toast.error(response.error);
          setFailedKey(key);
          return;
        }
        setResult({ key, data: response.data });
      })
      .catch((error: unknown) => {
        console.error(error);
        if (request !== latest.current) return;
        toast.error("The simulator hit a snag. Please try again.");
        setFailedKey(key);
      });
  }, []);

  React.useEffect(() => {
    if (selectedKey === "") return;
    const timer = window.setTimeout(() => simulate(selectedKey), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [selectedKey, simulate]);

  const ready = result !== null && result.key === selectedKey ? result.data : null;
  const failed = failedKey === selectedKey;
  const loading = selectedKey !== "" && ready === null && !failed;
  // While a fresh answer is on its way, keep showing the previous one, dimmed.
  const shown = ready ?? result?.data ?? null;

  const projectedScore = ready ? ready.projectedScore : score + added;
  const currentTier = tierFor(score);
  const projectedTier = tierFor(projectedScore);

  return (
    <section aria-labelledby="simulator-heading" className={className}>
      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <header>
          <h2
            id="simulator-heading"
            className="flex items-center gap-2 text-base font-semibold tracking-tight"
          >
            <Calculator className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            What if you bought it?
          </h2>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Tick what you&apos;re tempted by. Nothing is saved, nothing is charged.
          </p>
        </header>

        <fieldset className="min-w-0">
          <legend className="sr-only">Products to include in the simulation</legend>
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              aria-hidden="true"
            >
              Include
            </p>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={onSelectAll}
                disabled={selected.length === items.length}
                className="rounded-full px-2 py-1 font-medium text-accent transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
              >
                All
              </button>
              <button
                type="button"
                onClick={onSelectNone}
                disabled={selected.length === 0}
                className="rounded-full px-2 py-1 font-medium text-accent transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
              >
                None
              </button>
            </div>
          </div>
          <ul className="-mr-1 mt-1 max-h-60 space-y-0.5 overflow-y-auto overscroll-contain pr-1">
            {items.map((item) => {
              const id = `simulate-${item.productId}`;
              return (
                <li key={item.id}>
                  <label
                    htmlFor={id}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm transition-colors hover:bg-secondary/70"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={!excluded.has(item.productId)}
                      onChange={() => onToggle(item.productId)}
                      className="size-4 shrink-0 rounded border-border accent-accent"
                    />
                    <span className="min-w-0 flex-1 truncate">{item.product.name}</span>
                    <span className="tabular shrink-0 text-xs text-muted-foreground">
                      {formatUSD(item.product.priceUSD)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div
          className={cn(
            "rounded-2xl bg-secondary/60 p-4 transition-opacity sm:p-5",
            loading && shown && "opacity-70"
          )}
          aria-live="polite"
          aria-busy={loading}
        >
          {selected.length === 0 ? (
            <p className="text-pretty text-sm text-muted-foreground">
              Nothing ticked. Your Apple Score stays exactly where it is:{" "}
              <span className="tabular font-semibold text-foreground">{formatUSD(score)}</span>.
              Restraint looks good on you.
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Projected Apple Score
              </p>
              <p className="score-figure mt-2 text-4xl font-bold sm:text-5xl">
                <AnimatedMoney value={projectedScore} />
              </p>
              <p className="tabular mt-2 text-sm text-muted-foreground">
                {formatSignedUSD(added)} on top of {formatUSD(score)}
              </p>

              <div className="mt-4 min-h-8">
                {failed ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>Couldn&apos;t work out your rank.</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => simulate(selectedKey)}
                    >
                      <RefreshCw aria-hidden="true" />
                      Retry
                    </Button>
                  </div>
                ) : shown ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-sm font-medium backdrop-blur">
                      <Trophy className="size-3.5 text-gold" aria-hidden="true" />
                      <span className="tabular">
                        {formatRank(shown.projectedRank.rank)} of{" "}
                        {formatNumber(shown.projectedRank.total)}
                      </span>
                      <RankDelta movement={shown.positionsGained} />
                    </span>
                    {shown.currentRank === null ? (
                      <span className="text-xs text-muted-foreground">
                        You&apos;d join the board.
                      </span>
                    ) : shown.positionsGained !== null && shown.positionsGained > 0 ? (
                      <span className="tabular text-xs text-muted-foreground">
                        up from {formatRank(shown.currentRank.rank)}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-32 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <span className="sr-only">Working out your rank</span>
                  </div>
                )}
              </div>

              {projectedTier.id !== currentTier.id && (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  You&apos;d become
                  <TierBadge tier={projectedTier} size="sm" />
                </p>
              )}

              <p className="mt-4 text-pretty text-sm text-muted-foreground">
                That&apos;s{" "}
                <span className="tabular font-semibold text-foreground">{formatUSD(added)}</span> of
                restraint you&apos;re about to give up.
              </p>
            </>
          )}
        </div>
      </Card>
    </section>
  );
}
