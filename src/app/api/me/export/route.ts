import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAchievementDefinition } from "@/lib/achievements";
import { getActivity, getInventory, getUnlockedAchievements, summarize } from "@/lib/queries";
import { lineTotal, unitPrice } from "@/lib/score";

export const dynamic = "force-dynamic";

/** How much of the activity log goes in the file. */
const ACTIVITY_LIMIT = 500;

/** Keeps the download filename to characters every OS accepts. */
function safeFilename(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "collector";
}

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * GET /api/me/export
 *
 * Everything the app stores about the signed-in user, as a JSON download:
 * profile, collection, score, achievements and the last 500 activity events.
 * The user comes from the session, never from the request.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const userId = session.user.id;

  try {
    const [user, items, unlocked, activity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
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
      getInventory(userId),
      getUnlockedAchievements(userId),
      getActivity(userId, ACTIVITY_LIMIT),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
    }

    const stats = summarize(items);

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarEmoji: user.avatarEmoji,
        avatarHue: user.avatarHue,
        isPublic: user.isPublic,
        createdAt: user.createdAt.toISOString(),
      },
      collection: items.map((item) => ({
        product: {
          slug: item.product.slug,
          name: item.product.name,
          category: item.product.category,
          family: item.product.family,
          priceUSD: item.product.priceUSD,
          year: item.product.year,
        },
        quantity: item.quantity,
        pricePaidUSD: item.pricePaidUSD,
        unitPriceUSD: unitPrice(item),
        lineTotalUSD: lineTotal(item),
        addedAt: item.createdAt.toISOString(),
      })),
      score: stats.score,
      productCount: stats.productCount,
      tier: stats.tier.name,
      achievements: unlocked.map((row) => ({
        id: row.achievementId,
        title: getAchievementDefinition(row.achievementId)?.title ?? row.achievementId,
        unlockedAt: row.unlockedAt.toISOString(),
      })),
      activity: activity.map((event) => ({
        id: event.id,
        type: event.type,
        productName: event.productName,
        productSlug: event.product?.slug ?? null,
        quantityDelta: event.quantityDelta,
        scoreDelta: event.scoreDelta,
        scoreAfter: event.scoreAfter,
        createdAt: event.createdAt.toISOString(),
      })),
    };

    const body = JSON.stringify(payload, null, 2);
    const filename = `apple-score-${safeFilename(user.username)}.json`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(Buffer.byteLength(body, "utf8")),
        "X-Content-Type-Options": "nosniff",
        ...NO_STORE,
      },
    });
  } catch (error) {
    console.error("GET /api/me/export:", error);
    return NextResponse.json(
      { error: "Could not build your export. Please try again." },
      { status: 500, headers: NO_STORE }
    );
  }
}
