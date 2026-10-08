import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

/** Shown when the user owns nothing at all. */
export function CollectionEmpty() {
  return (
    <EmptyState
      emoji="🪟"
      title="Your Apple Score is currently $0."
      description={
        <>
          That&apos;s… impressive restraint. Add the device you&apos;re reading this on and the
          number starts climbing.
        </>
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/catalog">
              <Plus aria-hidden="true" />
              Browse the catalogue
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/welcome">
              <Sparkles aria-hidden="true" />
              Quick start
            </Link>
          </Button>
        </div>
      }
      className="py-20"
    />
  );
}
