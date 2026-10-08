"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  ECOSYSTEM_CATEGORIES,
  MAX_ONBOARDING_ITEMS,
  ecosystemPool,
  featuredEcosystem,
  featuredIphones,
  featuredMacs,
  iphonePool,
  macPool,
  summarizePicks,
  toItems,
  visibleProducts,
  withPick,
  withoutPick,
  withoutPicks,
  type OnboardingProduct,
  type Picks,
} from "@/components/onboarding/catalogue";
import { ProductChipList } from "@/components/onboarding/product-chip-list";
import { ProductSearch } from "@/components/onboarding/product-search";
import { RevealStep } from "@/components/onboarding/reveal-step";
import { SelectChip } from "@/components/onboarding/select-chip";
import { StepProgress } from "@/components/onboarding/step-progress";
import { SkipOnboardingButton, WizardFooter } from "@/components/onboarding/wizard-footer";

const STEPS = ["iPhone", "Mac", "Ecosystem", "Reveal"] as const;
const REVEAL_STEP = 3;

const COPY = [
  {
    title: "Which iPhone do you carry?",
    description:
      "Pick the one in your pocket right now. Older ones can join from the catalog later.",
  },
  {
    title: "Any Macs?",
    description:
      "Select every Mac you own, then set how many. Desk, lap or drawer — they all count.",
  },
  {
    title: "The rest of the ecosystem",
    description:
      "iPad, Apple Watch, AirPods, Vision Pro, displays and the living room. Tap everything you own.",
  },
] as const;

type OnboardingWizardProps = {
  /** Non-legacy catalogue, trimmed and serialisable. */
  products: OnboardingProduct[];
  username: string;
};

