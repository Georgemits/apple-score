"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Boxes,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Trophy,
  User as UserIcon,
  X,
  Home as HomeIcon,
  type LucideIcon,
} from "lucide-react";
import { OPEN_PALETTE_EVENT } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { logoutAction } from "@/actions/auth";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

export type NavUser = {
  username: string;
  email: string;
  displayName: string | null;
  avatarEmoji: string | null;
  avatarHue: number | null;
} | null;

type NavLink = { href: string; label: string; icon: LucideIcon };

const AUTHED_LINKS: NavLink[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/collection", label: "Collection", icon: Boxes },
  { href: "/catalog", label: "Add", icon: Plus },
  { href: "/leaderboard", label: LEADERBOARD_NAME, icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Award },
];

const GUEST_LINKS: NavLink[] = [
  { href: "/leaderboard", label: LEADERBOARD_NAME, icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Award },
];

function LogoutForm({ className }: { className?: string }) {
  return (
    <form action={logoutAction} className={className}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
    </form>
  );
}

export function SiteNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const links = user ? AUTHED_LINKS : GUEST_LINKS;

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass rounded-none border-x-0 border-t-0">
        <nav
          aria-label="Main"
          className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link
            href={user ? "/home" : "/"}
            className="-m-2 rounded-lg p-2 transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-secondary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            {user && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))}
                className="hidden h-9 items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
                aria-label="Quick add a product (Command K)"
              >
                <Search className="size-3.5" aria-hidden="true" />
                Quick add
                <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px] font-medium">
                  ⌘K
                </kbd>
              </button>
            )}
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Account menu"
                  >
                    <UserAvatar user={user} size={36} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="truncate">
                    {user.displayName ?? `@${user.username}`}
                    <span className="block truncate font-normal text-muted-foreground">
                      {user.displayName ? `@${user.username}` : user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon aria-hidden="true" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/achievements">
                      <Award aria-hidden="true" />
                      Achievements
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings aria-hidden="true" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <LogoutForm />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <div className="hidden items-center gap-2 md:flex">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup">Get started</Link>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-expanded={open}
                  aria-controls="mobile-nav"
                  aria-label={open ? "Close menu" : "Open menu"}
                  onClick={() => setOpen((value) => !value)}
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
              </>
            )}
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {open && !user && (
            <motion.div
              id="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <ul className="container space-y-1 px-4 py-4 sm:px-6">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(link.href) ? "bg-secondary" : "hover:bg-secondary"
                      )}
                    >
                      <link.icon className="size-4" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline">
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">Get started</Link>
                    </Button>
                  </div>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
