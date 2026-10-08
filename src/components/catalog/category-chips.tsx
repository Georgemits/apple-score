"use client";

import type { Category } from "@prisma/client";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/categories";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

/** A horizontally scrolling chip row on phones that wraps on wider screens. */
function ChipRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "scrollbar-none -mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        className
      )}
    >
      {children}
    </div>
  );
}

type CategoryChipsProps = {
  value: Category | null;
  /** Matches per category under the current search and filters. */
  counts: ReadonlyMap<Category, number>;
  total: number;
  onChange: (category: Category | null) => void;
};

export function CategoryChips({ value, counts, total, onChange }: CategoryChipsProps) {
  return (
    <ChipRow label="Category">
      <Chip active={value === null} count={total} onClick={() => onChange(null)}>
        All
      </Chip>
      {CATEGORIES.map((category) => {
        const count = counts.get(category) ?? 0;
        const active = value === category;
        return (
          <Chip
            key={category}
            active={active}
            count={count}
            disabled={!active && count === 0}
            onClick={() => onChange(active ? null : category)}
          >
            <span aria-hidden="true">{CATEGORY_EMOJI[category]}</span>
            {CATEGORY_LABEL[category]}
          </Chip>
        );
      })}
    </ChipRow>
  );
}

type FamilyChipsProps = {
  category: Category;
  families: readonly string[];
  counts: ReadonlyMap<string, number>;
  total: number;
  value: string | null;
  onChange: (family: string | null) => void;
};

/** Sub-chips for the product lines inside the active category. */
export function FamilyChips({
  category,
  families,
  counts,
  total,
  value,
  onChange,
}: FamilyChipsProps) {
  if (families.length < 2) return null;

  return (
    <ChipRow label={`${CATEGORY_LABEL[category]} families`} className="animate-enter-up">
      <Chip size="sm" active={value === null} count={total} onClick={() => onChange(null)}>
        All {CATEGORY_LABEL[category]}
      </Chip>
      {families.map((family) => {
        const count = counts.get(family) ?? 0;
        const active = value === family;
        return (
          <Chip
            key={family}
            size="sm"
            active={active}
            count={count}
            disabled={!active && count === 0}
            onClick={() => onChange(active ? null : family)}
          >
            {family}
          </Chip>
        );
      })}
    </ChipRow>
  );
}
