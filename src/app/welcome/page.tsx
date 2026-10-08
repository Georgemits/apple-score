import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCatalogue } from "@/lib/queries";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { OnboardingProduct } from "@/components/onboarding/catalogue";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Pick the Apple products you own and reveal your Apple Score.",
};

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/welcome");

  const [user, catalogue] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardedAt: true },
    }),
    getCatalogue(),
  ]);

  // The session outlived the account.
  if (!user) redirect("/login?callbackUrl=/welcome");
  // Already welcomed (or skipped): this flow is one-time. The reveal step
  // marks onboarding done and its revalidation re-renders this page, so a
  // short grace window keeps the reveal on screen instead of bouncing home.
  const GRACE_MS = 15 * 60 * 1000;
  if (user.onboardedAt && Date.now() - user.onboardedAt.getTime() > GRACE_MS) {
    redirect("/home");
  }

  const products: OnboardingProduct[] = catalogue
    .filter((product) => !product.legacy)
    .map(({ id, name, family, category, priceUSD, year, legacy }) => ({
      id,
      name,
      family,
      category,
      priceUSD,
      year,
      legacy,
    }));

  return (
    <div className="container px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <OnboardingWizard products={products} username={session.user.username} />
      </div>
    </div>
  );
}
