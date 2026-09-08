"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ScoreUpdate } from "@/actions/products";
import type { ActionResult } from "@/actions/types";
import { celebrate } from "@/components/confetti";
import { formatNumber } from "@/lib/utils";

/**
 * Runs an inventory server action, then surfaces the result: a toast, confetti
 * when a milestone is crossed, and a refresh so every server-rendered score on
 * the page (home, profile, leaderboard) picks up the new total.
 */
export function useScoreAction() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const run = React.useCallback(
    (action: () => Promise<ActionResult<ScoreUpdate>>, successMessage?: string) => {
      startTransition(async () => {
        try {
          const result = await action();

          if (!result.ok) {
            toast.error(result.error);
            return;
          }

          if (successMessage) toast.success(successMessage);

          if (result.data.milestone !== null) {
            void celebrate();
            toast.success(`Milestone unlocked: ${formatNumber(result.data.milestone)} Apple Points`);
          }

          router.refresh();
        } catch (error) {
          console.error(error);
          toast.error("Network error. Please try again.");
        }
      });
    },
    [router]
  );

  return { run, isPending };
}
