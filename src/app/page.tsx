import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AchievementTeaser } from "@/components/landing/achievement-teaser";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/components/landing/brand";
import { CommunityStats } from "@/components/landing/community-stats";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PodiumPreview } from "@/components/landing/podium-preview";
import { CommunityStatsSkeleton, PodiumSkeleton } from "@/components/landing/skeletons";
import { TierLadder } from "@/components/landing/tier-ladder";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — ${SITE_TAGLINE}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

/**
 * The signed-out front door. The hero and the static sections render
 * immediately; the two sections that hit the database stream in behind
 * skeletons so a slow query never delays the first paint.
 */
export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <div className="container px-4 sm:px-6">
      <Hero />

      <Suspense fallback={<CommunityStatsSkeleton />}>
        <CommunityStats />
      </Suspense>

      <HowItWorks />

      <Suspense fallback={<PodiumSkeleton />}>
        <PodiumPreview />
      </Suspense>

      <FeatureGrid />
      <AchievementTeaser />
      <TierLadder />
      <FinalCta />
    </div>
  );
}
