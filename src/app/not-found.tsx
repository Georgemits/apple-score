import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LEADERBOARD_NAME } from "@/lib/branding";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        That page does not exist. It may have been moved, or the link was mistyped.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/leaderboard">{LEADERBOARD_NAME}</Link>
        </Button>
      </div>
    </div>
  );
}
