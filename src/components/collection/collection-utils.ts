import type { Category } from "@prisma/client";
import { CATEGORY_LABEL } from "@/lib/categories";
import { lineTotal, unitPrice } from "@/lib/score";
import type { CollectionItem, SortKey } from "@/components/collection/types";

/** Case-insensitive match on name, family, category label or release year. Every word must hit. */
export function matchesQuery(item: CollectionItem, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = [
    item.product.name,
    item.product.family,
    CATEGORY_LABEL[item.product.category],
    String(item.product.year),
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

const byName = (a: CollectionItem, b: CollectionItem) =>
  a.product.name.localeCompare(b.product.name, "en", { sensitivity: "base" });

/** Returns a sorted copy; the input is never mutated. */
export function sortItems(items: readonly CollectionItem[], sort: SortKey): CollectionItem[] {
  const sorted = [...items];
  switch (sort) {
    case "recent":
      sorted.sort((a, b) => b.updatedAt - a.updatedAt || byName(a, b));
      break;
    case "price-desc":
      sorted.sort((a, b) => unitPrice(b) - unitPrice(a) || byName(a, b));
      break;
    case "price-asc":
      sorted.sort((a, b) => unitPrice(a) - unitPrice(b) || byName(a, b));
      break;
    case "name":
      sorted.sort(byName);
      break;
    case "quantity":
      sorted.sort((a, b) => b.quantity - a.quantity || lineTotal(b) - lineTotal(a) || byName(a, b));
      break;
    case "year":
      sorted.sort((a, b) => b.product.year - a.product.year || byName(a, b));
      break;
  }
  return sorted;
}

export type CategoryTotal = {
  category: Category;
  /** Dollars in this category. */
  total: number;
  /** Units owned in this category. */
  units: number;
  /** Distinct products in this category. */
  distinct: number;
};

/** Dollar totals per category, richest first. */
export function categoryTotals(items: readonly CollectionItem[]): CategoryTotal[] {
  const totals = new Map<Category, CategoryTotal>();

  for (const item of items) {
    const category = item.product.category;
    const current = totals.get(category) ?? { category, total: 0, units: 0, distinct: 0 };
    totals.set(category, {
      category,
      total: current.total + lineTotal(item),
      units: current.units + item.quantity,
      distinct: current.distinct + 1,
    });
  }

  return [...totals.values()].sort(
    (a, b) =>
      b.total - a.total || CATEGORY_LABEL[a.category].localeCompare(CATEGORY_LABEL[b.category])
  );
}

export type CategoryGroup = CategoryTotal & { items: CollectionItem[] };

/** Buckets already-sorted items by category, keeping their order; groups come richest first. */
export function groupByCategory(items: readonly CollectionItem[]): CategoryGroup[] {
  const buckets = new Map<Category, CollectionItem[]>();
  for (const item of items) {
    const bucket = buckets.get(item.product.category);
    if (bucket) bucket.push(item);
    else buckets.set(item.product.category, [item]);
  }

  return categoryTotals(items).map((total) => ({
    ...total,
    items: buckets.get(total.category) ?? [],
  }));
}
