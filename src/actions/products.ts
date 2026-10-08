"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, type SessionUser } from "@/lib/session";
import { calculateScore, lineTotal, milestoneReached, tierFor, type Milestone } from "@/lib/score";
import {
  buildAchievementContext,
  syncAchievements,
  type UnlockSummary,
} from "@/lib/achievement-sync";
import {
  addProductSchema,
  onboardingSchema,
  productIdSchema,
  setQuantitySchema,
  updateOwnedItemSchema,
  MAX_QUANTITY,
} from "@/lib/validations";
import { formatNumber, formatUSD } from "@/lib/utils";
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

const SIGNED_OUT = "You need to be signed in to do that.";

function revalidate(username: string) {
  revalidatePath("/home");
  revalidatePath("/collection");
  revalidatePath("/catalog");
  revalidatePath("/wishlist");
  revalidatePath("/profile");
  revalidatePath("/achievements");
  revalidatePath("/leaderboard");
  revalidatePath(`/u/${username}`);
  revalidateTag("community");
}

/**
 * One ownership change. Either an absolute target (`quantity`, 0 removes the
 * row) or a relative one (`add`, negative to remove units). Relative changes
 * are resolved *inside* the transaction, so two overlapping taps on "+ Add"
 * cannot both read the same starting quantity.
 */
type Change = {
  productId: string;
  quantity?: number;
  add?: number;
  /** `undefined` leaves the recorded price alone; null resets to MSRP. */
  pricePaidUSD?: number | null;
};

type Applied = { before: number; after: number; productCount: number };

/** Thrown inside the transaction so Prisma rolls the whole batch back. */
class ChangeError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ChangeError";
  }
}

const MAX_ATTEMPTS = 3;

function isSerializationFailure(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

/**
 * Applies a set of ownership changes atomically and appends one activity
 * event per change. Runs at SERIALIZABLE isolation and retries on write
 * conflicts, so concurrent changes to the same collection serialise instead
 * of losing units. Returns the score before and after.
 */
async function applyChanges(
  userId: string,
  changes: Change[],
  options: { markOnboarded?: boolean } = {}
): Promise<Applied> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
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
            if (!product) throw new ChangeError("That product no longer exists.");

            const previousQuantity = current?.quantity ?? 0;
            const previousPrice = current?.pricePaidUSD ?? null;

            const target =
              change.add !== undefined ? previousQuantity + change.add : (change.quantity ?? 0);
            if (target > MAX_QUANTITY) {
              throw new ChangeError(
                `You can track at most ${formatNumber(MAX_QUANTITY)} of one product.`,
                { quantity: [`At most ${formatNumber(MAX_QUANTITY)} in total.`] }
              );
            }
            if (change.add !== undefined && change.add < 0 && !current) {
              throw new ChangeError("You do not own that product.");
            }
            const nextQuantity = Math.max(0, target);
            const nextPrice =
              change.pricePaidUSD === undefined ? previousPrice : change.pricePaidUSD;

            // One formula for the whole app lives in lib/score.
            const previousLine = lineTotal({
              quantity: previousQuantity,
              pricePaidUSD: previousPrice,
              product,
            });
            const nextLine = lineTotal({
              quantity: nextQuantity,
              pricePaidUSD: nextPrice,
              product,
            });
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

          if (options.markOnboarded) {
            await tx.user.update({ where: { id: userId }, data: { onboardedAt: new Date() } });
          }

          const productCount = [...owned.values()].reduce((sum, item) => sum + item.quantity, 0);
          return { before, after: running, productCount };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (isSerializationFailure(error) && attempt < MAX_ATTEMPTS) continue;
      throw error;
    }
  }
}

async function finish(session: SessionUser, applied: Applied): Promise<ActionResult<ScoreUpdate>> {
  // The context already holds the user's standing, so the ranking query runs once.
  const context = await buildAchievementContext(session.userId);
  const unlocked = await syncAchievements(session.userId, { context });
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
      rank: context.rank !== null ? { rank: context.rank, total: context.totalUsers } : null,
    },
  };
}

async function runChanges(
  session: SessionUser,
  changes: Change[],
  options: { markOnboarded?: boolean } = {}
): Promise<ActionResult<ScoreUpdate>> {
  try {
    const applied = await applyChanges(session.userId, changes, options);
    return await finish(session, applied);
  } catch (error) {
    if (error instanceof ChangeError) return failure(error.message, error.fieldErrors);
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
  if (!session) return failure(SIGNED_OUT);

  const { productId, quantity, pricePaidUSD } = parsed.data;

  // A line holds one price for every unit, so a different price for extra
  // units would silently re-price the ones already owned.
  if (pricePaidUSD !== undefined) {
    const existing = await prisma.userProduct.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
      select: { pricePaidUSD: true, product: { select: { priceUSD: true } } },
    });
    if (existing) {
      const currentUnit = existing.pricePaidUSD ?? existing.product.priceUSD;
      const requestedUnit = pricePaidUSD ?? existing.product.priceUSD;
      if (currentUnit !== requestedUnit) {
        return failure(
          `You already own this at ${formatUSD(currentUnit)} per unit. Change the price from your collection instead.`,
          { pricePaidUSD: [`Already recorded at ${formatUSD(currentUnit)} per unit.`] }
        );
      }
    }
  }

  return runChanges(session, [
    { productId, add: quantity, ...(pricePaidUSD === undefined ? {} : { pricePaidUSD }) },
  ]);
}

/** Sets an exact quantity. A quantity of 0 removes the product entirely. */
export async function setQuantityAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = setQuantitySchema.safeParse(input);
  if (!parsed.success) {
    return failure("Invalid quantity.", parsed.error.flatten().fieldErrors);
  }

  const session = await requireUser();
  if (!session) return failure(SIGNED_OUT);

  return runChanges(session, [parsed.data]);
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

  const session = await requireUser();
  if (!session) return failure(SIGNED_OUT);

  return runChanges(session, [parsed.data]);
}

/** Removes a single unit, deleting the row when the last one goes. */
export async function removeOneAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid product.");

  const session = await requireUser();
  if (!session) return failure(SIGNED_OUT);

  return runChanges(session, [{ productId: parsed.data.productId, add: -1 }]);
}

/** Removes the product and every unit of it. */
export async function removeProductAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid product.");

  const session = await requireUser();
  if (!session) return failure(SIGNED_OUT);

  return runChanges(session, [{ productId: parsed.data.productId, quantity: 0 }]);
}

/**
 * The welcome flow: adds several products at once and marks onboarding done
 * in the same transaction, so a failed batch leaves nothing half-applied.
 * Quantities are added on top of anything already owned.
 */
export async function completeOnboardingAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return failure("Pick valid products to start with.");

  const session = await requireUser();
  if (!session) return failure(SIGNED_OUT);

  const merged = new Map<string, number>();
  for (const item of parsed.data.items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  const changes: Change[] = [...merged.entries()].map(([productId, add]) => ({ productId, add }));

  return runChanges(session, changes, { markOnboarded: true });
}
