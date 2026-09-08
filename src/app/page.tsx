import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ListPlus, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";
import { AppleMark } from "@/components/logo";
import { formatNumber } from "@/lib/utils";
import { LEADERBOARD_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: ListPlus,
    title: "Track products",
    description:
      "Add every Mac, iPhone, iPad, Watch and pair of AirPods you own — with quantities, because nobody stops at one.",
  },
  {
    icon: Sparkles,
    title: "Earn Apple Points",
    description:
      "Each product contributes its MSRP to your Apple Score. Unlock achievements as your collection grows.",
  },
  {
    icon: Trophy,
    title: "Go band for band",
    description:
      "See exactly where you stand against every other Apple fan — and how far you are from the top spot.",
  },
] as const;

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/home");

  const [productCount, userCount] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
  ]).catch(() => [0, 0] as const);

  return (
    <div className="container px-4 sm:px-6">
      <section className="flex flex-col items-center py-20 text-center sm:py-28">
        <Reveal>
          <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1.5">
            <AppleMark className="size-3.5" />
            {productCount > 0
              ? `${formatNumber(productCount)} products in the catalogue`
              : "The Apple collection rankings"}
          </Badge>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tighter sm:text-6xl lg:text-7xl">
            Your Apple ecosystem has a score.
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Track every Apple device you&apos;ve ever purchased and see how you compare with other
            Apple fans.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Get started
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/leaderboard">{LEADERBOARD_NAME}</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.28}>
          <p className="mt-6 text-sm text-muted-foreground">
            {userCount > 0
              ? `${formatNumber(userCount)} ${userCount === 1 ? "fan has" : "fans have"} already scored their setup.`
              : "Be the first on the board."}
          </p>
        </Reveal>
      </section>

      <section aria-labelledby="how-it-works" className="pb-8">
        <h2 id="how-it-works" className="sr-only">
          How Apple Score works
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <li key={feature.title}>
              <Reveal delay={index * 0.08} className="h-full">
                <Card className="h-full p-6">
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent/12 text-accent">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="formula" className="py-20">
        <Reveal>
          <Card className="relative overflow-hidden p-8 text-center sm:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 -top-24 size-72 animate-float-slow rounded-full bg-gradient-to-br from-accent/20 to-fuchsia-500/20 blur-3xl"
            />
            <div className="relative">
              <h2 id="formula" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                One simple formula
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Your Apple Score is the total US dollar value of everything you own, at launch MSRP.
              </p>
              <p className="tabular mt-8 text-xl font-medium sm:text-2xl">
                Apple Score = Σ (MSRP × quantity)
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                2 × iPhone 17 Pro Max ($1,199) + 1 × MacBook Pro 16&quot; M4 Max ($3,499) ={" "}
                <span className="font-semibold text-foreground">5,897 Apple Points</span>
              </p>
              <Button asChild size="lg" className="mt-10">
                <Link href="/signup">
                  Score my setup
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