export function OnboardingWizard({ products, username }: OnboardingWizardProps) {
  const [step, setStep] = React.useState(0);
  const [picks, setPicks] = React.useState<Picks>({});
  const [noIphone, setNoIphone] = React.useState(false);
  const [iphoneQuery, setIphoneQuery] = React.useState("");
  const [macQuery, setMacQuery] = React.useState("");
  const [ecosystemQuery, setEcosystemQuery] = React.useState("");

  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const hasMounted = React.useRef(false);

  const pools = React.useMemo(
    () => ({
      iphone: iphonePool(products),
      mac: macPool(products),
      ecosystem: ecosystemPool(products),
    }),
    [products]
  );
  const featured = React.useMemo(
    () => ({
      iphone: featuredIphones(products),
      mac: featuredMacs(products),
      ecosystem: featuredEcosystem(products),
    }),
    [products]
  );
  const iphoneIds = React.useMemo(
    () => new Set(pools.iphone.map((product) => product.id)),
    [pools.iphone]
  );

  const summary = React.useMemo(() => summarizePicks(picks, products), [picks, products]);
  const items = React.useMemo(() => toItems(picks), [picks]);
  const limitReached = summary.distinct >= MAX_ONBOARDING_ITEMS;

  // Each step is its own screen: move focus to its heading and start at the top.
  React.useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [step]);

  /** Step 1 is single-select: picking an iPhone replaces any other iPhone. */
  const pickIphone = (id: string) => {
    setNoIphone(false);
    setPicks((previous) => {
      const cleared = withoutPicks(previous, iphoneIds);
      return previous[id] === undefined ? withPick(cleared, id, 1) : cleared;
    });
  };

  const toggleNoIphone = () => {
    setNoIphone((value) => !value);
    setPicks((previous) => withoutPicks(previous, iphoneIds));
  };

  const togglePick = (id: string) => {
    setPicks((previous) =>
      previous[id] === undefined ? withPick(previous, id, 1) : withoutPick(previous, id)
    );
  };

  const setQuantity = (id: string, quantity: number) => {
    setPicks((previous) =>
      quantity <= 0 ? withoutPick(previous, id) : withPick(previous, id, quantity)
    );
  };

  const back = () => setStep((current) => Math.max(0, current - 1));
  const next = () => setStep((current) => Math.min(REVEAL_STEP, current + 1));

  if (products.length === 0) {
    return (
      <EmptyState
        emoji="🛒"
        title="The catalogue hasn’t arrived yet"
        description="There’s nothing to pick from right now. Head to your dashboard and add products once it lands."
        action={<SkipOnboardingButton label="Go to my dashboard" variant="default" size="lg" />}
      />
    );
  }

  const copy = step < REVEAL_STEP ? COPY[step] : undefined;

  const iphoneVisible = visibleProducts({
    pool: pools.iphone,
    featured: featured.iphone,
    picks,
    query: iphoneQuery,
  });
  const macVisible = visibleProducts({
    pool: pools.mac,
    featured: featured.mac,
    picks,
    query: macQuery,
  });
  const ecosystemVisible = visibleProducts({
    pool: pools.ecosystem,
    featured: featured.ecosystem,
    picks,
    query: ecosystemQuery,
  });
  const ecosystemGroups = ECOSYSTEM_CATEGORIES.map((category) => ({
    category,
    products: ecosystemVisible.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);

  return (
    <div className="space-y-8 pb-28 md:pb-24">
      <StepProgress steps={STEPS} current={step} />

      {!copy ? (
        <RevealStep items={items} headingRef={headingRef} />
      ) : (
        <section aria-labelledby="step-heading" className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Welcome, @{username}</p>
            <h1
              id="step-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-balance rounded-md text-3xl font-semibold tracking-tighter sm:text-4xl"
            >
              {copy.title}
            </h1>
            <p className="max-w-xl text-pretty text-muted-foreground">{copy.description}</p>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <ProductSearch
                id="iphone-search"
                value={iphoneQuery}
                onChange={setIphoneQuery}
                label="Search any iPhone"
                placeholder="Search any iPhone…"
                resultCount={iphoneVisible.length}
              />
              {iphoneVisible.length === 0 ? (
                <NoResults noun="iPhone" query={iphoneQuery} />
              ) : (
                <ProductChipList
                  label="iPhones"
                  products={iphoneVisible}
                  picks={picks}
                  limitReached={limitReached}
                  onToggle={pickIphone}
                  trailing={
                    iphoneQuery.trim() === "" && (
                      <SelectChip
                        label="No iPhone"
                        detail="$0"
                        selected={noIphone}
                        onToggle={toggleNoIphone}
                      />
                    )
                  }
                />
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <ProductSearch
                id="mac-search"
                value={macQuery}
                onChange={setMacQuery}
                label="Search any Mac"
                placeholder="Search any Mac…"
                resultCount={macVisible.length}
              />
              {macVisible.length === 0 ? (
                <NoResults noun="Mac" query={macQuery} />
              ) : (
                <ProductChipList
                  label="Macs"
                  products={macVisible}
                  picks={picks}
                  limitReached={limitReached}
                  onToggle={togglePick}
                  onQuantityChange={setQuantity}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <ProductSearch
                id="ecosystem-search"
                value={ecosystemQuery}
                onChange={setEcosystemQuery}
                label="Search iPad, Apple Watch, AirPods, Vision, displays and home"
                placeholder="Search the rest of the lineup…"
                resultCount={ecosystemVisible.length}
              />
              {ecosystemGroups.length === 0 ? (
                <NoResults noun="product" query={ecosystemQuery} />
              ) : (
                ecosystemGroups.map((group) => (
                  <div key={group.category} className="space-y-2.5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <span aria-hidden="true">{CATEGORY_EMOJI[group.category]}</span>
                      {CATEGORY_LABEL[group.category]}
                    </h2>
                    <ProductChipList
                      label={CATEGORY_LABEL[group.category]}
                      products={group.products}
                      picks={picks}
                      limitReached={limitReached}
                      onToggle={togglePick}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {limitReached && (
            <p role="status" className="text-sm text-muted-foreground">
              That’s {MAX_ONBOARDING_ITEMS} — the most the welcome flow takes in one go. The catalog
              has the rest.
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" onClick={back} disabled={step === 0}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <Button
              type="button"
              size="lg"
              variant={step === REVEAL_STEP - 1 ? "accent" : "default"}
              onClick={next}
            >
              {step === REVEAL_STEP - 1 ? (
                <>
                  <Sparkles aria-hidden="true" />
                  Reveal my score
                </>
              ) : (
                <>
                  Next
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </section>
      )}

      {copy && <WizardFooter score={summary.score} units={summary.units} />}
    </div>
  );
}

function NoResults({ noun, query }: { noun: string; query: string }) {
  const term = query.trim();
  if (term === "") {
    return (
      <EmptyState
        bare
        emoji="🫥"
        title="Nothing to pick here yet"
        description="The catalog is missing this category for now. Carry on to the next step."
      />
    );
  }
  return (
    <EmptyState
      bare
      emoji="🔍"
      title={`No ${noun} called “${term}”`}
      description="Try a model name like “16 Pro” or “Air”. Anything else is waiting in the catalog after this."
    />
  );
}
