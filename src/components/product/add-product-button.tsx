"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { addProductAction } from "@/actions/products";
import { useScoreAction } from "@/hooks/use-score-action";
import { MAX_PRICE_PAID, MAX_QUANTITY } from "@/lib/validations";
import { formatNumber, formatUSD } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
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
import { QuantityStepper } from "@/components/quantity-stepper";

type AddProductButtonProps = {
  product: { id: string; name: string; priceUSD: number };
  ownedQuantity: number;
  currentScore: number;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
};

/** "Add to my collection" with a quantity and optional price-paid dialog. */
export function AddProductButton({
  product,
  ownedQuantity,
  currentScore,
  size = "lg",
  variant = "default",
  className,
}: AddProductButtonProps) {
  const { run, isPending } = useScoreAction();
  const [open, setOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [price, setPrice] = React.useState("");

  const paid = price.trim() === "" ? null : Number.parseInt(price, 10);
  const invalid = paid !== null && (Number.isNaN(paid) || paid < 0 || paid > MAX_PRICE_PAID);
  const unit = paid ?? product.priceUSD;
  const added = Number.isNaN(unit) ? 0 : unit * quantity;

  const confirm = () => {
    if (invalid) return;
    setOpen(false);
    run(
      () =>
        addProductAction({
          productId: product.id,
          quantity,
          ...(paid === null ? {} : { pricePaidUSD: paid }),
        }),
      `Added ${quantity} × ${product.name}.`
    );
    setQuantity(1);
    setPrice("");
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
        aria-busy={isPending || undefined}
      >
        <Plus aria-hidden="true" />
        {ownedQuantity > 0 ? "Add another" : "Add to my collection"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {product.name}</DialogTitle>
            <DialogDescription>
              {formatUSD(product.priceUSD)} launch MSRP
              {ownedQuantity > 0 && ` · you already own ${formatNumber(ownedQuantity)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium leading-none" aria-hidden="true">
                Quantity
              </span>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={MAX_QUANTITY}
                label="Quantity to add"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`paid-${product.id}`}>What did you pay per unit? (optional)</Label>
              <Input
                id={`paid-${product.id}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_PRICE_PAID}
                placeholder={String(product.priceUSD)}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-invalid={invalid}
                aria-describedby={`paid-hint-${product.id}`}
              />
              <p id={`paid-hint-${product.id}`} className="text-xs text-muted-foreground">
                {invalid
                  ? `Enter a whole number between 0 and ${formatNumber(MAX_PRICE_PAID)}.`
                  : "Leave blank to use the launch price. Second-hand bargains count too."}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/60 px-4 py-3 text-sm">
              <p>
                Adds <span className="font-semibold">{formatUSD(added)}</span> to your score
              </p>
              <p className="text-muted-foreground">
                New Apple Score: {formatUSD(currentScore + added)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={invalid || isPending}>
              <Plus aria-hidden="true" />
              Add {quantity > 1 ? `${quantity} units` : "product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
