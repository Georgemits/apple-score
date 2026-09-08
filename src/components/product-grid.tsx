"use client";

import { AnimatePresence } from "framer-motion";
import type { InventoryItem } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({ items }: { items: InventoryItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <ProductCard key={item.id} item={item} index={index} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
