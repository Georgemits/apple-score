import type { Category } from "@prisma/client";

/** The catalogue fields a collection card needs, as plain JSON. */
export type CollectionProduct = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  family: string;
  priceUSD: number;
  image: string;
  year: number;
  legacy: boolean;
};

/**
 * One owned line, flattened for the server → client boundary. Dates travel as
 * epoch milliseconds; the shape stays compatible with `ScorableItem`, so the
 * pure helpers in `@/lib/score` work on it unchanged.
 */
export type CollectionItem = {
  id: string;
  productId: string;
  quantity: number;
  pricePaidUSD: number | null;
  createdAt: number;
  updatedAt: number;
  product: CollectionProduct;
};

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently updated" },
  { value: "price-desc", label: "Price high → low" },
  { value: "price-asc", label: "Price low → high" },
  { value: "name", label: "Name" },
  { value: "quantity", label: "Quantity" },
  { value: "year", label: "Release year" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortKey = "recent";

export type ViewMode = "grid" | "list";

export type CategoryFilter = Category | "all";
