import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LEADERBOARD_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist.",
};

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="score-figure text-7xl font-bold tracking-tighter sm:text-8xl">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page has been discontinued.</h1>
      <p className="max-w-md text-pretty text-muted-foreground">
        Like the headphone jack, it is either gone for good or never existed. Check the link, or
        head somewhere that still ships.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
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
