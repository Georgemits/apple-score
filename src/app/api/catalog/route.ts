import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCatalogue } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Slim catalogue for the quick-add command palette. Signed-in only, cached
 * for a minute on the server and in the browser.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await getCatalogue();
  const slim = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    family: product.family,
    category: product.category,
    priceUSD: product.priceUSD,
    year: product.year,
    legacy: product.legacy,
  }));

  return NextResponse.json(
    { products: slim },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}
