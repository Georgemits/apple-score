import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your public Apple Score profile.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** `/profile` is a stable link to the signed-in user's own public page. */
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");
  redirect(`/u/${session.user.username}`);
}
