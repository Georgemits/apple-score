"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  SOCIAL_GROUPS,
  buildSocialContext,
  syncAchievements,
  type UnlockSummary,
} from "@/lib/achievement-sync";
import { productIdSchema, usernameParamSchema } from "@/lib/validations";
import { failure, type ActionResult } from "@/actions/types";

/** Only the social rules can change on a follow, so only they are evaluated. */
async function syncSocial(userId: string): Promise<UnlockSummary[]> {
  const context = await buildSocialContext(userId);
  return syncAchievements(userId, { context, only: SOCIAL_GROUPS });
}

export type FollowResult = { following: boolean; followers: number; unlocked: UnlockSummary[] };

/** Follows or unfollows a public user. Returns the new state. */
export async function toggleFollowAction(input: unknown): Promise<ActionResult<FollowResult>> {
  const parsed = usernameParamSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid user.");

  const me = await requireUser();
  if (!me) return failure("Sign in to follow collectors.");

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true, isPublic: true },
  });
  if (!target || !target.isPublic) return failure("That collector could not be found.");
  if (target.id === me.userId) return failure("You cannot follow yourself. Nice try.");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: me.userId, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: me.userId, followingId: target.id } },
    });
  } else {
    await prisma.follow.create({ data: { followerId: me.userId, followingId: target.id } });
  }

  const [followers, unlocked] = await Promise.all([
    prisma.follow.count({ where: { followingId: target.id } }),
    existing ? Promise.resolve([]) : syncSocial(me.userId),
    // The followed user may have just earned "Influencer"; their unlock must
    // not fail this request, but it is awaited (serverless would freeze a
    // detached promise) and logged.
    existing
      ? Promise.resolve([])
      : syncSocial(target.id).catch((error: unknown) => {
          console.error("toggleFollowAction: target sync failed", error);
          return [];
        }),
  ]);

  revalidatePath(`/u/${parsed.data.username}`);
  revalidatePath("/leaderboard");
  revalidatePath("/home");
  revalidateTag("community");

  return { ok: true, data: { following: !existing, followers, unlocked } };
}

export type WishlistResult = { wished: boolean };

/** Adds or removes a product from the wishlist. */
export async function toggleWishlistAction(input: unknown): Promise<ActionResult<WishlistResult>> {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return failure("Invalid product.");

  const me = await requireUser();
  if (!me) return failure("Sign in to keep a wishlist.");

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) return failure("That product no longer exists.");

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: me.userId, productId: product.id } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: me.userId, productId: product.id } });
  }

  revalidatePath("/catalog");
  revalidatePath("/wishlist");
  revalidatePath("/home");

  return { ok: true, data: { wished: !existing } };
}
