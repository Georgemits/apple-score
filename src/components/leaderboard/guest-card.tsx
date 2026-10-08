import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type GuestCardProps = {
  boardKey: string;
  className?: string;
};

/** The signed-out stand-in for "Your standing": a nudge to sign up. */
export function GuestCard({ boardKey, className }: GuestCardProps) {
  const callbackUrl = encodeURIComponent(`/leaderboard?board=${boardKey}`);

  return (
    <section aria-labelledby="guest-heading" className={cn("animate-enter-up", className)}>
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 size-56 rounded-full bg-gradient-to-br from-accent/20 via-fuchsia-500/10 to-transparent blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Your standing
            </p>
            <h2
              id="guest-heading"
              className="mt-1 text-balance text-xl font-semibold tracking-tight"
            >
              Create an account to get on the board
            </h2>
            <p className="mt-1 max-w-prose text-pretty text-sm text-muted-foreground">
              Add what you own, find out what it cost you, and climb {LEADERBOARD_NAME}. Rank is
              free. The products were not.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild>
              <Link href={`/signup?callbackUrl=${callbackUrl}`}>
                <UserPlus aria-hidden="true" />
                Sign up
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/login?callbackUrl=${callbackUrl}`}>
                <LogIn aria-hidden="true" />
                Log in
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
