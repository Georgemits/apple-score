import type { Category } from "@prisma/client";
import { CATEGORY_KEYWORDS, CATEGORY_LABEL } from "@/lib/categories";
import type { CatalogueItem, Filters, SortKey } from "@/components/catalog/types";

/* -------------------------------------------------------------------------
 * Search
 * ---------------------------------------------------------------------- */

/**
 * Everything a product can be found by, lower-cased and joined once so the
 * per-keystroke filter is a handful of `includes` calls per row.
 */
export function searchText(item: CatalogueItem): string {
  return [
    item.name,
    item.family,
    CATEGORY_LABEL[item.category],
    ...CATEGORY_KEYWORDS[item.category],
    String(item.year),
  ]
    .join(" ")
    .toLowerCase();
}

export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Every token must appear somewhere in the text. */
export function matchesTokens(text: string, tokens: readonly string[]): boolean {
  for (const token of tokens) {
    if (!text.includes(token)) return false;
  }
  return true;
}

/* -------------------------------------------------------------------------
 * Filters
 * ---------------------------------------------------------------------- */

export function passesFilters(item: CatalogueItem, filters: Filters): boolean {
  if (filters.legacyOnly && !item.legacy) return false;
  if (filters.owned === "owned" && item.owned === 0) return false;
  if (filters.owned === "not-owned" && item.owned > 0) return false;
  return true;
}

/* -------------------------------------------------------------------------
 * Sorting
 * ---------------------------------------------------------------------- */

const byName = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** The catalogue's own order: newest, then priciest, then by name. */
function newestFirst(a: CatalogueItem, b: CatalogueItem): number {
  return b.year - a.year || b.priceUSD - a.priceUSD || byName.compare(a.name, b.name);
}

const COMPARATORS: Record<SortKey, (a: CatalogueItem, b: CatalogueItem) => number> = {
  newest: newestFirst,
  "price-desc": (a, b) => b.priceUSD - a.priceUSD || newestFirst(a, b),
  "price-asc": (a, b) => a.priceUSD - b.priceUSD || newestFirst(a, b),
  name: (a, b) => byName.compare(a.name, b.name) || newestFirst(a, b),
  "most-owned": (a, b) => b.holders - a.holders || newestFirst(a, b),
};

export function sortItems(items: readonly CatalogueItem[], sort: SortKey): CatalogueItem[] {
  return [...items].sort(COMPARATORS[sort]);
}

/* -------------------------------------------------------------------------
 * Grouping
 * ---------------------------------------------------------------------- */

export type FamilyGroup = { family: string; items: CatalogueItem[] };

/** Groups in order of first appearance, so a newest-first list stays newest-first. */
export function groupByFamily(items: readonly CatalogueItem[]): FamilyGroup[] {
  const groups = new Map<string, CatalogueItem[]>();
  for (const item of items) {
    const group = groups.get(item.family);
    if (group) group.push(item);
    else groups.set(item.family, [item]);
  }
  return [...groups.entries()].map(([family, members]) => ({ family, items: members }));
}

/* -------------------------------------------------------------------------
 * Counts
 * ---------------------------------------------------------------------- */

export function countByCategory(items: readonly CatalogueItem[]): Map<Category, number> {
  const counts = new Map<Category, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return counts;
}

export function countByFamily(items: readonly CatalogueItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.family, (counts.get(item.family) ?? 0) + 1);
  }
  return counts;
}

/** Every family per category, in catalogue (newest-first) order. */
export function familiesByCategory(items: readonly CatalogueItem[]): Map<Category, string[]> {
  const families = new Map<Category, string[]>();
  for (const item of items) {
    const list = families.get(item.category);
    if (!list) families.set(item.category, [item.family]);
    else if (!list.includes(item.family)) list.push(item.family);
  }
  return families;
}

/** A stable DOM id fragment for a family heading. */
export function familySlug(family: string): string {
  return family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
