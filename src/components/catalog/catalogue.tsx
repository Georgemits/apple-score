"use client";

import * as React from "react";
import type { Category } from "@prisma/client";
import { RotateCcw } from "lucide-react";
import { CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { cn, formatNumber, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { SearchBox } from "@/components/catalog/search-box";
import { CategoryChips, FamilyChips } from "@/components/catalog/category-chips";
import { FilterBar } from "@/components/catalog/filter-bar";
import { ProductTile } from "@/components/catalog/product-tile";
import { AddDialog } from "@/components/catalog/add-dialog";
import {
  countByCategory,
  countByFamily,
  familiesByCategory,
  familySlug,
  groupByFamily,
  matchesTokens,
  passesFilters,
  searchText,
  sortItems,
  tokenize,
} from "@/components/catalog/search";
import type { CatalogueItem, OwnedFilter, SortKey } from "@/components/catalog/types";

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";
/** Products rendered before a "Show more" button; keeps phones fast. */
const PAGE_SIZE = 48;

type CatalogueProps = {
  items: CatalogueItem[];
  currentScore: number;
  /** From `?category=<slug>` — the product page links back here with it. */
  initialCategory: Category | null;
  /** From `?q=`. */
  initialQuery: string;
};

/**
 * The browsable catalogue: sticky search, category and family chips, filters,
 * sort, a grid of tiles and the add dialog. Everything is derived from a handful
 * of state values with memoised passes over the (small) catalogue.
 */
export function Catalogue({ items, currentScore, initialCategory, initialQuery }: CatalogueProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = React.useState(initialQuery);
  const deferredQuery = React.useDeferredValue(query);
  const [category, setCategory] = React.useState<Category | null>(initialCategory);
  const [family, setFamily] = React.useState<string | null>(null);
  const [legacyOnly, setLegacyOnly] = React.useState(false);
  const [owned, setOwned] = React.useState<OwnedFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  /* ------------------------------------------------------------- indexes */
  const index = React.useMemo(
    () => items.map((item) => ({ item, text: searchText(item) })),
    [items]
  );
  const families = React.useMemo(() => familiesByCategory(items), [items]);
  const ownedDistinct = React.useMemo(
    () => items.reduce((count, item) => count + (item.owned > 0 ? 1 : 0), 0),
    [items]
  );
  const tokens = React.useMemo(() => tokenize(deferredQuery), [deferredQuery]);

  /* ----------------------------------------------------------- filtering */
  // Search + ownership + legacy, but not category: chip counts come from here.
  const base = React.useMemo(() => {
    const filters = { legacyOnly, owned };
    const matches: CatalogueItem[] = [];
    for (const entry of index) {
      if (matchesTokens(entry.text, tokens) && passesFilters(entry.item, filters)) {
        matches.push(entry.item);
      }
    }
    return matches;
  }, [index, tokens, legacyOnly, owned]);

  const categoryCounts = React.useMemo(() => countByCategory(base), [base]);
  const inCategory = React.useMemo(
    () => (category ? base.filter((item) => item.category === category) : base),
    [base, category]
  );
  const familyCounts = React.useMemo(() => countByFamily(inCategory), [inCategory]);

  const results = React.useMemo(
    () =>
      sortItems(family ? inCategory.filter((item) => item.family === family) : inCategory, sort),
    [inCategory, family, sort]
  );

  // Render the catalogue in pages so a 230-product list never lands at once.
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  React.useEffect(() => setLimit(PAGE_SIZE), [results]);
  const visible = React.useMemo(() => results.slice(0, limit), [results, limit]);
  const hiddenCount = results.length - visible.length;

  // Newest-first reads best as a run of families; other sorts stay flat.
  const groups = React.useMemo(() => {
    if (sort !== "newest") return null;
    const grouped = groupByFamily(visible);
    return grouped.length > 1 ? grouped : null;
  }, [visible, sort]);

  const activeItem = React.useMemo(
    () => (activeId === null ? null : (items.find((item) => item.id === activeId) ?? null)),
    [items, activeId]
  );

  const isStale = query !== deferredQuery;

  /* ------------------------------------------------------------ handlers */
  const selectCategory = (next: Category | null) => {
    setCategory(next);
    setFamily(null);
  };

  const reset = () => {
    setQuery("");
    setCategory(null);
    setFamily(null);
    setLegacyOnly(false);
    setOwned("all");
    inputRef.current?.focus();
  };

  /* ------------------------------------------------------------- URL sync */
  // Keep ?category= and ?q= shareable without a navigation.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (category) params.set("category", CATEGORY_SLUG[category]);
    else params.delete("category");
    const trimmed = deferredQuery.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [category, deferredQuery]);

  /* ---------------------------------------------------------------- copy */
  const scope = family ?? (category ? CATEGORY_LABEL[category] : null);
  const resultLabel = [
    pluralize(results.length, "product"),
    scope ? `in ${scope}` : null,
    tokens.length > 0 ? `for “${deferredQuery.trim()}”` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const ownsNothing = owned === "owned" && ownedDistinct === 0;

  /* -------------------------------------------------------------- render */
  let stagger = 0;

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <SearchBox value={query} onChange={setQuery} inputRef={inputRef} />
      </div>

      <div className="space-y-3">
        <CategoryChips
          value={category}
          counts={categoryCounts}
          total={base.length}
          onChange={selectCategory}
        />
        {category && (
          <FamilyChips
            category={category}
            families={families.get(category) ?? []}
            counts={familyCounts}
            total={inCategory.length}
            value={family}
            onChange={setFamily}
          />
        )}
      </div>

      <FilterBar
        owned={owned}
        onOwnedChange={setOwned}
        legacyOnly={legacyOnly}
        onLegacyChange={setLegacyOnly}
        sort={sort}
        onSortChange={setSort}
        resultLabel={resultLabel}
      />

      <section
        aria-labelledby="catalog-results"
        aria-busy={isStale || undefined}
        className={cn("transition-opacity duration-200", isStale && "opacity-70")}
      >
        <h2 id="catalog-results" className="sr-only">
          Products
        </h2>

        {results.length === 0 ? (
          <EmptyState
            emoji={ownsNothing ? "🪟" : "🔍"}
            title={ownsNothing ? "You don't own anything yet" : "Nothing matches"}
            description={
              ownsNothing
                ? "Your Apple Score is $0. That's… impressive restraint. Switch to “Not owned” and fix that."
                : "Even Apple hasn't made that yet. Try fewer words, or start over."
            }
            action={
              <Button variant="outline" onClick={reset}>
                <RotateCcw aria-hidden="true" />
                Reset filters
              </Button>
            }
          />
        ) : groups ? (
          <div className="space-y-8">
            {groups.map((group) => {
              const start = stagger;
              stagger += group.items.length;
              const headingId = `family-${familySlug(group.family)}`;
              return (
                <section key={group.family} aria-labelledby={headingId} className="space-y-3">
                  <h3
                    id={headingId}
                    className="flex items-baseline gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    {group.family}
                    <span className="tabular font-medium normal-case tracking-normal">
                      {formatNumber(group.items.length)}
                    </span>
                  </h3>
                  <ul className={GRID}>
                    {group.items.map((item, position) => (
                      <ProductTile
                        key={item.id}
                        item={item}
                        index={start + position}
                        onOpen={(product) => setActiveId(product.id)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <ul className={GRID}>
            {visible.map((item, position) => (
              <ProductTile
                key={item.id}
                item={item}
                index={position}
                onOpen={(product) => setActiveId(product.id)}
              />
            ))}
          </ul>
        )}

        {hiddenCount > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <Button variant="outline" onClick={() => setLimit((value) => value + PAGE_SIZE)}>
              Show {formatNumber(Math.min(PAGE_SIZE, hiddenCount))} more
            </Button>
            <p className="text-xs text-muted-foreground">
              Showing {formatNumber(visible.length)} of {formatNumber(results.length)}
            </p>
          </div>
        )}
      </section>

      <AddDialog item={activeItem} currentScore={currentScore} onClose={() => setActiveId(null)} />
    </div>
  );
}
