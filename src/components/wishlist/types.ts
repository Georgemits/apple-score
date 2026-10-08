import type { Category } from "@prisma/client";

/** The catalogue fields a wishlist row needs, as plain JSON. */
export type WishlistProduct = {
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

/** One wished product, flattened for the server → client boundary (dates as epoch ms). */
export type WishlistItemView = {
  id: string;
  productId: string;
  createdAt: number;
  product: WishlistProduct;
};
