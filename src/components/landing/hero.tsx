import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { AppleMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { formatNumber } from "@/lib/utils";
import { loadCommunityStats } from "./data";
import { DemoScore } from "./demo-score";
import { CatalogueCountSkeleton } from "./skeletons";

/** The live catalogue count for the eyebrow badge; streams in after first paint. */
async function CatalogueCount() {
  const stats = await loadCommunityStats();
  return stats.products > 0
    ? `${formatNumber(stats.products)} products in the catalogue`
    : "The Apple collection rankings";
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate py-14 sm:py-20 lg:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-8 size-80 animate-float-slow rounded-full bg-gradient-to-br from-accent/25 to-fuchsia-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-4 size-72 animate-float-slow rounded-full bg-gradient-to-br from-emerald-400/20 to-accent/20 blur-3xl [animation-delay:-4s]" />
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <Reveal>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <AppleMark className="size-3.5" />
              <Suspense fallback={<CatalogueCountSkeleton />}>
                <CatalogueCount />
              </Suspense>
            </Badge>
          </Reveal>

          <Reveal delay={0.05}>
            <h1
              id="hero-title"
              className="mt-6 text-balance text-4xl font-semibold tracking-tighter sm:text-6xl lg:text-7xl"
            >
              How much <span className="text-gradient">Apple</span> do you own?
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground sm:text-xl lg:mx-0">
              Your Apple Score is every dollar you&apos;ve spent on Apple hardware, added up and
              ranked against everyone else&apos;s.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get started
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/leaderboard">
                  <Trophy aria-hidden="true" />
                  See {LEADERBOARD_NAME}
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.28}>
            <p className="mt-5 text-sm text-muted-foreground">
              Free. No ads. No multipliers. Just the number.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.18} className="mx-auto w-full max-w-md lg:max-w-none">
          <DemoScore />
        </Reveal>
      </div>
    </section>
  );
}
