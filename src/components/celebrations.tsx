"use client";

import { toast } from "sonner";
import type { ScoreUpdate } from "@/actions/products";
import type { UnlockSummary } from "@/lib/achievement-sync";
import type { AchievementRarity } from "@/lib/achievements";
import { celebrate } from "@/components/confetti";
import { RARITY_LABEL } from "@/lib/achievements";
import { cn, formatUSD } from "@/lib/utils";

const RARITY_RING: Record<AchievementRarity, string> = {
  common: "ring-border",
  uncommon: "ring-success/50",
  rare: "ring-accent/60",
  epic: "ring-fuchsia-500/60",
  legendary: "ring-gold/70 shadow-glow-gold",
};

function AchievementToast({ unlock }: { unlock: UnlockSummary }) {
  return (
    <div
      className={cn(
        "shine flex w-[22rem] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl bg-popover p-3 pr-4 text-popover-foreground ring-2",
        RARITY_RING[unlock.rarity]
      )}
      role="status"
    >
      <span
        className="bg-accent/12 flex size-11 shrink-0 items-center justify-center rounded-full text-2xl"
        aria-hidden="true"
      >
        {unlock.emoji}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Achievement unlocked · {RARITY_LABEL[unlock.rarity]}
        </p>
        <p className="truncate font-semibold">{unlock.title}</p>
      </div>
    </div>
  );
}

/**
 * Turns the result of an inventory action into the right amount of fanfare:
 * confetti for milestones and rare unlocks, a toast per achievement, a note
 * when the user climbs into a new tier.
 */
export function celebrateUpdate(update: ScoreUpdate): void {
  let fireworks = false;

  if (update.milestone !== null) {
    fireworks = true;
    toast.success(`Milestone: ${formatUSD(update.milestone)} Apple Score`, {
      description:
        update.rank && update.rank.total > 1
          ? `You're now #${update.rank.rank} of ${update.rank.total} on Band for Band.`
          : undefined,
      duration: 6000,
    });
  }

  if (update.tier) {
    toast(`${update.tier.emoji} New tier: ${update.tier.name}`, { duration: 6000 });
  }

  update.unlocked.forEach((unlock, index) => {
    if (unlock.rarity === "rare" || unlock.rarity === "epic" || unlock.rarity === "legendary") {
      fireworks = true;
    }
    window.setTimeout(() => {
      toast.custom(() => <AchievementToast unlock={unlock} />, {
        duration: 6000,
        id: `achievement-${unlock.id}`,
      });
    }, 350 * index);
  });

  if (fireworks) void celebrate();
}
