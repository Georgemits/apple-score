"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import type { Category } from "@prisma/client";
import { AnimatedMoney } from "@/components/animated-number";
import { MilestoneProgress } from "@/components/milestone-progress";
import { ProductImage } from "@/components/product-image";
import { TierBadge } from "@/components/tier-badge";
import { Card } from "@/components/ui/card";
import { CATEGORY_SLUG } from "@/lib/categories";
import { nextMilestone, tierFor } from "@/lib/score";
import { cn, formatUSD, pluralize } from "@/lib/utils";

type DemoItem = { name: string; price: number; category: Category };

/** A plausible collection that crosses the $10,000 tier on the last add. */
const DEMO_ITEMS: readonly DemoItem[] = [
  { name: "iPhone 17 Pro Max", price: 1_199, category: "IPHONE" },
  { name: "MacBook Pro 16″", price: 3_499, category: "MAC" },
  { name: "AirPods Pro 3", price: 249, category: "AIRPODS" },
  { name: "Apple Watch Ultra 3", price: 799, category: "WATCH" },
  { name: "iPad Pro 13″", price: 1_299, category: "IPAD" },
  { name: "Apple Vision Pro", price: 3_499, category: "VISION" },
];

const DEMO_TOTAL = DEMO_ITEMS.reduce((sum, item) => sum + item.price, 0);

/** Gap between additions, the hold on the full collection, and the pause at zero. */
const STEP_MS = 1_700;
const HOLD_MS = 3_800;
const RESET_MS = 900;

/**
 * The hero's mock score card: adds the example products one at a time, counts
 * the total up with each one, holds, then empties and starts again. With
 * reduced motion it simply shows the finished collection.
 */
export function DemoScore({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = React.useState(0);
  const [hidden, setHidden] = React.useState(false);

  // Pause the loop while the tab is in the background; resume where it left off.
  React.useEffect(() => {
    const sync = () => setHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  React.useEffect(() => {
    if (reduceMotion) {
      setCount(DEMO_ITEMS.length);
      return;
    }
    if (hidden) return;

    const full = DEMO_ITEMS.length;
    const delay = count === 0 ? RESET_MS : count === full ? HOLD_MS : STEP_MS;
    const next = count === full ? 0 : count + 1;
    const timer = window.setTimeout(() => setCount(next), delay);
    return () => window.clearTimeout(timer);
  }, [count, hidden, reduceMotion]);

  const added = DEMO_ITEMS.slice(0, count);
  const total = added.reduce((sum, item) => sum + item.price, 0);
  const latest = count > 0 ? DEMO_ITEMS[count - 1] : undefined;
  const tier = tierFor(total);
  const milestone = nextMilestone(total);

  return (
    <Card
      role="group"
      aria-label="Example Apple Score"
      className={cn("relative overflow-hidden p-5 sm:p-6", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-gradient-to-br from-accent/20 to-fuchsia-500/15 blur-3xl"
      />

      <p className="sr-only">
        Example: {pluralize(DEMO_ITEMS.length, "product")} totalling {formatUSD(DEMO_TOTAL)}.
      </p>

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Example collection
          </p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
            aria-hidden="true"
          >
            <span className="size-1.5 animate-pulse-soft rounded-full bg-success" />
            Live demo
          </span>
        </div>

        <div className="mt-4 flex min-h-[3.5rem] flex-wrap items-end gap-x-3 gap-y-2">
          <AnimatedMoney
            value={total}
            className="score-figure text-5xl font-bold tracking-tighter sm:text-6xl"
          />
          {latest && !reduceMotion && (
            <span
              key={count}
              className="tabular mb-1 animate-pop-in rounded-full bg-success/12 px-2.5 py-1 text-sm font-semibold text-success"
              aria-hidden="true"
            >
              +{formatUSD(latest.price)}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span key={tier.id} className="inline-flex animate-pop-in">
            <TierBadge tier={tier} size="sm" />
          </span>
          <span className="text-xs text-muted-foreground">{pluralize(count, "product")}</span>
        </div>

        <MilestoneProgress score={total} milestone={milestone} className="mt-4" />

        <ul className="mt-5 space-y-2" aria-label="Products in the example collection">
          {DEMO_ITEMS.map((item, index) => {
            const isAdded = index < count;
            return (
              <li
                key={item.name}
                aria-hidden={!isAdded}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2 transition-opacity duration-300",
                  isAdded ? "animate-enter-up" : "opacity-0"
                )}
              >
                <ProductImage
                  src={`/product-art/${CATEGORY_SLUG[item.category]}.svg`}
                  alt=""
                  category={item.category}
                  className="size-10 shrink-0 rounded-lg p-2"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
                <span className="tabular text-sm text-muted-foreground">
                  {formatUSD(item.price)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
