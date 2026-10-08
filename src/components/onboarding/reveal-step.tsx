"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, PackagePlus, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { completeOnboardingAction, type ScoreUpdate } from "@/actions/products";
import { getAchievementDefinition, type AchievementDefinition } from "@/lib/achievements";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { tierFor } from "@/lib/score";
import { formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { AchievementCard } from "@/components/achievement-card";
import { AnimatedMoney } from "@/components/animated-number";
import { celebrateUpdate } from "@/components/celebrations";
import { celebrate } from "@/components/confetti";
import { EmptyState } from "@/components/empty-state";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OnboardingItem } from "@/components/onboarding/catalogue";

const NETWORK_ERROR = "Network error. Please try again.";

type Status =
  | { kind: "pending" }
  | { kind: "error"; message: string }
  | { kind: "done"; update: ScoreUpdate; at: Date };

type RevealStepProps = {
  items: OnboardingItem[];
  /** Focused when the result (or an error) lands, so the outcome is announced. */
  headingRef: React.RefObject<HTMLHeadingElement | null>;
};

/** Mirrors the cases in which `celebrateUpdate` already fires confetti. */
function firesConfetti(update: ScoreUpdate): boolean {
  return (
    update.milestone !== null ||
    update.unlocked.some(
      (unlock) =>
        unlock.rarity === "rare" || unlock.rarity === "epic" || unlock.rarity === "legendary"
    )
  );
}

/**
 * The final step. Submits the picks exactly once on mount (which also stamps
 * `onboardedAt`), then counts the score up from zero and shows what it earned.
 */
export function RevealStep({ items, headingRef }: RevealStepProps) {
  const [status, setStatus] = React.useState<Status>({ kind: "pending" });
  const [, startTransition] = React.useTransition();
  const started = React.useRef(false);

  const submit = React.useCallback(() => {
    setStatus({ kind: "pending" });
    startTransition(async () => {
      try {
        const result = await completeOnboardingAction({ items });
        if (!result.ok) {
          setStatus({ kind: "error", message: result.error });
          toast.error(result.error);
          return;
        }

        const update = result.data;
        setStatus({ kind: "done", update, at: new Date() });
        celebrateUpdate(update);
        if (!firesConfetti(update) && update.score > 0) {
          window.setTimeout(() => void celebrate(), 600);
        }
      } catch (error) {
        console.error(error);
        setStatus({ kind: "error", message: NETWORK_ERROR });
        toast.error(NETWORK_ERROR);
      }
    });
  }, [items]);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    submit();
  }, [submit]);

  React.useEffect(() => {
    if (status.kind === "pending") return;
    headingRef.current?.focus({ preventScroll: true });
  }, [status.kind, headingRef]);

  if (status.kind === "pending") {
    return <RevealSkeleton headingRef={headingRef} />;
  }

  if (status.kind === "error") {
    return (
      <div className="space-y-4">
        <h1 ref={headingRef} tabIndex={-1} className="sr-only">
          Something went wrong
        </h1>
        <EmptyState
          emoji="😬"
          title="We couldn’t save your picks"
          description={status.message}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={submit}>
                <RotateCcw aria-hidden="true" />
                Try again
              </Button>
              <Button asChild variant="outline">
                <Link href="/home">Go to my dashboard</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const { update, at } = status;
  const tier = tierFor(update.score);
  const unlocked = update.unlocked
    .map((unlock) => getAchievementDefinition(unlock.id))
    .filter((definition): definition is AchievementDefinition => definition !== undefined);

  if (update.score === 0) {
    return (
      <Card className="relative animate-pop-in overflow-hidden p-6 text-center sm:p-10">
        <Blobs />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Your Apple Score
          </p>
          <p className="score-figure mt-3 text-6xl font-bold sm:text-7xl">
            <AnimatedMoney value={0} fromZero />
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mx-auto mt-6 max-w-xl text-balance rounded-md text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Your Apple Score is currently $0. That’s… impressive restraint.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            Everything in the catalog counts the moment you add it. Start with the device you’re
            reading this on.
          </p>
          <div className="mt-5 flex justify-center">
            <TierBadge tier={tier} />
          </div>
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/catalog">
                <PackagePlus aria-hidden="true" />
                Browse the catalog
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/home">
                <LayoutDashboard aria-hidden="true" />
                Go to my dashboard
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="relative animate-pop-in overflow-hidden p-6 text-center sm:p-10">
        <Blobs />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Your Apple Score
          </p>
          <p className="score-figure mt-3 text-6xl font-bold sm:text-7xl lg:text-8xl">
            <AnimatedMoney value={update.score} fromZero duration={1.6} />
          </p>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mx-auto mt-6 max-w-2xl text-balance rounded-md text-xl font-semibold tracking-tight sm:text-2xl"
          >
            <span aria-hidden="true">🔥 </span>
            Your Apple Score is {formatUSD(update.score)}. You’re officially on the board.
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <TierBadge tier={tier} />
            {update.rank && update.rank.total > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-sm font-medium backdrop-blur">
                <Trophy className="size-3.5 text-gold" aria-hidden="true" />#
                {formatNumber(update.rank.rank)} of {formatNumber(update.rank.total)}
              </span>
            )}
          </div>

          <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-muted-foreground">
            {tier.tagline}
            {update.rank && update.rank.total > 0
              ? ` That’s your spot on ${LEADERBOARD_NAME}.`
              : ""}{" "}
            {pluralize(update.productCount, "product")} tracked.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/home">
                <LayoutDashboard aria-hidden="true" />
                Go to my dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/catalog">
                <PackagePlus aria-hidden="true" />
                Add more products
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {unlocked.length > 0 && (
        <section aria-labelledby="unlocked-heading" className="space-y-3">
          <h2 id="unlocked-heading" className="text-lg font-semibold tracking-tight">
            {pluralize(unlocked.length, "achievement")} unlocked
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {unlocked.map((definition) => (
              <li key={definition.id}>
                <AchievementCard definition={definition} unlockedAt={at} progress={1} fresh />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RevealSkeleton({ headingRef }: Pick<RevealStepProps, "headingRef">) {
  return (
    <div role="status" aria-busy="true">
      <Card className="p-6 text-center sm:p-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="animate-pulse-soft rounded-md text-sm font-medium text-muted-foreground"
        >
          Counting every dollar…
        </h1>
        <div className="mt-6 flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-56 sm:h-20 sm:w-72" />
          <Skeleton className="h-6 w-72 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-36 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-12 w-48 rounded-full" />
            <Skeleton className="h-12 w-44 rounded-full" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Blobs() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 size-80 animate-float-slow rounded-full bg-gradient-to-br from-accent/25 via-fuchsia-500/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-transparent blur-3xl"
      />
    </>
  );
}
