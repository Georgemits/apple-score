"use client";

import * as React from "react";
import type { Category, Product } from "@prisma/client";
import { Check, Plus, Search, SearchX, X } from "lucide-react";
import { addProductAction } from "@/actions/products";
import { useScoreAction } from "@/hooks/use-score-action";
import { CATEGORIES, CATEGORY_KEYWORDS, CATEGORY_LABEL } from "@/lib/categories";
import { MAX_QUANTITY } from "@/lib/validations";
import { lineTotal } from "@/lib/score";
import { formatNumber, formatUSD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { EmptyState } from "@/components/empty-state";
import { LegacyBadge } from "@/components/legacy-badge";

type ProductCatalogProps = {
  products: Product[];
  /** productId → quantity already owned. */
  owned: Record<string, number>;
};

function matches(product: Product, query: string): boolean {
  if (!query) return true;

  const haystack = [
    product.name.toLowerCase(),
    product.slug,
    CATEGORY_LABEL[product.category].toLowerCase(),
    ...CATEGORY_KEYWORDS[product.category],
    ...(product.legacy ? ["legacy", "vintage", "discontinued", "old"] : []),
  ].join(" ");

  // Every whitespace-separated term must appear somewhere.
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function ProductCatalog({ products, owned }: ProductCatalogProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Category | "ALL">("ALL");
  const [legacyOnly, setLegacyOnly] = React.useState(false);
  const [selected, setSelected] = React.useState<Product | null>(null);
  const [quantity, setQuantity] = React.useState(1);

  const deferredQuery = React.useDeferredValue(query);
  const { run, isPending } = useScoreAction();

  const filtered = React.useMemo(
    () =>
      products.filter(
        (product) =>
          (category === "ALL" || product.category === category) &&
          (!legacyOnly || product.legacy) &&
          matches(product, deferredQuery)
      ),
    [products, category, legacyOnly, deferredQuery]
  );

  const openProduct = (product: Product) => {
    setSelected(product);
    setQuantity(1);
  };

  const confirmAdd = () => {
    if (!selected) return;
    const product = selected;
    setSelected(null);
    run(
      () => addProductAction({ productId: product.id, quantity }),
      `Added ${quantity} × ${product.name}.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search iPhone, Mac, Watch, AirPods, Vision, iPad…"
            aria-label="Search Apple products"
            className="h-12 pl-11 pr-11"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <FilterChip
            active={category === "ALL"}
            onClick={() => setCategory("ALL")}
            label="All"
            count={products.length}
          />
          {CATEGORIES.map((value) => {
            const count = products.filter((product) => product.category === value).length;
            if (count === 0) return null;
            return (
              <FilterChip
                key={value}
                active={category === value}
                onClick={() => setCategory(value)}
                label={CATEGORY_LABEL[value]}
                count={count}
              />
            );
          })}

          <span className="mx-1 h-6 w-px self-center bg-border" aria-hidden="true" />

          <FilterChip
            active={legacyOnly}
            onClick={() => setLegacyOnly((value) => !value)}
            label="🕰 Legacy only"
            count={products.filter((product) => product.legacy).length}
          />
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {query ? ` matching “${query}”` : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No products found"
          description="Try a different search term, or clear the category filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("ALL");
                setLegacyOnly(false);
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, index) => {
              const ownedCount = owned[product.id] ?? 0;
              return (
                <li
                  key={product.id}
                  className="animate-enter-up"
                  style={{ animationDelay: `${Math.min(index * 12, 200)}ms` }}
                >
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <button
                      type="button"
                      onClick={() => openProduct(product)}
                      className="flex h-full w-full items-center gap-4 rounded-xl p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={`Add ${product.name} — ${formatUSD(product.priceUSD)}`}
                    >
                      <ProductImage
                        src={product.image}
                        alt=""
                        category={product.category}
                        className="size-16 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium leading-snug">
                          {product.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{CATEGORY_LABEL[product.category]}</Badge>
                          {product.legacy && <LegacyBadge />}
                          <span className="tabular text-sm text-muted-foreground">
                            {formatUSD(product.priceUSD)}
                          </span>
                          {ownedCount > 0 && (
                            <Badge variant="accent">
                              <Check className="size-3" aria-hidden="true" />
                              {ownedCount} owned
                            </Badge>
                          )}
                        </span>
                      </span>
                      <Plus className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </Card>
                </li>
              );
            })}
        </ul>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Add {selected.name}</DialogTitle>
                <DialogDescription>
                  {CATEGORY_LABEL[selected.category]} · {formatUSD(selected.priceUSD)} MSRP
                  {selected.legacy && " · legacy, +10% bonus"}
                  {(owned[selected.id] ?? 0) > 0 &&
                    ` · you already own ${owned[selected.id]}`}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-4">
                <ProductImage
                  src={selected.image}
                  alt=""
                  category={selected.category}
                  className="size-24 shrink-0"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Quantity</p>
                    <QuantityStepper
                      value={quantity}
                      onChange={setQuantity}
                      min={1}
                      max={MAX_QUANTITY}
                      label="Quantity to add"
                      className="mt-1.5"
                    />
                  </div>
                  <p className="tabular text-sm text-muted-foreground">
                    Adds{" "}
                    <span className="font-semibold text-foreground">
                      {formatNumber(
                        lineTotal({ quantity, pricePaidUSD: null, product: selected })
                      )}
                    </span>{" "}
                    Apple Points
                    {selected.legacy && " (legacy bonus included)"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button onClick={confirmAdd} disabled={isPending}>
                  <Plus aria-hidden="true" />
                  Add product
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors"
          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      }
    >
      {label}
      <span className="tabular text-xs opacity-60">{count}</span>
    </button>
  );
}
