import Link from "next/link";
import { Activity, Minus, Plus, Tag, type LucideIcon } from "lucide-react";
import type { ActivityType } from "@prisma/client";
import type { ActivityItem } from "@/lib/queries";
import { cn, formatNumber, formatRelative, formatSignedUSD } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ProfileSection } from "@/components/profile/profile-section";

type ProfileActivityProps = {
  items: ActivityItem[];
  isOwner: boolean;
  name: string;
  delay?: number;
  className?: string;
};

const TYPE_STYLE: Record<
  ActivityType,
  { icon: LucideIcon; tile: string; label: (quantity: number) => string }
> = {
  ADD: {
    icon: Plus,
    tile: "bg-success/12 text-success",
    label: (quantity) => `Added ${formatNumber(Math.abs(quantity))}`,
  },
  REMOVE: {
    icon: Minus,
    tile: "bg-destructive/12 text-destructive",
    label: (quantity) => `Removed ${formatNumber(Math.abs(quantity))}`,
  },
  REPRICE: {
    icon: Tag,
    tile: "bg-accent/12 text-accent",
    label: () => "Price updated",
  },
};

/** The latest inventory changes, newest first, with the dollars each one moved. */
export function ProfileActivity({ items, isOwner, name, delay, className }: ProfileActivityProps) {
  return (
    <ProfileSection
      id="profile-activity"
      title="Recent activity"
      icon={Activity}
      href={isOwner ? "/collection" : undefined}
      linkLabel="Collection"
      delay={delay}
      className={className}
      bodyClassName={items.length === 0 ? "flex items-center" : undefined}
    >
      {items.length === 0 ? (
        <EmptyState
          bare
          emoji="🫥"
          title="Quiet in here"
          description={
            isOwner
              ? "Every add, remove and reprice shows up here. Right now it is very quiet."
              : `${name} hasn't changed anything lately. Suspiciously disciplined.`
          }
          className="w-full py-6"
        />
      ) : (
        <ol className="-mx-2 space-y-1" aria-label="Recent changes to the collection">
          {items.map((item) => {
            const style = TYPE_STYLE[item.type];
            const Icon = style.icon;
            const tone =
              item.scoreDelta > 0
                ? "text-success"
                : item.scoreDelta < 0
                  ? "text-destructive"
                  : "text-muted-foreground";
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    style.tile
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.product ? (
                      <Link href={`/p/${item.product.slug}`} className="hover:underline">
                        {item.productName}
                      </Link>
                    ) : (
                      item.productName
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {style.label(item.quantityDelta)}
                    <span aria-hidden="true"> · </span>
                    <time dateTime={item.createdAt.toISOString()}>
                      {formatRelative(item.createdAt)}
                    </time>
                  </p>
                </div>
                <span className={cn("tabular shrink-0 text-sm font-semibold", tone)}>
                  {formatSignedUSD(item.scoreDelta)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </ProfileSection>
  );
}
