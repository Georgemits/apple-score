import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftRight, Layers } from "lucide-react";
import { auth } from "@/auth";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { getStanding } from "@/lib/leaderboard";
import { getProfile, getUnlockedAchievements } from "@/lib/queries";
import { formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { avatarGradient } from "@/components/user-avatar";
import { ShareButton } from "@/components/share/share-button";
import { ProfileSection } from "@/components/profile/profile-section";
import { CompareCategories } from "@/components/profile/compare-categories";
import {
  CompareColumn,
  type CompareSide,
  type CompareStatKey,
} from "@/components/profile/compare-column";
import { compareVerdict } from "@/components/profile/compare-copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string; other: string }> };

function loadPair(a: string, b: string, viewerId: string | null) {
  return Promise.all([getProfile(a, viewerId), getProfile(b, viewerId)]);
}

function displayName(user: { displayName: string | null; username: string }): string {
  return user.displayName ?? `@${user.username}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, other } = await params;
  const session = await auth();
  const [left, right] = await loadPair(username, other, session?.user?.id ?? null);
  if (!left || !right)
    return { title: "Profile not found", robots: { index: false, follow: false } };

  const title = `@${left.user.username} vs @${right.user.username}`;
  const gap = Math.abs(left.stats.score - right.stats.score);
  const [leader, trailer] =
    left.stats.score >= right.stats.score ? [left.user, right.user] : [right.user, left.user];
  const description = `Apple Score head-to-head: ${displayName(left.user)} (${formatUSD(left.stats.score)}) vs ${displayName(right.user)} (${formatUSD(right.stats.score)}). ${compareVerdict(leader.username, trailer.username, gap, left.user.id === right.user.id)}`;
  const isPublic = left.user.isPublic && right.user.isPublic;

  return {
    title,
    description,
    openGraph: { title: `${title} · Apple Score`, description },
    twitter: { card: "summary", title: `${title} · Apple Score`, description },
    robots: isPublic ? undefined : { index: false, follow: false },
  };
}

/**
 * Two collectors, side by side. Dollars decide; the per-category bars show
 * where the money went differently.
 */
export default async function ComparePage({ params }: PageProps) {
  const { username, other } = await params;
  const session = await auth();
  const viewer = session?.user ? { id: session.user.id, username: session.user.username } : null;

  const [left, right] = await loadPair(username, other, viewer?.id ?? null);
  if (!left || !right) notFound();

  const [leftStanding, rightStanding, leftUnlocked, rightUnlocked] = await Promise.all([
    getStanding(left.user.id),
    getStanding(right.user.id),
    getUnlockedAchievements(left.user.id),
    getUnlockedAchievements(right.user.id),
  ]);

  const a: CompareSide = {
    user: left.user,
    stats: left.stats,
    standing: leftStanding,
    achievements: leftUnlocked.length,
  };
  const b: CompareSide = {
    user: right.user,
    stats: right.stats,
    standing: rightStanding,
    achievements: rightUnlocked.length,
  };

  const sameUser = a.user.id === b.user.id;
  const gap = Math.abs(a.stats.score - b.stats.score);
  const [leader, trailer] = a.stats.score >= b.stats.score ? [a, b] : [b, a];
  const verdict = compareVerdict(leader.user.username, trailer.user.username, gap, sameUser);

  // Who is ahead on each stat; ties lead nowhere.
  const ahead = (x: number, y: number) => !sameUser && x > y;
  const rankOf = (side: CompareSide) => side.standing?.me.rank ?? Number.POSITIVE_INFINITY;
  const leadsFor = (mine: CompareSide, theirs: CompareSide): Record<CompareStatKey, boolean> => ({
    score: ahead(mine.stats.score, theirs.stats.score),
    rank: !sameUser && rankOf(mine) < rankOf(theirs),
    products: ahead(mine.stats.productCount, theirs.stats.productCount),
    categories: ahead(mine.stats.breakdown.length, theirs.stats.breakdown.length),
    achievements: ahead(mine.achievements, theirs.achievements),
  });

  const currentPath = `/u/${a.user.username}/vs/${b.user.username}`;
  const swapPath = `/u/${b.user.username}/vs/${a.user.username}`;
  const title = `@${a.user.username} vs @${b.user.username}`;
  const viewerInvolved = viewer !== null && (viewer.id === a.user.id || viewer.id === b.user.id);
  const nothingOwned = a.stats.productCount === 0 && b.stats.productCount === 0;

  const leftGradient = avatarGradient(a.user);
  const rightGradient = avatarGradient(b.user);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow="Head to head"
        title={
          <>
            @{a.user.username} <span className="font-normal text-muted-foreground">vs</span> @
            {b.user.username}
          </>
        }
        description={`Two collections, one ${LEADERBOARD_NAME}. Dollars decide.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={swapPath}>
                <ArrowLeftRight aria-hidden="true" />
                Swap sides
              </Link>
            </Button>
            <ShareButton
              path={currentPath}
              title={`${title} · Apple Score`}
              text={verdict}
              variant="default"
            />
          </>
        }
      />

      <Card className="relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full opacity-30 blur-3xl"
          style={{
            backgroundImage: `radial-gradient(circle, ${leftGradient.from}, transparent 68%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full opacity-30 blur-3xl"
          style={{
            backgroundImage: `radial-gradient(circle, ${rightGradient.to}, transparent 68%)`,
          }}
        />

        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-start">
          <CompareColumn side={a} leads={leadsFor(a, b)} isViewer={viewer?.id === a.user.id} />

          <div className="flex flex-col items-center justify-center gap-3 text-center md:px-4 md:pt-8">
            <span
              className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-black tracking-tight text-primary-foreground shadow-lg"
              aria-hidden="true"
            >
              VS
            </span>
            <span className="sr-only">versus</span>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              The gap
            </p>
            <p className="tabular text-3xl font-bold tracking-tighter">{formatUSD(gap)}</p>
            <p className="max-w-xs text-pretty text-sm text-muted-foreground">{verdict}</p>
          </div>

          <CompareColumn side={b} leads={leadsFor(b, a)} isViewer={viewer?.id === b.user.id} />
        </div>
      </Card>

      <ProfileSection
        id="compare-categories"
        title="Category by category"
        description="Each row is its own duel: bars are relative to the bigger spender in that category."
        icon={Layers}
        delay={120}
        bodyClassName={nothingOwned ? "flex items-center" : undefined}
      >
        {nothingOwned ? (
          <EmptyState
            bare
            emoji="🤝"
            title="Nothing to compare yet"
            description="Neither collection has a product in it. The rivalry starts with the first purchase."
            className="w-full py-6"
          />
        ) : (
          <CompareCategories
            left={{
              username: a.user.username,
              breakdown: a.stats.breakdown,
              gradient: leftGradient,
            }}
            right={{
              username: b.user.username,
              breakdown: b.stats.breakdown,
              gradient: rightGradient,
            }}
          />
        )}
      </ProfileSection>

      {viewer && !viewerInvolved && (
        <p className="text-pretty text-center text-sm text-muted-foreground">
          Think you can take them?{" "}
          <Link
            href={`/u/${viewer.username}/vs/${a.user.username}`}
            className="font-medium text-accent hover:underline"
          >
            You vs @{a.user.username}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link
            href={`/u/${viewer.username}/vs/${b.user.username}`}
            className="font-medium text-accent hover:underline"
          >
            You vs @{b.user.username}
          </Link>
        </p>
      )}
    </div>
  );
}
