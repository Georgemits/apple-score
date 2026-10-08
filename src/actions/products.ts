"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateScore, milestoneReached, tierFor, type Milestone } from "@/lib/score";
import { getStanding } from "@/lib/leaderboard";
import { syncAchievements, type UnlockSummary } from "@/lib/achievement-sync";
import {
  addProductSchema,
  onboardingSchema,
  productIdSchema,
  setQuantitySchema,
  updateOwnedItemSchema,
  MAX_QUANTITY,
} from "@/lib/validations";
import { failure, type ActionResult } from "@/actions/types";

/** What every inventory action reports back, so the UI can celebrate properly. */
export type ScoreUpdate = {
  score: number;
  productCount: number;
  /** Signed change in dollars from this action. */
  delta: number;
  /** Set when this change pushed the user past a celebration threshold. */
  milestone: Milestone | null;
  /** Set when the user moved into a new tier. */
  tier: { name: string; emoji: string } | null;
  /** Achievements earned by this change. */
  unlocked: UnlockSummary[];
  rank: { rank: number; total: number } | null;
};

type Session = { ok: true; userId: string; username: string } | { ok: false; error: string };

async function requireUser(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to do that." };
  }
  return { ok: true, userId: session.user.id, username: session.user.username };
}

function revalidate(username: string) {
  revalidatePath("/home");
  revalidatePath("/collection");
  revalidatePath("/catalog");
  revalidatePath("/profile");
  revalidatePath("/achievements");
  revalidatePath("/leaderboard");
  revalidatePath(`/u/${username}`);
  revalidateTag("community");
}

type Change = {
  productId: string;
  /** Desired quantity after the change. 0 removes the row. */
  quantity: number;
  /** `undefined` leaves the recorded price alone; null resets to MSRP. */
  pricePaidUSD?: number | null;
};

type Applied = { before: number; after: number; productCount: number };

/**
 * Applies a set of ownership changes atomically and appends one activity
 * event per change. Returns the score before and after.
 */
async function applyChanges(
  userId: string,
  changes: Change[]
): Promise<Applied | { error: string }> {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.userProduct.findMany({
      where: { userId },
      include: { product: { select: { priceUSD: true, name: true } } },
    });
    const owned = new Map(inventory.map((item) => [item.productId, item]));
    const before = calculateScore(inventory.filter((item) => item.quantity > 0));
    let running = before;

    for (const change of changes) {
      const current = owned.get(change.productId);
      const product =
        current?.product ??
        (await tx.product.findUnique({
          where: { id: change.productId },
          select: { priceUSD: true, name: true },
        }));
      if (!product) return { error: "That product no longer exists." };

      const previousQuantity = current?.quantity ?? 0;
      const previousPrice = current?.pricePaidUSD ?? null;
      const nextQuantity = Math.min(change.quantity, MAX_QUANTITY);
      const nextPrice = change.pricePaidUSD === undefined ? previousPrice : change.pricePaidUSD;

      const previousLine = (previousPrice ?? product.priceUSD) * previousQuantity;
      const nextLine = (nextPrice ?? product.priceUSD) * nextQuantity;
      const scoreDelta = nextLine - previousLine;
      const quantityDelta = nextQuantity - previousQuantity;

      if (quantityDelta === 0 && scoreDelta === 0) continue;

      if (nextQuantity === 0) {
        await tx.userProduct.deleteMany({ where: { userId, productId: change.productId } });
        owned.delete(change.productId);
      } else {
        const row = await tx.userProduct.upsert({
          where: { userId_productId: { userId, productId: change.productId } },
          update: { quantity: nextQuantity, pricePaidUSD: nextPrice },
          create: {
            userId,
            productId: change.productId,
            quantity: nextQuantity,
            pricePaidUSD: nextPrice,
          },
          include: { product: { select: { priceUSD: true, name: true } } },
        });
        owned.set(change.productId, row);
      }

      running += scoreDelta;

      await tx.activityEvent.create({
        data: {
          userId,
          productId: change.productId,
          productName: product.name,
          type: quantityDelta > 0 ? "ADD" : quantityDelta < 0 ? "REMOVE" : "REPRICE",
          quantityDelta,
          scoreDelta,
          scoreAfter: running,
        },
      });
    }

    const productCount = [...owned.values()].reduce((sum, item) => sum + item.quantity, 0);
    return { before, after: running, productCount };
  });
}

