"use client";

import * as React from "react";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { cn, formatUSD, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CollectionToolbar } from "@/components/collection/collection-toolbar";
import { OwnedProductCard } from "@/components/collection/owned-product-card";
import { useCollectionPrefs } from "@/components/collection/use-collection-prefs";
import {
  categoryTotals,
  groupByCategory,
  matchesQuery,
  sortItems,
} from "@/components/collection/collection-utils";
import {
  DEFAULT_SORT,
  type CategoryFilter,
  type CollectionItem,
  type SortKey,
} from "@/components/collection/types";

type CollectionViewProps = {
  items: CollectionItem[];
  /** The user's current Apple Score. */
  score: number;
};

/** The interactive part of the collection page: filters, layout and the cards themselves. */
export function CollectionView({ items, score }: CollectionViewProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const [sort, setSort] = React.useState<SortKey>(DEFAULT_SORT);
  const { prefs, update } = useCollectionPrefs();

  const totals = React.useMemo(() => categoryTotals(items), [items]);

  // If the selected category just lost its last product, fall back to everything.
  const activeCategory: CategoryFilter =
    category !== "all" && !totals.some((entry) => entry.category === category) ? "all" : category;

  const visible = React.useMemo(() => {
    const filtered = items.filter(
      (item) =>
        (activeCategory === "all" || item.product.category === activeCategory) &&
        matchesQuery(item, query)
    );
    return sortItems(filtered, sort);
  }, [items, activeCategory, query, sort]);

  const groups = React.useMemo(
    () => (prefs.grouped ? groupByCategory(visible) : null),
    [prefs.grouped, visible]
  );

  const listClass =
    prefs.view === "grid"
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
      : "flex flex-col gap-2";

  const renderList = (list: CollectionItem[], label: string, offset = 0) => (
    <ul className={cn("list-none", listClass)} aria-label={label}>
      {list.map((item, index) => (
        <OwnedProductCard
          key={item.id}
          item={item}
          view={prefs.view}
          score={score}
          index={offset + index}
        />
      ))}
    </ul>
  );

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  let offset = 0;

  return (
    <section aria-labelledby="collection-items-heading" className="space-y-4">
      <h2 id="collection-items-heading" className="sr-only">
        Products you own
      </h2>

      <CollectionToolbar
        query={query}
        onQueryChange={setQuery}
        category={activeCategory}
        onCategoryChange={setCategory}
        totals={totals}
        score={score}
        sort={sort}
        onSortChange={setSort}
        view={prefs.view}
        onViewChange={(view) => update({ view })}
        grouped={prefs.grouped}
        onGroupedChange={(grouped) => update({ grouped })}
        shown={visible.length}
        total={items.length}
      />

      {visible.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Nothing matches"
          description={
            query.trim()
              ? `No products match “${query.trim()}”${activeCategory !== "all" ? ` in ${CATEGORY_LABEL[activeCategory]}` : ""}. Try another word, or clear the filters.`
              : "Nothing in that category. Yet."
          }
          action={
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : groups ? (
        <div className="space-y-8">
          {groups.map((group) => {
            const headingId = `collection-group-${CATEGORY_SLUG[group.category]}`;
            const list = renderList(group.items, CATEGORY_LABEL[group.category], offset);
            offset += group.items.length;
            return (
              <section key={group.category} aria-labelledby={headingId} className="space-y-3">
                <header className="flex items-end justify-between gap-3">
                  <h3
                    id={headingId}
                    className="flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--chart-${CATEGORY_SLUG[group.category]})` }}
                    />
                    <span aria-hidden="true">{CATEGORY_EMOJI[group.category]}</span>
                    <span className="truncate">{CATEGORY_LABEL[group.category]}</span>
                    <span className="tabular shrink-0 text-sm font-normal text-muted-foreground">
                      {pluralize(group.units, "unit")}
                    </span>
                  </h3>
                  <p className="tabular shrink-0 text-sm font-semibold">{formatUSD(group.total)}</p>
                </header>
                {list}
              </section>
            );
          })}
        </div>
      ) : (
        renderList(visible, "Products you own")
      )}
    </section>
  );
}
