import type { Category } from "@prisma/client";
import { CATEGORY_TINT } from "@/lib/categories";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  category: Category;
  className?: string;
  imageClassName?: string;
};

/**
 * Product artwork on a category-tinted tile. The catalogue ships neutral SVG
 * line art, so a plain <img> is used rather than next/image — no remote hosts,
 * no layout-shift risk and no SVG allowlisting required.
 */
export function ProductImage({
  src,
  alt,
  category,
  className,
  imageClassName,
}: ProductImageProps) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-to-br p-4",
        CATEGORY_TINT[category],
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("size-full object-contain", imageClassName)}
      />
    </span>
  );
}
