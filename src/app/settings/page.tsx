import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, KeyRound, ShieldAlert, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { SectionNav } from "@/components/settings/section-nav";
import { SettingsSection } from "@/components/settings/settings-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { AccountDetails } from "@/components/settings/account-details";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ExportData } from "@/components/settings/export-data";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Edit your Apple Score profile, avatar and privacy, change your password, export your data.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      displayName: true,
      bio: true,
      avatarEmoji: true,
      avatarHue: true,
      isPublic: true,
      createdAt: true,
    },
  });

  // The session outlived the account.
  if (!user) redirect("/login?callbackUrl=/settings");

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow="Your account"
        title="Settings"
        description="Your profile, your privacy, your password. The score takes care of itself."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/u/${user.username}`}>
              <UserRound aria-hidden="true" />
              {user.isPublic ? "View public profile" : "View your profile"}
            </Link>
          </Button>
        }
      />

      <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <SectionNav />

        <div className="mt-6 max-w-3xl space-y-6 lg:mt-0">
          <SettingsSection
            id="profile"
            icon={UserRound}
            title="Profile"
            description={`How you appear on ${LEADERBOARD_NAME} and on your public page.`}
            delay={0}
          >
            <ProfileForm
              user={{
                username: user.username,
                displayName: user.displayName,
                bio: user.bio,
                avatarEmoji: user.avatarEmoji,
                avatarHue: user.avatarHue,
                isPublic: user.isPublic,
              }}
            />
          </SettingsSection>

          <SettingsSection
            id="account"
            icon={KeyRound}
            title="Account"
            description="Sign-in details and your password. The email stays private; the username stays put."
            delay={60}
          >
            <div className="space-y-6">
              <AccountDetails
                email={user.email}
                username={user.username}
                createdAt={user.createdAt}
              />
              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold tracking-tight">Change password</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You&apos;ll stay signed in here after changing it.
                  </p>
                </div>
                <ChangePasswordForm />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="data"
            icon={Database}
            title="Your data"
            description="Download everything Apple Score knows about you as JSON: profile, collection, achievements and activity."
            delay={120}
          >
            <ExportData />
          </SettingsSection>

          <SettingsSection
            id="danger"
            icon={ShieldAlert}
            tone="danger"
            title="Danger zone"
            description="Deleting your account permanently removes your collection, your achievements and your follows. There is no undo, and no, we will not remember your Apple Score for you."
            delay={180}
          >
            <DeleteAccountDialog username={user.username} />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
