import { PackagePlus, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { formatUSD } from "@/lib/utils";
import { FORMULA } from "./brand";
import { SectionHeading } from "./section-heading";

type Step = { icon: LucideIcon; title: string; body: string };

const STEPS: readonly Step[] = [
  {
    icon: PackagePlus,
    title: "Add your products",
    body: "Search the catalogue, tap what you own, set the quantity. Paid something other than list price? Record it.",
  },
  {
    icon: TrendingUp,
    title: "Watch your score",
    body: "Every unit adds its price to your Apple Score. Milestones, tiers and achievements fire as it climbs.",
  },
  {
    icon: Trophy,
    title: `Climb ${LEADERBOARD_NAME}`,
    body: "One board overall, one per category, one for the people you follow. Weekly movement, every time.",
  },
];

/** A worked example whose total is computed, so the copy can never drift. */
const EXAMPLE = [
  { name: "iPhone 17 Pro Max", quantity: 2, price: 1_199 },
  { name: "MacBook Pro 16″", quantity: 1, price: 3_499 },
  { name: "AirPods Pro 3", quantity: 1, price: 249 },
] as const;

const EXAMPLE_TOTAL = EXAMPLE.reduce((sum, line) => sum + line.quantity * line.price, 0);

const RULES = [
  { lead: "It is dollars.", rest: `A score of ${formatUSD(12_482)} means ${formatUSD(12_482)} spent.` },
  { lead: "No multipliers.", rest: "No bonuses, no weights, no rarity points. Money in, score out." },
  {
    lead: "Legacy counts at face value.",
    rest: "A 2001 iPod still scores its $399 launch price. Nostalgia is not inflation-adjusted.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-24 py-16 sm:py-24"
    >
      <Reveal>
        <SectionHeading
          id="how-it-works-title"
          eyebrow="How it works"
          title="Three steps. One number."
          description="Apple Score is deliberately simple: the money you have spent on Apple hardware, added up."
        />
      </Reveal>

      <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Reveal delay={0.06 * index} className="h-full">
              <Card className="relative h-full p-6">
                <span
                  className="tabular absolute right-5 top-5 text-sm font-semibold text-muted-foreground/60"
                  aria-hidden="true"
                >
                  0{index + 1}
                </span>
                <span className="flex size-11 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-pretty text-muted-foreground">{step.body}</p>
              </Card>
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal delay={0.2} className="mt-6">
        <Card className="relative overflow-hidden p-6 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-72 animate-float-slow rounded-full bg-gradient-to-br from-accent/20 to-fuchsia-500/20 blur-3xl"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
                The formula
              </h3>
              <p className="tabular mt-3 text-balance text-xl font-semibold tracking-tight sm:text-2xl">
                {FORMULA}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-mono">??</span> means &ldquo;or, if you never recorded a
                price&rdquo;.
              </p>
              <ul className="mt-6 space-y-3">
                {RULES.map((rule) => (
                  <li key={rule.lead} className="flex gap-3 text-pretty">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{rule.lead}</span>{" "}
                      {rule.rest}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Worked example
              </h3>
              <table className="mt-3 w-full text-sm">
                <caption className="sr-only">
                  Three products and their contribution to an Apple Score
                </caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Quantity and price</th>
                    <th scope="col">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE.map((line) => (
                    <tr key={line.name} className="border-b border-border/60 last:border-0">
                      <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                        {line.name}
                      </th>
                      <td className="tabular whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                        {line.quantity} × {formatUSD(line.price)}
                      </td>
                      <td className="tabular whitespace-nowrap py-2.5 text-right font-medium">
                        {formatUSD(line.quantity * line.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={2} className="pt-3 text-left font-semibold">
                      Apple Score
                    </th>
                    <td className="score-figure pt-3 text-right text-2xl font-bold">
                      {formatUSD(EXAMPLE_TOTAL)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
