"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { skipOnboardingAction } from "@/actions/account";
import { AnimatedMoney } from "@/components/animated-number";
import { Button, type ButtonProps } from "@/components/ui/button";
import { pluralize } from "@/lib/utils";

const NETWORK_ERROR = "Network error. Please try again.";

type SkipOnboardingButtonProps = {
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

/** Marks the welcome flow as skipped, then heads to the dashboard. */
export function SkipOnboardingButton({
  label = "Skip for now",
  variant = "link",
  size = "sm",
  className,
}: SkipOnboardingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const skip = () => {
    startTransition(async () => {
      try {
        const result = await skipOnboardingAction();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        router.push("/home");
      } catch (error) {
        console.error(error);
        toast.error(NETWORK_ERROR);
      }
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={skip}
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {label}
    </Button>
  );
}

type WizardFooterProps = {
  score: number;
  units: number;
};

/**
 * The running total, pinned to the bottom of the viewport. On phones it sits
 * just above the tab bar (5rem plus the home-indicator inset); on wider
 * screens it hugs the bottom edge.
 */
export function WizardFooter({ score, units }: WizardFooterProps) {
  return (
    <div
      role="region"
      aria-label="Your Apple Score so far"
      className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 md:bottom-0"
    >
      <div className="container px-4 pb-3 sm:px-6 md:pb-4">
        <div className="glass mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Your Apple Score so far
            </p>
            <p className="mt-0.5 truncate text-base font-semibold">
              <AnimatedMoney value={score} duration={0.6} />
              <span className="font-normal text-muted-foreground">
                {" "}
                · {pluralize(units, "product")}
              </span>
            </p>
          </div>
          <SkipOnboardingButton className="shrink-0 px-0 text-muted-foreground hover:text-foreground" />
        </div>
      </div>
    </div>
  );
}
