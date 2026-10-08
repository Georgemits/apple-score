import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { TIERS } from "@/lib/score";
import { formatUSD } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const first = TIERS[0];
const last = TIERS[TIERS.length - 1];

/** Every tier as a horizontally scrolling ladder, lowest to highest. */
export function TierLadder() {
  return (
    <section aria-labelledby="tiers-title" className="py-16 sm:py-24">
      <Reveal>
        <SectionHeading
          id="tiers-title"
          eyebrow="Tiers"
          title={
            first && last ? `From ${first.name} to ${last.name}.` : "Every dollar moves you up."
          }
          description="Each tier is a dollar threshold. You climb it by spending, which, let's be honest, was already the plan."
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <ol
          className="fade-x scrollbar-none -mx-4 flex snap-x snap-proximity gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-6 sm:px-6"
          aria-label="Tier ladder, lowest to highest"
          tabIndex={0}
        >
          {TIERS.map((tier, index) => (
            <li key={tier.id} className="w-44 shrink-0 snap-start sm:w-52">
              <Card className="card-hover flex h-full flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <span className="text-3xl leading-none" aria-hidden="true">
                    {tier.emoji}
                  </span>
                  <span
                    className="tabular text-xs font-semibold text-muted-foreground/60"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 text-balance font-semibold leading-snug tracking-tight">
                  <span className="sr-only">Tier {index + 1}: </span>
                  {tier.name}
                </h3>
                <p className="tabular mt-1 text-sm text-muted-foreground">
                  {tier.min === 0 ? "Start here" : `From ${formatUSD(tier.min)}`}
                </p>
                <p className="mt-3 text-pretty text-xs text-muted-foreground">{tier.tagline}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
