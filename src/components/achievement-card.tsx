import { Lock } from "lucide-react";
import {
  RARITY_LABEL,
  type AchievementDefinition,
  type AchievementRarity,
} from "@/lib/achievements";
import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

const RARITY_STYLE: Record<AchievementRarity, { chip: string; halo: string; card: string }> = {
  common: {
    chip: "bg-secondary text-muted-foreground",
    halo: "bg-secondary",
    card: "",
  },
  uncommon: {
    chip: "bg-success/12 text-success",
    halo: "bg-success/15",
    card: "",
  },
  rare: {
    chip: "bg-accent/12 text-accent",
    halo: "bg-accent/15",
    card: "",
  },
  epic: {
    chip: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300",
    halo: "bg-fuchsia-500/15",
    card: "",
  },
  legendary: {
    chip: "bg-gold/15 text-amber-700 dark:text-amber-300",
    halo: "bg-gradient-to-br from-gold/35 to-orange-500/25",
    card: "border-gold/40 shadow-glow-gold",
  },
};

export type AchievementCardProps = {
  definition: AchievementDefinition;
  unlockedAt: Date | null;
  /** 0–1 progress for locked achievements. */
  progress: number;
  /** Share of collectors holding it, 0–1. */
  holderShare?: number;
  /** Highlight as just earned. */
  fresh?: boolean;
  className?: string;
};

export function AchievementCard({
  definition,
  unlockedAt,
  progress,
  holderShare,
  fresh = false,
  className,
}: AchievementCardProps) {
  const unlocked = unlockedAt !== null;
  const hidden = definition.secret && !unlocked;
  const style = RARITY_STYLE[definition.rarity];
  const percent = Math.round(Math.min(progress, 1) * 100);

  return (
    <Card
      className={cn(
        "flex h-full items-start gap-3.5 p-4 transition-opacity",
        unlocked ? style.card : "opacity-75",
        fresh && "shine animate-pop-in",
        className
      )}
      aria-label={`${hidden ? "Secret achievement" : definition.title}: ${unlocked ? "unlocked" : "locked"}`}
    >
      <span
        className={cn(
          "relative flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl",
          unlocked ? style.halo : "bg-secondary grayscale"
        )}
        aria-hidden="true"
      >
        {hidden ? <Lock className="size-5 text-muted-foreground" /> : definition.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold leading-snug">
            {hidden ? "Secret achievement" : definition.title}
          </p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              style.chip
            )}
          >
            {RARITY_LABEL[definition.rarity]}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {hidden ? "Keep collecting. You will know it when you see it." : definition.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {unlocked && unlockedAt && <span>Unlocked {formatDate(unlockedAt)}</span>}
          {holderShare !== undefined && (
            <span>
              {holderShare === 0
                ? "Nobody has this yet"
                : `${Math.max(1, Math.round(holderShare * 100))}% of collectors have this`}
            </span>
          )}
        </div>

        {!unlocked && !hidden && (
          <div
            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${definition.title} progress`}
          >
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
