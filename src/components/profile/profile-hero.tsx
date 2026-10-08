import Link from "next/link";
import {
  CalendarDays,
  EyeOff,
  Image as ImageIcon,
  LogIn,
  Pencil,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { LEADERBOARD_NAME } from "@/lib/branding";
import type { Standing } from "@/lib/leaderboard";
import type { FollowCounts, PublicUser, UserStats } from "@/lib/queries";
import { nextMilestone } from "@/lib/score";
import { formatMonthYear, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { AnimatedMoney } from "@/components/animated-number";
import { FollowButton } from "@/components/follow-button";
import { MilestoneProgress } from "@/components/milestone-progress";
import { RankDelta } from "@/components/rank-delta";
import { TopBadge } from "@/components/score-badges";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { ShareButton } from "@/components/share/share-button";

export type ProfileViewer = { id: string; username: string } | null;

type ProfileHeroProps = {
  user: PublicUser;
  stats: UserStats;
  standing: Standing | null;
  follows: FollowCounts;
  viewer: ProfileViewer;
  /** Whether the viewer already follows this profile. */
  following: boolean;
};

export function profileName(user: Pick<PublicUser, "displayName" | "username">): string {
  return user.displayName ?? `@${user.username}`;
}

/** "Richer in Apple than 72% of collectors." — phrased for the owner or a visitor. */
function StandingLine({
  standing,
  name,
  isOwner,
}: {
  standing: Standing;
  name: string;
  isOwner: boolean;
}) {
  const { percentile, me } = standing;
  const strong = (value: string) => <span className="font-semibold text-foreground">{value}</span>;

  if (me.total <= 1) {
    return (
      <>
        {isOwner ? "You're" : `${name} is`} the only collector on the board.{" "}
        {isOwner ? "Enjoy the view." : "For now."}
      </>
    );
  }
  if (percentile === 0) {
    return <>Everyone else on the board has spent more. {strong("Impressive restraint.")}</>;
  }
  if (percentile >= 50) {
    return (
      <>
        {isOwner ? "You're" : `${name} is`} richer in Apple than {strong(`${percentile}%`)} of
        collectors.
      </>
    );
  }
  return (
    <>
      {strong(`${100 - percentile}%`)} of collectors have spent more.{" "}
      {isOwner ? "Plenty of room to climb." : "Room to climb."}
    </>
  );
}

/**
 * The top of a profile: who they are, how long they have been collecting, who
 * follows them, and the Apple Score as the hero figure with its rank.
 */
export function ProfileHero({
  user,
  stats,
  standing,
  follows,
  viewer,
  following,
}: ProfileHeroProps) {
  const isOwner = viewer?.id === user.id;
  const name = profileName(user);
  const profilePath = `/u/${user.username}`;
  const rankLine = standing
    ? ` — #${formatNumber(standing.me.rank)} of ${formatNumber(standing.me.total)} on ${LEADERBOARD_NAME}`
    : "";
  const shareText = `${name} has an Apple Score of ${formatUSD(stats.score)} across ${pluralize(stats.productCount, "Apple product")}${rankLine}.`;
  const milestone = nextMilestone(stats.score);

  return (
    <Card className="relative overflow-hidden p-6 sm:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 size-80 animate-float-slow rounded-full bg-gradient-to-br from-accent/25 via-fuchsia-500/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-transparent blur-3xl"
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        {/* Identity */}
        <div className="min-w-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <UserAvatar user={user} size={96} ring className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-balance text-3xl font-semibold tracking-tighter sm:text-4xl">
                {name}
              </h1>
              {user.displayName && (
                <p className="mt-1 text-base text-muted-foreground">@{user.username}</p>
              )}
              {user.bio && (
                <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed">{user.bio}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TierBadge tier={stats.tier} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Member since {formatMonthYear(user.createdAt)}
                </span>
                {!user.isPublic && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/45 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300"
                    title="Only you can see this page."
                  >
                    <EyeOff className="size-3.5" aria-hidden="true" />
                    Private
                  </span>
                )}
              </div>

              <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                  <dt className="sr-only">Followers</dt>
                  <dd>
                    <span className="tabular font-semibold">{formatNumber(follows.followers)}</span>{" "}
                    <span className="text-muted-foreground">
                      {follows.followers === 1 ? "follower" : "followers"}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Following</dt>
                  <dd>
                    <span className="tabular font-semibold">{formatNumber(follows.following)}</span>{" "}
                    <span className="text-muted-foreground">following</span>
                  </dd>
                </div>
              </dl>

              {!user.isPublic && isOwner && (
                <p className="mt-3 text-pretty text-sm text-muted-foreground">
                  Only you can see this page. Private profiles stay off {LEADERBOARD_NAME} and have
                  no share cards.{" "}
                  <Link href="/settings" className="font-medium text-accent hover:underline">
                    Make it public
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {isOwner ? (
              <Button asChild>
                <Link href="/settings">
                  <Pencil aria-hidden="true" />
                  Edit profile
                </Link>
              </Button>
            ) : viewer ? (
              <>
                <FollowButton
                  username={user.username}
                  initialFollowing={following}
                  size="default"
                />
                <Button asChild variant="outline">
                  <Link href={`/u/${viewer.username}/vs/${user.username}`}>
                    <Swords aria-hidden="true" />
                    Compare with me
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href={`/login?callbackUrl=${encodeURIComponent(profilePath)}`}>
                  <LogIn aria-hidden="true" />
                  Sign in to follow
                </Link>
              </Button>
            )}
            <ShareButton
              path={profilePath}
              title={`${name} · Apple Score`}
              text={shareText}
              variant={isOwner ? "outline" : "ghost"}
            />
            {user.isPublic && (
              <Button asChild variant="ghost">
                <Link href={`${profilePath}/card`}>
                  <ImageIcon aria-hidden="true" />
                  Score card
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="min-w-0 rounded-2xl border border-border/70 bg-background/50 p-5 backdrop-blur sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Apple Score
          </p>
          <p className="score-figure mt-2 text-5xl font-bold sm:text-6xl">
            <AnimatedMoney value={stats.score} fromZero />
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {standing ? (
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-sm font-medium backdrop-blur transition-colors hover:bg-secondary"
                title={`${LEADERBOARD_NAME} rank`}
              >
                <Trophy className="size-3.5 text-gold" aria-hidden="true" />#
                {formatNumber(standing.me.rank)} of {formatNumber(standing.me.total)}
                <RankDelta movement={standing.me.movement} isNew={standing.me.isNew} />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
                <Trophy className="size-3.5" aria-hidden="true" />
                {user.isPublic ? "Not on the board yet" : "Off the board"}
              </span>
            )}
            {standing?.me.isTop && <TopBadge />}
          </div>

          {standing ? (
            <p className="mt-3 text-pretty text-sm text-muted-foreground">
              <StandingLine standing={standing} name={name} isOwner={isOwner} />
            </p>
          ) : stats.productCount > 0 ? (
            <p className="mt-3 text-pretty text-sm text-muted-foreground">
              {user.isPublic
                ? `${pluralize(stats.productCount, "product")} tracked. The board updates in a moment.`
                : "Private profiles don't rank. The score still counts."}
            </p>
          ) : (
            <p className="mt-3 text-pretty text-sm text-muted-foreground">
              {isOwner
                ? "One product puts you on the board."
                : `${name} is still deciding what to buy first.`}
            </p>
          )}

          {isOwner && (
            <MilestoneProgress score={stats.score} milestone={milestone} className="mt-5" />
          )}
        </div>
      </div>
    </Card>
  );
}
