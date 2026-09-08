import Link from "next/link";
import { AppleMark } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p className="flex items-center gap-2">
          <AppleMark className="size-4" />
          Apple Score — an unofficial, for-fun project. Not affiliated with Apple Inc.
        </p>
        <nav aria-label="Footer">
          <Link href="/leaderboard" className="transition-colors hover:text-foreground">
            Leaderboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}