async function finish(
  session: Extract<Session, { ok: true }>,
  applied: Applied
): Promise<ActionResult<ScoreUpdate>> {
  const [unlocked, standing] = await Promise.all([
    syncAchievements(session.userId),
    getStanding(session.userId),
  ]);
  revalidate(session.username);

  const beforeTier = tierFor(applied.before);
  const afterTier = tierFor(applied.after);

  return {
    ok: true,
    data: {
      score: applied.after,
      productCount: applied.productCount,
      delta: applied.after - applied.before,
      milestone: milestoneReached(applied.before, applied.after),
      tier:
        afterTier.id !== beforeTier.id && applied.after > applied.before
          ? { name: afterTier.name, emoji: afterTier.emoji }
          : null,
      unlocked,
      rank: standing ? { rank: standing.me.rank, total: standing.me.total } : null,
    },
  };
}

async function runChanges(changes: Change[]): Promise<ActionResult<ScoreUpdate>> {
  const session = await requireUser();
  if (!session.ok) return failure(session.error);

  try {
    const applied = await applyChanges(session.userId, changes);
    if ("error" in applied) return failure(applied.error);
    return await finish(session, applied);
  } catch (error) {
    console.error("inventory action:", error);
    return failure("Could not update your collection. Please try again.");
  }
}

/** Adds `quantity` units of a product, merging with anything already owned. */
export async function addProductAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = addProductSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Invalid product or quantity.", parsed.error.flatten().fieldErrors);
  }

  const session = await requireUser();
  if (!session.ok) return failure(session.error);

  const { productId, quantity, pricePaidUSD } = parsed.data;
  const existing = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
    select: { quantity: true },
  });

  return runChanges([
    {
      productId,
      quantity: (existing?.quantity ?? 0) + quantity,
      ...(pricePaidUSD === undefined ? {} : { pricePaidUSD }),
    },
  ]);
}

/** Sets an exact quantity. A quantity of 0 removes the product entirely. */
export async function setQuantityAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = setQuantitySchema.safeParse(input);
  if (!parsed.success) {
    return failure("Invalid quantity.", parsed.error.flatten().fieldErrors);
  }
  return runChanges([parsed.data]);
}

/**
 * Updates one owned line: quantity and the price actually paid. Pass
 * `pricePaidUSD: null` to fall back to MSRP, or a quantity of 0 to remove the
 * product entirely.
 */
export async function updateOwnedItemAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = updateOwnedItemSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Invalid quantity or price.", parsed.error.flatten().fieldErrors);
  }
  return runChanges([parsed.data]);
}

/** Removes a single unit, deleting the row when the last one goes. */
export async function removeOneAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid product.");

  const session = await requireUser();
  if (!session.ok) return failure(session.error);

  const owned = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId: session.userId, productId: parsed.data.productId } },
    select: { quantity: true },
  });
  if (!owned) return failure("You do not own that product.");

  return runChanges([{ productId: parsed.data.productId, quantity: owned.quantity - 1 }]);
}

/** Removes the product and every unit of it. */
export async function removeProductAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid product.");
  return runChanges([{ productId: parsed.data.productId, quantity: 0 }]);
}

/**
 * The welcome flow: adds several products at once and marks onboarding done.
 * Quantities are added on top of anything already owned.
 */
export async function completeOnboardingAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return failure("Pick valid products to start with.");

  const session = await requireUser();
  if (!session.ok) return failure(session.error);

  const merged = new Map<string, number>();
  for (const item of parsed.data.items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  const existing = await prisma.userProduct.findMany({
    where: { userId: session.userId, productId: { in: [...merged.keys()] } },
    select: { productId: true, quantity: true },
  });
  const ownedNow = new Map(existing.map((row) => [row.productId, row.quantity]));

  const changes: Change[] = [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity: (ownedNow.get(productId) ?? 0) + quantity,
  }));

  await prisma.user.update({
    where: { id: session.userId },
    data: { onboardedAt: new Date() },
  });

  if (changes.length === 0) {
    revalidate(session.username);
    const [standing, stats] = await Promise.all([
      getStanding(session.userId),
      prisma.userProduct.aggregate({ where: { userId: session.userId }, _sum: { quantity: true } }),
    ]);
    return {
      ok: true,
      data: {
        score: standing?.me.score ?? 0,
        productCount: stats._sum.quantity ?? 0,
        delta: 0,
        milestone: null,
        tier: null,
        unlocked: [],
        rank: standing ? { rank: standing.me.rank, total: standing.me.total } : null,
      },
    };
  }

  return runChanges(changes);
}
