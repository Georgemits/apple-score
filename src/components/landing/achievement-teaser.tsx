import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AchievementCard } from "@/components/achievement-card";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import {
  ACHIEVEMENTS,
  getAchievementDefinition,
  type AchievementDefinition,
} from "@/lib/achievements";
import { formatNumber } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

/** Visually fun, non-secret picks, shown as if freshly unlocked. */
const TEASER_IDS = [
  "cheese-grater",
  "lost-and-found",
  "apple-billionaire",
  "time-traveller",
  "band-leader",
  "whale",
] as const;

export function AchievementTeaser() {
  const now = new Date();
  const picks = TEASER_IDS.map((id) => getAchievementDefinition(id)).filter(
    (definition): definition is AchievementDefinition =>
      definition !== undefined && !definition.secret
  );

  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="achievements-title" className="py-16 sm:py-24">
      <Reveal>
        <SectionHeading
          id="achievements-title"
          eyebrow="Achievements"
          title={`${formatNumber(ACHIEVEMENTS.length)} badges for things you have already done.`}
          description="Owning a Mac Pro. Losing three pairs of AirPods. Holding first place. Some are common, a few are legendary, and a handful are secret until you trip them."
          action={
            <Button asChild variant="outline">
              <Link href="/achievements">
                Browse them all
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      </Reveal>

      <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((definition, index) => (
          <li key={definition.id}>
            <Reveal delay={Math.min(0.06 * index, 0.24)} className="h-full">
              <AchievementCard definition={definition} unlockedAt={now} progress={1} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
