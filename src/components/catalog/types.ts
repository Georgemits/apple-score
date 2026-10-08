import type { Category } from "@prisma/client";

/**
 * A catalogue row plus what the viewer knows about it. Plain data only, so the
 * server page can hand the whole list straight to the client catalogue.
 */
export type CatalogueItem = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  family: string;
  /** Launch MSRP in whole US dollars — what it adds to the score. */
  priceUSD: number;
  image: string;
  year: number;
  legacy: boolean;
  /** Units the viewer already owns. */
  owned: number;
  /** Public collectors who own it. */
  holders: number;
  wished: boolean;
};

export const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "name", label: "Name" },
  { key: "most-owned", label: "Most owned" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["key"];

export function isSortKey(value: string): value is SortKey {
  return SORT_OPTIONS.some((option) => option.key === value);
}

export const OWNED_OPTIONS = [
  { key: "all", label: "All" },
  { key: "owned", label: "Owned" },
  { key: "not-owned", label: "Not owned" },
] as const;

export type OwnedFilter = (typeof OWNED_OPTIONS)[number]["key"];

export type Filters = {
  legacyOnly: boolean;
  owned: OwnedFilter;
};
