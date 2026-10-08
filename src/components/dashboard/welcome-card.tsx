import Link from "next/link";
import { Compass, Rocket } from "lucide-react";
import { tierFor } from "@/lib/score";
import { formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";

type WelcomeCardProps = {
  name: string;
  /** Offer the onboarding flow only while it has never been completed or skipped. */
  showSetup: boolean;
};

/**
 * The hero for a collection worth exactly nothing. Takes the place of
 * `ScoreHero` until the first product lands.
 */
export function WelcomeCard({ name, showSetup }: WelcomeCardProps) {
  const tier = tierFor(0);

  return (
    <Card className="relative overflow-hidden p-6 sm:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 size-80 animate-float-slow rounded-full bg-gradient-to-br from-accent/25 via-fuchsia-500/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-transparent blur-3xl"
      />

      <div className="relative max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">Welcome, {name}</p>
        <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Your Apple Score is currently <span className="whitespace-nowrap">{formatUSD(0)}</span>.
          That&apos;s… impressive restraint.
        </h1>

        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Apple Score
        </p>
        <p className="score-figure mt-2 text-6xl font-bold sm:text-7xl lg:text-8xl">
          {formatUSD(0)}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <TierBadge tier={tier} />
        </div>

        <p className="mt-4 max-w-prose text-pretty text-base text-muted-foreground">
          Add the device you are reading this on and the number stops being zero. Everything you add
          goes straight onto the board.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          {showSetup && (
            <Button asChild size="lg">
              <Link href="/welcome">
                <Rocket aria-hidden="true" />
                Start the 60-second setup
              </Link>
            </Button>
          )}
          <Button asChild size="lg" variant={showSetup ? "outline" : "default"}>
            <Link href="/catalog">
              <Compass aria-hidden="true" />
              Browse the catalogue
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
