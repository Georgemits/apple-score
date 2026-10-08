import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  /** An emoji instead of an icon, for the playful ones. */
  emoji?: string;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Render without the card chrome (inside another card). */
  bare?: boolean;
};

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  className,
  bare = false,
}: EmptyStateProps) {
  const body = (
    <>
      <span
        className={cn(
          "flex size-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground",
          emoji && "text-3xl"
        )}
        aria-hidden="true"
      >
        {emoji ?? (Icon ? <Icon className="size-6" /> : null)}
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="max-w-sm text-pretty text-sm text-muted-foreground">{description}</div>
      {action && <div className="pt-2">{action}</div>}
    </>
  );

  if (bare) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 px-6 py-10 text-center",
          className
        )}
      >
        {body}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      {body}
    </Card>
  );
}
