import Link from "next/link";
import { Boxes } from "lucide-react";
import { CATEGORY_LABEL } from "@/lib/categories";
import type { InventoryItem } from "@/lib/queries";
import { countProducts, lineTotal } from "@/lib/score";
import { formatNumber, formatUSD, pluralize } from "@/lib/utils";
import { LegacyBadge } from "@/components/legacy-badge";
import { ProductImage } from "@/components/product-image";
import { ProfileSection } from "@/components/profile/profile-section";
import { ShowMore } from "@/components/profile/show-more";

const PREVIEW = 8;

type CollectionShowcaseProps = {
  items: InventoryItem[];
  isOwner: boolean;
  delay?: number;
  className?: string;
};

function Tile({ item, index }: { item: InventoryItem; index: number }) {
  const { product } = item;
  return (
    <li
      className="min-w-0 animate-enter-up"
      style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
    >
      <Link
        href={`/p/${product.slug}`}
        className="card-hover group flex h-full flex-col rounded-xl border border-border/70 bg-background/50 p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="relative block">
          <ProductImage
            src={product.image}
            alt=""
            category={product.category}
            className="aspect-square w-full p-5 sm:p-6"
          />
          {item.quantity > 1 && (
            <span className="tabular absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
              ×{formatNumber(item.quantity)}
              <span className="sr-only"> owned</span>
            </span>
          )}
          {product.legacy && <LegacyBadge className="absolute left-2 top-2" />}
        </span>
        <span className="mt-3 flex min-w-0 flex-1 flex-col">
          <span className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
            {product.name}
          </span>
          <span className="mt-auto flex items-end justify-between gap-2 pt-2">
            <span className="truncate text-xs text-muted-foreground">
              {CATEGORY_LABEL[product.category]}
            </span>
            <span className="tabular shrink-0 text-sm font-semibold">
              {formatUSD(lineTotal(item))}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Owned products as a grid, most expensive line first, with the tail behind a toggle. */
export function CollectionShowcase({ items, isOwner, delay, className }: CollectionShowcaseProps) {
  const sorted = [...items].sort(
    (a, b) => lineTotal(b) - lineTotal(a) || a.product.name.localeCompare(b.product.name)
  );
  const preview = sorted.slice(0, PREVIEW);
  const rest = sorted.slice(PREVIEW);
  const units = countProducts(items);

  return (
    <ProfileSection
      id="profile-collection"
      title="Collection"
      description={`${pluralize(units, "product")} across ${pluralize(sorted.length, "line")}, most expensive first.`}
      icon={Boxes}
      href={isOwner ? "/collection" : undefined}
      linkLabel="Manage"
      delay={delay}
      className={className}
    >
      <ShowMore
        id="profile-collection-grid"
        as="ul"
        ariaLabel="Owned products"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        moreCount={rest.length}
        label={`Show all ${formatNumber(sorted.length)}`}
        more={rest.map((item, index) => (
          <Tile key={item.id} item={item} index={index} />
        ))}
      >
        {preview.map((item, index) => (
          <Tile key={item.id} item={item} index={index} />
        ))}
      </ShowMore>
    </ProfileSection>
  );
}
