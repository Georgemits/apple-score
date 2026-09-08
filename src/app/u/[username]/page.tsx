import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublicProfile, getRecentActivity, getUserRank } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";
import { ProfileView } from "@/components/profile-view";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) return { title: "Profile not found" };

  const description = `${profile.user.username} has an Apple Score of ${formatNumber(
    profile.stats.score
  )} across ${formatNumber(profile.stats.productCount)} Apple products.`;

  return {
    title: `@${profile.user.username}`,
    description,
    openGraph: { title: `@${profile.user.username} · Apple Score`, description },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) notFound();

  const [session, recent, rank] = await Promise.all([
    auth(),
    getRecentActivity(profile.user.id),
    getUserRank(profile.user.id),
  ]);

  return (
    <div className="container px-4 py-8 sm:px-6 sm:py-12">
      <ProfileView
        user={{ username: profile.user.username, createdAt: profile.user.createdAt }}
        stats={profile.stats}
        recent={recent}
        rank={rank}
        isOwner={session?.user?.id === profile.user.id}
      />
    </div>
  );
}
