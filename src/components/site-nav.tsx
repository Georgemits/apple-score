"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut,
  Menu,
  Trophy,
  User as UserIcon,
  X,
  Home as HomeIcon,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { logoutAction } from "@/actions/auth";
import { cn, initials } from "@/lib/utils";

type NavUser = { username: string; email: string } | null;

type NavLink = { href: string; label: string; icon: LucideIcon };

const AUTHED_LINKS: NavLink[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/products/add", label: "Add product", icon: Plus },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

const GUEST_LINKS: NavLink[] = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
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
      <div className="glass border-x-0 border-t-0 rounded-none">
        <nav
          aria-label="Main"
          className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link
            href={user ? "/home" : "/"}
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
            <span className="sr-only">Apple Score home</span>
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
            <ThemeToggle />

            {user ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label="Account menu"
                    >
                      <Avatar className="size-9">
                        <AvatarFallback>{initials(user.username)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">
                      @{user.username}
                      <span className="block truncate font-normal">{user.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon aria-hidden="true" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <LogoutForm />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Get started</Link>
                </Button>
              </div>
            )}

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
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {open && (
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
                  {user ? (
                    <LogoutForm />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline">
                        <Link href="/login">Log in</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/signup">Get started</Link>
                      </Button>
                    </div>
                  )}
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
