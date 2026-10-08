"use client";

import {
  ArrowUpDown,
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_SLUG } from "@/lib/categories";
import { cn, formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { CategoryTotal } from "@/components/collection/collection-utils";
import {
  DEFAULT_SORT,
  SORT_OPTIONS,
  type CategoryFilter,
  type SortKey,
  type ViewMode,
} from "@/components/collection/types";

type CollectionToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  /** Dollar totals per owned category, richest first. */
  totals: CategoryTotal[];
  /** The whole collection's total, for the "All" chip. */
  score: number;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  /** Lines shown after filtering, and lines in total. */
  shown: number;
  total: number;
};

/**
 * Search, category chips, sort, layout and grouping. Rendered as a fragment so
 * the search bar is a direct child of the section and can stay stuck under the
 * site header while the list scrolls on phones.
 */
export function CollectionToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  totals,
  score,
  sort,
  onSortChange,
  view,
  onViewChange,
  grouped,
  onGroupedChange,
  shown,
  total,
}: CollectionToolbarProps) {
  const searching = query.trim().length > 0;

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 bg-background/85 px-4 py-2 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="relative sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="collection-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Search your collection"
            placeholder="Search by name, family or category"
            autoComplete="off"
            enterKeyHint="search"
            className="pl-10 pr-11"
          />
          {searching && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-offset-0"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter by category"
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
      >
        <CategoryChip
          label="All"
          detail={formatUSD(score)}
          active={category === "all"}
          onClick={() => onCategoryChange("all")}
        />
        {totals.map((entry) => (
          <CategoryChip
            key={entry.category}
            emoji={CATEGORY_EMOJI[entry.category]}
            swatch={`var(--chart-${CATEGORY_SLUG[entry.category]})`}
            label={CATEGORY_LABEL[entry.category]}
            detail={formatUSD(entry.total)}
            active={category === entry.category}
            onClick={() => onCategoryChange(entry.category)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="relative">
          <label htmlFor="collection-sort" className="sr-only">
            Sort by
          </label>
          <ArrowUpDown
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <select
            id="collection-sort"
            value={sort}
            onChange={(event) => {
              const next = SORT_OPTIONS.find((option) => option.value === event.target.value);
              onSortChange(next?.value ?? DEFAULT_SORT);
            }}
            className="h-11 appearance-none rounded-full border border-border bg-background/60 pl-10 pr-10 text-base font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary sm:h-10 sm:text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <div
          role="group"
          aria-label="Layout"
          className="inline-flex items-center gap-1 rounded-full bg-secondary p-1"
        >
          <ViewButton
            icon={LayoutGrid}
            label="Grid view"
            active={view === "grid"}
            onClick={() => onViewChange("grid")}
          />
          <ViewButton
            icon={List}
            label="List view"
            active={view === "list"}
            onClick={() => onViewChange("list")}
          />
        </div>

        <div className="ml-auto flex min-h-11 items-center gap-2.5 sm:min-h-10">
          <label htmlFor="collection-group" className="text-sm font-medium">
            Group by category
          </label>
          <Switch id="collection-group" checked={grouped} onCheckedChange={onGroupedChange} />
        </div>
      </div>

      <p className="tabular text-sm text-muted-foreground" aria-live="polite">
        {shown === total
          ? pluralize(total, "unique product")
          : `Showing ${formatNumber(shown)} of ${pluralize(total, "unique product")}`}
      </p>
    </>
  );
}

type CategoryChipProps = {
  label: string;
  detail: string;
  emoji?: string;
  /** CSS colour for the identity dot, e.g. `var(--chart-iphone)`. */
  swatch?: string;
  active: boolean;
  onClick: () => void;
};

function CategoryChip({ label, detail, emoji, swatch, active, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors sm:min-h-9 sm:px-3",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background/60 text-foreground backdrop-blur hover:bg-secondary"
      )}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      <span>{label}</span>
      {swatch && (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full"
          style={{ backgroundColor: swatch }}
        />
      )}
      <span
        className={cn(
          "tabular text-xs",
          active ? "text-primary-foreground/70" : "text-muted-foreground"
        )}
      >
        {detail}
      </span>
    </button>
  );
}

type ViewButtonProps = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
};

function ViewButton({ icon: Icon, label, active, onClick }: ViewButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors sm:size-8",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
