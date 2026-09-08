import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getInventory, getRecentActivity, getUserRank, summarize } from "@/lib/queries";
import { ProfileView } from "@/components/profile-view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Apple Score profile, achievements and recent additions.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const userId = session.user.id;

  const [user, items, recent, rank] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true, createdAt: true },
    }),
    getInventory(userId),
    getRecentActivity(userId),
    getUserRank(userId),
  ]);

  // The session outlived the account (deleted user) — send them back to login.
  if (!user) redirect("/login");

  return (
    <div className="container px-4 py-8 sm:px-6 sm:py-12">
      <ProfileView user={user} stats={summarize(items)} recent={recent} rank={rank} isOwner />
    </div>
  );
}
