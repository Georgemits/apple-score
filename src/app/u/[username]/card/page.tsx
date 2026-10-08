import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { getStanding } from "@/lib/leaderboard";
import { getProfile } from "@/lib/queries";
import { SHARE_FORMAT_KEYS, SHARE_FORMATS } from "@/lib/share-card";
import { formatNumber, formatUSD, pluralize, profileName } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { TierBadge } from "@/components/tier-badge";
import { UserAvatar } from "@/components/user-avatar";
import { CardPreview } from "@/components/share/card-preview";
import { CopyLinkButton, ShareButton } from "@/components/share/share-button";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username, null);
  if (!profile) return { title: "Profile not found", robots: { index: false, follow: false } };

  return {
    title: "Share card",
    description: `Download or share ${profileName(profile.user)}'s Apple Score card in landscape, square and story formats.`,
    robots: { index: false, follow: true },
  };
}

/**
 * The three share-card formats for a public profile, with live previews,
 * downloads and native sharing. Private profiles have no cards, so they 404
 * here exactly like unknown ones.
 */
export default async function ShareCardPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfile(username, null);
  if (!profile) notFound();

  const { user, stats } = profile;
  const [standing, session] = await Promise.all([getStanding(user.id), auth()]);

  const isOwner = session?.user?.id === user.id;
  const name = profileName(user);
  const profilePath = `/u/${user.username}`;
  const rankLine = standing
    ? ` — #${formatNumber(standing.me.rank)} of ${formatNumber(standing.me.total)} on ${LEADERBOARD_NAME}`
    : "";
  const shareTitle = `${name} · Apple Score`;
  const shareText = `${name} has an Apple Score of ${formatUSD(stats.score)} across ${pluralize(stats.productCount, "Apple product")}${rankLine}.`;

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={profilePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {isOwner ? "Back to your profile" : `Back to ${name}`}
      </Link>

      <PageHeader
        eyebrow="Share"
        title="Share card"
        description={`${isOwner ? "Your" : `${name}'s`} Apple Score, rendered three ways. Cards are drawn live from the collection, so they are never out of date for long.`}
        actions={
          <>
            <ShareButton path={profilePath} title={shareTitle} text={shareText} />
            <CopyLinkButton path={profilePath} />
          </>
        }
      />

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar user={user} size={56} ring />
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight">{name}</p>
            <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:justify-end">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Score</dt>
            <dd className="tabular font-semibold">{formatUSD(stats.score)}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Rank</dt>
            <dd className="tabular font-semibold">
              {standing
                ? `#${formatNumber(standing.me.rank)} of ${formatNumber(standing.me.total)}`
                : "Unranked"}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Products</dt>
            <dd className="tabular font-semibold">{formatNumber(stats.productCount)}</dd>
          </div>
          <div>
            <dt className="sr-only">Tier</dt>
            <dd>
              <TierBadge tier={stats.tier} size="sm" />
            </dd>
          </div>
        </dl>
      </Card>

      <section aria-label="Card formats" className="space-y-4 sm:space-y-5">
        {SHARE_FORMAT_KEYS.map((format, index) => {
          const spec = SHARE_FORMATS[format];
          const src = `/api/card/${encodeURIComponent(user.username)}?format=${format}`;
          return (
            <CardPreview
              key={format}
              username={user.username}
              label={spec.label}
              hint={spec.hint}
              width={spec.width}
              height={spec.height}
              src={src}
              downloadHref={`${src}&download=1`}
              filename={`apple-score-${user.username}-${format}.png`}
              profilePath={profilePath}
              shareTitle={shareTitle}
              shareText={shareText}
              delay={index * 80}
            />
          );
        })}
      </section>

      <p className="text-pretty text-center text-sm text-muted-foreground">
        Cards are rendered on demand and cached for five minutes. Post one, then go buy something to
        make it out of date.
      </p>
    </div>
  );
}
