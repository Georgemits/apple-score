import "server-only";

import { cache } from "react";
import { Prisma, type Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { percentile as percentileOf } from "@/lib/score";

/**
 * Band for Band — the leaderboard.
 *
 * Every board ranks public users by a metric computed in SQL straight from the
 * ownership table, using exactly the formula in `src/lib/score.ts`:
 * `(pricePaidUSD ?? priceUSD) × quantity`. Nothing is cached in a score column.
 *
 * Only users with something to rank appear (a $0 collection is not "on the
 * board" yet). Ties share a rank (competition ranking: 1, 2, 2, 4).
 *
 * Rank movement over the last 7 days is reconstructed from the append-only
 * `ActivityEvent` log: previous score = current score − Σ deltas since then.
 */

export type BoardMetric = "score" | "units" | "biggest";

export type BoardDefinition = {
  key: string;
  label: string;
  emoji: string;
  description: string;
  metric: BoardMetric;
  filter: { category?: Category; legacy?: boolean };
  /** Only meaningful for a signed-in viewer (e.g. "Following"). */
  requiresViewer?: boolean;
};

export const BOARDS: readonly BoardDefinition[] = [
  {
    key: "overall",
    label: "Overall",
    emoji: "🏆",
    description: "Total money spent on Apple, across everything.",
    metric: "score",
    filter: {},
  },
  {
    key: "following",
    label: "Following",
    emoji: "👥",
    description: "Just you and the collectors you follow.",
    metric: "score",
    filter: {},
    requiresViewer: true,
  },
  {
    key: "iphone",
    label: "iPhone",
    emoji: "📱",
    description: "Dollars spent on iPhones.",
    metric: "score",
    filter: { category: "IPHONE" },
  },
  {
    key: "mac",
    label: "Mac",
    emoji: "💻",
    description: "Dollars spent on Macs.",
    metric: "score",
    filter: { category: "MAC" },
  },
  {
    key: "ipad",
    label: "iPad",
    emoji: "📝",
    description: "Dollars spent on iPads.",
    metric: "score",
    filter: { category: "IPAD" },
  },
  {
    key: "watch",
    label: "Apple Watch",
    emoji: "⌚",
    description: "Dollars spent on Apple Watch.",
    metric: "score",
    filter: { category: "WATCH" },
  },
  {
    key: "airpods",
    label: "AirPods",
    emoji: "🎧",
    description: "Dollars spent on AirPods.",
    metric: "score",
    filter: { category: "AIRPODS" },
  },
  {
    key: "vision",
    label: "Vision",
    emoji: "🥽",
    description: "Dollars spent on Apple Vision Pro.",
    metric: "score",
    filter: { category: "VISION" },
  },
  {
    key: "vintage",
    label: "Vintage",
    emoji: "🕰️",
    description: "Dollars spent on discontinued and legacy hardware.",
    metric: "score",
    filter: { legacy: true },
  },
  {
    key: "products",
    label: "Most products",
    emoji: "📦",
    description: "Total units owned, regardless of price.",
    metric: "units",
    filter: {},
  },
  {
    key: "biggest",
    label: "Biggest purchase",
    emoji: "🐋",
    description: "The single most expensive unit anyone owns.",
    metric: "biggest",
    filter: {},
  },
];

export const DEFAULT_BOARD = BOARDS[0]!;

export function getBoardDefinition(key: string | null | undefined): BoardDefinition {
  return BOARDS.find((board) => board.key === key) ?? DEFAULT_BOARD;
}

export type BoardRow = {
  id: string;
  username: string;
  displayName: string | null;
  avatarEmoji: string | null;
  avatarHue: number | null;
  createdAt: Date;
  /** The ranked metric: dollars, or units for the products board. */
  value: number;
  /** Dollars within the board's filter. */
  score: number;
  /** Units within the board's filter. */
  units: number;
  /** Distinct products within the board's filter. */
  distinct: number;
  /** Most expensive single unit within the filter. */
  biggest: number;
  /** Name of that most expensive unit. */
  highlight: string | null;
  rank: number;
  /** Rank 7 days ago, or null when the metric has no history. */
  previousRank: number | null;
  /** previousRank − rank: positive is climbing. Null when unknown. */
  movement: number | null;
  /** Joined the board within the last 7 days. */
  isNew: boolean;
  /** Users on this board with a strictly lower value. */
  below: number;
  total: number;
  isTop: boolean;
  isBottom: boolean;
};

type RawRow = Omit<BoardRow, "isTop" | "isBottom" | "movement"> & {
  min: number;
  max: number;
  average: number;
  previous: number;
  /** Dense position in display order (ties broken by join date). */
  position: number;
};

const PAGE_SIZE = 50;
/** Hard ceiling on `?page=` so a hand-edited URL cannot produce an absurd OFFSET. */
const MAX_PAGE = 100_000;

function boardQuery(board: BoardDefinition, viewerId: string | null): Prisma.Sql {
  const productFilter = board.filter.category
    ? Prisma.sql`AND p."category" = ${board.filter.category}::"Category"`
    : board.filter.legacy
      ? Prisma.sql`AND p."legacy" = true`
      : Prisma.empty;

  // Events for deleted products carry no category, so category boards ignore them.
  const eventFilter = board.filter.category
    ? Prisma.sql`AND p."category" = ${board.filter.category}::"Category"`
    : board.filter.legacy
      ? Prisma.sql`AND p."legacy" = true`
      : Prisma.empty;

  const audience =
    board.key === "following"
      ? Prisma.sql`AND (u."id" = ${viewerId ?? ""} OR u."id" IN (
          SELECT f."followingId" FROM "Follow" f WHERE f."followerId" = ${viewerId ?? ""}
        ))`
      : Prisma.empty;

  // Per-user aggregates over the (filtered) inventory and the week's events.
  const score = Prisma.sql`COALESCE(SUM(i."unit" * i."quantity"), 0)`;
  const units = Prisma.sql`COALESCE(SUM(i."quantity"), 0)`;
  const biggest = Prisma.sql`COALESCE(MAX(i."unit"), 0)`;
  const scoreDelta = Prisma.sql`COALESCE(MAX(d."scoreDelta"), 0)`;
  const unitsDelta = Prisma.sql`COALESCE(MAX(d."unitsDelta"), 0)`;

  const metric = board.metric === "score" ? score : board.metric === "units" ? units : biggest;

  // The metric as it stood seven days ago. The biggest-purchase board has no
  // usable history (a removed unit cannot be reconstructed from deltas).
  const previous =
    board.metric === "score"
      ? Prisma.sql`(${score} - ${scoreDelta})`
      : board.metric === "units"
        ? Prisma.sql`(${units} - ${unitsDelta})`
        : null;

  // Keep users who are on the board now OR were a week ago, so last week's
  // ranking includes people who have since dropped off (otherwise everyone
  // below them would appear not to have moved).
  const having = previous
    ? Prisma.sql`HAVING ${metric} > 0 OR ${previous} > 0`
    : Prisma.sql`HAVING ${metric} > 0`;

  const previousRank = previous
    ? Prisma.sql`CASE WHEN t."previous" > 0
        THEN RANK() OVER (ORDER BY t."previous" DESC)::int
        ELSE NULL END`
    : Prisma.sql`NULL::int`;

  const isNew = previous ? Prisma.sql`(t."previous" <= 0)` : Prisma.sql`false`;

  return Prisma.sql`
    WITH inv AS (
      SELECT
        up."userId",
        up."quantity",
        COALESCE(up."pricePaidUSD", p."priceUSD") AS "unit",
        p."name"
      FROM "UserProduct" up
      JOIN "Product" p ON p."id" = up."productId"
      WHERE up."quantity" > 0 ${productFilter}
    ),
    deltas AS (
      SELECT
        e."userId",
        SUM(e."scoreDelta")::int    AS "scoreDelta",
        SUM(e."quantityDelta")::int AS "unitsDelta"
      FROM "ActivityEvent" e
      LEFT JOIN "Product" p ON p."id" = e."productId"
      WHERE e."createdAt" > now() - interval '7 days' ${eventFilter}
      GROUP BY e."userId"
    ),
    totals AS (
      SELECT
        u."id",
        u."username",
        u."displayName",
        u."avatarEmoji",
        u."avatarHue",
        u."createdAt",
        ${score}::int                                   AS "score",
        ${units}::int                                   AS "units",
        COUNT(i."userId")::int                          AS "distinct",
        ${biggest}::int                                 AS "biggest",
        (array_agg(i."name" ORDER BY i."unit" DESC))[1] AS "highlight",
        ${metric}::int                                  AS "value",
        ${previous ?? Prisma.sql`0`}::int               AS "previous"
      FROM "User" u
      LEFT JOIN inv i ON i."userId" = u."id"
      LEFT JOIN deltas d ON d."userId" = u."id"
      WHERE u."isPublic" = true ${audience}
      GROUP BY u."id"
      ${having}
    ),
    history AS (
      SELECT t."id", ${previousRank} AS "previousRank", ${isNew} AS "isNew"
      FROM totals t
    ),
    current AS (
      SELECT t.* FROM totals t WHERE t."value" > 0
    ),
    ranked AS (
      SELECT
        c.*,
        h."previousRank",
        h."isNew",
        RANK() OVER (ORDER BY c."value" DESC)::int                            AS "rank",
        ROW_NUMBER() OVER (ORDER BY c."value" DESC, c."createdAt" ASC)::int   AS "position",
        (RANK() OVER (ORDER BY c."value" ASC) - 1)::int                       AS "below",
        COUNT(*) OVER ()::int                                                 AS "total",
        MIN(c."value") OVER ()::int                                           AS "min",
        MAX(c."value") OVER ()::int                                           AS "max",
        COALESCE(AVG(c."value") OVER (), 0)::int                              AS "average"
      FROM current c
      JOIN history h ON h."id" = c."id"
    )
  `;
}

function finish(row: RawRow): BoardRow {
  const { min, max, average: _average, previous: _previous, position: _position, ...rest } = row;
  const contested = row.total >= 2 && min < max;
  return {
    ...rest,
    movement: row.previousRank === null ? null : row.isNew ? null : row.previousRank - row.rank,
    isTop: contested && row.value === max,
    isBottom: contested && row.value === min,
  };
}

export type BoardPage = {
  board: BoardDefinition;
  rows: BoardRow[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  /** Average metric value across the board, for "vs the average collector". */
  average: number;
};

export async function getBoardPage(
  key: string,
  options: { page?: number; viewerId?: string | null } = {}
): Promise<BoardPage> {
  const board = getBoardDefinition(key);
  const viewerId = options.viewerId ?? null;
  const requested = Number.isSafeInteger(options.page) ? (options.page as number) : 1;
  const page = Math.min(MAX_PAGE, Math.max(1, requested));
  const offset = (page - 1) * PAGE_SIZE;

  if (board.requiresViewer && !viewerId) {
    return { board, rows: [], page: 1, pageSize: PAGE_SIZE, total: 0, pageCount: 0, average: 0 };
  }

  const rows = await prisma.$queryRaw<RawRow[]>`
    ${boardQuery(board, viewerId)}
    SELECT * FROM ranked
    ORDER BY "rank" ASC, "createdAt" ASC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const total = rows[0]?.total ?? (await countBoard(board, viewerId));
  const average = rows[0]?.average ?? 0;

  return {
    board,
    rows: rows.map(finish),
    page,
    pageSize: PAGE_SIZE,
    total,
    pageCount: Math.ceil(total / PAGE_SIZE),
    average,
  };
}

async function countBoard(board: BoardDefinition, viewerId: string | null): Promise<number> {
  const rows = await prisma.$queryRaw<{ total: number }[]>`
    ${boardQuery(board, viewerId)}
    SELECT COUNT(*)::int AS "total" FROM ranked
  `;
  return rows[0]?.total ?? 0;
}

export type Standing = {
  board: BoardDefinition;
  me: BoardRow;
  /** Up to two rows above and two below, including `me`, in rank order. */
  nearby: BoardRow[];
  percentile: number;
  average: number;
  /** The closest user ranked above, and the gap in metric units. */
  above: { row: BoardRow; gap: number } | null;
  /** The closest user ranked below, and how far ahead `me` is. */
  belowMe: { row: BoardRow; gap: number } | null;
};

/**
 * One user's position on a board, with the neighbours either side. Null when
 * the user is not on that board yet (nothing owned, or a private profile).
 * Wrapped in `cache`: the ranking CTE is the most expensive query in the app,
 * and a dashboard render or inventory action asks for it more than once.
 */
export const getStanding = cache(async function getStanding(
  userId: string,
  key = "overall"
): Promise<Standing | null> {
  const board = getBoardDefinition(key);

  const rows = await prisma.$queryRaw<RawRow[]>`
    ${boardQuery(board, userId)}
    SELECT r.* FROM ranked r
    WHERE r."position" BETWEEN
      (SELECT me."position" FROM ranked me WHERE me."id" = ${userId}) - 2
      AND
      (SELECT me."position" FROM ranked me WHERE me."id" = ${userId}) + 2
    ORDER BY r."position" ASC
  `;

  const raw = rows.find((row) => row.id === userId);
  if (!raw) return null;

  const nearby = rows.map(finish);
  const me = nearby.find((row) => row.id === userId)!;

  // Keep the window tight: at most two neighbours either side of `me`.
  const index = nearby.indexOf(me);
  const windowed = nearby.slice(Math.max(0, index - 2), index + 3);

  const aboveRow = [...windowed].reverse().find((row) => row.rank < me.rank) ?? null;
  const belowRow = windowed.find((row) => row.rank > me.rank) ?? null;

  return {
    board,
    me,
    nearby: windowed,
    percentile: percentileOf(me.below, me.total),
    average: raw.average,
    above: aboveRow ? { row: aboveRow, gap: aboveRow.value - me.value } : null,
    belowMe: belowRow ? { row: belowRow, gap: me.value - belowRow.value } : null,
  };
});

export type Podium = BoardRow[];

/** The top three of a board, for podiums and the landing page. */
export async function getPodium(key = "overall"): Promise<Podium> {
  const page = await getBoardPage(key, { page: 1 });
  return page.rows.filter((row) => row.rank <= 3).slice(0, 3);
}

/**
 * The rank a user would hold with `extraDollars` added to their collection —
 * the "what if I buy this?" simulator. Counts users strictly ahead of the
 * hypothetical score.
 */
export async function simulateRank(
  userId: string,
  hypotheticalScore: number
): Promise<{ rank: number; total: number } | null> {
  // Private profiles never rank, so there is no spot to project them into.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPublic: true } });
  if (!user?.isPublic) return null;

  const rows = await prisma.$queryRaw<{ ahead: number; total: number; onBoard: boolean }[]>`
    ${boardQuery(DEFAULT_BOARD, userId)}
    SELECT
      (SELECT COUNT(*) FROM ranked r WHERE r."value" > ${hypotheticalScore} AND r."id" <> ${userId})::int AS "ahead",
      (SELECT COUNT(*) FROM ranked)::int AS "total",
      EXISTS (SELECT 1 FROM ranked r WHERE r."id" = ${userId}) AS "onBoard"
  `;
  const row = rows[0] ?? { ahead: 0, total: 0, onBoard: false };
  // A user not yet on the board joins it, growing the total by one.
  const total = row.onBoard ? row.total : row.total + 1;
  return { rank: row.ahead + 1, total };
}
