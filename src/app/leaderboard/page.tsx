import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { auth } from "@/auth";
import { DEFAULT_BOARD, getBoardDefinition, getBoardPage, getStanding } from "@/lib/leaderboard";
import { getUserById } from "@/lib/queries";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Podium } from "@/components/podium";
import { BoardTabs } from "@/components/leaderboard/board-tabs";
import { StandingCard } from "@/components/leaderboard/standing-card";
import { GuestCard } from "@/components/leaderboard/guest-card";
import { BoardList } from "@/components/leaderboard/board-list";
import { BoardPagination } from "@/components/leaderboard/board-pagination";
import {
  boardHref,
  formatBoardValue,
  headerDescription,
  toBoardSummary,
  toListRow,
} from "@/components/leaderboard/types";

export const metadata: Metadata = {
  title: LEADERBOARD_NAME,
  description: "The global Apple Score leaderboard",
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type PageProps = { searchParams: Promise<SearchParams> };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** `?page=` as a positive integer; anything odd lands on page 1. */
function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isSafeInteger(page) && page >= 1 ? Math.min(page, 100_000) : 1;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const viewerId = session?.user?.id ?? null;

  const board = getBoardDefinition(first(params.board) || undefined);
  // Guests have nobody to follow; send them to the overall board instead of
  // an empty one.
  if (board.requiresViewer && !viewerId) redirect(boardHref(DEFAULT_BOARD.key));

  const page = parsePage(first(params.page));

  const [data, standing, viewer] = await Promise.all([
    getBoardPage(board.key, { page, viewerId }),
    viewerId ? getStanding(viewerId, board.key) : Promise.resolve(null),
    viewerId ? getUserById(viewerId) : Promise.resolve(null),
  ]);

  // A page past the end (stale link, hand-edited URL) snaps to the last one.
  if (data.rows.length === 0 && data.pageCount > 0 && page > data.pageCount) {
    redirect(boardHref(board.key, data.pageCount));
  }

  const signedIn = viewerId !== null;
  const isEmpty = data.total === 0;
  const isFollowing = board.key === "following";
  const now = new Date();
  const rows = data.rows.map((row) => toListRow(row, now));
  const summary = toBoardSummary(board);
  const formatValue = (value: number) => formatBoardValue(board.metric, value);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow={`${board.emoji} ${board.label}`}
        title={LEADERBOARD_NAME}
        description={headerDescription(board, data.total)}
        actions={
          signedIn ? (
            <Button asChild>
              <Link href="/catalog">
                <PackagePlus aria-hidden="true" />
                Add product
              </Link>
            </Button>
          ) : undefined
        }
      />

      <BoardTabs activeKey={board.key} signedIn={signedIn} />

      {isEmpty ? (
        isFollowing ? (
          <EmptyState
            emoji="👥"
            title="You're not following anyone yet."
            description="Pick a rival. The overall board is full of candidates."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href={boardHref(DEFAULT_BOARD.key)}>Browse the overall board</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            emoji="🏁"
            title="The board is empty."
            description="First one to spend money wins."
            action={
              signedIn ? (
                <Button asChild size="sm">
                  <Link href="/catalog">
                    <PackagePlus aria-hidden="true" />
                    Add a product
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href="/signup">Create an account</Link>
                </Button>
              )
            }
          />
        )
      ) : (
        <>
          {data.page === 1 && (
            <section aria-label="Podium" className="animate-enter-up">
              <Podium rows={data.rows} formatValue={formatValue} currentUserId={viewerId} />
            </section>
          )}

          {viewerId ? (
            <StandingCard
              standing={standing}
              board={board}
              viewerId={viewerId}
              isPrivate={viewer ? !viewer.isPublic : false}
            />
          ) : (
            <GuestCard boardKey={board.key} />
          )}

          <BoardList
            rows={rows}
            board={summary}
            currentUserId={viewerId}
            page={data.page}
            pageCount={data.pageCount}
            pageSize={data.pageSize}
            total={data.total}
          />

          {isFollowing && data.total === 1 && (
            <p className="text-pretty text-center text-sm text-muted-foreground">
              A board of one is technically a win. Follow some collectors from the{" "}
              <Link
                href={boardHref(DEFAULT_BOARD.key)}
                className="font-medium text-accent hover:underline"
              >
                overall board
              </Link>{" "}
              to make it interesting.
            </p>
          )}

          <BoardPagination boardKey={board.key} page={data.page} pageCount={data.pageCount} />
        </>
      )}
    </div>
  );
}
