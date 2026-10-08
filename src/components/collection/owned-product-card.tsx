"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { removeProductAction, setQuantityAction, updateOwnedItemAction } from "@/actions/products";
import { useScoreAction } from "@/hooks/use-score-action";
import { lineTotal, unitPrice } from "@/lib/score";
import { cn, formatUSD } from "@/lib/utils";
import { MAX_QUANTITY } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LegacyBadge } from "@/components/legacy-badge";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";
import { EditItemDialog, type EditItemValues } from "@/components/collection/edit-item-dialog";
import { RemoveItemDialog } from "@/components/collection/remove-item-dialog";
import { UnitPriceLine } from "@/components/collection/unit-price-line";
import type { CollectionItem, ViewMode } from "@/components/collection/types";

type OwnedProductCardProps = {
  item: CollectionItem;
  view: ViewMode;
  /** The user's current Apple Score, for the remove confirmation. */
  score: number;
  /** Position in the list, for the entrance stagger. */
  index: number;
};

/**
 * One owned product, as a grid card or a compact list row. Quantity changes
 * are applied optimistically and rolled back if the server says no; every
 * mutation goes through `useScoreAction`, which toasts, celebrates and
 * refreshes the server-rendered totals.
 */
export function OwnedProductCard({ item, view, score, index }: OwnedProductCardProps) {
  const { run, isPending } = useScoreAction();
  const [quantity, setQuantity] = React.useState(item.quantity);
  const [editOpen, setEditOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  // Follow the server once a refresh lands (React's "adjust state on prop change" pattern).
  const [syncedQuantity, setSyncedQuantity] = React.useState(item.quantity);
  if (item.quantity !== syncedQuantity) {
    setSyncedQuantity(item.quantity);
    setQuantity(item.quantity);
  }

  const name = item.product.name;
  const live = { ...item, quantity };
  const subtotal = lineTotal(live);
  const unit = unitPrice(item);

  const changeQuantity = (next: number) => {
    if (next < 1) {
      // The stepper's floor is 0 so the last unit can be "stepped off" — into a confirmation.
      setRemoveOpen(true);
      return;
    }
    if (next > MAX_QUANTITY || next === quantity) return;

    const previous = quantity;
    setQuantity(next);
    run(
      () =>
        setQuantityAction({ productId: item.productId, quantity: next }).then(
          (result) => {
            if (!result.ok) setQuantity(previous);
            return result;
          },
          (error: unknown) => {
            setQuantity(previous);
            throw error;
          }
        ),
      next > previous ? `One more ${name}.` : `One less ${name}.`
    );
  };

  const save = ({ quantity: nextQuantity, pricePaidUSD }: EditItemValues) => {
    setEditOpen(false);
    const previous = quantity;
    setQuantity(nextQuantity);
    run(
      () =>
        updateOwnedItemAction({
          productId: item.productId,
          quantity: nextQuantity,
          pricePaidUSD,
        }).then(
          (result) => {
            if (!result.ok) setQuantity(previous);
            return result;
          },
          (error: unknown) => {
            setQuantity(previous);
            throw error;
          }
        ),
      `Updated ${name}.`
    );
  };

  const remove = () => {
    setRemoveOpen(false);
    setRemoving(true);
    run(
      () =>
        removeProductAction({ productId: item.productId }).then(
          (result) => {
            if (!result.ok) setRemoving(false);
            return result;
          },
          (error: unknown) => {
            setRemoving(false);
            throw error;
          }
        ),
      `Removed ${name}.`
    );
  };

  const delay = `${Math.min(index * 40, 240)}ms`;
  const href = `/p/${item.product.slug}`;
  const stepperLabel = `quantity of ${name}`;

  const dialogs = (
    <>
      <EditItemDialog
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={save}
        isPending={isPending}
      />
      <RemoveItemDialog
        item={live}
        score={score}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        onConfirm={remove}
        isPending={isPending}
      />
    </>
  );

  if (view === "list") {
    return (
      <li className="animate-enter-up" style={{ animationDelay: delay }}>
        <Card
          className={cn(
            "p-3 transition-opacity sm:flex sm:items-center sm:gap-4 sm:px-4",
            removing && "pointer-events-none opacity-50"
          )}
          aria-busy={isPending}
        >
          <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
            <ProductImage
              src={item.product.image}
              alt=""
              category={item.product.category}
              className="size-12 shrink-0 p-2 sm:size-14 sm:p-2.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={href} className="truncate font-medium hover:underline">
                  {name}
                </Link>
                {item.product.legacy && <LegacyBadge className="shrink-0" />}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {item.product.family} · {item.product.year}
              </p>
              <UnitPriceLine item={item} className="mt-0.5" />
            </div>
            <p className="tabular shrink-0 text-right text-sm font-semibold sm:hidden">
              {formatUSD(subtotal)}
            </p>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 sm:mt-0 sm:justify-end sm:gap-3 sm:border-0 sm:pt-0">
            <QuantityStepper
              value={quantity}
              onChange={changeQuantity}
              min={0}
              max={MAX_QUANTITY}
              disabled={isPending}
              label={stepperLabel}
            />
            <p className="tabular hidden w-24 text-right font-semibold sm:block">
              {formatUSD(subtotal)}
            </p>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setEditOpen(true)}
                disabled={isPending}
                aria-label={`Edit ${name}`}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => setRemoveOpen(true)}
                disabled={isPending}
                aria-label={`Remove ${name}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
        {dialogs}
      </li>
    );
  }

  return (
    <li className="animate-enter-up" style={{ animationDelay: delay }}>
      <Card
        className={cn(
          "card-hover flex h-full gap-3 p-3 transition-opacity sm:flex-col sm:p-4",
          removing && "pointer-events-none opacity-50"
        )}
        aria-busy={isPending}
      >
        <ProductImage
          src={item.product.image}
          alt=""
          category={item.product.category}
          className="size-24 shrink-0 self-start p-3 sm:aspect-square sm:size-auto sm:w-full sm:p-6"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link href={href} className="line-clamp-2 font-semibold leading-snug hover:underline">
              {name}
            </Link>
            {item.product.legacy && <LegacyBadge className="shrink-0" />}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.product.family} · {item.product.year}
          </p>
          <UnitPriceLine item={item} className="mt-1" />

          <div className="mt-3 flex items-center justify-between gap-2 sm:mt-auto sm:pt-4">
            <QuantityStepper
              value={quantity}
              onChange={changeQuantity}
              min={0}
              max={MAX_QUANTITY}
              disabled={isPending}
              label={stepperLabel}
            />
            <div className="min-w-0 text-right">
              <p className="tabular truncate font-semibold">{formatUSD(subtotal)}</p>
              {quantity > 1 && (
                <p className="tabular truncate text-xs text-muted-foreground">
                  {quantity} × {formatUSD(unit)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-1 border-t border-border/60 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 flex-1 sm:h-9"
              onClick={() => setEditOpen(true)}
              disabled={isPending}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 flex-1 text-muted-foreground hover:text-destructive sm:h-9"
              onClick={() => setRemoveOpen(true)}
              disabled={isPending}
            >
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      </Card>
      {dialogs}
    </li>
  );
}
