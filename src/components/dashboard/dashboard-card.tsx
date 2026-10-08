import type * as React from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  /** Used as the heading id so the section is labelled for assistive tech. */
  id: string;
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  /** Where "View all" goes. */
  href?: string;
  linkLabel?: string;
  /** Replaces the default link in the header. */
  action?: React.ReactNode;
  /** Entrance stagger, in milliseconds. Capped so late cards never feel slow. */
  delay?: number;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

/**
 * One tile of the dashboard: a glass card with a labelled heading, an optional
 * "View all" link and a body that stretches to fill the grid cell.
 */
export function DashboardCard({
  id,
  title,
  description,
  icon: Icon,
  href,
  linkLabel = "View all",
  action,
  delay = 0,
  className,
  bodyClassName,
  children,
}: DashboardCardProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn("min-w-0 animate-enter-up", className)}
      style={{ animationDelay: `${Math.min(Math.max(delay, 0), 240)}ms` }}
    >
      <Card className="flex h-full flex-col p-5 sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={id} className="flex items-center gap-2 text-base font-semibold tracking-tight">
              {Icon && (
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="truncate">{title}</span>
            </h2>
            {description && (
              <p className="mt-0.5 text-pretty text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action ??
            (href ? (
              <Link
                href={href}
                className="-mr-2 -mt-1 inline-flex h-9 shrink-0 items-center gap-0.5 rounded-full px-3 text-sm font-medium text-accent transition-colors hover:bg-secondary"
              >
                {linkLabel}
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null)}
        </header>
        <div className={cn("mt-4 flex-1", bodyClassName)}>{children}</div>
      </Card>
    </section>
  );
}
