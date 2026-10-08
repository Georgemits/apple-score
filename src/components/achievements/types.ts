import {
  GROUP_LABEL,
  RARITY_ORDER,
  type AchievementGroup,
  type AchievementRarity,
} from "@/lib/achievements";
import { formatNumber, pluralize } from "@/lib/utils";

/**
 * One achievement as the client sees it: plain data only, dates as ISO
 * strings, so it crosses the server → client boundary untouched. The full
 * definition (with its progress function) is looked up by id on the client.
 */
export type AchievementView = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  rarity: AchievementRarity;
  group: AchievementGroup;
  secret: boolean;
  /** 0–1 toward unlocking. Always 0 for guests. */
  progress: number;
  /** ISO timestamp once persisted as unlocked, otherwise null. */
  unlockedAt: string | null;
  /** Share of public collectors holding it, 0–1. */
  holderShare: number;
};

export type StatusFilter = "all" | "unlocked" | "locked";
export type RarityFilter = "all" | AchievementRarity;
export type GroupFilter = "all" | AchievementGroup;

export type Filters = {
  status: StatusFilter;
  rarity: RarityFilter;
  group: GroupFilter;
};

export const DEFAULT_FILTERS: Filters = { status: "all", rarity: "all", group: "all" };

export const STATUS_OPTIONS: readonly { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unlocked", label: "Unlocked" },
  { key: "locked", label: "Locked" },
];

/** Groups in catalogue order — the order the grid renders them. */
export const GROUP_KEYS = Object.keys(GROUP_LABEL) as readonly AchievementGroup[];
export const RARITY_KEYS = RARITY_ORDER;

export function isUnlocked(view: AchievementView): boolean {
  return view.unlockedAt !== null;
}

export function matchesStatus(view: AchievementView, status: StatusFilter): boolean {
  if (status === "all") return true;
  return status === "unlocked" ? isUnlocked(view) : !isUnlocked(view);
}

export function matchesFilters(view: AchievementView, filters: Filters): boolean {
  return (
    matchesStatus(view, filters.status) &&
    (filters.rarity === "all" || view.rarity === filters.rarity) &&
    (filters.group === "all" || view.group === filters.group)
  );
}

export function hasActiveFilters(filters: Filters): boolean {
  return filters.status !== "all" || filters.rarity !== "all" || filters.group !== "all";
}

/** "61 achievements", or "12 of 61 achievements" once a filter bites. */
export function resultLabel(shown: number, total: number): string {
  if (shown === total) return pluralize(total, "achievement");
  return `${formatNumber(shown)} of ${pluralize(total, "achievement")}`;
}

/** "Held by 12% of collectors" — mirrors the rounding inside `AchievementCard`. */
export function holderShareLabel(share: number): string {
  if (share <= 0) return "nobody else yet";
  return `${Math.max(1, Math.round(share * 100))}% of collectors`;
}
