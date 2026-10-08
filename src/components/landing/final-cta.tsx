import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppleMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="py-16 sm:py-24">
      <Reveal>
        <Card className="relative overflow-hidden p-8 text-center sm:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-80 animate-float-slow rounded-full bg-gradient-to-br from-accent/25 to-fuchsia-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-20 size-72 animate-float-slow rounded-full bg-gradient-to-br from-emerald-400/20 to-accent/15 blur-3xl [animation-delay:-5s]"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <AppleMark className="size-6" />
            </span>
            <h2
              id="cta-title"
              className="mt-6 text-balance text-3xl font-semibold tracking-tighter sm:text-5xl"
            >
              Your receipts already know the answer.
            </h2>
            <p className="mt-4 max-w-lg text-pretty text-muted-foreground sm:text-lg">
              Find out, then find out where that puts you. Signing up takes two minutes and, unusually
              for this hobby, costs nothing.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Score my setup
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
