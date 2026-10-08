"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Home as HomeIcon,
  Plus,
  Trophy,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon; primary?: boolean };

const TABS: Tab[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/collection", label: "Collection", icon: Boxes },
  { href: "/catalog", label: "Add", icon: Plus, primary: true },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

/**
 * Bottom tab bar for signed-in users on phones. Primary navigation lives
 * here on small screens so the top bar can stay minimal; the Add tab is
 * raised and filled because adding products is the whole game.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="glass mx-auto flex items-end justify-around rounded-none border-x-0 border-b-0 px-2 pb-1.5 pt-1.5">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          if (tab.primary) {
            return (
              <li key={tab.href} className="-mt-5">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95",
                    active && "ring-4 ring-accent/40"
                  )}
                >
                  <tab.icon className="size-6" aria-hidden="true" />
                </Link>
              </li>
            );
          }
          return (
            <li key={tab.href} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <tab.icon
                  className={cn("size-5", active && "text-accent")}
                  strokeWidth={active ? 2.4 : 2}
                  aria-hidden="true"
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
