"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { cn, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { RankDelta } from "@/components/rank-delta";
import { RankMedal } from "@/components/rank-medal";
import { BottomBadge, TopBadge } from "@/components/score-badges";
import { UserAvatar } from "@/components/user-avatar";
import { BoardSearch } from "@/components/leaderboard/board-search";
import {
  formatBoardValue,
  valueLabel,
  type BoardSummary,
  type ListRow,
} from "@/components/leaderboard/types";

type BoardListProps = {
  rows: ListRow[];
  board: BoardSummary;
  currentUserId: string | null;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

/** Entrance stagger for stacked cards, capped so the tail never feels slow. */
function stagger(index: number): React.CSSProperties {
  return { animationDelay: `${Math.min(index * 24, 240)}ms` };
}

function matches(row: ListRow, needle: string): boolean {
  return (
    row.username.toLowerCase().includes(needle) ||
    (row.displayName ?? "").toLowerCase().includes(needle)
  );
}

function displayName(row: ListRow): string {
  return row.displayName ?? `@${row.username}`;
}

function Rank({ rank }: { rank: number }) {
  if (rank <= 3) return <RankMedal rank={rank} />;
  return (
    <span className="tabular inline-flex size-9 items-center justify-center text-sm font-semibold text-muted-foreground">
      {formatNumber(rank)}
    </span>
  );
}

function RowBadges({ row, isMe, className }: { row: ListRow; isMe: boolean; className?: string }) {
  const any = isMe || row.isTop || row.isBottom || row.isNew || row.movement !== null;
  if (!any) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      {isMe && <Badge variant="accent">You</Badge>}
      {row.isTop && <TopBadge />}
      {row.isBottom && <BottomBadge />}
      <RankDelta movement={row.movement} isNew={row.isNew} />
    </div>
  );
}

/**
 * The ranking itself. A real table on wide screens, stacked cards on phones,
 * both fed by a client-side search over the loaded page. The viewer's own row
 * is highlighted, and stays pinned above the list when a search hides it.
 */
