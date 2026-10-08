import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PackagePlus, Search } from "lucide-react";
import { auth } from "@/auth";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { getStanding } from "@/lib/leaderboard";
import {
  getAchievementRarity,
  getActivity,
  getFollowCounts,
  getProfile,
  getScoreHistory,
  getUnlockedAchievements,
  isFollowing,
} from "@/lib/queries";
import { formatNumber, formatUSD, pluralize, profileName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProfileHero, type ProfileViewer } from "@/components/profile/profile-hero";
import { ProfileStats } from "@/components/profile/profile-stats";
import { CategoryCard, HistoryCard } from "@/components/profile/profile-charts";
import { CollectionShowcase } from "@/components/profile/collection-showcase";
import { AchievementsShowcase } from "@/components/profile/achievements-showcase";
import { ProfileActivity } from "@/components/profile/profile-activity";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string }> };

/** Shared between `generateMetadata` and the page so the board is queried once. */
const loadStanding = cache((userId: string) => getStanding(userId));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const session = await auth();
  const profile = await getProfile(username, session?.user?.id ?? null);
  if (!profile) return { title: "Profile not found", robots: { index: false, follow: false } };

  const { user, stats } = profile;
  const standing = await loadStanding(user.id);
  const name = profileName(user);
  const rankLine = standing
    ? ` — #${formatNumber(standing.me.rank)} of ${formatNumber(standing.me.total)} on ${LEADERBOARD_NAME}`
    : "";
  const description = `${name} has an Apple Score of ${formatUSD(stats.score)} across ${pluralize(stats.productCount, "Apple product")}${rankLine}.`;
  const title = `${name} · Apple Score`;

  return {
    title: name,
    description,
    alternates: { canonical: `/u/${user.username}` },
    // The image comes from ./opengraph-image.tsx; Next attaches it to both.
    openGraph: { title, description, type: "profile", url: `/u/${user.username}` },
    twitter: { card: "summary_large_image", title, description },
    robots: user.isPublic ? undefined : { index: false, follow: false },
  };
}

/**
 * A collector's public page. Private profiles are only shown to their owner;
 * everyone else gets a 404 that is indistinguishable from an unknown handle.
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();
  const viewer: ProfileViewer = session?.user
    ? { id: session.user.id, username: session.user.username }
    : null;

  const profile = await getProfile(username, viewer?.id ?? null);
  if (!profile) notFound();

  const { user, items, stats } = profile;
  const isOwner = viewer?.id === user.id;
  const name = profileName(user);

  const [standing, history, activity, unlocked, follows, following, rarity] = await Promise.all([
    loadStanding(user.id),
    getScoreHistory(user.id),
    getActivity(user.id, 8),
    getUnlockedAchievements(user.id),
    getFollowCounts(user.id),
    viewer && !isOwner ? isFollowing(viewer.id, user.id) : Promise.resolve(false),
    getAchievementRarity(),
  ]);

  const points = history.map((point) => ({ at: point.at.getTime(), score: point.score }));

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <ProfileHero
        user={user}
        stats={stats}
        standing={standing}
        follows={follows}
        viewer={viewer}
        following={following}
      />

      {items.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="animate-enter-up lg:col-span-3">
            {isOwner ? (
              <EmptyState
                emoji="🪟"
                title="Your Apple Score is currently $0."
                description="That's… impressive restraint. Add your first product and the stats, charts and achievements light up."
                action={
                  <Button asChild size="lg">
                    <Link href="/catalog">
                      <PackagePlus aria-hidden="true" />
                      Add a product
                    </Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                emoji="🧼"
                title={`@${user.username} hasn't added anything yet.`}
                description="Someone send them a Polishing Cloth."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/p/polishing-cloth">
                      <Search aria-hidden="true" />
                      See the Polishing Cloth
                    </Link>
                  </Button>
                }
              />
            )}
          </div>

          {unlocked.length > 0 && (
            <AchievementsShowcase
              unlocked={unlocked}
              rarity={rarity.byId}
              isOwner={isOwner}
              name={name}
              delay={60}
              className="lg:col-span-2"
            />
          )}
          {activity.length > 0 && (
            <ProfileActivity
              items={activity}
              isOwner={isOwner}
              name={name}
              delay={120}
              className={unlocked.length > 0 ? undefined : "lg:col-span-3"}
            />
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <ProfileStats stats={stats} className="lg:col-span-3" />

          <CategoryCard breakdown={stats.breakdown} delay={60} className="lg:col-span-2" />
          <HistoryCard points={points} name={name} isOwner={isOwner} delay={120} />

          <CollectionShowcase
            items={items}
            isOwner={isOwner}
            delay={180}
            className="lg:col-span-3"
          />

          <AchievementsShowcase
            unlocked={unlocked}
            rarity={rarity.byId}
            isOwner={isOwner}
            name={name}
            delay={240}
            className="lg:col-span-2"
          />
          <ProfileActivity items={activity} isOwner={isOwner} name={name} delay={240} />
        </div>
      )}
    </div>
  );
}
