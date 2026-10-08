import { cn } from "@/lib/utils";

const MEDALS: Record<number, { emoji: string; label: string; className: string }> = {
  1: {
    emoji: "🥇",
    label: "1st place",
    className: "bg-amber-400/20 text-amber-700 dark:text-amber-300",
  },
  2: {
    emoji: "🥈",
    label: "2nd place",
    className: "bg-slate-400/20 text-slate-700 dark:text-slate-300",
  },
  3: {
    emoji: "🥉",
    label: "3rd place",
    className: "bg-orange-500/18 text-orange-700 dark:text-orange-300",
  },
};

export function RankMedal({ rank, className }: { rank: number; className?: string }) {
  const medal = MEDALS[rank];

  if (!medal) {
    return (
      <span
        className={cn(
          "tabular inline-flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground",
          className
        )}
      >
        {rank}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-base font-semibold",
        medal.className,
        className
      )}
      title={medal.label}
    >
      <span aria-hidden="true">{medal.emoji}</span>
      <span className="sr-only">{medal.label}</span>
    </span>
  );
}
