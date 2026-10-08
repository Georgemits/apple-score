import type { Category } from "@prisma/client";

/**
 * A catalogue row trimmed to what the welcome wizard needs. Plain data only, so
 * the server page can hand it straight to the client component.
 */
export type OnboardingProduct = {
  id: string;
  name: string;
  family: string;
  category: Category;
  priceUSD: number;
  year: number;
  legacy: boolean;
};

/** productId → quantity picked. */
export type Picks = Record<string, number>;

export type OnboardingItem = { productId: string; quantity: number };

/** Mirrors the `max(12)` on `onboardingSchema` in `src/lib/validations.ts`. */
export const MAX_ONBOARDING_ITEMS = 12;

/** Current Mac lines, in the order they are shown. */
export const MAC_FAMILIES = [
  "MacBook Air",
  "MacBook Pro",
  "iMac",
  "Mac mini",
  "Mac Studio",
  "Mac Pro",
] as const;

/** Everything that is not an iPhone or a Mac, in the order it is shown. */
export const ECOSYSTEM_CATEGORIES = [
  "IPAD",
  "WATCH",
  "AIRPODS",
  "VISION",
  "DISPLAY",
  "TV_HOME",
] as const satisfies readonly Category[];

const ECOSYSTEM_SET: ReadonlySet<Category> = new Set<Category>(ECOSYSTEM_CATEGORIES);

/** Newest first, then priciest, then by name — the catalogue's own order. */
export function newestFirst(a: OnboardingProduct, b: OnboardingProduct): number {
  return b.year - a.year || b.priceUSD - a.priceUSD || a.name.localeCompare(b.name);
}

export function iphonePool(products: readonly OnboardingProduct[]): OnboardingProduct[] {
  return products.filter((product) => product.category === "IPHONE").sort(newestFirst);
}

/** The newest `limit` iPhones. */
export function featuredIphones(
  products: readonly OnboardingProduct[],
  limit = 10
): OnboardingProduct[] {
  return iphonePool(products).slice(0, limit);
}

export function macPool(products: readonly OnboardingProduct[]): OnboardingProduct[] {
  return products.filter((product) => product.category === "MAC").sort(newestFirst);
}

/** The newest `perFamily` Macs of each current line, in line order. */
export function featuredMacs(
  products: readonly OnboardingProduct[],
  perFamily = 2
): OnboardingProduct[] {
  const pool = macPool(products);
  return MAC_FAMILIES.flatMap((family) =>
    pool.filter((product) => product.family === family).slice(0, perFamily)
  );
}

export function ecosystemPool(products: readonly OnboardingProduct[]): OnboardingProduct[] {
  return products.filter((product) => ECOSYSTEM_SET.has(product.category)).sort(newestFirst);
}

/** The newest `perFamily` products of every family outside iPhone and Mac. */
export function featuredEcosystem(
  products: readonly OnboardingProduct[],
  perFamily = 1
): OnboardingProduct[] {
  const taken = new Map<string, number>();
  return ecosystemPool(products).filter((product) => {
    const count = taken.get(product.family) ?? 0;
    if (count >= perFamily) return false;
    taken.set(product.family, count + 1);
    return true;
  });
}

/** Every whitespace-separated token must appear in the name or the family. */
export function matchesQuery(product: OnboardingProduct, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = `${product.name} ${product.family}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

/**
 * What a step shows: matches from the whole pool while there is a query,
 * otherwise the featured list plus anything already picked — so a product found
 * through search stays visible once the box is cleared.
 */
export function visibleProducts(args: {
  pool: readonly OnboardingProduct[];
  featured: readonly OnboardingProduct[];
  picks: Picks;
  query: string;
}): OnboardingProduct[] {
  const query = args.query.trim();
  if (query) return args.pool.filter((product) => matchesQuery(product, query));

  const shown = new Set(args.featured.map((product) => product.id));
  const pinned = args.pool.filter(
    (product) => args.picks[product.id] !== undefined && !shown.has(product.id)
  );
  return [...args.featured, ...pinned];
}

export function withPick(picks: Picks, id: string, quantity: number): Picks {
  return { ...picks, [id]: quantity };
}

export function withoutPick(picks: Picks, id: string): Picks {
  const next = { ...picks };
  delete next[id];
  return next;
}

export function withoutPicks(picks: Picks, ids: ReadonlySet<string>): Picks {
  const next: Picks = {};
  for (const [id, quantity] of Object.entries(picks)) {
    if (!ids.has(id)) next[id] = quantity;
  }
  return next;
}

export type PickSummary = {
  /** Σ launch MSRP × quantity. */
  score: number;
  /** Total units picked. */
  units: number;
  /** Distinct products picked. */
  distinct: number;
};

export function summarizePicks(picks: Picks, products: readonly OnboardingProduct[]): PickSummary {
  const byId = new Map(products.map((product) => [product.id, product]));
  let score = 0;
  let units = 0;
  let distinct = 0;
  for (const [id, quantity] of Object.entries(picks)) {
    const product = byId.get(id);
    if (!product || quantity <= 0) continue;
    score += product.priceUSD * quantity;
    units += quantity;
    distinct += 1;
  }
  return { score, units, distinct };
}

export function toItems(picks: Picks): OnboardingItem[] {
  return Object.entries(picks)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));
}