export function BoardList({
  rows,
  board,
  currentUserId,
  page,
  pageCount,
  pageSize,
  total,
}: BoardListProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);
  const needle = deferredQuery.trim().toLowerCase();
  const filtering = needle.length > 0;
  const stale = query.trim().toLowerCase() !== needle;

  const visible = React.useMemo(
    () => (filtering ? rows.filter((row) => matches(row, needle)) : rows),
    [rows, filtering, needle]
  );

  const viewerRow = currentUserId ? (rows.find((row) => row.id === currentUserId) ?? null) : null;
  const viewerHidden =
    viewerRow !== null && filtering && !visible.some((row) => row.id === viewerRow.id);

  const metric = board.metric;
  const showHighlight = metric === "biggest";
  const secondaryLabel = metric === "units" ? "Spent" : "Products";
  const secondary = (row: ListRow) =>
    metric === "units" ? formatUSD(row.score) : formatNumber(row.units);
  /** The same fact as a phrase, for the stacked cards. */
  const secondaryPhrase = (row: ListRow) =>
    metric === "units" ? `spent ${formatUSD(row.score)}` : pluralize(row.units, "product");
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, from + rows.length - 1);

  const navigate = (event: React.MouseEvent<HTMLElement>, href: string) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    if (window.getSelection()?.toString()) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      window.open(href, "_blank", "noopener");
      return;
    }
    router.push(href);
  };

  return (
    <section aria-labelledby="ranking-heading" className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="ranking-heading" className="text-xl font-semibold tracking-tight">
          The ranking
        </h2>
        <p className="tabular text-sm text-muted-foreground" aria-live="polite">
          {filtering
            ? `${formatNumber(visible.length)} of ${formatNumber(rows.length)} on this page match`
            : `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)}`}
        </p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 bg-background/85 px-4 py-2 backdrop-blur-md md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <BoardSearch value={query} onChange={setQuery} className="md:max-w-sm" />
      </div>

      {viewerHidden && viewerRow && (
        <div
          role="note"
          aria-label="Your row, pinned"
          className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/8 px-3 py-2.5"
        >
          <Pin className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <Rank rank={viewerRow.rank} />
          <UserAvatar user={viewerRow} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {displayName(viewerRow)}
              <span className="ml-1.5 text-xs font-medium text-accent">You</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Still on this page, just hidden by your search.
            </p>
          </div>
          <span className="tabular hidden shrink-0 text-sm font-semibold sm:inline">
            {formatBoardValue(metric, viewerRow.value)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setQuery("")} className="shrink-0">
            Clear
          </Button>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No one on this page matches"
          description={
            pageCount > 1
              ? "Try another spelling, or flip to the next page. They might be hiding there."
              : "Try another spelling. Usernames are exact, feelings are not."
          }
          action={
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className={cn("transition-opacity", stale && "opacity-70")}>
          {/* --------------------------------------------------- Table (md+) */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">
                {board.label} board, page {formatNumber(page)} of{" "}
                {formatNumber(Math.max(1, pageCount))}
              </caption>
              <thead className="bg-secondary/50 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Rank
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">
                    Collector
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    {valueLabel(board)}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    {secondaryLabel}
                  </th>
                  {showHighlight && (
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Highlight
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const isMe = row.id === currentUserId;
                  const href = `/u/${row.username}`;
                  return (
                    <tr
                      key={row.id}
                      aria-current={isMe ? "true" : undefined}
                      onClick={(event) => navigate(event, href)}
                      className={cn(
                        "cursor-pointer border-t border-border/60 transition-colors hover:bg-secondary/50",
                        isMe &&
                          "bg-accent/8 shadow-[inset_3px_0_0_hsl(var(--accent))] hover:bg-accent/12"
                      )}
                    >
                      <td className="px-4 py-3 align-middle">
                        <Rank rank={row.rank} />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={row} size={40} />
                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                              <Link
                                href={href}
                                className="min-w-0 max-w-full truncate rounded font-semibold hover:underline"
                              >
                                {displayName(row)}
                              </Link>
                              {row.displayName && (
                                <span className="truncate text-xs text-muted-foreground">
                                  @{row.username}
                                </span>
                              )}
                            </div>
                            <RowBadges row={row} isMe={isMe} className="mt-1" />
                          </div>
                        </div>
                      </td>
                      <td className="tabular whitespace-nowrap px-4 py-3 text-right align-middle font-semibold">
                        {formatBoardValue(metric, row.value)}
                      </td>
                      <td className="tabular whitespace-nowrap px-4 py-3 text-right align-middle text-muted-foreground">
                        {secondary(row)}
                      </td>
                      {showHighlight && (
                        <td className="max-w-[16rem] px-4 py-3 align-middle text-muted-foreground">
                          <span className="line-clamp-2">{row.highlight ?? "—"}</span>
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-3 text-right align-middle text-muted-foreground">
                        <time dateTime={new Date(row.joinedAt).toISOString()}>{row.joined}</time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* --------------------------------------------------- Cards (<md) */}
          <ol className="space-y-2 md:hidden" aria-label={`${board.label} ranking`}>
            {visible.map((row, index) => {
              const isMe = row.id === currentUserId;
              return (
                <li
                  key={row.id}
                  aria-current={isMe ? "true" : undefined}
                  className="animate-enter-up"
                  style={stagger(index)}
                >
                  <Card className={cn("card-hover", isMe && "ring-2 ring-accent/50")}>
                    <Link href={`/u/${row.username}`} className="block rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Rank rank={row.rank} />
                        <UserAvatar user={row} size={44} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {displayName(row)}
                            {isMe && (
                              <span className="ml-1.5 text-xs font-medium text-accent">You</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{row.username}
                            <span aria-hidden="true"> · </span>
                            <span className="tabular">{secondaryPhrase(row)}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="tabular text-lg font-bold tracking-tight">
                            {formatBoardValue(metric, row.value)}
                          </p>
                          <RankDelta movement={row.movement} isNew={row.isNew} />
                        </div>
                      </div>
                      {(row.isTop || row.isBottom || (showHighlight && row.highlight)) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                          {row.isTop && <TopBadge />}
                          {row.isBottom && <BottomBadge />}
                          {showHighlight && row.highlight && (
                            <span className="min-w-0 truncate">
                              Biggest buy: <span className="text-foreground">{row.highlight}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
