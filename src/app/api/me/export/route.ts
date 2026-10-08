import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAchievementDefinition } from "@/lib/achievements";
import { getActivity, getInventory, getUnlockedAchievements, summarize } from "@/lib/queries";
import { lineTotal, unitPrice } from "@/lib/score";

export const dynamic = "force-dynamic";

/** Everything the app stores about the signed-in user, as a JSON download. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, items, achievements, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarEmoji: true,
        avatarHue: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    getInventory(session.user.id),
    getUnlockedAchievements(session.user.id),
    getActivity(session.user.id, 500),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stats = summarize(items);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: user,
    score: stats.score,
    productCount: stats.productCount,
    tier: stats.tier.name,
    collection: items.map((item) => ({
      product: {
        slug: item.product.slug,
        name: item.product.name,
        category: item.product.category,
        family: item.product.family,
        priceUSD: item.product.priceUSD,
        year: item.product.year,
        legacy: item.product.legacy,
      },
      quantity: item.quantity,
      pricePaidUSD: item.pricePaidUSD,
      unitPriceUSD: unitPrice(item),
      lineTotalUSD: lineTotal(item),
      addedAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    achievements: achievements.map((row) => ({
      id: row.achievementId,
      title: getAchievementDefinition(row.achievementId)?.title ?? row.achievementId,
      unlockedAt: row.unlockedAt,
    })),
    activity: activity.map((event) => ({
      type: event.type,
      product: event.productName,
      quantityDelta: event.quantityDelta,
      scoreDelta: event.scoreDelta,
      scoreAfter: event.scoreAfter,
      at: event.createdAt,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="apple-score-${user.username}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
