"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { InventoryItem } from "@/lib/queries";
import { removeProductAction, setQuantityAction } from "@/actions/products";
import { useScoreAction } from "@/hooks/use-score-action";
import { CATEGORY_LABEL } from "@/lib/categories";
import { MAX_QUANTITY } from "@/lib/validations";
import { formatNumber, formatUSD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";

export function ProductCard({ item, index = 0 }: { item: InventoryItem; index?: number }) {
  const { product, quantity } = item;
  const { run, isPending } = useScoreAction();

  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [draftQuantity, setDraftQuantity] = React.useState(quantity);

  React.useEffect(() => {
    if (editOpen) setDraftQuantity(quantity);
  }, [editOpen, quantity]);

  const lineTotal = product.priceUSD * quantity;

  // The stepper only ever removes single units; dropping to zero always goes
  // through the confirmation dialog below.
  const changeQuantity = (next: number) => {
    if (next === quantity || next < 1) return;
    run(
      () => setQuantityAction({ productId: product.id, quantity: next }),
      next > quantity ? `Added another ${product.name}.` : `Removed one ${product.name}.`
    );
  };

  const removeAll = () => {
    setConfirmOpen(false);
    run(() => removeProductAction({ productId: product.id }), `${product.name} removed.`);
  };

  const saveEdit = () => {
    setEditOpen(false);

    if (draftQuantity === quantity) return;

    if (draftQuantity < 1) {
      setConfirmOpen(true);
      return;
    }

    run(
      () => setQuantityAction({ productId: product.id, quantity: draftQuantity }),
      `${product.name} set to ${draftQuantity}.`
    );
  };

  return (
    <li
      className="animate-enter-up"
      style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
    >
      <Card className="flex h-full flex-col gap-4 p-5" aria-busy={isPending}>
        <div className="flex items-start gap-4">
          <ProductImage
            src={product.image}
            alt=""
            category={product.category}
            className="size-20 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-snug" title={product.name}>
              {product.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{CATEGORY_LABEL[product.category]}</Badge>
              <span className="tabular text-sm text-muted-foreground">
                {formatUSD(product.priceUSD)} MSRP
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <QuantityStepper
            value={quantity}
            onChange={changeQuantity}
            min={1}
            max={MAX_QUANTITY}
            disabled={isPending}
            label={`${product.name} quantity`}
          />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="tabular font-semibold">{formatNumber(lineTotal)} pts</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setEditOpen(true)}
            disabled={isPending}
          >
            <Pencil aria-hidden="true" />
            Edit quantity
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            aria-label={`Remove ${product.name}`}
          >
            <Trash2 aria-hidden="true" />
            Remove
          </Button>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit quantity</DialogTitle>
            <DialogDescription>
              How many {product.name} do you own? Set it to 0 to remove it entirely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`quantity-${product.id}`}>Quantity</Label>
            <Input
              id={`quantity-${product.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_QUANTITY}
              value={draftQuantity}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setDraftQuantity(
                  Number.isNaN(next) ? 0 : Math.min(Math.max(next, 0), MAX_QUANTITY)
                );
              }}
            />
            <p className="tabular text-sm text-muted-foreground">
              New subtotal: {formatNumber(product.priceUSD * Math.max(draftQuantity, 0))} pts
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all {quantity} {quantity === 1 ? "unit" : "units"} and lowers your Apple
              Score by {formatNumber(lineTotal)} points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
