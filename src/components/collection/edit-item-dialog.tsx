"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { lineTotal } from "@/lib/score";
import { formatNumber, formatSignedUSD, formatUSD } from "@/lib/utils";
import { MAX_PRICE_PAID, MAX_QUANTITY } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CollectionItem } from "@/components/collection/types";

export type EditItemValues = {
  quantity: number;
  /** Null means "use the launch MSRP". */
  pricePaidUSD: number | null;
};

type EditItemDialogProps = {
  item: CollectionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: EditItemValues) => void;
  isPending: boolean;
};

const WHOLE_NUMBER = /^\d+$/;

/** Quantity and price-paid editor for one owned line, with a live subtotal. */
export function EditItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
  isPending,
}: EditItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so the form re-seeds from the latest saved values each time. */}
        <EditItemForm
          item={item}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

type EditItemFormProps = {
  item: CollectionItem;
  onSave: (values: EditItemValues) => void;
  onCancel: () => void;
  isPending: boolean;
};

function EditItemForm({ item, onSave, onCancel, isPending }: EditItemFormProps) {
  const baseId = React.useId();
  const quantityId = `${baseId}-quantity`;
  const quantityHintId = `${baseId}-quantity-hint`;
  const priceId = `${baseId}-price`;
  const priceHintId = `${baseId}-price-hint`;

  const [quantity, setQuantity] = React.useState(String(item.quantity));
  const [price, setPrice] = React.useState(
    item.pricePaidUSD === null ? "" : String(item.pricePaidUSD)
  );

  const trimmedQuantity = quantity.trim();
  const parsedQuantity = Number.parseInt(trimmedQuantity, 10);
  const quantityInvalid =
    !WHOLE_NUMBER.test(trimmedQuantity) || parsedQuantity < 1 || parsedQuantity > MAX_QUANTITY;

  const trimmedPrice = price.trim();
  const paid = trimmedPrice === "" ? null : Number.parseInt(trimmedPrice, 10);
  const priceInvalid =
    paid !== null && (!WHOLE_NUMBER.test(trimmedPrice) || paid < 0 || paid > MAX_PRICE_PAID);

  const invalid = quantityInvalid || priceInvalid;
  const currentTotal = lineTotal(item);
  const nextTotal = invalid ? null : (paid ?? item.product.priceUSD) * parsedQuantity;
  const delta = nextTotal === null ? 0 : nextTotal - currentTotal;

  // Announce the new subtotal a beat after the last keystroke, not on each.
  const [announcement, setAnnouncement] = React.useState("");
  React.useEffect(() => {
    if (nextTotal === null) return;
    const message =
      delta === 0
        ? `No change from ${formatUSD(currentTotal)}.`
        : `New subtotal ${formatUSD(nextTotal)}, ${formatSignedUSD(delta)}.`;
    const timer = setTimeout(() => setAnnouncement(message), 600);
    return () => clearTimeout(timer);
  }, [nextTotal, delta, currentTotal]);
  const unchanged = !invalid && parsedQuantity === item.quantity && paid === item.pricePaidUSD;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (invalid || unchanged) return;
    onSave({ quantity: parsedQuantity, pricePaidUSD: paid });
  };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle className="pr-8">Edit {item.product.name}</DialogTitle>
        <DialogDescription>
          {formatUSD(item.product.priceUSD)} launch MSRP · {item.product.family} ·{" "}
          {item.product.year}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={quantityId}>Quantity</Label>
          <Input
            id={quantityId}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUANTITY}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            aria-invalid={quantityInvalid}
            aria-describedby={quantityHintId}
            autoComplete="off"
          />
          <p
            id={quantityHintId}
            className={
              quantityInvalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"
            }
          >
            {quantityInvalid
              ? `Enter a whole number between 1 and ${MAX_QUANTITY}.`
              : "To drop it entirely, use Remove instead."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={priceId}>Price paid per unit</Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              aria-hidden="true"
            >
              $
            </span>
            <Input
              id={priceId}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_PRICE_PAID}
              step={1}
              placeholder={String(item.product.priceUSD)}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              aria-invalid={priceInvalid}
              aria-describedby={priceHintId}
              autoComplete="off"
              className="pl-8"
            />
          </div>
          <p
            id={priceHintId}
            className={priceInvalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
          >
            {priceInvalid
              ? `Enter a whole number of dollars between 0 and ${formatNumber(MAX_PRICE_PAID)}.`
              : "Leave blank to count the launch price. Second-hand bargains count too."}
          </p>
        </div>

        <p className="sr-only" role="status" aria-atomic="true">
          {announcement}
        </p>
        <div className="rounded-xl bg-secondary/60 px-4 py-3 text-sm">
          <p>
            New subtotal:{" "}
            <span className="tabular font-semibold">
              {nextTotal === null ? "—" : formatUSD(nextTotal)}
            </span>
          </p>
          <p className="tabular text-muted-foreground">
            {nextTotal === null
              ? "Fix the highlighted field to see the new total."
              : delta === 0
                ? `No change from ${formatUSD(currentTotal)}.`
                : `${formatSignedUSD(delta)} from ${formatUSD(currentTotal)}.`}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={invalid || unchanged || isPending}>
          <Check aria-hidden="true" />
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}
