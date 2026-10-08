import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMonthYear } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

export const metadata: Metadata = {
  title: "Settings",
  description: "Edit your Apple Score profile, avatar, privacy and password.",
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
  if (!user) redirect("/login");

  return (
    <div className="container max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Settings"
        description="Your profile, your privacy, your password. The score takes care of itself."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/u/${user.username}`}>
              <ExternalLink aria-hidden="true" />
              View public profile
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear on Band for Band and your public page.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Member since {formatMonthYear(user.createdAt)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} readOnly aria-readonly="true" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={`@${user.username}`} readOnly aria-readonly="true" aria-describedby="username-note" />
              <p id="username-note" className="text-xs text-muted-foreground">
                Usernames are permanent — they&apos;re your public URL.
              </p>
            </div>
          </div>
          <div className="space-y-3 border-t border-border/70 pt-6">
            <h3 className="font-semibold">Change password</h3>
            <ChangePasswordForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            Download everything Apple Score knows about you as JSON: profile, collection,
            achievements and activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/api/me/export" download>
              <Download aria-hidden="true" />
              Export my data
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting your account removes your collection, achievements and follows permanently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog username={user.username} />
        </CardContent>
      </Card>
    </div>
  );
}
