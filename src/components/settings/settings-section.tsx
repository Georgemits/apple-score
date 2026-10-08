import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SettingsSectionId } from "@/components/settings/sections";

type SettingsSectionProps = {
  id: SettingsSectionId;
  title: string;
  description: React.ReactNode;
  icon: LucideIcon;
  /** The danger zone gets a red outline and title. */
  tone?: "default" | "danger";
  /** Entrance stagger in milliseconds, capped so late cards never feel slow. */
  delay?: number;
  children: React.ReactNode;
};

/**
 * One settings card: an anchor target with a labelled heading, an icon tile
 * and a body. `scroll-mt` keeps the heading clear of the sticky navbar when a
 * section-nav link jumps to it.
 */
export function SettingsSection({
  id,
  title,
  description,
  icon: Icon,
  tone = "default",
  delay = 0,
  children,
}: SettingsSectionProps) {
  const danger = tone === "danger";
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="min-w-0 animate-enter-up scroll-mt-24"
      style={{ animationDelay: `${Math.min(Math.max(delay, 0), 240)}ms` }}
    >
      <Card className={cn(danger && "border-destructive/40")}>
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              danger ? "bg-destructive/12 text-destructive" : "bg-secondary text-muted-foreground"
            )}
            aria-hidden="true"
          >
            <Icon className="size-[18px]" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <CardTitle id={titleId} className={cn(danger && "text-destructive")}>
              {title}
            </CardTitle>
            <CardDescription className="text-pretty">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
