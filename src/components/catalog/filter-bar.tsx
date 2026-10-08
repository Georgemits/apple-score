"use client";

import * as React from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import {
  OWNED_OPTIONS,
  SORT_OPTIONS,
  isSortKey,
  type OwnedFilter,
  type SortKey,
} from "@/components/catalog/types";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  owned: OwnedFilter;
  onOwnedChange: (value: OwnedFilter) => void;
  legacyOnly: boolean;
  onLegacyChange: (value: boolean) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  /** "12 products in iPhone" — announced politely as it changes. */
  resultLabel: string;
};

export function FilterBar({
  owned,
  onOwnedChange,
  legacyOnly,
  onLegacyChange,
  sort,
  onSortChange,
  resultLabel,
}: FilterBarProps) {
  const sortId = React.useId();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Ownership"
        className="inline-flex h-11 items-center rounded-full bg-secondary p-1 sm:h-9"
      >
        {OWNED_OPTIONS.map((option) => {
          const active = owned === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => onOwnedChange(option.key)}
              className={cn(
                "h-full rounded-full px-3.5 text-sm font-medium transition-colors sm:px-3",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <Chip active={legacyOnly} onClick={() => onLegacyChange(!legacyOnly)}>
        <span aria-hidden="true">🕰</span>
        Legacy only
      </Chip>

      <div className="relative inline-flex items-center">
        <label htmlFor={sortId} className="sr-only">
          Sort by
        </label>
        <ArrowUpDown
          className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <select
          id={sortId}
          value={sort}
          onChange={(event) => {
            if (isSortKey(event.target.value)) onSortChange(event.target.value);
          }}
          className="h-11 appearance-none rounded-full border border-border/70 bg-background/60 pl-10 pr-9 text-base font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-9 sm:text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="tabular basis-full text-sm text-muted-foreground sm:ml-auto sm:basis-auto"
      >
        {resultLabel}
      </p>
    </div>
  );
}
