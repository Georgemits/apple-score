"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStanding, simulateRank } from "@/lib/leaderboard";
import { calculateScore } from "@/lib/score";
import { MAX_QUANTITY } from "@/lib/validations";
import { failure, type ActionResult } from "@/actions/types";

const simulateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY),
      })
    )
    .min(1)
    .max(50),
});

export type Simulation = {
  /** The user's score today. */
  currentScore: number;
  currentRank: { rank: number; total: number } | null;
  /** Dollars the hypothetical purchase would add. */
  added: number;
  projectedScore: number;
  /** Null for private profiles, which never rank. */
  projectedRank: { rank: number; total: number } | null;
  /** Positions gained (positive) on the overall board. */
  positionsGained: number | null;
};

/**
 * "What if I buy this?" — the score and overall rank the signed-in user would
 * have after adding the given products. Reads only; nothing is saved.
 */
export async function simulatePurchaseAction(input: unknown): Promise<ActionResult<Simulation>> {
  const parsed = simulateSchema.safeParse(input);
  if (!parsed.success) return failure("Pick a product to simulate.");

  const session = await auth();
  if (!session?.user?.id) return failure("Sign in to run the simulator.");
  const userId = session.user.id;

  const ids = [...new Set(parsed.data.items.map((item) => item.productId))];
  const [products, inventory, standing] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, priceUSD: true } }),
    prisma.userProduct.findMany({
      where: { userId, quantity: { gt: 0 } },
      include: { product: { select: { priceUSD: true } } },
    }),
    getStanding(userId),
  ]);

  const priceById = new Map(products.map((product) => [product.id, product.priceUSD]));
  let added = 0;
  for (const item of parsed.data.items) {
    const price = priceById.get(item.productId);
    if (price === undefined) return failure("One of those products no longer exists.");
    added += price * item.quantity;
  }

  const currentScore = calculateScore(inventory);
  const projectedScore = currentScore + added;
  const projectedRank = await simulateRank(userId, projectedScore);

  return {
    ok: true,
    data: {
      currentScore,
      currentRank: standing ? { rank: standing.me.rank, total: standing.me.total } : null,
      added,
      projectedScore,
      projectedRank,
      positionsGained: standing && projectedRank ? standing.me.rank - projectedRank.rank : null,
    },
  };
}
