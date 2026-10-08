import type { Metadata } from "next";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { PageHeader } from "@/components/page-header";

// Placeholder while the leaderboard page is being rebuilt.
export const metadata: Metadata = { title: LEADERBOARD_NAME };
export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <div className="container px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader title={LEADERBOARD_NAME} description="The Apple Score leaderboard." />
    </div>
  );
}
