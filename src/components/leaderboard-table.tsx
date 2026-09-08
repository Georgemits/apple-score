"use client";

import * as React from "react";
import Link from "next/link";
import { Search, SearchX, X } from "lucide-react";
import type { LeaderboardRow } from "@/lib/queries";
import { cn, formatDate, formatNumber, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RankMedal } from "@/components/rank-medal";
import { BottomBadge } from "@/components/bottom-badge";
import { EmptyState } from "@/components/empty-state";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  bottomUserIds: string[];
  currentUserId?: string | undefined;
};

export function LeaderboardTable({ rows, bottomUserIds, currentUserId }: LeaderboardTableProps) {
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);

  const bottomIds = React.useMemo(() => new Set(bottomUserIds), [bottomUserIds]);

  const filtered = React.useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => row.username.includes(term));
  }, [rows, deferredQuery]);

  const me = currentUserId ? rows.find((row) => row.id === currentUserId) : undefined;
  const meIsVisible = me ? filtered.some((row) => row.id === me.id) : true;

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users…"
          aria-label="Search the leaderboard by username"
          className="pl-11 pr-11"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Your own rank stays visible even when filtered out of the list below. */}
      {me && !meIsVisible && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your rank
          </p>
          <LeaderboardRowView row={me} isCurrentUser isBottom={bottomIds.has(me.id)} />
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No users found"
          description={`Nobody on the leaderboard matches “${query}”.`}
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">
                Registered users ranked by Apple Score, highest first.
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="w-20 px-5 py-3 font-semibold">
                    Rank
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    User
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    Apple Score
                  </th>
                  <th scope="col" className="hidden px-5 py-3 text-right font-semibold sm:table-cell">
                    Products
                  </th>
                  <th scope="col" className="hidden px-5 py-3 text-right font-semibold md:table-cell">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr
                    key={row.id}
                    style={{ animationDelay: `${Math.min(index * 15, 300)}ms` }}
                    className={cn(
                      "animate-enter-up",
                      "border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50",
                      row.id === currentUserId && "bg-accent/[0.07]"
                    )}
                  >
                    <td className="px-5 py-3">
                      <RankMedal rank={row.rank} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {initials(row.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/u/${row.username}`}
                            className="truncate font-medium hover:underline"
                          >
                            @{row.username}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {row.id === currentUserId && <Badge variant="accent">You</Badge>}
                            {bottomIds.has(row.id) && <BottomBadge />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="tabular px-5 py-3 text-right font-semibold">
                      {formatNumber(row.score)}
                    </td>
                    <td className="tabular hidden px-5 py-3 text-right text-muted-foreground sm:table-cell">
                      {formatNumber(row.productCount)}
                    </td>
                    <td className="hidden px-5 py-3 text-right text-muted-foreground md:table-cell">
                      {formatDate(new Date(row.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function LeaderboardRowView({
  row,
  isCurrentUser,
  isBottom,
}: {
  row: LeaderboardRow;
  isCurrentUser: boolean;
  isBottom: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <RankMedal rank={row.rank} />
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">{initials(row.username)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">@{row.username}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {isCurrentUser && <Badge variant="accent">You</Badge>}
          {isBottom && <BottomBadge />}
        </div>
      </div>
      <p className="tabular font-semibold">{formatNumber(row.score)}</p>
    </div>
  );
}
