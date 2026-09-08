"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/queries";
import { milestoneReached } from "@/lib/score";
import {
  addProductSchema,
  productIdSchema,
  setQuantitySchema,
  MAX_QUANTITY,
} from "@/lib/validations";
import { failure, type ActionResult } from "@/actions/types";

export type ScoreUpdate = {
  score: number;
  productCount: number;
  /** Set when this change pushed the user past a celebration threshold. */
  milestone: number | null;
};

async function requireUserId(): Promise<
  { ok: true; userId: string; username: string } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in to do that." };
  }
  return { ok: true, userId: session.user.id, username: session.user.username };
}

function revalidate(username: string) {
  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  revalidatePath("/products/add");
  revalidatePath(`/u/${username}`);
}

/** Adds `quantity` units of a product, merging with anything already owned. */
export async function addProductAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const session = await requireUserId();
  if (!session.ok) return failure(session.error);

  const parsed = addProductSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Invalid product or quantity.", parsed.error.flatten().fieldErrors);
  }

  const { productId, quantity } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return failure("That product no longer exists.");

  const before = await getUserStats(session.userId);

  const existing = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
    select: { quantity: true },
  });

  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, MAX_QUANTITY);

  await prisma.userProduct.upsert({
    where: { userId_productId: { userId: session.userId, productId } },
    update: { quantity: nextQuantity },
    create: { userId: session.userId, productId, quantity: nextQuantity },
  });

  const after = await getUserStats(session.userId);
  revalidate(session.username);

  return {
    ok: true,
    data: {
      score: after.score,
      productCount: after.productCount,
      milestone: milestoneReached(before.score, after.score),
    },
  };
}

/** Sets an exact quantity. A quantity of 0 removes the product entirely. */
export async function setQuantityAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const session = await requireUserId();
  if (!session.ok) return failure(session.error);

  const parsed = setQuantitySchema.safeParse(input);
  if (!parsed.success) {
    return failure("Invalid quantity.", parsed.error.flatten().fieldErrors);
  }

  const { productId, quantity } = parsed.data;
  const before = await getUserStats(session.userId);

  if (quantity === 0) {
    await prisma.userProduct.deleteMany({ where: { userId: session.userId, productId } });
  } else {
    const owned = await prisma.userProduct.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
      select: { id: true },
    });

    if (!owned) return failure("You do not own that product.");

    await prisma.userProduct.update({
      where: { userId_productId: { userId: session.userId, productId } },
      data: { quantity },
    });
  }

  const after = await getUserStats(session.userId);
  revalidate(session.username);

  return {
    ok: true,
    data: {
      score: after.score,
      productCount: after.productCount,
      milestone: milestoneReached(before.score, after.score),
    },
  };
}

/** Removes a single unit, deleting the row when the last one goes. */
export async function removeOneAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const session = await requireUserId();
  if (!session.ok) return failure(session.error);

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid product.");

  const owned = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId: session.userId, productId: parsed.data.productId } },
    select: { quantity: true },
  });

  if (!owned) return failure("You do not own that product.");

  return setQuantityAction({ productId: parsed.data.productId, quantity: owned.quantity - 1 });
}

/** Removes the product and every unit of it. */
export async function removeProductAction(input: unknown): Promise<ActionResult<ScoreUpdate>> {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid product.");

  return setQuantityAction({ productId: parsed.data.productId, quantity: 0 });
}
