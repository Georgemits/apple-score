"use client";

import { lineTotal } from "@/lib/score";
import { formatNumber, formatUSD } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CollectionItem } from "@/components/collection/types";

type RemoveItemDialogProps = {
  item: CollectionItem;
  /** The user's current Apple Score, so the drop can be put in context. */
  score: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

/** Confirms removing a product (every unit of it) and spells out what it costs the score. */
export function RemoveItemDialog({
  item,
  score,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: RemoveItemDialogProps) {
  const drop = lineTotal(item);
  const after = Math.max(0, score - drop);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {item.product.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {item.quantity > 1 && `All ${formatNumber(item.quantity)} units go. `}
            Your Apple Score drops by{" "}
            <span className="tabular font-semibold text-foreground">{formatUSD(drop)}</span>, from{" "}
            <span className="tabular">{formatUSD(score)}</span> to{" "}
            <span className="tabular font-semibold text-foreground">{formatUSD(after)}</span>.{" "}
            {after === 0
              ? "Back to zero. Impressive restraint, in reverse."
              : "The leaderboard will notice."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
