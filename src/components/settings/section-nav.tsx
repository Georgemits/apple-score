"use client";

import * as React from "react";
import { Database, ShieldAlert, UserRound, KeyRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "@/components/settings/sections";

const ICONS: Record<SettingsSectionId, LucideIcon> = {
  profile: UserRound,
  account: KeyRound,
  data: Database,
  danger: ShieldAlert,
};

/**
 * Jump links for the settings sections: a horizontal chip row on phones and a
 * sticky column on wide screens. A small scroll-spy marks the section in view
 * with `aria-current`, so the nav reads as a position, not just a list.
 */
export function SectionNav() {
  const [active, setActive] = React.useState<SettingsSectionId>(SETTINGS_SECTIONS[0].id);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const targets = SETTINGS_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => element !== null
    );
    if (targets.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        // The first section (in page order) with any part in the viewport wins.
        const next = SETTINGS_SECTIONS.find((section) => (visible.get(section.id) ?? 0) > 0);
        if (next) setActive(next.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.1, 0.5, 1] }
    );

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-24">
      <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = ICONS[section.id];
          const isActive = section.id === active;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={() => setActive(section.id)}
                className={cn(
                  "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors lg:h-9 lg:w-full lg:rounded-lg lg:border-transparent lg:px-3",
                  isActive
                    ? "border-foreground bg-foreground text-background lg:border-transparent lg:bg-secondary lg:text-foreground"
                    : "border-border bg-background/60 text-muted-foreground hover:text-foreground lg:bg-transparent lg:hover:bg-secondary/60"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
