import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Profile, PublicUser } from "@/lib/queries";
import { formatMonthYear, formatNumber, profileName } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";

export type PeopleKind = "followers" | "following";

type PeopleListProps = {
  profile: Profile;
  people: PublicUser[];
  kind: PeopleKind;
  viewerId: string | null;
};

const COPY: Record<
  PeopleKind,
  { title: string; emptyTitle: (name: string) => string; emptyBody: string }
> = {
  followers: {
    title: "Followers",
    emptyTitle: (name) => `Nobody follows ${name} yet.`,
    emptyBody: "Collections this good rarely stay unnoticed.",
  },
  following: {
    title: "Following",
    emptyTitle: (name) => `${name} isn't following anyone yet.`,
    emptyBody: "Following a collector adds them to the Following board.",
  },
};

/** Who follows a collector, or who they follow. Private accounts never appear. */
export function PeopleList({ profile, people, kind, viewerId }: PeopleListProps) {
  const { user } = profile;
  const name = profileName(user);
  const isOwner = viewerId === user.id;
  const copy = COPY[kind];

  return (
    <div className="container max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={`/u/${user.username}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {name}
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {copy.title}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tighter sm:text-4xl">
          {formatNumber(people.length)}{" "}
          {kind === "followers" ? (people.length === 1 ? "follower" : "followers") : "following"}
        </h1>
      </div>

      {people.length === 0 ? (
        <EmptyState
          emoji={kind === "followers" ? "📣" : "🔭"}
          title={copy.emptyTitle(isOwner ? "you" : name)}
          description={copy.emptyBody}
          action={
            kind === "following" && isOwner ? (
              <Link href="/leaderboard" className="font-medium text-accent hover:underline">
                Find collectors on the board
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border/60">
            {people.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/u/${person.username}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none sm:px-5"
                >
                  <UserAvatar user={person} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{profileName(person)}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      @{person.username}
                      {person.bio ? ` · ${person.bio}` : ""}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                    Since {formatMonthYear(person.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
