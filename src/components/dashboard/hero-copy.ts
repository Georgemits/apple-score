import type { Tier } from "@/lib/score";

/**
 * Extra hero lines per tier, on top of the tier's own tagline. All of them are
 * jokes about money, never about the person. Keep them short and confident.
 */
const EXTRA_LINES: Record<string, readonly string[]> = {
  "window-shopper": ["Every collection starts at $0. Yours is right on schedule."],
  "toe-dipper": ["Every empire starts with a dongle.", "Small purchases. Big intentions."],
  "casual-fan": [
    "A respectable start. Cupertino has noticed.",
    "Still within explaining distance of a budget.",
  ],
  committed: [
    "Leaving the ecosystem would be a whole project now.",
    "Your chargers alone could fund a small startup.",
  ],
  "apple-addict": [
    "Your wallet has entered the chat.",
    "Continuity works beautifully. So does the billing.",
  ],
  "ecosystem-hostage": [
    "Android is a rumour you have heard about.",
    "At this point the wall charger is sentimental.",
  ],
  "cupertino-royalty": [
    "You have paid for a window at Apple Park. Not a big one.",
    "Your receipts could wallpaper a Genius Bar.",
  ],
  "keynote-vip": [
    "Somewhere, a product manager is thanking you.",
    "One more thing? You already own it.",
  ],
  "tims-favourite": [
    "Less a collection, more an index fund.",
    "Your collection has a better P&L than most startups.",
  ],
  "infinite-loop": [
    "Numbers this big usually have a board of directors.",
    "At this scale it is practically a museum endowment.",
  ],
};

/**
 * A hero line for the tier that rotates day to day but is deterministic for a
 * given `seed`, so the server and any re-render agree on the copy.
 */
export function heroTitle(tier: Tier, seed: number): string {
  const lines = [tier.tagline, ...(EXTRA_LINES[tier.id] ?? [])];
  const index = Math.abs(Math.trunc(seed)) % lines.length;
  return lines[index] ?? tier.tagline;
}

/** Day of the year (1–366) in UTC, used as the rotating part of the seed. */
export function dayOfYear(date: Date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}
