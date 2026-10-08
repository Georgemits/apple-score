"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A spinner that appears inside a `<Link>` while its navigation is pending.
 * Profile and product pages deliberately have no `loading.tsx` (a streamed
 * shell would turn their 404s into 200s), so this is the feedback instead.
 * The CSS delay keeps fast navigations from flashing it.
 */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <LoaderCircle
      role="status"
      aria-label="Loading"
      className={cn("link-pending size-3.5 shrink-0 animate-spin text-muted-foreground", className)}
    />
  );
}
