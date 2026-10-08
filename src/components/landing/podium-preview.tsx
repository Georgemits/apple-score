import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Podium } from "@/components/podium";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { loadPodium } from "./data";
import { SectionHeading } from "./section-heading";

/** The current overall top three. Renders nothing until somebody owns something. */
export async function PodiumPreview() {
  const rows = await loadPodium();
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="podium-title" className="py-16 sm:py-24">
      <Reveal>
        <SectionHeading
          id="podium-title"
          eyebrow={LEADERBOARD_NAME}
          title="The current top three"
          description="Ranked by Apple Score and refreshed as collections change. Somebody has to be first."
          action={
            <Button asChild variant="outline">
              <Link href="/leaderboard">
                See the full board
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      </Reveal>
      <Reveal delay={0.1} className="mt-8 sm:mt-12">
        <Podium rows={rows} />
      </Reveal>
    </section>
  );
}
