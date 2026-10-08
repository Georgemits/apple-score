"use client";

import { RotateCcw } from "lucide-react";
import { GROUP_LABEL, RARITY_LABEL } from "@/lib/achievements";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Chip, ChipRow } from "@/components/ui/chip";
import { RARITY_DOT } from "@/components/achievements/rarity";
import {
  GROUP_KEYS,
  RARITY_KEYS,
  STATUS_OPTIONS,
  hasActiveFilters,
  type Filters,
  type GroupFilter,
  type RarityFilter,
  type StatusFilter,
} from "@/components/achievements/types";

export type FilterCounts = {
  status: Record<StatusFilter, number>;
  rarity: Record<RarityFilter, number>;
  group: Record<GroupFilter, number>;
};

type FilterBarProps = {
  filters: Filters;
  /** What each option would show if pressed, given the other two axes. */
  counts: FilterCounts;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  /** "12 of 61 achievements" — announced politely as it changes. */
  resultLabel: string;
};

export function FilterBar({ filters, counts, onChange, onReset, resultLabel }: FilterBarProps) {
  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Status"
          className="inline-flex h-11 items-center rounded-full bg-secondary p-1 sm:h-9"
        >
          {STATUS_OPTIONS.map((option) => {
            const pressed = filters.status === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChange({ status: option.key })}
                className={cn(
                  "inline-flex h-full items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors sm:px-3",
                  pressed
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
                <span className="tabular text-xs text-muted-foreground">
                  {formatNumber(counts.status[option.key])}
                </span>
              </button>
            );
          })}
        </div>

        {/* Always mounted: unmounting on click would drop keyboard focus. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={active ? onReset : undefined}
          aria-disabled={!active || undefined}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <RotateCcw aria-hidden="true" />
          Reset
        </Button>

        <p
          aria-live="polite"
          aria-atomic="true"
          className="tabular basis-full text-sm text-muted-foreground sm:ml-auto sm:basis-auto"
        >
          {resultLabel}
        </p>
      </div>

      <ChipRow label="Rarity">
        <Chip
          active={filters.rarity === "all"}
          count={counts.rarity.all}
          onClick={() => onChange({ rarity: "all" })}
        >
          All
        </Chip>
        {RARITY_KEYS.map((rarity) => (
          <Chip
            key={rarity}
            active={filters.rarity === rarity}
            count={counts.rarity[rarity]}
            onClick={() => onChange({ rarity: filters.rarity === rarity ? "all" : rarity })}
          >
            <span aria-hidden="true" className={cn("size-2 rounded-full", RARITY_DOT[rarity])} />
            {RARITY_LABEL[rarity]}
          </Chip>
        ))}
      </ChipRow>

      <ChipRow label="Group">
        <Chip
          active={filters.group === "all"}
          count={counts.group.all}
          onClick={() => onChange({ group: "all" })}
        >
          All
        </Chip>
        {GROUP_KEYS.map((group) => (
          <Chip
            key={group}
            active={filters.group === group}
            count={counts.group[group]}
            onClick={() => onChange({ group: filters.group === group ? "all" : group })}
          >
            {GROUP_LABEL[group]}
          </Chip>
        ))}
      </ChipRow>
    </div>
  );
}
