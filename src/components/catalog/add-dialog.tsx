"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { addProductAction } from "@/actions/products";
import { simulatePurchaseAction, type Simulation } from "@/actions/simulate";
import { useScoreAction } from "@/hooks/use-score-action";
import { CATEGORY_LABEL } from "@/lib/categories";
import { LEADERBOARD_NAME } from "@/lib/branding";
import { MAX_PRICE_PAID, MAX_QUANTITY } from "@/lib/validations";
import { cn, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { ProductImage } from "@/components/product-image";
import { LegacyBadge } from "@/components/legacy-badge";
import { QuantityStepper } from "@/components/quantity-stepper";
import { RankDelta } from "@/components/rank-delta";
import type { CatalogueItem } from "@/components/catalog/types";

type AddDialogProps = {
  /** The product being added, or null when the dialog is closed. */
  item: CatalogueItem | null;
  currentScore: number;
  onClose: () => void;
};

/**
 * "Add to my collection": quantity, optional price paid, a live score preview
 * and a what-if rank from the simulator. The body is keyed by product so the
 * form resets whenever a different tile is opened.
 */
export function AddDialog({ item, currentScore, onClose }: AddDialogProps) {
  // Keep the last product rendered while the close animation plays out.
  const [shown, setShown] = React.useState(item);
  if (item && item !== shown) setShown(item);

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        {shown && (
          <AddDialogBody
            key={shown.id}
            item={shown}
            currentScore={currentScore}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------
 * Body
 * ---------------------------------------------------------------------- */

type SimulationStatus = "loading" | "ready" | "error";

/** Quantity changes re-run the simulator after this pause. */
const REFETCH_DELAY_MS = 350;
/** The screen-reader summary waits this long after the last change. */
const ANNOUNCE_DELAY_MS = 600;

/** The rank sentence, in words, for the live region. */
function describeRank(simulation: Simulation): string {
  const { projectedRank, currentRank, positionsGained } = simulation;
  if (projectedRank === null) return "Private profiles don't rank.";
  const spot = `#${formatNumber(projectedRank.rank)} of ${formatNumber(projectedRank.total)}`;
  if (currentRank === null) return `You'd enter ${LEADERBOARD_NAME} at ${spot}.`;
  if (positionsGained !== null && positionsGained > 0) {
    return `You'd move to ${spot}, up ${formatNumber(positionsGained)}.`;
  }
  return `You'd stay at ${spot}.`;
}
const SIMULATE_TOAST_ID = "catalog-simulate";

type AddDialogBodyProps = {
  item: CatalogueItem;
  currentScore: number;
  onClose: () => void;
};

function AddDialogBody({ item, currentScore, onClose }: AddDialogBodyProps) {
  const { run, isPending } = useScoreAction();
  const priceId = React.useId();
  const hintId = `${priceId}-hint`;

  const [quantity, setQuantity] = React.useState(1);
  const [price, setPrice] = React.useState("");

  const [simulation, setSimulation] = React.useState<Simulation | null>(null);
  const [status, setStatus] = React.useState<SimulationStatus>("loading");
  const [attempt, setAttempt] = React.useState(0);
  const requestRef = React.useRef(0);
  const fetchedOnceRef = React.useRef(false);

  /* ----------------------------------------------------------- price paid */
  const trimmed = price.trim();
  const paid = trimmed === "" ? null : Number(trimmed);
  const priceInvalid =
    paid !== null && (!Number.isInteger(paid) || paid < 0 || paid > MAX_PRICE_PAID);
  const unit = paid !== null && !priceInvalid ? paid : item.priceUSD;
  const added = unit * quantity;
  const customPrice = paid !== null && !priceInvalid && paid !== item.priceUSD;

  /* ------------------------------------------------------------ simulator */
  React.useEffect(() => {
    const id = ++requestRef.current;
    const delay = fetchedOnceRef.current ? REFETCH_DELAY_MS : 0;
    setStatus("loading");

    const timer = setTimeout(async () => {
      fetchedOnceRef.current = true;
      try {
        const result = await simulatePurchaseAction({
          items: [{ productId: item.id, quantity }],
        });
        if (id !== requestRef.current) return;
        if (result.ok) {
          setSimulation(result.data);
          setStatus("ready");
        } else {
          setStatus("error");
          toast.error(result.error, { id: SIMULATE_TOAST_ID });
        }
      } catch (error) {
        console.error(error);
        if (id !== requestRef.current) return;
        setStatus("error");
        toast.error("Could not preview your rank. Please try again.", { id: SIMULATE_TOAST_ID });
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      // Anything still in flight belongs to a stale quantity.
      requestRef.current += 1;
    };
  }, [item.id, quantity, attempt]);

  /* --------------------------------------------------------- announcement */
  // One polite region, updated a beat after the last change, so typing a
  // price or stepping the quantity does not read the whole preview aloud
  // on every keystroke.
  const [announcement, setAnnouncement] = React.useState("");
  React.useEffect(() => {
    if (status !== "ready" || !simulation) return;
    const message = `Adds ${formatUSD(added)}. New score ${formatUSD(currentScore + added)}. ${describeRank(simulation)}`;
    const timer = setTimeout(() => setAnnouncement(message), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, simulation, added, currentScore]);

  /* -------------------------------------------------------------- confirm */
  const confirm = () => {
    if (priceInvalid || isPending) return;
    run(
      () =>
        addProductAction({
          productId: item.id,
          quantity,
          ...(paid === null ? {} : { pricePaidUSD: paid }),
        }),
      quantity === 1 ? `Added ${item.name}.` : `Added ${formatNumber(quantity)} × ${item.name}.`,
      onClose
    );
  };

  return (
    <form
      className="grid grid-cols-[minmax(0,1fr)] gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        confirm();
      }}
    >
      <DialogHeader className="pr-8">
        <DialogTitle>Add {item.name}</DialogTitle>
        <DialogDescription>
          {formatUSD(item.priceUSD)} launch MSRP · {item.year} · {CATEGORY_LABEL[item.category]}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3">
        <ProductImage
          src={item.image}
          alt=""
          category={item.category}
          className="size-16 shrink-0 p-3"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.family}
            {item.holders > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                {pluralize(item.holders, "collector")} {item.holders === 1 ? "owns" : "own"} this
              </>
            )}
          </p>
          {(item.legacy || item.owned > 0) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.legacy && <LegacyBadge />}
              {item.owned > 0 && (
                <Badge variant="accent">
                  You own <span className="tabular">×{formatNumber(item.owned)}</span>
                </Badge>
              )}
            </div>
          )}
        </div>
        <Link
          href={`/p/${item.slug}`}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Details
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {item.owned > 0 && (
        <p className="-mt-2 text-sm text-accent">
          You already own {formatNumber(item.owned)} — adding more.
        </p>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium" id={`${priceId}-quantity`}>
            Quantity
          </span>
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={MAX_QUANTITY}
            disabled={isPending}
            label="Quantity to add"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={priceId}>
            What did you pay per unit?{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
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
              placeholder={String(item.priceUSD)}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              disabled={isPending}
              aria-invalid={priceInvalid || undefined}
              aria-describedby={hintId}
              className="tabular pl-8"
            />
          </div>
          <p
            id={hintId}
            className={cn("text-xs", priceInvalid ? "text-destructive" : "text-muted-foreground")}
          >
            {priceInvalid
              ? `Enter a whole number between $0 and ${formatUSD(MAX_PRICE_PAID)}.`
              : "Blank means the launch price. Second-hand bargains count too."}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-secondary/60 px-4 py-3">
        <p className="text-sm">
          Adds <span className="tabular font-semibold">{formatUSD(added)}</span> to your score
          <span aria-hidden="true"> → </span>
          <span className="sr-only">, </span>
          new score <span className="tabular font-semibold">{formatUSD(currentScore + added)}</span>
        </p>
        <p className="sr-only" role="status" aria-atomic="true">
          {announcement}
        </p>
        <div className="mt-2 border-t border-border/60 pt-2">
          <RankPreview
            status={status}
            simulation={simulation}
            customPrice={customPrice}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={priceInvalid || isPending} aria-busy={isPending}>
          {isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}
          {quantity === 1 ? "Add to collection" : `Add ${formatNumber(quantity)} units`}
        </Button>
      </DialogFooter>
    </form>
  );
}

/* -------------------------------------------------------------------------
 * Rank preview
 * ---------------------------------------------------------------------- */

type RankPreviewProps = {
  status: SimulationStatus;
  simulation: Simulation | null;
  /** The simulator always prices at MSRP; say so when the user typed a price. */
  customPrice: boolean;
  onRetry: () => void;
};

function RankPreview({ status, simulation, customPrice, onRetry }: RankPreviewProps) {
  if (!simulation) {
    if (status === "error") {
      return (
        <p className="text-sm text-muted-foreground">
          Could not preview your rank.{" "}
          <button
            type="button"
            onClick={onRetry}
            className="rounded font-medium text-foreground underline underline-offset-4"
          >
            Try again
          </button>
        </p>
      );
    }
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        Checking {LEADERBOARD_NAME}…
      </p>
    );
  }

  const { projectedRank, currentRank, positionsGained } = simulation;
  if (projectedRank === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Private profiles don&apos;t rank. Make yours public in Settings to join {LEADERBOARD_NAME}.
      </p>
    );
  }
  const spot = (
    <span className="tabular font-semibold text-foreground">
      #{formatNumber(projectedRank.rank)} of {formatNumber(projectedRank.total)}
    </span>
  );

  return (
    <div
      className={cn(
        "text-sm text-muted-foreground transition-opacity",
        status === "loading" && "opacity-60"
      )}
    >
      <p className="flex flex-wrap items-center gap-x-1.5">
        {currentRank === null ? (
          <>You&apos;d enter the board at {spot}</>
        ) : positionsGained !== null && positionsGained > 0 ? (
          <>
            You&apos;d move to {spot}
            <RankDelta movement={positionsGained} />
          </>
        ) : (
          <>You&apos;d stay at {spot} — same spot, bigger number.</>
        )}
        {status === "loading" && (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        )}
      </p>
      {customPrice && <p className="mt-1 text-xs">Rank preview uses the launch price.</p>}
    </div>
  );
}
