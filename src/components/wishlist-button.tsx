"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlistAction } from "@/actions/social";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  productId: string;
  productName: string;
  initialWished: boolean;
  className?: string;
};

/** A heart that saves a product to the wishlist. Optimistic, with rollback. */
export function WishlistButton({
  productId,
  productName,
  initialWished,
  className,
}: WishlistButtonProps) {
  const router = useRouter();
  const [wished, setWished] = React.useState(initialWished);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => setWished(initialWished), [initialWished]);

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = !wished;
    setWished(next);
    startTransition(async () => {
      const result = await toggleWishlistAction({ productId });
      if (!result.ok) {
        setWished(!next);
        toast.error(result.error);
        return;
      }
      setWished(result.data.wished);
      toast.success(
        result.data.wished
          ? `${productName} added to your wishlist.`
          : `${productName} removed from your wishlist.`
      );
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={wished}
      aria-label={wished ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
        wished ? "text-rose-500" : "text-muted-foreground",
        className
      )}
    >
      <Heart
        className={cn("size-4 transition-transform", wished && "scale-110 fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
