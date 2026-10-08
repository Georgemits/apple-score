import { Card } from "@/components/ui/card";

/**
 * The formula, spelled out, for signed-in users. The landing page explains
 * it to guests, but the landing page redirects anyone with a session, so the
 * footer's "How scoring works" link lands here instead.
 */
export function ScoringExplainer() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-24">
      <Card className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          How scoring works
        </p>
        <h2 id="how-it-works-title" className="mt-2 text-xl font-semibold tracking-tight">
          Money spent on Apple is your Apple Score.
        </h2>
        <p className="tabular mt-3 rounded-xl bg-secondary/60 px-4 py-3 font-mono text-sm">
          Apple Score = Σ (price paid, or launch price) × quantity
        </p>
        <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <li>
            <span className="font-semibold text-foreground">Launch price by default.</span> Every
            product counts at its US launch price, so a 2012 MacBook Pro is worth what it cost in
            2012.
          </li>
          <li>
            <span className="font-semibold text-foreground">Your price if you know it.</span> Record
            what you actually paid and that line uses it instead. Bargains count; so do
            overpayments.
          </li>
          <li>
            <span className="font-semibold text-foreground">Nothing is stored.</span> The score is
            recomputed from your collection every time, so editing a line fixes the number
            everywhere at once.
          </li>
        </ul>
      </Card>
    </section>
  );
}
