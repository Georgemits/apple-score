import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCatalogue, getOwnedQuantities } from "@/lib/queries";
import { ProductCatalog } from "@/components/product-catalog";

export const metadata: Metadata = {
  title: "Add a product",
  description: "Search the Apple catalogue and add products to your collection.",
};

export const dynamic = "force-dynamic";

export default async function AddProductPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/products/add");

  const [products, owned] = await Promise.all([
    getCatalogue(),
    getOwnedQuantities(session.user.id),
  ]);

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl">Add a product</h1>
        <p className="max-w-2xl text-muted-foreground">
          Search the catalogue, pick a quantity, and your Apple Score updates immediately.
        </p>
      </header>

      <ProductCatalog products={products} owned={owned} />
    </div>
  );
}
