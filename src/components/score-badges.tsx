import { LEADERBOARD_NAME } from "@/lib/branding";
import { cn, formatUSD } from "@/lib/utils";

/**
 * Loud status badges for the top and bottom of the board. Both are
 * deliberately playful about money rather than about the person.
 */
const BASE =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm";

/** Only a seven-figure collection earns the millionaire label. */
export const MILLIONAIRE_THRESHOLD = 1_000_000;

export const TOP_BADGE = {
  emoji: "💰",
  label: "Rich Millionaire",
  modestLabel: "Top of the board",
  description: `Currently sitting at the top of ${LEADERBOARD_NAME}.`,
} as const;

export const BOTTOM_BADGE = {
  emoji: "🚨",
  label: "Broke Alert!!",
  description: "Currently holding up the rest of the board. Plenty of room to climb.",
} as const;

/** The label for whoever holds first place, honest about the number behind it. */
export function topBadgeLabel(value: number | undefined): string {
  return value === undefined || value >= MILLIONAIRE_THRESHOLD
    ? TOP_BADGE.label
    : TOP_BADGE.modestLabel;
}

export function TopBadge({ value, className }: { value?: number; className?: string }) {
  return (
    <span
      className={cn(BASE, "bg-emerald-700 ring-1 ring-emerald-800/40", className)}
      title={
        value === undefined || value >= MILLIONAIRE_THRESHOLD
          ? TOP_BADGE.description
          : `${TOP_BADGE.description} ${formatUSD(MILLIONAIRE_THRESHOLD)} unlocks the big title.`
      }
    >
      <span aria-hidden="true">{TOP_BADGE.emoji}</span>
      {topBadgeLabel(value)}
    </span>
  );
}

export function BottomBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(BASE, "bg-red-600 ring-1 ring-red-700/40", className)}
      title={BOTTOM_BADGE.description}
    >
      <span aria-hidden="true">{BOTTOM_BADGE.emoji}</span>
      {BOTTOM_BADGE.label}
    </span>
  );
}
