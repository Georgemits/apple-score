"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ScoreUpdate } from "@/actions/products";
import type { ActionResult } from "@/actions/types";
import { celebrateUpdate } from "@/components/celebrations";
import { formatSignedUSD, formatUSD } from "@/lib/utils";

/**
 * Runs an inventory server action, then surfaces the result: a toast with the
 * score change, celebrations for milestones and achievements, and a refresh so
 * every server-rendered score on the page picks up the new total.
 */
export function useScoreAction() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const run = React.useCallback(
    (
      action: () => Promise<ActionResult<ScoreUpdate>>,
      successMessage?: string,
      onSuccess?: (update: ScoreUpdate) => void
    ) => {
      startTransition(async () => {
        try {
          const result = await action();

          if (!result.ok) {
            toast.error(result.error);
            return;
          }

          if (successMessage) {
            toast.success(successMessage, {
              description:
                result.data.delta === 0
                  ? undefined
                  : `${formatSignedUSD(result.data.delta)} · Apple Score ${formatUSD(result.data.score)}`,
            });
          }

          celebrateUpdate(result.data);
          onSuccess?.(result.data);
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
