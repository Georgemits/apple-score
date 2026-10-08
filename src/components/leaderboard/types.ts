import type { Category } from "@prisma/client";
import type { BoardDefinition, BoardMetric, BoardRow } from "@/lib/leaderboard";
import { CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { formatNumber, formatRelative, formatUSD, pluralize } from "@/lib/utils";
import { LEADERBOARD_NAME } from "@/lib/branding";

/**
 * Plain, serialisable shapes for the client half of the leaderboard. Dates
 * become epoch milliseconds (plus a pre-formatted label) so a `BoardRow` can
 * cross the server → client boundary untouched.
 */

export type BoardSummary = {
  key: string;
  label: string;
  emoji: string;
  metric: BoardMetric;
};

export type ListRow = {
  id: string;
  username: string;
  displayName: string | null;
  avatarEmoji: string | null;
  avatarHue: number | null;
  rank: number;
  value: number;
  score: number;
  units: number;
  highlight: string | null;
  movement: number | null;
  isNew: boolean;
  isTop: boolean;
  isBottom: boolean;
  /** Account creation, epoch ms. */
  joinedAt: number;
  /** "3 days ago" / "Mar 1, 2024" — formatted once on the server. */
  joined: string;
};

export function toBoardSummary(board: BoardDefinition): BoardSummary {
  return { key: board.key, label: board.label, emoji: board.emoji, metric: board.metric };
}

export function toListRow(row: BoardRow, now = new Date()): ListRow {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarEmoji: row.avatarEmoji,
    avatarHue: row.avatarHue,
    rank: row.rank,
    value: row.value,
    score: row.score,
    units: row.units,
    highlight: row.highlight,
    movement: row.movement,
    isNew: row.isNew,
    isTop: row.isTop,
    isBottom: row.isBottom,
    joinedAt: row.createdAt.getTime(),
    joined: formatRelative(row.createdAt, now),
  };
}

/* -------------------------------------------------------------------------
 * Formatting
 * ---------------------------------------------------------------------- */

/** The ranked metric: dollars everywhere except the products board. */
export function formatBoardValue(metric: BoardMetric, value: number): string {
  return metric === "units" ? pluralize(value, "product") : formatUSD(value);
}

/** A difference in the ranked metric: "$420" or "3 products". */
export function formatBoardGap(metric: BoardMetric, gap: number): string {
  return metric === "units" ? pluralize(gap, "product") : formatUSD(gap);
}

/** Column header for the ranked metric. */
export function valueLabel(board: BoardSummary): string {
  if (board.metric === "units") return "Products";
  if (board.metric === "biggest") return "Biggest unit";
  return board.key === "overall" || board.key === "following" ? "Apple Score" : "Spent";
}

/* -------------------------------------------------------------------------
 * URLs
 * ---------------------------------------------------------------------- */

export function boardHref(key: string, page = 1): string {
  const params = new URLSearchParams({ board: key });
  if (page > 1) params.set("page", String(page));
  return `/leaderboard?${params.toString()}`;
}

/* -------------------------------------------------------------------------
 * Copy
 * ---------------------------------------------------------------------- */

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function stripPeriod(value: string): string {
  return value.replace(/\.\s*$/, "");
}

/** The page description, adapted to the board and how many are on it. */
export function headerDescription(board: BoardDefinition, total: number): string {
  if (total === 0) return `${board.description} Nobody here yet.`;
  const count = pluralize(total, "collector");
  if (board.key === "overall") {
    return `${LEADERBOARD_NAME} — ${count} ranked by money spent on Apple.`;
  }
  if (board.key === "following") {
    return `Just you and the collectors you follow — ${count} ranked by money spent on Apple.`;
  }
  return `The ${board.label} board — ${count} ranked by ${lowerFirst(stripPeriod(board.description))}.`;
}

/** "$420 behind @steve" / "$1,200 ahead of @alex" / "Tied with @sam". */
export function gapCopy(
  metric: BoardMetric,
  gap: number,
  username: string,
  direction: "behind" | "ahead"
): string {
  if (gap === 0) return `Tied with @${username}`;
  return direction === "behind"
    ? `${formatBoardGap(metric, gap)} behind @${username}`
    : `${formatBoardGap(metric, gap)} ahead of @${username}`;
}

/** "You're 42% above the average collector." Null when there is no average. */
export function averageCopy(value: number, average: number): string | null {
  if (average <= 0) return null;
  const percent = Math.round(((value - average) / average) * 100);
  if (percent === 0) return "You're exactly the average collector. Suspiciously so.";
  return percent > 0
    ? `You're ${formatNumber(percent)}% above the average collector.`
    : `You're ${formatNumber(Math.abs(percent))}% below the average collector.`;
}

/**
 * "You're ahead of 87% of collectors on this board." The two extremes come
 * from counts, not the rounded percentile: #2 of 150 rounds to 99% but is not
 * ahead of everyone, and a tie for last still has nobody behind it.
 */
export function percentileCopy(
  percentile: number,
  me: Pick<BoardRow, "rank" | "total" | "below">
): string {
  if (me.total <= 1) return "You're the only one here. Enjoy the view while it lasts.";
  if (me.rank === 1) return "You're ahead of everyone else on this board.";
  if (me.below === 0) return "Nobody on this board is behind you yet. Plenty of room to climb.";
  return `You're ahead of ${formatNumber(percentile)}% of collectors on this board.`;
}

const CATEGORY_NUDGE: Partial<Record<Category, string>> = {
  IPHONE: "an iPhone",
  MAC: "a Mac",
  IPAD: "an iPad",
  WATCH: "an Apple Watch",
  AIRPODS: "some AirPods",
  VISION: "a Vision Pro",
};

/** What to add to get on this board, and where to add it. */
export function notOnBoardCopy(board: BoardDefinition): {
  title: string;
  description: string;
  href: string;
  cta: string;
} {
  const category = board.filter.category;
  if (category) {
    const thing = CATEGORY_NUDGE[category] ?? CATEGORY_LABEL[category];
    return {
      title: `You're not on the ${board.label} board yet`,
      description: `Only ${CATEGORY_LABEL[category]} spending counts here. Add ${thing} to get ranked.`,
      href: `/catalog?category=${CATEGORY_SLUG[category]}`,
      cta: `Add ${thing}`,
    };
  }
  if (board.filter.legacy) {
    return {
      title: "You're not on the Vintage board yet",
      description: "Only discontinued hardware counts here. Old money is still money.",
      href: "/catalog",
      cta: "Add something old",
    };
  }
  return {
    title: "You're not on this board yet",
    description: "Add a product to get on the board. One is enough to start climbing.",
    href: "/catalog",
    cta: "Add a product",
  };
}
