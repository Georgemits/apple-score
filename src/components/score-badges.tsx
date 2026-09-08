import { cn } from "@/lib/utils";

/**
 * Loud status badges for the top and bottom of Band for Band. Both are
 * deliberately playful about money rather than about the person.
 */
const BASE =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm";

export const TOP_BADGE = {
  emoji: "💰",
  label: "Rich Millionaire",
  description: "Currently sitting at the top of Band for Band.",
} as const;

export const BOTTOM_BADGE = {
  emoji: "🚨",
  label: "Broke Alert!!",
  description: "Currently holding up the rest of the board. Plenty of room to climb.",
} as const;

export function TopBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(BASE, "bg-emerald-600 ring-1 ring-emerald-700/40", className)}
      title={TOP_BADGE.description}
    >
      <span aria-hidden="true">{TOP_BADGE.emoji}</span>
      {TOP_BADGE.label}
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
