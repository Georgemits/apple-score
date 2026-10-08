import Link from "next/link";
import {
  ArrowRight,
  Award,
  Boxes,
  FlaskConical,
  ImageIcon,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { formatNumber } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  link?: { href: string; label: string };
};

const FEATURES: readonly Feature[] = [
  {
    icon: Boxes,
    title: "Collection",
    body: "Every Mac, iPhone, iPad, Watch and pair of AirPods you own, with quantities and what you actually paid.",
  },
  {
    icon: Trophy,
    title: `${LEADERBOARD_NAME} boards`,
    body: "One board overall and one per category: iPhone, Mac, iPad, Watch, AirPods, Vision and vintage. Plus one for just the people you follow.",
    link: { href: "/leaderboard", label: "See the boards" },
  },
  {
    icon: Award,
    title: "Achievements",
    body: `${formatNumber(ACHIEVEMENTS.length)} to unlock, from your first purchase to owning a Mac Pro. A few are secret. One involves a stand.`,
    link: { href: "/achievements", label: "Browse them all" },
  },
  {
    icon: ImageIcon,
    title: "Share cards",
    body: "A generated card with your score, tier and most expensive purchase. Post it. Regret nothing.",
  },
  {
    icon: Users,
    title: "Compare with friends",
    body: "Two collections side by side, category by category, with the gap in dollars. Settle it properly.",
  },
  {
    icon: FlaskConical,
    title: "What-if simulator",
    body: "Pick anything from the catalogue and see where it would put you on the board before you buy it.",
  },
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-title" className="py-16 sm:py-24">
      <Reveal>
        <SectionHeading
          id="features-title"
          eyebrow="Everything included"
          title="A collection tracker that keeps score."
          description="Part catalogue, part social network, part game. Entirely about the money."
        />
      </Reveal>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <li key={feature.title}>
            <Reveal delay={Math.min(0.06 * index, 0.24)} className="h-full">
              <Card className="flex h-full flex-col p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 flex-1 text-pretty text-muted-foreground">{feature.body}</p>
                {feature.link && (
                  <Link
                    href={feature.link.href}
                    className="mt-4 inline-flex min-h-11 items-center gap-1 self-start rounded-md text-sm font-medium text-accent hover:underline"
                  >
                    {feature.link.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
