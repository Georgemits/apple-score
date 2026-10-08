import type { AchievementRarity } from "@/lib/achievements";

/** Rarity tints for small chips, matching the chip inside `AchievementCard`. */
export const RARITY_CHIP: Record<AchievementRarity, string> = {
  common: "bg-secondary text-muted-foreground",
  uncommon: "bg-success/12 text-success",
  rare: "bg-accent/12 text-accent",
  epic: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300",
  legendary: "bg-gold/15 text-amber-700 dark:text-amber-300",
};

/**
 * A small dot per rarity for the filter chips. The label always sits next to
 * it, so colour is a hint, never the only signal.
 */
export const RARITY_DOT: Record<AchievementRarity, string> = {
  common: "bg-muted-foreground/60",
  uncommon: "bg-success",
  rare: "bg-accent",
  epic: "bg-fuchsia-500",
  legendary: "bg-gold",
};
