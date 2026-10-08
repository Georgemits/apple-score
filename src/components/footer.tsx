import Link from "next/link";
import { AppleMark } from "@/components/logo";
import { LEADERBOARD_NAME } from "@/lib/branding";

/**
 * The landing page redirects signed-in users to their dashboard, so the
 * scoring explainer they can reach lives on the collection page instead.
 */
function links(signedIn: boolean) {
  return [
    { href: "/leaderboard", label: LEADERBOARD_NAME },
    { href: "/achievements", label: "Achievements" },
    { href: "/stats", label: "The Census" },
    {
      href: signedIn ? "/collection#how-it-works" : "/#how-it-works",
      label: "How scoring works",
    },
  ];
}

export function Footer({ signedIn = false }: { signedIn?: boolean }) {
  const LINKS = links(signedIn);
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p className="flex items-center gap-2 text-center sm:text-left">
          <AppleMark className="size-4 shrink-0" />
          <span>Apple Score is an unofficial, for-fun project. Not affiliated with Apple Inc.</span>
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
