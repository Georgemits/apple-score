import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/queries";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { formatNumber, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { RankMedal } from "@/components/rank-medal";
import { BottomBadge, TopBadge } from "@/components/score-badges";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: LEADERBOARD_NAME,
  description: "Every Apple Score, ranked from highest to lowest.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [session, leaderboard] = await Promise.all([auth(), getLeaderboard()]);
  const podium = leaderboard.rows.filter((row) => row.rank <= 3).slice(0, 3);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl">{LEADERBOARD_NAME}</h1>
        <p className="text-muted-foreground">
          {leaderboard.totalUsers === 0
            ? "Nobody has signed up yet."
            : `${formatNumber(leaderboard.totalUsers)} ${leaderboard.totalUsers === 1 ? "Apple fan" : "Apple fans"}, ranked by total collection value.`}
        </p>
      </header>

      {leaderboard.totalUsers === 0 ? (
        <EmptyState
          icon={Users}
          title="The board is empty"
          description="Be the first to register and claim the top spot."
          action={
            <Button asChild>
              <Link href="/signup">Create an account</Link>
            </Button>
          }
        />
      ) : (
        <>
          {podium.length >= 3 && (
            <section aria-labelledby="podium">
              <h2 id="podium" className="sr-only">
                Top three
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {podium.map((row) => (
                  <li key={row.id}>
                    <Card className="flex h-full flex-col items-center gap-3 p-6 text-center">
                      <RankMedal rank={row.rank} className="size-12 text-xl" />
                      <Avatar className="size-14">
                        <AvatarFallback>{initials(row.username)}</AvatarFallback>
                      </Avatar>
                      <Link href={`/u/${row.username}`} className="font-medium hover:underline">
                        @{row.username}
                      </Link>
                      <p className="tabular text-2xl font-semibold tracking-tight">
                        {formatNumber(row.score)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(row.productCount)} products
                      </p>
                      {leaderboard.topUserIds.includes(row.id) && <TopBadge />}
                      {leaderboard.bottomUserIds.includes(row.id) && <BottomBadge />}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <LeaderboardTable
            rows={leaderboard.rows}
            topUserIds={leaderboard.topUserIds}
            bottomUserIds={leaderboard.bottomUserIds}
            currentUserId={session?.user?.id}
          />

          {!session?.user && (
            <Card className="flex flex-col items-center gap-3 p-8 text-center">
              <Trophy className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-muted-foreground">
                Create an account to get your own Apple Score on this board.
              </p>
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
