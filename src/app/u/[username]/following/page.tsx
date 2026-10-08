import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getFollowing, getProfile } from "@/lib/queries";
import { profileName } from "@/lib/utils";
import { PeopleList } from "@/components/profile/people-list";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string }> };

/** How many people the page lists; follow lists are small by design. */
const LIMIT = 200;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const session = await auth();
  const profile = await getProfile(username, session?.user?.id ?? null);
  if (!profile) return { title: "Profile not found", robots: { index: false, follow: false } };
  return {
    title: `Followed by ${profileName(profile.user)}`,
    robots: { index: false, follow: true },
  };
}

/** Private profiles 404 for everyone but their owner, exactly like the profile. */
export default async function FollowingPage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const profile = await getProfile(username, viewerId);
  if (!profile) notFound();

  const people = await getFollowing(profile.user.id, LIMIT);
  return <PeopleList profile={profile} people={people} kind="following" viewerId={viewerId} />;
}
